"""
Menu Service - จัดการเมนูอาหารใน Supabase Database
"""

import os
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
from dotenv import load_dotenv
import pathlib
import re

# Load environment variables
env_path = pathlib.Path(__file__).parent.parent.parent / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=str(env_path))
else:
    load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
SUPABASE_KEY = (
    SUPABASE_SERVICE_KEY or
    os.getenv('SUPABASE_KEY') or
    os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
)

# Debug: Check which key is being used
if SUPABASE_SERVICE_KEY:
    print("✅ Menu Service: Using SERVICE_ROLE_KEY (bypasses RLS)")
else:
    print("⚠️ Menu Service: Using ANON_KEY (subject to RLS policies)")

class MenuService:
    """Service for managing menu items in Supabase"""
    
    def __init__(self):
        self.supabase_client: Optional[Client] = None
        if SUPABASE_URL and SUPABASE_KEY:
            try:
                self.supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
                print("✅ Menu Service: Supabase client initialized")
            except Exception as e:
                print(f"⚠️ Menu Service: Failed to initialize Supabase client: {str(e)}")
                self.supabase_client = None
        else:
            print("⚠️ Menu Service: Supabase credentials not found")
    
    def _is_valid_uuid(self, uuid_string: str) -> bool:
        """ตรวจสอบว่า string เป็น UUID format หรือไม่"""
        uuid_pattern = re.compile(
            r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
            re.IGNORECASE
        )
        return bool(uuid_pattern.match(uuid_string))
    
    def create_menu_item(self, restaurant_id: str, menu_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        สร้าง menu item ใหม่
        
        Args:
            restaurant_id: Restaurant ID
            menu_data: Dictionary with menu item data
            
        Returns:
            Dictionary with created menu item or None if failed
        """
        if not self.supabase_client:
            print("⚠️ Menu Service: Supabase client not available")
            return None
        
        if not self._is_valid_uuid(restaurant_id):
            print(f"⚠️ Menu Service: Invalid restaurant_id format '{restaurant_id}'")
            return None
        
        try:
            # Prepare menu data for database
            db_data = {
                "restaurant_id": restaurant_id,
                "name_original": menu_data.get("name", ""),
                "name_english": menu_data.get("nameEn", ""),
                "description_original": menu_data.get("description", ""),
                "description_english": menu_data.get("descriptionEn", ""),
                "price": float(menu_data.get("price", 0)),
                "image_url": menu_data.get("image_url") or menu_data.get("photo_url"),
                "category": menu_data.get("category", "Main Course"),
                "category_english": menu_data.get("categoryEn") or menu_data.get("category_english"),
                "language_code": menu_data.get("language_code", "en"),
                "display_mode": menu_data.get("display_mode", "both"),
                "is_active": menu_data.get("is_active", True),
                "is_featured": menu_data.get("is_featured", False),
            }
            
            # Add is_best_seller if provided
            if "is_best_seller" in menu_data:
                db_data["is_best_seller"] = menu_data.get("is_best_seller", False)

            # Add menu_type if provided (food, snack, beverage)
            if "menu_type" in menu_data:
                db_data["menu_type"] = menu_data.get("menu_type", "food")

            # Store meats and addOns in options JSONB column
            import json
            options_data = {}
            if menu_data.get("meats"):
                options_data["meats"] = menu_data.get("meats")
            if menu_data.get("addOns"):
                options_data["addOns"] = menu_data.get("addOns")
            
            if options_data:
                db_data["options"] = options_data
            
            print(f"🔄 Menu Service: Inserting menu item...")
            print(f"   Restaurant ID: {restaurant_id}")
            print(f"   Name: {db_data.get('name_original')}")
            print(f"   Price: {db_data.get('price')}")
            print(f"   Category: {db_data.get('category')}")
            print(f"   Options: {options_data}")
            print(f"   Data keys: {list(db_data.keys())}")

            # Debug image URL
            image_url = db_data.get('image_url')
            if image_url:
                if image_url.startswith('data:'):
                    print(f"   Image URL: Base64 string (length: {len(image_url)})")
                else:
                    print(f"   Image URL: {image_url[:100]}...")
            else:
                print(f"   Image URL: None")

            # Remove any keys that might not exist in schema
            safe_data = {}
            skip_columns = ['meats_json', 'addons_json']  # Skip old columns that don't exist
            for key, value in db_data.items():
                if key not in skip_columns and value is not None:
                    safe_data[key] = value
            
            result = self.supabase_client.table('menus').insert(safe_data).execute()
            
            if result.data and len(result.data) > 0:
                menu_item = result.data[0]
                print(f"✅ Menu Service: Created menu item with ID: {menu_item.get('id')}")
                return self._format_menu_item(menu_item)
            else:
                print(f"⚠️ Menu Service: Insert succeeded but no data returned")
                return None
        except Exception as e:
            print(f"❌ Menu Service: Failed to create menu item: {str(e)}")
            print(f"   Data attempted: {db_data}")
            import traceback
            traceback.print_exc()
            raise Exception(f"Database error: {str(e)}")
    
    def get_menu_items(self, restaurant_id: str) -> List[Dict[str, Any]]:
        """
        ดึง menu items ทั้งหมดของร้าน
        
        Args:
            restaurant_id: Restaurant ID
            
        Returns:
            List of menu items
        """
        if not self.supabase_client:
            return []
        
        if not self._is_valid_uuid(restaurant_id):
            print(f"⚠️ Menu Service: Invalid restaurant_id format '{restaurant_id}'")
            return []
        
        try:
            result = self.supabase_client.table('menus').select('*').eq('restaurant_id', restaurant_id).eq('is_active', True).order('sort_order', desc=False).execute()
            
            if result.data:
                return [self._format_menu_item(item) for item in result.data]
            return []
        except Exception as e:
            print(f"❌ Menu Service: Failed to get menu items: {str(e)}")
            import traceback
            traceback.print_exc()
            return []
    
    def get_menu_item(self, menu_id: str) -> Optional[Dict[str, Any]]:
        """
        ดึง menu item เดียว
        
        Args:
            menu_id: Menu ID
            
        Returns:
            Dictionary with menu item or None if not found
        """
        if not self.supabase_client:
            return None
        
        if not self._is_valid_uuid(menu_id):
            return None
        
        try:
            result = self.supabase_client.table('menus').select('*').eq('id', menu_id).limit(1).execute()
            
            if result.data and len(result.data) > 0:
                return self._format_menu_item(result.data[0])
            return None
        except Exception as e:
            print(f"❌ Menu Service: Failed to get menu item: {str(e)}")
            return None
    
    def update_menu_item(self, menu_id: str, menu_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        อัปเดต menu item
        
        Args:
            menu_id: Menu ID
            menu_data: Dictionary with fields to update
            
        Returns:
            Dictionary with updated menu item or None if failed
        """
        if not self.supabase_client:
            return None
        
        if not self._is_valid_uuid(menu_id):
            return None
        
        try:
            # Prepare update data
            update_data = {}
            if "name" in menu_data:
                update_data["name_original"] = menu_data["name"]
            if "nameEn" in menu_data:
                update_data["name_english"] = menu_data["nameEn"]
            if "description" in menu_data:
                update_data["description_original"] = menu_data["description"]
            if "descriptionEn" in menu_data:
                update_data["description_english"] = menu_data["descriptionEn"]
            if "price" in menu_data:
                update_data["price"] = float(menu_data["price"])
            if "image_url" in menu_data or "photo_url" in menu_data:
                update_data["image_url"] = menu_data.get("image_url") or menu_data.get("photo_url")
            if "category" in menu_data:
                update_data["category"] = menu_data["category"]
            if "categoryEn" in menu_data or "category_english" in menu_data:
                update_data["category_english"] = menu_data.get("categoryEn") or menu_data.get("category_english")
            if "is_active" in menu_data:
                update_data["is_active"] = menu_data["is_active"]
            if "is_best_seller" in menu_data:
                update_data["is_best_seller"] = menu_data["is_best_seller"]
                print(f"📝 Menu Service: Setting is_best_seller = {menu_data['is_best_seller']}")
            if "meats" in menu_data or "addOns" in menu_data:
                options = {}
                if "meats" in menu_data:
                    options["meats"] = menu_data["meats"]
                if "addOns" in menu_data:
                    options["addOns"] = menu_data["addOns"]
                update_data["options"] = options
            
            if not update_data:
                print(f"⚠️ Menu Service: No update data to send")
                return None

            print(f"📝 Menu Service: Update data = {update_data}")
            result = self.supabase_client.table('menus').update(update_data).eq('id', menu_id).execute()
            print(f"📝 Menu Service: Update result = {result.data}")
            
            if result.data and len(result.data) > 0:
                return self._format_menu_item(result.data[0])
            return None
        except Exception as e:
            print(f"❌ Menu Service: Failed to update menu item: {str(e)}")
            import traceback
            traceback.print_exc()
            return None
    
    def update_menu_image_url(self, menu_id: str, image_url: str) -> Optional[Dict[str, Any]]:
        """
        อัปเดต image_url ของ menu item
        
        Args:
            menu_id: Menu ID
            image_url: Image URL from Supabase Storage
            
        Returns:
            Dictionary with updated menu item or None if failed
        """
        return self.update_menu_item(menu_id, {"image_url": image_url})
    
    def delete_menu_item(self, menu_id: str) -> bool:
        """
        ลบ menu item (soft delete by setting is_active = false)
        
        Args:
            menu_id: Menu ID
            
        Returns:
            True if successful, False otherwise
        """
        if not self.supabase_client:
            return False
        
        if not self._is_valid_uuid(menu_id):
            return False
        
        try:
            result = self.supabase_client.table('menus').update({"is_active": False}).eq('id', menu_id).execute()
            return result.data is not None and len(result.data) > 0
        except Exception as e:
            print(f"❌ Menu Service: Failed to delete menu item: {str(e)}")
            return False
    
    def _format_menu_item(self, db_item: Dict[str, Any]) -> Dict[str, Any]:
        """
        แปลงข้อมูลจาก database format เป็น frontend format
        
        Args:
            db_item: Menu item from database
            
        Returns:
            Formatted menu item
        """
        # Get category and category_english, fallback to category if no English translation
        category = db_item.get("category", "Main Course")
        category_english = db_item.get("category_english") or category
        
        # Parse options JSON if available
        import json
        options = db_item.get("options", {})
        if isinstance(options, str):
            try:
                options = json.loads(options)
            except:
                options = {}
        
        meats = options.get("meats", []) if options else []
        addOns = options.get("addOns", []) if options else []
        
        return {
            "menu_id": db_item.get("id"),
            "name": db_item.get("name_original", ""),
            "nameEn": db_item.get("name_english", ""),
            "description": db_item.get("description_original", ""),
            "descriptionEn": db_item.get("description_english", ""),
            "price": str(db_item.get("price", 0)),
            "photo_url": db_item.get("image_url"),
            "image_url": db_item.get("image_url"),
            "category": category,
            "categoryEn": category_english,
            "menu_type": db_item.get("menu_type", "food"),  # food, snack, beverage
            "meats": meats,
            "addOns": addOns,
            "is_active": db_item.get("is_active", True),
            "is_featured": db_item.get("is_featured", False),
            "is_best_seller": db_item.get("is_best_seller", False),
            "created_at": db_item.get("created_at"),
            "updated_at": db_item.get("updated_at"),
            "restaurant_id": db_item.get("restaurant_id"),
        }

# Create singleton instance
menu_service = MenuService()
