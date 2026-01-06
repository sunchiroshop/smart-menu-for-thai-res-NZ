"""
Simple Menu Storage Service
ใช้ in-memory storage ก่อน (สำหรับ MVP)
ภายหลังจะเปลี่ยนเป็น Supabase
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid

class MenuStorage:
    def __init__(self):
        # In-memory storage (จะหายเมื่อ restart server)
        self.menus: Dict[str, Dict[str, Any]] = {}
        self.menu_items: Dict[str, List[Dict[str, Any]]] = {}
    
    def create_menu_item(self, menu_data: Dict[str, Any]) -> Dict[str, Any]:
        """สร้าง menu item ใหม่"""
        menu_id = str(uuid.uuid4())
        created_at = datetime.now().isoformat()
        
        menu_item = {
            "menu_id": menu_id,
            "created_at": created_at,
            "updated_at": created_at,
            **menu_data
        }
        
        # Store menu item
        restaurant_id = menu_data.get("restaurant_id", "default")
        if restaurant_id not in self.menu_items:
            self.menu_items[restaurant_id] = []
        
        self.menu_items[restaurant_id].append(menu_item)
        
        return menu_item
    
    def get_menu_items(self, restaurant_id: str = "default") -> List[Dict[str, Any]]:
        """ดึง menu items ทั้งหมดของร้าน"""
        return self.menu_items.get(restaurant_id, [])
    
    def get_menu_item(self, menu_id: str, restaurant_id: str = "default") -> Optional[Dict[str, Any]]:
        """ดึง menu item เดียว"""
        items = self.menu_items.get(restaurant_id, [])
        for item in items:
            if item["menu_id"] == menu_id:
                return item
        return None
    
    def update_menu_item(self, menu_id: str, menu_data: Dict[str, Any], restaurant_id: str = "default") -> Optional[Dict[str, Any]]:
        """แก้ไข menu item"""
        items = self.menu_items.get(restaurant_id, [])
        for i, item in enumerate(items):
            if item["menu_id"] == menu_id:
                updated_item = {
                    **item,
                    **menu_data,
                    "updated_at": datetime.now().isoformat()
                }
                items[i] = updated_item
                return updated_item
        return None
    
    def delete_menu_item(self, menu_id: str, restaurant_id: str = "default") -> bool:
        """ลบ menu item"""
        items = self.menu_items.get(restaurant_id, [])
        for i, item in enumerate(items):
            if item["menu_id"] == menu_id:
                items.pop(i)
                return True
        return False
    
    def get_stats(self, restaurant_id: str = "default") -> Dict[str, Any]:
        """สถิติของร้าน"""
        items = self.menu_items.get(restaurant_id, [])
        categories = set(item.get("category") for item in items if item.get("category"))
        
        return {
            "total_items": len(items),
            "total_categories": len(categories),
            "categories": list(categories)
        }

# Global instance
menu_storage = MenuStorage()

