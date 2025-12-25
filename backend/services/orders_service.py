"""
Orders Service - จัดการออเดอร์ใน Supabase Database
"""

import os
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
from dotenv import load_dotenv
import pathlib
import re
from datetime import datetime

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

class OrdersService:
    """Service for managing orders in Supabase"""
    
    def __init__(self):
        self.supabase_client: Optional[Client] = None
        if SUPABASE_URL and SUPABASE_KEY:
            try:
                self.supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
                print("✅ Orders Service: Supabase client initialized")
            except Exception as e:
                print(f"⚠️ Orders Service: Failed to initialize Supabase client: {str(e)}")
                self.supabase_client = None
        else:
            print("⚠️ Orders Service: Supabase credentials not found")
    
    def _is_valid_uuid(self, uuid_string: str) -> bool:
        """ตรวจสอบว่า string เป็น UUID format หรือไม่"""
        uuid_pattern = re.compile(
            r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
            re.IGNORECASE
        )
        return bool(uuid_pattern.match(uuid_string))
    
    def create_order(self, restaurant_id: str, order_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        สร้างออเดอร์ใหม่
        
        Args:
            restaurant_id: Restaurant ID
            order_data: Dictionary with order data (items, table_no, etc.)
            
        Returns:
            Dictionary with created order or None if failed
        """
        if not self.supabase_client:
            print("⚠️ Orders Service: Supabase client not available")
            return None
        
        if not self._is_valid_uuid(restaurant_id):
            print(f"⚠️ Orders Service: Invalid restaurant_id format '{restaurant_id}'")
            return None
        
        try:
            # Validate service type
            service_type = order_data.get("service_type", "dine_in")
            valid_service_types = ["dine_in", "pickup", "delivery"]
            if service_type not in valid_service_types:
                print(f"⚠️ Orders Service: Invalid service_type '{service_type}'. Must be one of: {valid_service_types}")
                service_type = "dine_in"  # Default fallback
            
            # Validate customer_details based on service_type
            customer_details = order_data.get("customer_details", {})
            if not isinstance(customer_details, dict):
                customer_details = {}
            
            # Enforce required fields based on service type
            if service_type == "dine_in":
                if "table_no" not in customer_details and order_data.get("table_no"):
                    customer_details["table_no"] = order_data.get("table_no")
                if not customer_details.get("table_no"):
                    print("⚠️ Orders Service: dine_in requires table_no in customer_details")
                    customer_details["table_no"] = order_data.get("table_no") or "0"
            
            elif service_type == "pickup":
                if not customer_details.get("name"):
                    print("⚠️ Orders Service: pickup requires name in customer_details")
                    customer_details["name"] = order_data.get("customer_name") or "Guest"
                if not customer_details.get("pickup_time"):
                    print("⚠️ Orders Service: pickup requires pickup_time in customer_details")
                    # Set default pickup time if not provided
                    customer_details["pickup_time"] = customer_details.get("pickup_time") or datetime.now().isoformat()
            
            elif service_type == "delivery":
                if not customer_details.get("name"):
                    print("⚠️ Orders Service: delivery requires name in customer_details")
                    customer_details["name"] = order_data.get("customer_name") or "Guest"
                if not customer_details.get("address"):
                    print("⚠️ Orders Service: delivery requires address in customer_details")
                    customer_details["address"] = customer_details.get("address") or ""
                if not customer_details.get("phone"):
                    customer_details["phone"] = order_data.get("customer_phone") or ""
            
            # Calculate totals
            items = order_data.get("items", [])
            subtotal = order_data.get("subtotal") or sum(item.get("itemTotal", item.get("price", 0) * item.get("quantity", 1)) for item in items)
            tax = order_data.get("tax", 0)
            delivery_fee = order_data.get("delivery_fee", 0) if service_type == "delivery" else 0
            total_price = subtotal + tax + delivery_fee

            db_data = {
                "restaurant_id": restaurant_id,
                "table_no": customer_details.get("table_no") if service_type == "dine_in" else None,
                "items": items,  # JSONB
                "subtotal": subtotal,
                "tax": tax,
                "delivery_fee": delivery_fee,
                "total_price": total_price,
                "status": "pending_payment",  # Start with pending_payment, move to pending after payment
                "payment_status": "pending",  # Payment not yet made
                "customer_name": customer_details.get("name") or order_data.get("customer_name"),
                "customer_phone": customer_details.get("phone") or order_data.get("customer_phone"),
                "special_instructions": order_data.get("special_instructions"),
                "service_type": service_type,
                "customer_details": customer_details,
            }
            
            result = self.supabase_client.table('orders').insert(db_data).execute()
            
            if result.data and len(result.data) > 0:
                order = result.data[0]
                print(f"✅ Orders Service: Created order {order.get('id')} for restaurant {restaurant_id}")
                return order
            return None
        except Exception as e:
            print(f"❌ Orders Service: Failed to create order: {str(e)}")
            import traceback
            traceback.print_exc()
            return None
    
    def get_orders(self, restaurant_id: str, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        ดึงออเดอร์ทั้งหมดของร้าน
        
        Args:
            restaurant_id: Restaurant ID
            status: Filter by status (optional)
            
        Returns:
            List of orders
        """
        if not self.supabase_client:
            return []
        
        if not self._is_valid_uuid(restaurant_id):
            return []
        
        try:
            query = self.supabase_client.table('orders').select('*').eq('restaurant_id', restaurant_id)
            
            if status:
                query = query.eq('status', status)
            
            result = query.order('created_at', desc=True).execute()
            
            if result.data:
                return result.data
            return []
        except Exception as e:
            print(f"❌ Orders Service: Failed to get orders: {str(e)}")
            import traceback
            traceback.print_exc()
            return []
    
    def get_order(self, order_id: str) -> Optional[Dict[str, Any]]:
        """
        ดึงออเดอร์เดียว
        
        Args:
            order_id: Order ID
            
        Returns:
            Dictionary with order or None if not found
        """
        if not self.supabase_client:
            return None
        
        if not self._is_valid_uuid(order_id):
            return None
        
        try:
            result = self.supabase_client.table('orders').select('*').eq('id', order_id).limit(1).execute()
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            return None
        except Exception as e:
            print(f"❌ Orders Service: Failed to get order: {str(e)}")
            return None
    
    def update_order_status(self, order_id: str, status: str) -> Optional[Dict[str, Any]]:
        """
        อัปเดตสถานะออเดอร์
        
        Args:
            order_id: Order ID
            status: New status (pending, preparing, ready, completed, cancelled)
            
        Returns:
            Dictionary with updated order or None if failed
        """
        if not self.supabase_client:
            return None
        
        if not self._is_valid_uuid(order_id):
            return None
        
        valid_statuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled']
        if status not in valid_statuses:
            print(f"⚠️ Orders Service: Invalid status '{status}'")
            return None
        
        try:
            update_data = {"status": status}
            
            result = self.supabase_client.table('orders').update(update_data).eq('id', order_id).execute()
            
            if result.data and len(result.data) > 0:
                order = result.data[0]
                print(f"✅ Orders Service: Updated order {order_id} status to {status}")
                return order
            return None
        except Exception as e:
            print(f"❌ Orders Service: Failed to update order status: {str(e)}")
            import traceback
            traceback.print_exc()
            return None

# Create singleton instance
orders_service = OrdersService()

