"""
Best Sellers Service - คำนวณเมนูขายดีจากยอดขาย 7 วัน
"""

import os
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
from dotenv import load_dotenv
import pathlib
import re
from datetime import datetime, timedelta

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

class BestSellersService:
    """Service for calculating best selling menu items"""
    
    def __init__(self):
        self.supabase_client: Optional[Client] = None
        if SUPABASE_URL and SUPABASE_KEY:
            try:
                self.supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
                print("✅ Best Sellers Service: Supabase client initialized")
            except Exception as e:
                print(f"⚠️ Best Sellers Service: Failed to initialize Supabase client: {str(e)}")
                self.supabase_client = None
        else:
            print("⚠️ Best Sellers Service: Supabase credentials not found")
    
    def _is_valid_uuid(self, uuid_string: str) -> bool:
        """ตรวจสอบว่า string เป็น UUID format หรือไม่"""
        uuid_pattern = re.compile(
            r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
            re.IGNORECASE
        )
        return bool(uuid_pattern.match(uuid_string))
    
    def get_best_sellers(
        self,
        restaurant_id: str,
        days: int = 14,  # Default 2 weeks
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        คำนวณเมนูขายดีจากยอดขายย้อนหลัง N วัน
        รวมเมนูที่ถูก pin เป็น bestseller ด้วย

        Args:
            restaurant_id: Restaurant ID
            days: จำนวนวันย้อนหลัง (default: 14 = 2 weeks)
            limit: จำนวนเมนูที่ต้องการ (default: 5)

        Returns:
            List of best selling menu items with sales count
        """
        if not self.supabase_client:
            return []

        if not self._is_valid_uuid(restaurant_id):
            return []

        try:
            # Calculate date range
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)

            # Get pinned bestsellers (manually marked)
            pinned_result = self.supabase_client.table('menus').select(
                'id, name_original, name_english, image_url, price, category, is_best_seller'
            ).eq('restaurant_id', restaurant_id).eq('is_best_seller', True).eq('is_active', True).execute()

            pinned_menus = {menu['id']: menu for menu in (pinned_result.data or [])}

            # Get all orders from the last N days (including pending/confirmed orders)
            orders_result = self.supabase_client.table('orders').select(
                'items, status'
            ).eq('restaurant_id', restaurant_id).gte(
                'created_at', start_date.isoformat()
            ).lte(
                'created_at', end_date.isoformat()
            ).neq('status', 'cancelled').execute()

            # Count menu item sales
            menu_sales: Dict[str, Dict[str, Any]] = {}

            # Initialize pinned menus with 0 sales (they will show even without orders)
            for menu_id, menu in pinned_menus.items():
                menu_sales[menu_id] = {
                    'menu_id': menu_id,
                    'name': menu.get('name_original', ''),
                    'nameEn': menu.get('name_english', ''),
                    'total_quantity': 0,
                    'order_count': 0,
                    'is_pinned': True,
                    'image_url': menu.get('image_url'),
                    'price': str(menu.get('price', 0)),
                    'category': menu.get('category', 'Main Course'),
                }

            # Count sales from orders
            for order in (orders_result.data or []):
                items = order.get('items', [])
                if not isinstance(items, list):
                    continue

                for item in items:
                    menu_id = item.get('menu_id')
                    if not menu_id:
                        continue

                    quantity = item.get('quantity', 1)

                    if menu_id not in menu_sales:
                        menu_sales[menu_id] = {
                            'menu_id': menu_id,
                            'name': item.get('name', ''),
                            'nameEn': item.get('nameEn', ''),
                            'total_quantity': 0,
                            'order_count': 0,
                            'is_pinned': False,
                        }

                    menu_sales[menu_id]['total_quantity'] += quantity
                    menu_sales[menu_id]['order_count'] += 1

            # Sort priority:
            # 1. Items with quantity >= 20 (sorted by quantity desc)
            # 2. Pinned items by owner
            # 3. Items with quantity < 20 (sorted by quantity desc)
            MIN_QUANTITY_THRESHOLD = 20  # Minimum orders to be ranked above pinned items

            def sort_key(x):
                quantity = x['total_quantity']
                is_pinned = x.get('is_pinned', False)

                # Priority groups:
                # 0 = high quantity (>= 20), 1 = pinned, 2 = low quantity (< 20)
                if quantity >= MIN_QUANTITY_THRESHOLD:
                    priority = 0  # High quantity first
                elif is_pinned:
                    priority = 1  # Pinned second
                else:
                    priority = 2  # Low quantity last

                return (priority, -quantity, -x['order_count'])

            sorted_items = sorted(menu_sales.values(), key=sort_key)

            # Get top N items
            top_items = sorted_items[:limit]

            # Fetch missing menu details for non-pinned items
            menu_ids_need_details = [
                item['menu_id'] for item in top_items
                if item['menu_id'] not in pinned_menus and 'image_url' not in item
            ]

            if menu_ids_need_details:
                menus_result = self.supabase_client.table('menus').select(
                    'id, name_original, name_english, image_url, price, category'
                ).in_('id', menu_ids_need_details).execute()

                if menus_result.data:
                    menu_details = {menu['id']: menu for menu in menus_result.data}

                    for item in top_items:
                        menu_id = item['menu_id']
                        if menu_id in menu_details:
                            details = menu_details[menu_id]
                            item['image_url'] = details.get('image_url')
                            item['price'] = str(details.get('price', 0))
                            item['category'] = details.get('category', 'Main Course')
                            if not item['name']:
                                item['name'] = details.get('name_original', '')
                            if not item['nameEn']:
                                item['nameEn'] = details.get('name_english', '')

            # Add rank to each item
            for idx, item in enumerate(top_items):
                item['rank'] = idx + 1

            print(f"✅ Best Sellers: Found {len(top_items)} top items for restaurant {restaurant_id} (pinned: {len(pinned_menus)})")
            return top_items

        except Exception as e:
            print(f"❌ Best Sellers Service: Failed to calculate best sellers: {str(e)}")
            import traceback
            traceback.print_exc()
            return []

    def update_bestseller_flags(self, restaurant_id: str, days: int = 14) -> Dict[str, Any]:
        """
        อัพเดท is_best_seller flag ตามยอดสั่งซื้อ (เรียกทุก 2 สัปดาห์)
        เมนูที่ถูก pin ไว้จะยังคงเป็น bestseller แต่อาจเปลี่ยนลำดับ

        Args:
            restaurant_id: Restaurant ID
            days: จำนวนวันย้อนหลัง (default: 14)

        Returns:
            Dict with update results
        """
        if not self.supabase_client:
            return {'success': False, 'error': 'Supabase client not available'}

        if not self._is_valid_uuid(restaurant_id):
            return {'success': False, 'error': 'Invalid restaurant ID'}

        try:
            # Get current bestsellers
            current_bestsellers = self.get_best_sellers(restaurant_id, days=days, limit=5)
            current_ids = {item['menu_id'] for item in current_bestsellers}

            # Get pinned menus (these should always stay as bestsellers)
            pinned_result = self.supabase_client.table('menus').select('id').eq(
                'restaurant_id', restaurant_id
            ).eq('is_best_seller', True).execute()

            pinned_ids = {menu['id'] for menu in (pinned_result.data or [])}

            # Get all menus for this restaurant
            all_menus = self.supabase_client.table('menus').select('id, is_best_seller').eq(
                'restaurant_id', restaurant_id
            ).execute()

            updated_count = 0

            for menu in (all_menus.data or []):
                menu_id = menu['id']
                current_status = menu.get('is_best_seller', False)

                # Should be bestseller if: in top 5 by sales OR manually pinned
                should_be_bestseller = menu_id in current_ids or menu_id in pinned_ids

                # Only update if status changed (and not pinned - don't unpin manually pinned items)
                if current_status != should_be_bestseller:
                    # Don't change manually pinned items
                    if menu_id in pinned_ids:
                        continue

                    self.supabase_client.table('menus').update({
                        'is_best_seller': should_be_bestseller
                    }).eq('id', menu_id).execute()
                    updated_count += 1

            print(f"✅ Updated bestseller flags for restaurant {restaurant_id}: {updated_count} changes")

            return {
                'success': True,
                'restaurant_id': restaurant_id,
                'updated_count': updated_count,
                'bestsellers': [item['menu_id'] for item in current_bestsellers],
                'pinned_count': len(pinned_ids)
            }

        except Exception as e:
            print(f"❌ Failed to update bestseller flags: {str(e)}")
            import traceback
            traceback.print_exc()
            return {'success': False, 'error': str(e)}

    def update_all_restaurants_bestsellers(self, days: int = 14) -> Dict[str, Any]:
        """
        อัพเดท bestseller flags สำหรับทุกร้าน (เรียกจาก cron job)

        Args:
            days: จำนวนวันย้อนหลัง (default: 14)

        Returns:
            Dict with update results for all restaurants
        """
        if not self.supabase_client:
            return {'success': False, 'error': 'Supabase client not available'}

        try:
            # Get all active restaurants
            restaurants = self.supabase_client.table('restaurants').select('id, name').execute()

            results = []
            for restaurant in (restaurants.data or []):
                result = self.update_bestseller_flags(restaurant['id'], days=days)
                results.append({
                    'restaurant_id': restaurant['id'],
                    'restaurant_name': restaurant['name'],
                    **result
                })

            success_count = sum(1 for r in results if r.get('success'))

            print(f"✅ Updated bestsellers for {success_count}/{len(results)} restaurants")

            return {
                'success': True,
                'total_restaurants': len(results),
                'success_count': success_count,
                'results': results
            }

        except Exception as e:
            print(f"❌ Failed to update all restaurants bestsellers: {str(e)}")
            import traceback
            traceback.print_exc()
            return {'success': False, 'error': str(e)}

# Create singleton instance
best_sellers_service = BestSellersService()

