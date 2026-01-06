"""
Shared Image Library Service - จัดการรูปภาพทั้งหมดของ user (across all restaurants)
"""
import os
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv
import pathlib
from datetime import datetime

try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False

# Load environment variables
env_path = pathlib.Path(__file__).parent.parent.parent / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=str(env_path))
else:
    load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_KEY')


class ImageLibraryService:
    """Service for managing shared image library across all user's restaurants"""
    
    def __init__(self):
        self.supabase_client: Optional[Client] = None
        if SUPABASE_AVAILABLE and SUPABASE_URL and SUPABASE_KEY:
            try:
                self.supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
                print("✅ Image Library Service: Supabase client initialized")
            except Exception as e:
                print(f"⚠️ Image Library Service: Failed to initialize: {str(e)}")
    
    def get_all_images_by_user(
        self, 
        user_id: str,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        ดึงรูปภาพทั้งหมดของ user จากทุกร้าน
        
        Args:
            user_id: User ID
            limit: จำนวนรูปสูงสุด
            
        Returns:
            List of images with metadata
        """
        if not self.supabase_client:
            return []
        
        try:
            # ดึงร้านทั้งหมดของ user
            restaurants_result = self.supabase_client.table('restaurants').select(
                'id, name'
            ).eq('user_id', user_id).execute()
            
            if not restaurants_result.data:
                return []
            
            restaurant_ids = [r['id'] for r in restaurants_result.data]
            restaurant_map = {r['id']: r['name'] for r in restaurants_result.data}
            
            # ดึง menu items ที่มีรูป (ใช้ name_original และ name_english)
            menu_items_result = self.supabase_client.table('menus').select(
                'id, name_original, name_english, image_url, restaurant_id, created_at, updated_at'
            ).in_('restaurant_id', restaurant_ids).not_.is_(
                'image_url', 'null'
            ).order('updated_at', desc=True).limit(limit).execute()
            
            if not menu_items_result.data:
                return []
            
            # Format ข้อมูล
            images = []
            for item in menu_items_result.data:
                if item.get('image_url'):
                    # ใช้ชื่อภาษาอังกฤษ หรือ original ถ้าไม่มี
                    menu_name = item.get('name_english') or item.get('name_original') or 'Unknown'
                    images.append({
                        'image_id': item['id'],
                        'image_url': item['image_url'],
                        'menu_name': menu_name,
                        'restaurant_id': item['restaurant_id'],
                        'restaurant_name': restaurant_map.get(item['restaurant_id'], 'Unknown'),
                        'created_at': item.get('created_at'),
                        'updated_at': item.get('updated_at')
                    })
            
            print(f"✅ Found {len(images)} images for user {user_id}")
            return images
            
        except Exception as e:
            print(f"❌ Failed to get user images: {str(e)}")
            import traceback
            traceback.print_exc()
            return []
    
    def get_images_by_restaurant(
        self, 
        restaurant_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        ดึงรูปภาพทั้งหมดของร้านหนึ่งๆ
        
        Args:
            restaurant_id: Restaurant ID
            limit: จำนวนรูปสูงสุด
            
        Returns:
            List of images
        """
        if not self.supabase_client:
            return []
        
        try:
            # Get restaurant name
            restaurant_result = self.supabase_client.table('restaurants').select(
                'name'
            ).eq('id', restaurant_id).limit(1).execute()
            
            restaurant_name = 'Unknown'
            if restaurant_result.data:
                restaurant_name = restaurant_result.data[0].get('name', 'Unknown')
            
            result = self.supabase_client.table('menus').select(
                'id, name_original, name_english, image_url, restaurant_id, created_at'
            ).eq('restaurant_id', restaurant_id).not_.is_(
                'image_url', 'null'
            ).order('created_at', desc=True).limit(limit).execute()
            
            if not result.data:
                return []
            
            images = []
            for item in result.data:
                if item.get('image_url'):
                    # ใช้ชื่อภาษาอังกฤษ หรือ original ถ้าไม่มี
                    menu_name = item.get('name_english') or item.get('name_original') or 'Unknown'
                    images.append({
                        'image_id': item['id'],
                        'image_url': item['image_url'],
                        'menu_name': menu_name,
                        'restaurant_id': item.get('restaurant_id', restaurant_id),
                        'restaurant_name': restaurant_name,
                        'created_at': item.get('created_at')
                    })
            
            print(f"✅ Found {len(images)} images for restaurant {restaurant_id}")
            return images
            
        except Exception as e:
            print(f"❌ Failed to get restaurant images: {str(e)}")
            import traceback
            traceback.print_exc()
            return []
    
    def search_images(
        self,
        user_id: str,
        search_term: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        ค้นหารูปภาพตามชื่อเมนู
        
        Args:
            user_id: User ID
            search_term: คำค้นหา
            limit: จำนวนรูปสูงสุด
            
        Returns:
            List of matching images
        """
        if not self.supabase_client:
            return []
        
        try:
            # ดึงร้านทั้งหมดของ user
            restaurants_result = self.supabase_client.table('restaurants').select(
                'id, name'
            ).eq('user_id', user_id).execute()
            
            if not restaurants_result.data:
                return []
            
            restaurant_ids = [r['id'] for r in restaurants_result.data]
            restaurant_map = {r['id']: r['name'] for r in restaurants_result.data}
            
            # ค้นหา menu items (ค้นหาทั้งชื่อ original และ English)
            result = self.supabase_client.table('menus').select(
                'id, name_original, name_english, image_url, restaurant_id, created_at'
            ).in_('restaurant_id', restaurant_ids).not_.is_(
                'image_url', 'null'
            ).or_(f'name_original.ilike.%{search_term}%,name_english.ilike.%{search_term}%').limit(limit).execute()
            
            if not result.data:
                return []
            
            images = []
            for item in result.data:
                if item.get('image_url'):
                    menu_name = item.get('name_english') or item.get('name_original') or 'Unknown'
                    images.append({
                        'image_id': item['id'],
                        'image_url': item['image_url'],
                        'menu_name': menu_name,
                        'restaurant_id': item['restaurant_id'],
                        'restaurant_name': restaurant_map.get(item['restaurant_id'], 'Unknown'),
                        'created_at': item.get('created_at')
                    })
            
            return images
            
        except Exception as e:
            print(f"❌ Failed to search images: {str(e)}")
            return []
    
    def get_recent_uploads(
        self,
        user_id: str,
        days: int = 7,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        ดึงรูปที่อัปโหลดล่าสุด
        
        Args:
            user_id: User ID
            days: จำนวนวันย้อนหลัง
            limit: จำนวนรูปสูงสุด
            
        Returns:
            List of recent images
        """
        if not self.supabase_client:
            return []
        
        try:
            # Calculate cutoff date
            from datetime import datetime, timedelta
            cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
            
            # ดึงร้านทั้งหมดของ user
            restaurants_result = self.supabase_client.table('restaurants').select(
                'id, name'
            ).eq('user_id', user_id).execute()
            
            if not restaurants_result.data:
                return []
            
            restaurant_ids = [r['id'] for r in restaurants_result.data]
            restaurant_map = {r['id']: r['name'] for r in restaurants_result.data}
            
            # ดึงรูปที่อัปโหลดล่าสุด
            result = self.supabase_client.table('menus').select(
                'id, name_original, name_english, image_url, restaurant_id, created_at'
            ).in_('restaurant_id', restaurant_ids).not_.is_(
                'image_url', 'null'
            ).gte('created_at', cutoff_date).order(
                'created_at', desc=True
            ).limit(limit).execute()
            
            if not result.data:
                return []
            
            images = []
            for item in result.data:
                if item.get('image_url'):
                    menu_name = item.get('name_english') or item.get('name_original') or 'Unknown'
                    images.append({
                        'image_id': item['id'],
                        'image_url': item['image_url'],
                        'menu_name': menu_name,
                        'restaurant_id': item['restaurant_id'],
                        'restaurant_name': restaurant_map.get(item['restaurant_id'], 'Unknown'),
                        'created_at': item.get('created_at')
                    })
            
            return images
            
        except Exception as e:
            print(f"❌ Failed to get recent uploads: {str(e)}")
            return []


# Create singleton instance
image_library_service = ImageLibraryService()

