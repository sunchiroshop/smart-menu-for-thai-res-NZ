"""
Restaurant Service - จัดการข้อมูลร้านอาหารใน Supabase
"""
import os
import re
from typing import Optional, Dict, Any
from dotenv import load_dotenv
import pathlib

# Supabase for database
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    print("⚠️ Supabase library not available. Install with: pip install supabase")

# Load environment variables
env_path = pathlib.Path(__file__).parent.parent.parent / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=str(env_path))
else:
    load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = (
    os.getenv('SUPABASE_SERVICE_ROLE_KEY') or
    os.getenv('SUPABASE_KEY') or
    os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
)


class RestaurantService:
    """Service for managing restaurant data in Supabase"""
    
    def __init__(self):
        self.supabase_client: Optional[Client] = None
        if SUPABASE_AVAILABLE and SUPABASE_URL and SUPABASE_KEY:
            try:
                self.supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
                print("✅ Restaurant Service: Supabase client initialized")
            except Exception as e:
                print(f"⚠️ Restaurant Service: Failed to initialize Supabase client: {str(e)}")
                self.supabase_client = None
        else:
            print("⚠️ Restaurant Service: Supabase credentials not found")
            print(f"   SUPABASE_URL: {'✅' if SUPABASE_URL else '❌'}")
            print(f"   SUPABASE_KEY: {'✅' if SUPABASE_KEY else '❌'}")
    
    def _is_valid_uuid(self, uuid_string: str) -> bool:
        """ตรวจสอบว่า string เป็น UUID format หรือไม่"""
        uuid_pattern = re.compile(
            r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
            re.IGNORECASE
        )
        return bool(uuid_pattern.match(uuid_string))
    
    def _slugify(self, text: str) -> str:
        """
        แปลง text เป็น URL-friendly slug
        
        Args:
            text: ข้อความต้นฉบับ (เช่น "Wok Express Bangkok")
            
        Returns:
            slug (เช่น "wok-express-bangkok")
        """
        # Convert to lowercase
        text = text.lower()
        # Remove special characters, keep only alphanumeric and spaces
        text = re.sub(r'[^a-z0-9\s-]', '', text)
        # Replace spaces and multiple hyphens with single hyphen
        text = re.sub(r'[\s-]+', '-', text)
        # Remove leading/trailing hyphens
        text = text.strip('-')
        return text
    
    def get_restaurant_by_user_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        ดึงข้อมูลร้านอาหารจาก user_id (ร้านแรก)
        
        Args:
            user_id: User ID
            
        Returns:
            Dictionary with restaurant data or None if not found
        """
        if not self.supabase_client:
            print("⚠️ Restaurant Service: Supabase client not available")
            return None
        
        # Validate UUID format
        if not self._is_valid_uuid(user_id):
            print(f"⚠️ Restaurant Service: Invalid UUID format for user_id: {user_id}")
            return None
        
        try:
            # Query restaurants table by user_id
            result = self.supabase_client.table('restaurants').select('*').eq('user_id', user_id).limit(1).execute()
            
            if result.data and len(result.data) > 0:
                restaurant = result.data[0]
                print(f"✅ Restaurant Service: Found restaurant for user {user_id}")
                return restaurant
            else:
                print(f"⚠️ Restaurant Service: No restaurant found for user {user_id}")
                return None
                
        except Exception as e:
            print(f"❌ Restaurant Service: Failed to get restaurant: {str(e)}")
            import traceback
            traceback.print_exc()
            return None
    
    def get_all_restaurants_by_user_id(self, user_id: str) -> list:
        """
        ดึงร้านอาหารทั้งหมดของ user (Multi-restaurant support)
        
        Args:
            user_id: User ID
            
        Returns:
            List of restaurants owned by user
        """
        if not self.supabase_client:
            print("⚠️ Restaurant Service: Supabase client not available")
            return []
        
        # Validate UUID format
        if not self._is_valid_uuid(user_id):
            print(f"⚠️ Restaurant Service: Invalid UUID format for user_id: {user_id}")
            return []
        
        try:
            # Query all restaurants for this user
            result = self.supabase_client.table('restaurants').select('*').eq('user_id', user_id).execute()
            
            if result.data:
                print(f"✅ Restaurant Service: Found {len(result.data)} restaurant(s) for user {user_id}")
                return result.data
            else:
                print(f"⚠️ Restaurant Service: No restaurants found for user {user_id}")
                return []
                
        except Exception as e:
            print(f"❌ Restaurant Service: Failed to get restaurants: {str(e)}")
            import traceback
            traceback.print_exc()
            return []
    
    def get_restaurant_by_id(self, restaurant_id: str) -> Optional[Dict[str, Any]]:
        """
        ดึงข้อมูลร้านอาหารจาก restaurant_id
        
        Args:
            restaurant_id: Restaurant ID
            
        Returns:
            Dictionary with restaurant data or None if not found
        """
        if not self.supabase_client:
            print("⚠️ Restaurant Service: Supabase client not available")
            return None
        
        try:
            result = self.supabase_client.table('restaurants').select('*').eq('id', restaurant_id).limit(1).execute()
            
            if result.data and len(result.data) > 0:
                restaurant = result.data[0]
                print(f"✅ Restaurant Service: Found restaurant {restaurant_id}")
                return restaurant
            else:
                print(f"⚠️ Restaurant Service: No restaurant found with ID {restaurant_id}")
                return None
                
        except Exception as e:
            print(f"❌ Restaurant Service: Failed to get restaurant: {str(e)}")
            import traceback
            traceback.print_exc()
            return None
    
    def get_restaurant_by_slug(self, slug: str) -> Optional[Dict[str, Any]]:
        """
        ดึงข้อมูลร้านอาหารจาก slug
        
        Args:
            slug: Restaurant slug (เช่น "wok-express")
            
        Returns:
            Dictionary with restaurant data or None if not found
        """
        if not self.supabase_client:
            print("⚠️ Restaurant Service: Supabase client not available")
            return None
        
        try:
            result = self.supabase_client.table('restaurants').select('*').eq('slug', slug).limit(1).execute()
            
            if result.data and len(result.data) > 0:
                print(f"✅ Restaurant Service: Found restaurant by slug '{slug}'")
                return result.data[0]
            else:
                print(f"⚠️ Restaurant Service: Restaurant not found by slug '{slug}'")
                return None
                
        except Exception as e:
            print(f"❌ Restaurant Service: Failed to get restaurant by slug: {str(e)}")
            import traceback
            traceback.print_exc()
            return None
    
    def get_restaurant_by_id_or_slug(self, identifier: str) -> Optional[Dict[str, Any]]:
        """
        ดึงข้อมูลร้านอาหารจาก ID หรือ slug (flexible)
        
        Args:
            identifier: Restaurant ID (UUID) หรือ slug
            
        Returns:
            Dictionary with restaurant data or None if not found
        """
        # Try UUID first
        if self._is_valid_uuid(identifier):
            return self.get_restaurant_by_id(identifier)
        else:
            # Try slug
            return self.get_restaurant_by_slug(identifier)
    
    def create_restaurant(self, user_id: str, restaurant_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        สร้างร้านอาหารใหม่
        
        Args:
            user_id: User ID
            restaurant_data: Dictionary with restaurant fields (name, phone, email, address, etc.)
            
        Returns:
            Dictionary with created restaurant data or None if failed
        """
        if not self.supabase_client:
            print("⚠️ Restaurant Service: Supabase client not available")
            return None
        
        # Validate UUID format
        if not self._is_valid_uuid(user_id):
            print(f"⚠️ Restaurant Service: Invalid UUID format for user_id: {user_id}, cannot create restaurant")
            return None
        
        try:
            # Add user_id to restaurant_data
            restaurant_data['user_id'] = user_id
            
            # Auto-generate slug from restaurant name if not provided
            if 'slug' not in restaurant_data or not restaurant_data['slug']:
                if 'name' in restaurant_data and restaurant_data['name']:
                    base_slug = self._slugify(restaurant_data['name'])
                    # Check if slug already exists, if so add number suffix
                    slug = base_slug
                    counter = 1
                    while True:
                        existing = self.get_restaurant_by_slug(slug)
                        if not existing:
                            break
                        counter += 1
                        slug = f"{base_slug}-{counter}"
                    restaurant_data['slug'] = slug
                    print(f"📝 Restaurant Service: Auto-generated slug: {slug}")
            
            # Check if theme_color column exists by trying to query schema
            # If column doesn't exist, remove it from restaurant_data
            try:
                # Try to check if theme_color column exists
                test_result = self.supabase_client.table('restaurants').select('theme_color').limit(0).execute()
                # If no error, column exists - set default if not provided
                if 'theme_color' not in restaurant_data:
                    restaurant_data['theme_color'] = '#000000'
            except Exception as schema_error:
                # Column doesn't exist, remove theme_color from data
                if 'theme_color' in restaurant_data:
                    print(f"⚠️ Restaurant Service: theme_color column not found, removing from insert data")
                    restaurant_data.pop('theme_color', None)
                if 'cover_image_url' in restaurant_data:
                    restaurant_data.pop('cover_image_url', None)
            
            result = self.supabase_client.table('restaurants').insert(restaurant_data).execute()
            
            if result.data and len(result.data) > 0:
                restaurant = result.data[0]
                print(f"✅ Restaurant Service: Created restaurant for user {user_id}")
                return restaurant
            else:
                print(f"⚠️ Restaurant Service: Failed to create restaurant - no data returned")
                return None
                
        except Exception as e:
            error_msg = str(e)
            # Check if error is about missing columns
            if 'theme_color' in error_msg or 'cover_image_url' in error_msg:
                print(f"⚠️ Restaurant Service: Missing columns in restaurants table. Please run migration: add_customization_to_restaurants.sql")
                # Try again without theme_color and cover_image_url
                try:
                    restaurant_data.pop('theme_color', None)
                    restaurant_data.pop('cover_image_url', None)
                    result = self.supabase_client.table('restaurants').insert(restaurant_data).execute()
                    if result.data and len(result.data) > 0:
                        restaurant = result.data[0]
                        print(f"✅ Restaurant Service: Created restaurant (without customization columns) for user {user_id}")
                        return restaurant
                except Exception as retry_error:
                    print(f"❌ Restaurant Service: Failed to create restaurant after retry: {str(retry_error)}")
            
            print(f"❌ Restaurant Service: Failed to create restaurant: {error_msg}")
            import traceback
            traceback.print_exc()
            return None
    
    def update_restaurant(self, restaurant_id: str, user_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        อัปเดตข้อมูลร้านอาหาร
        
        Args:
            restaurant_id: Restaurant ID
            user_id: User ID (for verification)
            update_data: Dictionary with fields to update (name, phone, email, address, theme_color, etc.)
            
        Returns:
            Dictionary with updated restaurant data or None if failed
        """
        if not self.supabase_client:
            print("⚠️ Restaurant Service: Supabase client not available")
            return None
        
        if not self._is_valid_uuid(restaurant_id) or not self._is_valid_uuid(user_id):
            print(f"⚠️ Restaurant Service: Invalid ID format, cannot update restaurant.")
            return None
        
        try:
            # Remove None values from update_data
            update_data = {k: v for k, v in update_data.items() if v is not None}
            
            if not update_data:
                print("⚠️ Restaurant Service: No data to update")
                return None
            
            # Check if optional columns exist
            # If they don't exist, remove them from update_data before updating
            optional_columns = ['theme_color', 'cover_image_url', 'delivery_settings', 'pos_theme_color']
            columns_to_check = [col for col in optional_columns if col in update_data]

            if columns_to_check:
                for col in columns_to_check:
                    try:
                        # Try to check if column exists by querying it
                        test_result = self.supabase_client.table('restaurants').select(col).limit(0).execute()
                        # If no error, column exists
                    except Exception as schema_error:
                        error_msg = str(schema_error)
                        if col in error_msg or 'PGRST204' in error_msg:
                            print(f"⚠️ Restaurant Service: {col} column not found, removing from update data")
                            update_data.pop(col, None)
            
            if not update_data:
                print("⚠️ Restaurant Service: No data to update after removing non-existent columns")
                return None
            
            # Update restaurant (with user_id check for security)
            try:
                result = self.supabase_client.table('restaurants').update(update_data).eq('id', restaurant_id).eq('user_id', user_id).execute()
                
                if result.data and len(result.data) > 0:
                    restaurant = result.data[0]
                    print(f"✅ Restaurant Service: Updated restaurant {restaurant_id}")
                    print(f"   Updated fields: {list(update_data.keys())}")
                    return restaurant
                else:
                    print(f"⚠️ Restaurant Service: Failed to update restaurant - no data returned or restaurant not found")
                    return None
            except Exception as update_error:
                error_msg = str(update_error)
                # If error is about missing columns, try again without them
                if 'PGRST204' in error_msg:
                    # Find which column is missing from error message
                    for col in optional_columns:
                        if col in error_msg:
                            print(f"⚠️ Restaurant Service: {col} column not found during update, removing")
                            update_data.pop(col, None)

                    if not update_data:
                        print("⚠️ Restaurant Service: No data to update after removing non-existent columns")
                        return None

                    # Retry update without missing columns
                    result = self.supabase_client.table('restaurants').update(update_data).eq('id', restaurant_id).eq('user_id', user_id).execute()

                    if result.data and len(result.data) > 0:
                        restaurant = result.data[0]
                        print(f"✅ Restaurant Service: Updated restaurant {restaurant_id} (without some optional columns)")
                        print(f"   Updated fields: {list(update_data.keys())}")
                        return restaurant
                    else:
                        print(f"⚠️ Restaurant Service: Retry update succeeded but no data returned")
                        return None
                else:
                    # Re-raise if it's a different error
                    raise update_error
                
        except Exception as e:
            print(f"❌ Restaurant Service: Failed to update restaurant: {str(e)}")
            import traceback
            traceback.print_exc()
            return None
    
    def update_restaurant_logo(self, restaurant_id: str, user_id: str, logo_url: str) -> bool:
        """
        อัปเดต logo URL ของร้าน
        
        Args:
            restaurant_id: Restaurant ID
            user_id: User ID
            logo_url: Logo URL
            
        Returns:
            True if successful, False otherwise
        """
        result = self.update_restaurant(restaurant_id, user_id, {'logo_url': logo_url})
        return result is not None
    
    def update_restaurant_banner(self, restaurant_id: str, user_id: str, cover_image_url: str) -> bool:
        """
        อัปเดต cover image URL ของร้าน
        
        Args:
            restaurant_id: Restaurant ID
            user_id: User ID
            cover_image_url: Cover image URL
            
        Returns:
            True if successful, False otherwise
        """
        result = self.update_restaurant(restaurant_id, user_id, {'cover_image_url': cover_image_url})
        return result is not None
    
    def delete_restaurant(self, restaurant_id: str, user_id: str) -> bool:
        """
        ลบร้านอาหาร (CASCADE: จะลบ menus, orders ทั้งหมดด้วย)
        
        Args:
            restaurant_id: Restaurant ID
            user_id: User ID (for verification)
            
        Returns:
            True if successful, False otherwise
        """
        if not self.supabase_client:
            print("⚠️ Restaurant Service: Supabase client not available")
            return False
        
        try:
            # Delete from database (CASCADE will handle related data)
            result = self.supabase_client.table('restaurants').delete().eq('id', restaurant_id).eq('user_id', user_id).execute()
            
            if result.data:
                print(f"✅ Restaurant Service: Deleted restaurant {restaurant_id}")
                return True
            else:
                print(f"⚠️ Restaurant Service: Failed to delete restaurant {restaurant_id}")
                return False
                
        except Exception as e:
            print(f"❌ Restaurant Service: Failed to delete restaurant: {str(e)}")
            import traceback
            traceback.print_exc()
            return False


# Create global instance
restaurant_service = RestaurantService()

