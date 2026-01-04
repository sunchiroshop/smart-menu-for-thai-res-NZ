"""
Orders Service - จัดการออเดอร์ใน Supabase Database

GST Calculation for New Zealand:
- Standard rate: 15%
- Prices are GST-inclusive (menu prices include GST)
- Formula to extract GST: GST_Amount = Total_Price * 3 / 23 (≈13.04%)
"""

import os
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
from dotenv import load_dotenv
import pathlib
import re
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP

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

    def _get_restaurant_gst_settings(self, restaurant_id: str) -> Dict[str, Any]:
        """
        Get GST settings for a restaurant

        Args:
            restaurant_id: Restaurant ID

        Returns:
            Dictionary with gst_registered (bool) and gst_number (str or None)
        """
        default_settings = {"gst_registered": True, "gst_number": None}

        if not self.supabase_client or not self._is_valid_uuid(restaurant_id):
            return default_settings

        try:
            result = self.supabase_client.table('restaurants').select(
                'gst_registered, gst_number'
            ).eq('id', restaurant_id).limit(1).execute()

            if result.data and len(result.data) > 0:
                return {
                    "gst_registered": result.data[0].get("gst_registered", True),
                    "gst_number": result.data[0].get("gst_number")
                }
            return default_settings
        except Exception as e:
            print(f"⚠️ Orders Service: Failed to get GST settings: {str(e)}")
            return default_settings

    def _get_restaurant_surcharge_settings(self, restaurant_id: str) -> Dict[str, Any]:
        """
        Get credit card surcharge settings for a restaurant

        Args:
            restaurant_id: Restaurant ID

        Returns:
            Dictionary with credit_card_surcharge_enabled (bool) and credit_card_surcharge_rate (float)
        """
        default_settings = {"credit_card_surcharge_enabled": False, "credit_card_surcharge_rate": 2.50}

        if not self.supabase_client or not self._is_valid_uuid(restaurant_id):
            return default_settings

        try:
            result = self.supabase_client.table('restaurants').select(
                'credit_card_surcharge_enabled, credit_card_surcharge_rate'
            ).eq('id', restaurant_id).limit(1).execute()

            if result.data and len(result.data) > 0:
                return {
                    "credit_card_surcharge_enabled": result.data[0].get("credit_card_surcharge_enabled", False),
                    "credit_card_surcharge_rate": float(result.data[0].get("credit_card_surcharge_rate", 2.50) or 2.50)
                }
            return default_settings
        except Exception as e:
            print(f"⚠️ Orders Service: Failed to get surcharge settings: {str(e)}")
            return default_settings

    def calculate_surcharge(self, subtotal: float, surcharge_rate: float) -> float:
        """
        Calculate credit card surcharge amount

        Args:
            subtotal: The subtotal amount (before surcharge)
            surcharge_rate: The surcharge rate as percentage (e.g., 2.5 for 2.5%)

        Returns:
            Surcharge amount rounded to 2 decimal places
        """
        if subtotal <= 0 or surcharge_rate <= 0:
            return 0.0

        # Use Decimal for precise financial calculations
        amount = Decimal(str(subtotal))
        rate = Decimal(str(surcharge_rate)) / Decimal('100')
        surcharge = amount * rate

        # Round to 2 decimal places
        return float(surcharge.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))

    def calculate_gst(self, total_amount: float, gst_registered: bool = True) -> float:
        """
        Calculate GST amount from GST-inclusive total (NZ standard)

        In NZ, prices are GST-inclusive. To extract the GST portion:
        GST = Total * 3 / 23 (which equals Total * 15/115)

        Args:
            total_amount: The GST-inclusive total amount
            gst_registered: Whether the restaurant is GST registered

        Returns:
            GST amount rounded to 2 decimal places
        """
        if not gst_registered or total_amount <= 0:
            return 0.0

        # Use Decimal for precise financial calculations
        total = Decimal(str(total_amount))
        gst = (total * Decimal('3')) / Decimal('23')

        # Round to 2 decimal places using banker's rounding
        return float(gst.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
    
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
            delivery_fee = order_data.get("delivery_fee", 0) if service_type == "delivery" else 0

            # Calculate credit card surcharge if enabled and payment method is card
            surcharge_amount = 0.0
            payment_method = order_data.get("payment_method", "card")

            # Get surcharge from order_data if already calculated by frontend, otherwise calculate
            if order_data.get("surcharge_amount") is not None:
                surcharge_amount = float(order_data.get("surcharge_amount", 0))
            elif payment_method == "card":
                surcharge_settings = self._get_restaurant_surcharge_settings(restaurant_id)
                if surcharge_settings.get("credit_card_surcharge_enabled", False):
                    surcharge_rate = surcharge_settings.get("credit_card_surcharge_rate", 2.50)
                    surcharge_amount = self.calculate_surcharge(subtotal + delivery_fee, surcharge_rate)

            # In NZ, prices are GST-inclusive, so total = subtotal + delivery_fee + surcharge
            total_price = subtotal + delivery_fee + surcharge_amount

            # Get GST settings and calculate GST (extracted from inclusive price)
            gst_settings = self._get_restaurant_gst_settings(restaurant_id)
            tax = self.calculate_gst(total_price, gst_settings.get("gst_registered", True))

            db_data = {
                "restaurant_id": restaurant_id,
                "table_no": customer_details.get("table_no") if service_type == "dine_in" else None,
                "items": items,  # JSONB
                "subtotal": subtotal,
                "tax": tax,  # GST amount extracted from inclusive price
                "delivery_fee": delivery_fee,
                "surcharge_amount": surcharge_amount,  # Credit card surcharge
                "total_price": total_price,  # GST-inclusive total + surcharge
                "status": "pending_payment",  # Start with pending_payment, move to pending after payment
                "payment_status": "pending",  # Payment not yet made
                "payment_method": payment_method,  # Track payment method
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

    def get_orders_summary(
        self,
        restaurant_id: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        payment_status: Optional[str] = None,
        service_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        ดึงสรุป Orders พร้อม Filter

        Args:
            restaurant_id: Restaurant ID
            start_date: Start date (ISO format, e.g., '2024-01-01')
            end_date: End date (ISO format)
            payment_status: Filter by payment status (pending, paid, failed)
            service_type: Filter by service type (dine_in, pickup, delivery)

        Returns:
            Dictionary with orders and summary statistics
        """
        if not self.supabase_client:
            return {"orders": [], "summary": {}}

        if not self._is_valid_uuid(restaurant_id):
            return {"orders": [], "summary": {}}

        try:
            query = self.supabase_client.table('orders').select('*').eq('restaurant_id', restaurant_id)

            # Date filters
            if start_date:
                query = query.gte('created_at', f"{start_date}T00:00:00")
            if end_date:
                query = query.lte('created_at', f"{end_date}T23:59:59")

            # Payment status filter
            if payment_status:
                query = query.eq('payment_status', payment_status)

            # Service type filter
            if service_type:
                query = query.eq('service_type', service_type)

            # Exclude cancelled orders from summary (unless specifically filtered)
            # query = query.neq('status', 'cancelled')

            result = query.order('created_at', desc=True).execute()

            orders = result.data or []

            # Calculate summary statistics
            total_orders = len(orders)
            total_revenue = sum(order.get('total_price', 0) or 0 for order in orders if order.get('payment_status') == 'paid')

            # Count by payment status
            paid_count = len([o for o in orders if o.get('payment_status') == 'paid'])
            pending_count = len([o for o in orders if o.get('payment_status') == 'pending'])
            failed_count = len([o for o in orders if o.get('payment_status') == 'failed'])

            # Count by service type
            dine_in_count = len([o for o in orders if o.get('service_type') == 'dine_in'])
            pickup_count = len([o for o in orders if o.get('service_type') == 'pickup'])
            delivery_count = len([o for o in orders if o.get('service_type') == 'delivery'])

            # Count by payment method
            card_count = len([o for o in orders if o.get('payment_method') == 'card' and o.get('payment_status') == 'paid'])
            bank_transfer_count = len([o for o in orders if o.get('payment_method') == 'bank_transfer' and o.get('payment_status') == 'paid'])

            # Revenue by payment method
            card_revenue = sum(o.get('total_price', 0) or 0 for o in orders if o.get('payment_method') == 'card' and o.get('payment_status') == 'paid')
            bank_transfer_revenue = sum(o.get('total_price', 0) or 0 for o in orders if o.get('payment_method') == 'bank_transfer' and o.get('payment_status') == 'paid')

            summary = {
                "total_orders": total_orders,
                "total_revenue": total_revenue,
                "payment_status": {
                    "paid": paid_count,
                    "pending": pending_count,
                    "failed": failed_count
                },
                "service_type": {
                    "dine_in": dine_in_count,
                    "pickup": pickup_count,
                    "delivery": delivery_count
                },
                "payment_method": {
                    "card": {"count": card_count, "revenue": card_revenue},
                    "bank_transfer": {"count": bank_transfer_count, "revenue": bank_transfer_revenue}
                }
            }

            return {
                "orders": orders,
                "summary": summary
            }

        except Exception as e:
            print(f"❌ Orders Service: Failed to get orders summary: {str(e)}")
            import traceback
            traceback.print_exc()
            return {"orders": [], "summary": {}}


# Create singleton instance
orders_service = OrdersService()

