"""
Admin Service - Super Admin Dashboard Functions
Provides comprehensive admin management for the entire platform
"""
import os
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from supabase import create_client, Client

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')


class AdminService:
    """
    Super Admin Dashboard Service
    Provides comprehensive platform management capabilities
    """

    def __init__(self):
        self.supabase_client: Optional[Client] = None
        if SUPABASE_URL and SUPABASE_KEY:
            try:
                self.supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
                print("✅ Admin Service: Supabase client initialized")
            except Exception as e:
                print(f"⚠️ Admin Service: Failed to initialize Supabase client: {str(e)}")
        else:
            print("⚠️ Admin Service: Supabase credentials not found")

    def _is_admin(self, user_id: str) -> bool:
        """Check if user is admin"""
        if not self.supabase_client:
            return False
        try:
            result = self.supabase_client.table('user_profiles').select('role').eq('user_id', user_id).execute()
            if result.data and len(result.data) > 0:
                return result.data[0].get('role') == 'admin'
        except Exception as e:
            print(f"⚠️ Failed to check admin status: {str(e)}")
        return False

    def _log_admin_action(self, admin_user_id: str, action: str, target_type: str = None,
                          target_id: str = None, old_value: Dict = None, new_value: Dict = None):
        """Log admin actions for audit trail"""
        if not self.supabase_client:
            return
        try:
            self.supabase_client.table('admin_activity_logs').insert({
                'admin_user_id': admin_user_id,
                'action': action,
                'target_type': target_type,
                'target_id': target_id,
                'old_value': old_value,
                'new_value': new_value
            }).execute()
        except Exception as e:
            print(f"⚠️ Failed to log admin action: {str(e)}")

    # ==================== OVERVIEW STATS ====================

    def get_platform_overview(self, admin_user_id: str) -> Dict[str, Any]:
        """Get platform-wide statistics overview"""
        if not self._is_admin(admin_user_id):
            return {"error": "Access denied. Admin only."}

        if not self.supabase_client:
            return {"error": "Database not available"}

        try:
            # Get counts
            users_result = self.supabase_client.table('user_profiles').select('id', count='exact').execute()
            restaurants_result = self.supabase_client.table('restaurants').select('id', count='exact').execute()
            orders_result = self.supabase_client.table('orders').select('id', count='exact').execute()
            menus_result = self.supabase_client.table('menus').select('id', count='exact').execute()

            # Get revenue stats
            revenue_result = self.supabase_client.table('orders').select('total_price, payment_status').execute()
            total_revenue = sum(float(o.get('total_price', 0)) for o in revenue_result.data if o.get('payment_status') == 'paid')
            pending_revenue = sum(float(o.get('total_price', 0)) for o in revenue_result.data if o.get('payment_status') == 'pending')

            # Get role distribution
            role_result = self.supabase_client.table('user_profiles').select('role, subscription_status, plan').execute()
            role_distribution = {}
            subscription_distribution = {}
            plan_distribution = {}
            for user in role_result.data:
                role = user.get('role', 'free_trial')
                role_distribution[role] = role_distribution.get(role, 0) + 1

                sub_status = user.get('subscription_status', 'trial')
                subscription_distribution[sub_status] = subscription_distribution.get(sub_status, 0) + 1

                plan = user.get('plan', 'free_trial')
                plan_distribution[plan] = plan_distribution.get(plan, 0) + 1

            # Get orders by status
            order_status_result = self.supabase_client.table('orders').select('status').execute()
            order_status_distribution = {}
            for order in order_status_result.data:
                status = order.get('status', 'unknown')
                order_status_distribution[status] = order_status_distribution.get(status, 0) + 1

            # Get today's stats
            today = datetime.now().strftime('%Y-%m-%d')
            today_orders_result = self.supabase_client.table('orders').select('id, total_price, payment_status').gte('created_at', f"{today}T00:00:00").execute()
            today_orders_count = len(today_orders_result.data)
            today_revenue = sum(float(o.get('total_price', 0)) for o in today_orders_result.data if o.get('payment_status') == 'paid')

            # Get this week's new users
            week_ago = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
            new_users_result = self.supabase_client.table('user_profiles').select('id', count='exact').gte('created_at', f"{week_ago}T00:00:00").execute()

            return {
                "success": True,
                "stats": {
                    "total_users": users_result.count or 0,
                    "total_restaurants": restaurants_result.count or 0,
                    "total_orders": orders_result.count or 0,
                    "total_menus": menus_result.count or 0,
                    "total_revenue": round(total_revenue, 2),
                    "pending_revenue": round(pending_revenue, 2),
                    "today_orders": today_orders_count,
                    "today_revenue": round(today_revenue, 2),
                    "new_users_this_week": new_users_result.count or 0,
                    "role_distribution": role_distribution,
                    "subscription_distribution": subscription_distribution,
                    "plan_distribution": plan_distribution,
                    "order_status_distribution": order_status_distribution
                }
            }
        except Exception as e:
            return {"error": f"Failed to get overview: {str(e)}"}

    # ==================== USERS MANAGEMENT ====================

    def get_all_users_detailed(self, admin_user_id: str, page: int = 1, limit: int = 20,
                               search: str = None, role_filter: str = None) -> Dict[str, Any]:
        """Get all users with detailed info"""
        if not self._is_admin(admin_user_id):
            return {"error": "Access denied. Admin only."}

        if not self.supabase_client:
            return {"error": "Database not available"}

        try:
            query = self.supabase_client.table('user_profiles').select('*', count='exact')

            # Apply filters
            if search:
                query = query.or_(f"email.ilike.%{search}%,restaurant_name.ilike.%{search}%")
            if role_filter:
                query = query.eq('role', role_filter)

            # Pagination
            offset = (page - 1) * limit
            query = query.range(offset, offset + limit - 1).order('created_at', desc=True)

            result = query.execute()
            users = result.data or []

            # Enrich with restaurant info
            for user in users:
                user_id = user.get('user_id')
                if user_id:
                    try:
                        restaurant_result = self.supabase_client.table('restaurants').select('id, name, slug, is_active').eq('user_id', user_id).execute()
                        user['restaurants'] = restaurant_result.data or []
                        user['restaurant_count'] = len(restaurant_result.data or [])

                        # Get order count for this user's restaurants
                        if restaurant_result.data:
                            rest_ids = [r['id'] for r in restaurant_result.data]
                            order_count = 0
                            for rest_id in rest_ids:
                                order_result = self.supabase_client.table('orders').select('id', count='exact').eq('restaurant_id', rest_id).execute()
                                order_count += order_result.count or 0
                            user['total_orders'] = order_count
                    except:
                        user['restaurants'] = []
                        user['restaurant_count'] = 0

            return {
                "success": True,
                "users": users,
                "total": result.count or 0,
                "page": page,
                "limit": limit,
                "total_pages": ((result.count or 0) + limit - 1) // limit
            }
        except Exception as e:
            return {"error": f"Failed to get users: {str(e)}"}

    def update_user(self, admin_user_id: str, target_user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update user profile"""
        if not self._is_admin(admin_user_id):
            return {"error": "Access denied. Admin only."}

        if not self.supabase_client:
            return {"error": "Database not available"}

        try:
            # Get old value for logging
            old_result = self.supabase_client.table('user_profiles').select('*').eq('user_id', target_user_id).execute()
            old_value = old_result.data[0] if old_result.data else {}

            # Update - allow all customer detail fields
            allowed_fields = [
                'role', 'email', 'restaurant_name', 'phone', 'address', 'city', 'country',
                'subscription_status', 'plan', 'billing_interval', 'is_active', 'notes',
                'trial_start_date', 'trial_end_date', 'subscription_start_date', 'subscription_end_date',
                'next_billing_date', 'stripe_customer_id', 'stripe_subscription_id'
            ]
            filtered_updates = {k: v for k, v in updates.items() if k in allowed_fields}
            filtered_updates['updated_at'] = datetime.now().isoformat()

            result = self.supabase_client.table('user_profiles').update(filtered_updates).eq('user_id', target_user_id).execute()

            # Log action
            self._log_admin_action(admin_user_id, 'update_user', 'user', target_user_id, old_value, filtered_updates)

            return {
                "success": True,
                "user": result.data[0] if result.data else None
            }
        except Exception as e:
            return {"error": f"Failed to update user: {str(e)}"}

    def get_user_detail(self, admin_user_id: str, target_user_id: str) -> Dict[str, Any]:
        """Get detailed user info including all customer data"""
        if not self._is_admin(admin_user_id):
            return {"error": "Access denied. Admin only."}

        if not self.supabase_client:
            return {"error": "Database not available"}

        try:
            # Get user profile
            result = self.supabase_client.table('user_profiles').select('*').eq('user_id', target_user_id).execute()
            if not result.data:
                return {"error": "User not found"}

            user = result.data[0]

            # Get restaurants owned by this user
            restaurants_result = self.supabase_client.table('restaurants').select('*').eq('user_id', target_user_id).execute()
            user['restaurants'] = restaurants_result.data or []
            user['branch_count'] = len(restaurants_result.data or [])

            # Get total orders and revenue across all restaurants
            total_orders = 0
            total_revenue = 0
            total_menu_items = 0
            total_staff = 0

            for restaurant in user['restaurants']:
                rest_id = restaurant.get('id')
                if rest_id:
                    # Orders
                    orders_result = self.supabase_client.table('orders').select('id, total_price, payment_status', count='exact').eq('restaurant_id', rest_id).execute()
                    total_orders += orders_result.count or 0
                    total_revenue += sum(float(o.get('total_price', 0)) for o in orders_result.data if o.get('payment_status') == 'paid')

                    # Menu items
                    menu_result = self.supabase_client.table('menus').select('id', count='exact').eq('restaurant_id', rest_id).execute()
                    total_menu_items += menu_result.count or 0

                    # Staff
                    staff_result = self.supabase_client.table('staff').select('id', count='exact').eq('restaurant_id', rest_id).execute()
                    total_staff += staff_result.count or 0

            user['total_orders'] = total_orders
            user['total_revenue'] = round(total_revenue, 2)
            user['total_menu_items'] = total_menu_items
            user['total_staff'] = total_staff

            return {
                "success": True,
                "user": user
            }
        except Exception as e:
            return {"error": f"Failed to get user detail: {str(e)}"}

    def delete_user(self, admin_user_id: str, target_user_id: str) -> Dict[str, Any]:
        """Delete user (soft delete - set inactive)"""
        if not self._is_admin(admin_user_id):
            return {"error": "Access denied. Admin only."}

        if not self.supabase_client:
            return {"error": "Database not available"}

        try:
            # Log action
            self._log_admin_action(admin_user_id, 'delete_user', 'user', target_user_id)

            # Delete user profile (cascade will handle related data)
            result = self.supabase_client.table('user_profiles').delete().eq('user_id', target_user_id).execute()

            return {"success": True, "message": "User deleted"}
        except Exception as e:
            return {"error": f"Failed to delete user: {str(e)}"}

    # ==================== RESTAURANTS MANAGEMENT ====================

    def get_all_restaurants(self, admin_user_id: str, page: int = 1, limit: int = 20,
                           search: str = None, is_active: bool = None) -> Dict[str, Any]:
        """Get all restaurants with owner info"""
        if not self._is_admin(admin_user_id):
            return {"error": "Access denied. Admin only."}

        if not self.supabase_client:
            return {"error": "Database not available"}

        try:
            query = self.supabase_client.table('restaurants').select('*', count='exact')

            if search:
                query = query.or_(f"name.ilike.%{search}%,slug.ilike.%{search}%,email.ilike.%{search}%")
            if is_active is not None:
                query = query.eq('is_active', is_active)

            offset = (page - 1) * limit
            query = query.range(offset, offset + limit - 1).order('created_at', desc=True)

            result = query.execute()
            restaurants = result.data or []

            # Enrich with owner and stats
            for restaurant in restaurants:
                user_id = restaurant.get('user_id')
                restaurant_id = restaurant.get('id')

                if user_id:
                    try:
                        owner_result = self.supabase_client.table('user_profiles').select('email, role').eq('user_id', user_id).execute()
                        if owner_result.data:
                            restaurant['owner_email'] = owner_result.data[0].get('email')
                            restaurant['owner_role'] = owner_result.data[0].get('role')
                    except:
                        pass

                if restaurant_id:
                    try:
                        # Order stats
                        order_result = self.supabase_client.table('orders').select('id, total_price, payment_status', count='exact').eq('restaurant_id', restaurant_id).execute()
                        restaurant['total_orders'] = order_result.count or 0
                        restaurant['total_revenue'] = sum(float(o.get('total_price', 0)) for o in order_result.data if o.get('payment_status') == 'paid')

                        # Menu count
                        menu_result = self.supabase_client.table('menus').select('id', count='exact').eq('restaurant_id', restaurant_id).execute()
                        restaurant['menu_count'] = menu_result.count or 0

                        # Staff count
                        staff_result = self.supabase_client.table('staff').select('id', count='exact').eq('restaurant_id', restaurant_id).execute()
                        restaurant['staff_count'] = staff_result.count or 0
                    except:
                        pass

            return {
                "success": True,
                "restaurants": restaurants,
                "total": result.count or 0,
                "page": page,
                "limit": limit,
                "total_pages": ((result.count or 0) + limit - 1) // limit
            }
        except Exception as e:
            return {"error": f"Failed to get restaurants: {str(e)}"}

    def update_restaurant(self, admin_user_id: str, restaurant_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update restaurant settings"""
        if not self._is_admin(admin_user_id):
            return {"error": "Access denied. Admin only."}

        if not self.supabase_client:
            return {"error": "Database not available"}

        try:
            old_result = self.supabase_client.table('restaurants').select('*').eq('id', restaurant_id).execute()
            old_value = old_result.data[0] if old_result.data else {}

            updates['updated_at'] = datetime.now().isoformat()
            result = self.supabase_client.table('restaurants').update(updates).eq('id', restaurant_id).execute()

            self._log_admin_action(admin_user_id, 'update_restaurant', 'restaurant', restaurant_id, old_value, updates)

            return {
                "success": True,
                "restaurant": result.data[0] if result.data else None
            }
        except Exception as e:
            return {"error": f"Failed to update restaurant: {str(e)}"}

    # ==================== ORDERS MANAGEMENT ====================

    def get_all_orders(self, admin_user_id: str, page: int = 1, limit: int = 20,
                      status: str = None, payment_status: str = None,
                      restaurant_id: str = None, date_from: str = None, date_to: str = None) -> Dict[str, Any]:
        """Get all orders platform-wide"""
        if not self._is_admin(admin_user_id):
            return {"error": "Access denied. Admin only."}

        if not self.supabase_client:
            return {"error": "Database not available"}

        try:
            query = self.supabase_client.table('orders').select('*', count='exact')

            if status:
                query = query.eq('status', status)
            if payment_status:
                query = query.eq('payment_status', payment_status)
            if restaurant_id:
                query = query.eq('restaurant_id', restaurant_id)
            if date_from:
                query = query.gte('created_at', f"{date_from}T00:00:00")
            if date_to:
                query = query.lte('created_at', f"{date_to}T23:59:59")

            offset = (page - 1) * limit
            query = query.range(offset, offset + limit - 1).order('created_at', desc=True)

            result = query.execute()
            orders = result.data or []

            # Enrich with restaurant name
            for order in orders:
                restaurant_id = order.get('restaurant_id')
                if restaurant_id:
                    try:
                        rest_result = self.supabase_client.table('restaurants').select('name, slug').eq('id', restaurant_id).execute()
                        if rest_result.data:
                            order['restaurant_name'] = rest_result.data[0].get('name')
                            order['restaurant_slug'] = rest_result.data[0].get('slug')
                    except:
                        pass

            return {
                "success": True,
                "orders": orders,
                "total": result.count or 0,
                "page": page,
                "limit": limit,
                "total_pages": ((result.count or 0) + limit - 1) // limit
            }
        except Exception as e:
            return {"error": f"Failed to get orders: {str(e)}"}

    def update_order_status(self, admin_user_id: str, order_id: str, status: str = None,
                           payment_status: str = None) -> Dict[str, Any]:
        """Update order status"""
        if not self._is_admin(admin_user_id):
            return {"error": "Access denied. Admin only."}

        if not self.supabase_client:
            return {"error": "Database not available"}

        try:
            updates = {'updated_at': datetime.now().isoformat()}
            if status:
                updates['status'] = status
            if payment_status:
                updates['payment_status'] = payment_status

            result = self.supabase_client.table('orders').update(updates).eq('id', order_id).execute()

            self._log_admin_action(admin_user_id, 'update_order', 'order', order_id, None, updates)

            return {
                "success": True,
                "order": result.data[0] if result.data else None
            }
        except Exception as e:
            return {"error": f"Failed to update order: {str(e)}"}

    # ==================== PAYMENTS MANAGEMENT ====================

    def get_payment_logs(self, admin_user_id: str, page: int = 1, limit: int = 20,
                        status: str = None, restaurant_id: str = None,
                        date_from: str = None, date_to: str = None) -> Dict[str, Any]:
        """Get payment logs"""
        if not self._is_admin(admin_user_id):
            return {"error": "Access denied. Admin only."}

        if not self.supabase_client:
            return {"error": "Database not available"}

        try:
            query = self.supabase_client.table('payment_logs').select('*', count='exact')

            if status:
                query = query.eq('payment_status', status)
            if restaurant_id:
                query = query.eq('restaurant_id', restaurant_id)
            if date_from:
                query = query.gte('created_at', f"{date_from}T00:00:00")
            if date_to:
                query = query.lte('created_at', f"{date_to}T23:59:59")

            offset = (page - 1) * limit
            query = query.range(offset, offset + limit - 1).order('created_at', desc=True)

            result = query.execute()
            payments = result.data or []

            # Enrich with restaurant name
            for payment in payments:
                restaurant_id = payment.get('restaurant_id')
                if restaurant_id:
                    try:
                        rest_result = self.supabase_client.table('restaurants').select('name').eq('id', restaurant_id).execute()
                        if rest_result.data:
                            payment['restaurant_name'] = rest_result.data[0].get('name')
                    except:
                        pass

            return {
                "success": True,
                "payments": payments,
                "total": result.count or 0,
                "page": page,
                "limit": limit,
                "total_pages": ((result.count or 0) + limit - 1) // limit
            }
        except Exception as e:
            return {"error": f"Failed to get payments: {str(e)}"}

    def get_payment_summary(self, admin_user_id: str, period: str = 'month') -> Dict[str, Any]:
        """Get payment summary stats"""
        if not self._is_admin(admin_user_id):
            return {"error": "Access denied. Admin only."}

        if not self.supabase_client:
            return {"error": "Database not available"}

        try:
            # Determine date range
            if period == 'day':
                start_date = datetime.now().strftime('%Y-%m-%d')
            elif period == 'week':
                start_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
            elif period == 'month':
                start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
            else:
                start_date = (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%d')

            # Get orders with payment info
            result = self.supabase_client.table('orders').select('total_price, payment_status, payment_method, created_at').gte('created_at', f"{start_date}T00:00:00").execute()

            orders = result.data or []

            # Calculate summaries
            total_amount = sum(float(o.get('total_price', 0)) for o in orders)
            paid_amount = sum(float(o.get('total_price', 0)) for o in orders if o.get('payment_status') == 'paid')
            pending_amount = sum(float(o.get('total_price', 0)) for o in orders if o.get('payment_status') == 'pending')
            refunded_amount = sum(float(o.get('total_price', 0)) for o in orders if o.get('payment_status') == 'refunded')

            # By payment method
            by_method = {}
            for order in orders:
                method = order.get('payment_method', 'unknown')
                if method not in by_method:
                    by_method[method] = {'count': 0, 'amount': 0}
                by_method[method]['count'] += 1
                by_method[method]['amount'] += float(order.get('total_price', 0))

            return {
                "success": True,
                "period": period,
                "summary": {
                    "total_transactions": len(orders),
                    "total_amount": round(total_amount, 2),
                    "paid_amount": round(paid_amount, 2),
                    "pending_amount": round(pending_amount, 2),
                    "refunded_amount": round(refunded_amount, 2),
                    "by_payment_method": by_method
                }
            }
        except Exception as e:
            return {"error": f"Failed to get payment summary: {str(e)}"}

    # ==================== COUPONS MANAGEMENT ====================

    def get_all_coupons(self, admin_user_id: str, page: int = 1, limit: int = 20,
                       is_active: bool = None, restaurant_id: str = None) -> Dict[str, Any]:
        """Get all coupons"""
        if not self._is_admin(admin_user_id):
            return {"error": "Access denied. Admin only."}

        if not self.supabase_client:
            return {"error": "Database not available"}

        try:
            query = self.supabase_client.table('coupons').select('*', count='exact')

            if is_active is not None:
                query = query.eq('is_active', is_active)
            if restaurant_id:
                query = query.eq('restaurant_id', restaurant_id)

            offset = (page - 1) * limit
            query = query.range(offset, offset + limit - 1).order('created_at', desc=True)

            result = query.execute()
            coupons = result.data or []

            # Enrich with usage stats and restaurant name
            for coupon in coupons:
                coupon_id = coupon.get('id')
                restaurant_id = coupon.get('restaurant_id')

                if restaurant_id:
                    try:
                        rest_result = self.supabase_client.table('restaurants').select('name').eq('id', restaurant_id).execute()
                        if rest_result.data:
                            coupon['restaurant_name'] = rest_result.data[0].get('name')
                    except:
                        coupon['restaurant_name'] = 'Global'
                else:
                    coupon['restaurant_name'] = 'Global'

            return {
                "success": True,
                "coupons": coupons,
                "total": result.count or 0,
                "page": page,
                "limit": limit,
                "total_pages": ((result.count or 0) + limit - 1) // limit
            }
        except Exception as e:
            return {"error": f"Failed to get coupons: {str(e)}"}

    def create_coupon(self, admin_user_id: str, coupon_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new coupon"""
        if not self._is_admin(admin_user_id):
            return {"error": "Access denied. Admin only."}

        if not self.supabase_client:
            return {"error": "Database not available"}

        try:
            # Clean up empty values - convert empty strings to None for optional fields
            cleaned_data = {}
            for key, value in coupon_data.items():
                if value == '' or value is None:
                    # Skip empty values for optional fields
                    if key in ['description', 'start_date', 'end_date', 'usage_limit', 'max_discount_amount', 'restaurant_id']:
                        continue
                cleaned_data[key] = value

            cleaned_data['created_by'] = admin_user_id
            result = self.supabase_client.table('coupons').insert(cleaned_data).execute()

            self._log_admin_action(admin_user_id, 'create_coupon', 'coupon',
                                   result.data[0].get('id') if result.data else None, None, coupon_data)

            return {
                "success": True,
                "coupon": result.data[0] if result.data else None
            }
        except Exception as e:
            return {"error": f"Failed to create coupon: {str(e)}"}

    def update_coupon(self, admin_user_id: str, coupon_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update coupon"""
        if not self._is_admin(admin_user_id):
            return {"error": "Access denied. Admin only."}

        if not self.supabase_client:
            return {"error": "Database not available"}

        try:
            # Clean up empty values - convert empty strings to None for date fields
            cleaned_updates = {}
            for key, value in updates.items():
                if value == '':
                    # Convert empty strings to None for date/optional fields
                    if key in ['start_date', 'end_date', 'description', 'usage_limit', 'max_discount_amount', 'restaurant_id']:
                        cleaned_updates[key] = None
                    continue
                cleaned_updates[key] = value

            cleaned_updates['updated_at'] = datetime.now().isoformat()
            result = self.supabase_client.table('coupons').update(cleaned_updates).eq('id', coupon_id).execute()

            self._log_admin_action(admin_user_id, 'update_coupon', 'coupon', coupon_id, None, updates)

            return {
                "success": True,
                "coupon": result.data[0] if result.data else None
            }
        except Exception as e:
            return {"error": f"Failed to update coupon: {str(e)}"}

    def delete_coupon(self, admin_user_id: str, coupon_id: str) -> Dict[str, Any]:
        """Delete coupon"""
        if not self._is_admin(admin_user_id):
            return {"error": "Access denied. Admin only."}

        if not self.supabase_client:
            return {"error": "Database not available"}

        try:
            self._log_admin_action(admin_user_id, 'delete_coupon', 'coupon', coupon_id)

            self.supabase_client.table('coupons').delete().eq('id', coupon_id).execute()

            return {"success": True, "message": "Coupon deleted"}
        except Exception as e:
            return {"error": f"Failed to delete coupon: {str(e)}"}

    # ==================== ACTIVITY LOGS ====================

    def get_activity_logs(self, admin_user_id: str, page: int = 1, limit: int = 50,
                         action_filter: str = None, target_type: str = None) -> Dict[str, Any]:
        """Get admin activity logs"""
        if not self._is_admin(admin_user_id):
            return {"error": "Access denied. Admin only."}

        if not self.supabase_client:
            return {"error": "Database not available"}

        try:
            query = self.supabase_client.table('admin_activity_logs').select('*', count='exact')

            if action_filter:
                query = query.ilike('action', f'%{action_filter}%')
            if target_type:
                query = query.eq('target_type', target_type)

            offset = (page - 1) * limit
            query = query.range(offset, offset + limit - 1).order('created_at', desc=True)

            result = query.execute()
            logs = result.data or []

            # Enrich with admin email
            for log in logs:
                admin_id = log.get('admin_user_id')
                if admin_id:
                    try:
                        admin_result = self.supabase_client.table('user_profiles').select('email').eq('user_id', admin_id).execute()
                        if admin_result.data:
                            log['admin_email'] = admin_result.data[0].get('email')
                    except:
                        pass

            return {
                "success": True,
                "logs": logs,
                "total": result.count or 0,
                "page": page,
                "limit": limit,
                "total_pages": ((result.count or 0) + limit - 1) // limit
            }
        except Exception as e:
            return {"error": f"Failed to get logs: {str(e)}"}

    # ==================== STAFF MANAGEMENT (All Restaurants) ====================

    def get_all_staff(self, admin_user_id: str, page: int = 1, limit: int = 20,
                     restaurant_id: str = None, role: str = None) -> Dict[str, Any]:
        """Get all staff across all restaurants"""
        if not self._is_admin(admin_user_id):
            return {"error": "Access denied. Admin only."}

        if not self.supabase_client:
            return {"error": "Database not available"}

        try:
            query = self.supabase_client.table('staff').select('*', count='exact')

            if restaurant_id:
                query = query.eq('restaurant_id', restaurant_id)
            if role:
                query = query.eq('role', role)

            offset = (page - 1) * limit
            query = query.range(offset, offset + limit - 1).order('created_at', desc=True)

            result = query.execute()
            staff = result.data or []

            # Enrich with restaurant name
            for member in staff:
                rest_id = member.get('restaurant_id')
                if rest_id:
                    try:
                        rest_result = self.supabase_client.table('restaurants').select('name').eq('id', rest_id).execute()
                        if rest_result.data:
                            member['restaurant_name'] = rest_result.data[0].get('name')
                    except:
                        pass

            return {
                "success": True,
                "staff": staff,
                "total": result.count or 0,
                "page": page,
                "limit": limit,
                "total_pages": ((result.count or 0) + limit - 1) // limit
            }
        except Exception as e:
            return {"error": f"Failed to get staff: {str(e)}"}


    # ==================== BANK TRANSFER APPROVAL ====================

    def get_pending_approvals(self, admin_user_id: str) -> Dict[str, Any]:
        """Get all pending bank transfer payments awaiting approval"""
        if not self._is_admin(admin_user_id):
            return {"error": "Access denied. Admin only."}

        if not self.supabase_client:
            return {"error": "Database not available"}

        try:
            result = self.supabase_client.table('payment_logs').select('*').eq('payment_status', 'pending_approval').order('created_at', desc=True).execute()
            payments = result.data or []

            # Enrich with user and restaurant info
            for payment in payments:
                user_id = payment.get('user_id')
                if user_id:
                    try:
                        user_result = self.supabase_client.table('user_profiles').select('email, restaurant_name, phone').eq('user_id', user_id).execute()
                        if user_result.data:
                            payment['user_email'] = user_result.data[0].get('email')
                            payment['restaurant_name'] = user_result.data[0].get('restaurant_name')
                            payment['user_phone'] = user_result.data[0].get('phone')
                    except:
                        pass

            return {
                "success": True,
                "payments": payments,
                "count": len(payments)
            }
        except Exception as e:
            return {"error": f"Failed to get pending approvals: {str(e)}"}

    def approve_bank_transfer(self, admin_user_id: str, payment_log_id: str, notes: str = None) -> Dict[str, Any]:
        """Approve bank transfer payment and activate subscription"""
        if not self._is_admin(admin_user_id):
            return {"error": "Access denied. Admin only."}

        if not self.supabase_client:
            return {"error": "Database not available"}

        try:
            # Get payment log
            payment_result = self.supabase_client.table('payment_logs').select('*').eq('id', payment_log_id).execute()
            if not payment_result.data:
                return {"error": "Payment not found"}

            payment = payment_result.data[0]
            user_id = payment.get('user_id')
            plan = payment.get('plan')
            billing_interval = payment.get('billing_interval', 'monthly')

            # Update payment log
            now = datetime.now()
            payment_updates = {
                'payment_status': 'completed',
                'admin_approved_by': admin_user_id,
                'admin_approved_at': now.isoformat(),
                'admin_notes': notes,
                'updated_at': now.isoformat()
            }
            self.supabase_client.table('payment_logs').update(payment_updates).eq('id', payment_log_id).execute()

            # Calculate subscription dates
            if billing_interval == 'yearly':
                next_billing = now + timedelta(days=365)
            else:
                next_billing = now + timedelta(days=30)

            # Update user subscription
            user_updates = {
                'subscription_status': 'active',
                'plan': plan,
                'role': plan,  # Also update role to match plan
                'billing_interval': billing_interval,
                'subscription_start_date': now.isoformat(),
                'subscription_end_date': next_billing.isoformat(),
                'next_billing_date': next_billing.isoformat(),
                'payment_method': 'bank_transfer',
                'updated_at': now.isoformat()
            }
            self.supabase_client.table('user_profiles').update(user_updates).eq('user_id', user_id).execute()

            # Log action
            self._log_admin_action(admin_user_id, 'approve_bank_transfer', 'payment', payment_log_id, None, {
                'plan': plan,
                'notes': notes
            })

            return {
                "success": True,
                "message": "Payment approved and subscription activated",
                "payment_id": payment_log_id,
                "user_id": user_id,
                "plan": plan,
                "next_billing_date": next_billing.isoformat()
            }
        except Exception as e:
            return {"error": f"Failed to approve payment: {str(e)}"}

    def reject_bank_transfer(self, admin_user_id: str, payment_log_id: str, reason: str) -> Dict[str, Any]:
        """Reject bank transfer payment with reason"""
        if not self._is_admin(admin_user_id):
            return {"error": "Access denied. Admin only."}

        if not self.supabase_client:
            return {"error": "Database not available"}

        try:
            # Get payment log
            payment_result = self.supabase_client.table('payment_logs').select('*').eq('id', payment_log_id).execute()
            if not payment_result.data:
                return {"error": "Payment not found"}

            payment = payment_result.data[0]
            user_id = payment.get('user_id')

            # Update payment log
            now = datetime.now()
            payment_updates = {
                'payment_status': 'failed',
                'admin_approved_by': admin_user_id,
                'admin_approved_at': now.isoformat(),
                'rejection_reason': reason,
                'updated_at': now.isoformat()
            }
            self.supabase_client.table('payment_logs').update(payment_updates).eq('id', payment_log_id).execute()

            # Update user status to pending_payment
            self.supabase_client.table('user_profiles').update({
                'subscription_status': 'pending_payment',
                'updated_at': now.isoformat()
            }).eq('user_id', user_id).execute()

            # Log action
            self._log_admin_action(admin_user_id, 'reject_bank_transfer', 'payment', payment_log_id, None, {
                'reason': reason
            })

            return {
                "success": True,
                "message": "Payment rejected",
                "payment_id": payment_log_id,
                "reason": reason
            }
        except Exception as e:
            return {"error": f"Failed to reject payment: {str(e)}"}

    # ==================== SUBSCRIPTION MANAGEMENT ====================

    def extend_subscription(self, admin_user_id: str, target_user_id: str, extension_days: int, reason: str = None) -> Dict[str, Any]:
        """Extend user subscription by days"""
        if not self._is_admin(admin_user_id):
            return {"error": "Access denied. Admin only."}

        if not self.supabase_client:
            return {"error": "Database not available"}

        try:
            # Get current user profile
            result = self.supabase_client.table('user_profiles').select('*').eq('user_id', target_user_id).execute()
            if not result.data:
                return {"error": "User not found"}

            user = result.data[0]
            old_end_date = user.get('subscription_end_date') or user.get('trial_end_date')

            # Calculate new end date
            if old_end_date:
                current_end = datetime.fromisoformat(old_end_date.replace('Z', '+00:00'))
            else:
                current_end = datetime.now()

            new_end_date = current_end + timedelta(days=extension_days)

            # Update user
            now = datetime.now()
            updates = {
                'subscription_end_date': new_end_date.isoformat(),
                'next_billing_date': new_end_date.isoformat(),
                'admin_notes': f"Extended by {extension_days} days. Reason: {reason or 'N/A'}. Previous: {old_end_date}",
                'updated_at': now.isoformat()
            }

            # If in trial, also extend trial_end_date
            if user.get('subscription_status') == 'trial':
                updates['trial_end_date'] = new_end_date.isoformat()

            self.supabase_client.table('user_profiles').update(updates).eq('user_id', target_user_id).execute()

            # Log action
            self._log_admin_action(admin_user_id, 'extend_subscription', 'user', target_user_id,
                                   {'end_date': old_end_date}, {'end_date': new_end_date.isoformat(), 'extension_days': extension_days})

            return {
                "success": True,
                "message": f"Subscription extended by {extension_days} days",
                "old_end_date": old_end_date,
                "new_end_date": new_end_date.isoformat()
            }
        except Exception as e:
            return {"error": f"Failed to extend subscription: {str(e)}"}

    def change_user_plan(self, admin_user_id: str, target_user_id: str, new_plan: str, reason: str = None, billing_interval: str = 'monthly') -> Dict[str, Any]:
        """Change user's subscription plan and set subscription dates automatically"""
        if not self._is_admin(admin_user_id):
            return {"error": "Access denied. Admin only."}

        if not self.supabase_client:
            return {"error": "Database not available"}

        valid_plans = ['free_trial', 'starter', 'professional', 'enterprise']
        if new_plan not in valid_plans:
            return {"error": f"Invalid plan. Must be one of: {', '.join(valid_plans)}"}

        if billing_interval not in ['monthly', 'yearly']:
            billing_interval = 'monthly'

        try:
            # Get current user profile
            result = self.supabase_client.table('user_profiles').select('*').eq('user_id', target_user_id).execute()
            if not result.data:
                return {"error": "User not found"}

            user = result.data[0]
            old_plan = user.get('plan')

            # Update user
            now = datetime.now()
            updates = {
                'plan': new_plan,
                'role': new_plan,  # Also update role
                'subscription_status': 'active' if new_plan != 'free_trial' else 'trial',
                'admin_notes': f"Plan changed from {old_plan} to {new_plan}. Reason: {reason or 'Admin action'}",
                'updated_at': now.isoformat()
            }

            # Set subscription dates for paid plans
            if new_plan != 'free_trial':
                # Calculate subscription end date based on billing interval
                if billing_interval == 'yearly':
                    subscription_end = now + timedelta(days=365)
                else:
                    subscription_end = now + timedelta(days=30)

                updates['subscription_start_date'] = now.isoformat()
                updates['subscription_end_date'] = subscription_end.isoformat()
                updates['next_billing_date'] = subscription_end.isoformat()
                updates['billing_interval'] = billing_interval
                updates['last_payment_date'] = now.isoformat()

            self.supabase_client.table('user_profiles').update(updates).eq('user_id', target_user_id).execute()

            # Log action
            self._log_admin_action(admin_user_id, 'change_plan', 'user', target_user_id,
                                   {'plan': old_plan}, {'plan': new_plan, 'reason': reason})

            return {
                "success": True,
                "message": f"Plan changed from {old_plan} to {new_plan}",
                "old_plan": old_plan,
                "new_plan": new_plan
            }
        except Exception as e:
            return {"error": f"Failed to change plan: {str(e)}"}

    def cancel_subscription(self, admin_user_id: str, target_user_id: str, reason: str = None, immediate: bool = False) -> Dict[str, Any]:
        """Cancel user subscription"""
        if not self._is_admin(admin_user_id):
            return {"error": "Access denied. Admin only."}

        if not self.supabase_client:
            return {"error": "Database not available"}

        try:
            # Get current user profile
            result = self.supabase_client.table('user_profiles').select('*').eq('user_id', target_user_id).execute()
            if not result.data:
                return {"error": "User not found"}

            user = result.data[0]
            old_status = user.get('subscription_status')

            # Update user
            now = datetime.now()
            updates = {
                'subscription_status': 'cancelled',
                'admin_notes': f"Cancelled by admin. Reason: {reason or 'N/A'}",
                'updated_at': now.isoformat()
            }

            if immediate:
                updates['subscription_end_date'] = now.isoformat()
                updates['is_active'] = False

            self.supabase_client.table('user_profiles').update(updates).eq('user_id', target_user_id).execute()

            # Log action
            self._log_admin_action(admin_user_id, 'cancel_subscription', 'user', target_user_id,
                                   {'status': old_status}, {'status': 'cancelled', 'immediate': immediate})

            return {
                "success": True,
                "message": "Subscription cancelled",
                "immediate": immediate
            }
        except Exception as e:
            return {"error": f"Failed to cancel subscription: {str(e)}"}

    def get_expiring_subscriptions(self, admin_user_id: str, days: int = 7) -> Dict[str, Any]:
        """Get subscriptions expiring within N days"""
        if not self._is_admin(admin_user_id):
            return {"error": "Access denied. Admin only."}

        if not self.supabase_client:
            return {"error": "Database not available"}

        try:
            now = datetime.now()
            future_date = (now + timedelta(days=days)).isoformat()

            # Get users with expiring subscriptions or trials
            result = self.supabase_client.table('user_profiles').select('*').or_(
                f"subscription_end_date.lte.{future_date},trial_end_date.lte.{future_date}"
            ).in_('subscription_status', ['active', 'trial']).order('subscription_end_date').execute()

            users = result.data or []

            # Categorize and calculate days remaining
            expiring = []
            for user in users:
                end_date = user.get('subscription_end_date') or user.get('trial_end_date')
                if end_date:
                    try:
                        end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                        days_remaining = (end_dt - now).days
                        if days_remaining <= days:
                            user['days_remaining'] = days_remaining
                            user['end_date'] = end_date
                            expiring.append(user)
                    except:
                        pass

            return {
                "success": True,
                "expiring_users": expiring,
                "count": len(expiring),
                "within_days": days
            }
        except Exception as e:
            return {"error": f"Failed to get expiring subscriptions: {str(e)}"}

    # ==================== ADMIN NOTIFICATIONS ====================

    def get_admin_notifications(self, admin_user_id: str) -> Dict[str, Any]:
        """Get admin notifications (pending approvals, expiring trials, etc.)"""
        if not self._is_admin(admin_user_id):
            return {"error": "Access denied. Admin only."}

        if not self.supabase_client:
            return {"error": "Database not available"}

        try:
            notifications = []

            # Pending bank transfer approvals
            pending_result = self.supabase_client.table('payment_logs').select('id', count='exact').eq('payment_status', 'pending_approval').execute()
            pending_count = pending_result.count or 0
            if pending_count > 0:
                notifications.append({
                    'type': 'pending_approval',
                    'title': 'Pending Payment Approvals',
                    'message': f'{pending_count} bank transfer(s) waiting for approval',
                    'count': pending_count,
                    'priority': 'high',
                    'link': '/dashboard/admin/payments'
                })

            # Expiring trials (within 3 days)
            now = datetime.now()
            three_days = (now + timedelta(days=3)).isoformat()
            expiring_result = self.supabase_client.table('user_profiles').select('id', count='exact').eq('subscription_status', 'trial').lte('trial_end_date', three_days).execute()
            expiring_count = expiring_result.count or 0
            if expiring_count > 0:
                notifications.append({
                    'type': 'expiring_trial',
                    'title': 'Expiring Trials',
                    'message': f'{expiring_count} trial(s) expiring in 3 days',
                    'count': expiring_count,
                    'priority': 'medium',
                    'link': '/dashboard/admin/customers?filter=expiring'
                })

            # Expiring subscriptions (within 7 days)
            seven_days = (now + timedelta(days=7)).isoformat()
            exp_sub_result = self.supabase_client.table('user_profiles').select('id', count='exact').eq('subscription_status', 'active').lte('subscription_end_date', seven_days).execute()
            exp_sub_count = exp_sub_result.count or 0
            if exp_sub_count > 0:
                notifications.append({
                    'type': 'expiring_subscription',
                    'title': 'Expiring Subscriptions',
                    'message': f'{exp_sub_count} subscription(s) expiring in 7 days',
                    'count': exp_sub_count,
                    'priority': 'medium',
                    'link': '/dashboard/admin/customers?filter=expiring'
                })

            # New users today
            today = now.strftime('%Y-%m-%d')
            new_users_result = self.supabase_client.table('user_profiles').select('id', count='exact').gte('created_at', f"{today}T00:00:00").execute()
            new_count = new_users_result.count or 0
            if new_count > 0:
                notifications.append({
                    'type': 'new_users',
                    'title': 'New Users Today',
                    'message': f'{new_count} new user(s) registered today',
                    'count': new_count,
                    'priority': 'low',
                    'link': '/dashboard/admin/customers'
                })

            return {
                "success": True,
                "notifications": notifications,
                "total_count": sum(n['count'] for n in notifications)
            }
        except Exception as e:
            return {"error": f"Failed to get notifications: {str(e)}"}

    # ==================== REPORTS ====================

    def get_subscription_report(self, admin_user_id: str) -> Dict[str, Any]:
        """Get subscription statistics and trends"""
        if not self._is_admin(admin_user_id):
            return {"error": "Access denied. Admin only."}

        if not self.supabase_client:
            return {"error": "Database not available"}

        try:
            # Get all user profiles
            result = self.supabase_client.table('user_profiles').select('*').execute()
            users = result.data or []

            # Calculate stats
            total_users = len(users)
            by_status = {}
            by_plan = {}
            by_payment_method = {}

            for user in users:
                status = user.get('subscription_status', 'trial')
                by_status[status] = by_status.get(status, 0) + 1

                plan = user.get('plan', 'free_trial')
                by_plan[plan] = by_plan.get(plan, 0) + 1

                method = user.get('payment_method', 'none')
                by_payment_method[method] = by_payment_method.get(method, 0) + 1

            # Calculate monthly recurring revenue (MRR)
            plan_prices = {
                'starter': 39,
                'professional': 89,
                'enterprise': 199
            }
            mrr = 0
            for user in users:
                if user.get('subscription_status') == 'active':
                    plan = user.get('plan', '')
                    interval = user.get('billing_interval', 'monthly')
                    price = plan_prices.get(plan, 0)
                    if interval == 'yearly':
                        mrr += price * 0.8 / 12  # Assume 20% yearly discount
                    else:
                        mrr += price

            return {
                "success": True,
                "report": {
                    "total_users": total_users,
                    "by_status": by_status,
                    "by_plan": by_plan,
                    "by_payment_method": by_payment_method,
                    "mrr": round(mrr, 2),
                    "arr": round(mrr * 12, 2)
                }
            }
        except Exception as e:
            return {"error": f"Failed to get subscription report: {str(e)}"}

    def get_revenue_report(self, admin_user_id: str, period: str = 'month') -> Dict[str, Any]:
        """Get revenue report with breakdown"""
        if not self._is_admin(admin_user_id):
            return {"error": "Access denied. Admin only."}

        if not self.supabase_client:
            return {"error": "Database not available"}

        try:
            # Determine date range
            now = datetime.now()
            if period == 'day':
                start_date = now.strftime('%Y-%m-%d')
            elif period == 'week':
                start_date = (now - timedelta(days=7)).strftime('%Y-%m-%d')
            elif period == 'month':
                start_date = (now - timedelta(days=30)).strftime('%Y-%m-%d')
            elif period == 'year':
                start_date = (now - timedelta(days=365)).strftime('%Y-%m-%d')
            else:
                start_date = (now - timedelta(days=30)).strftime('%Y-%m-%d')

            # Get payment logs
            result = self.supabase_client.table('payment_logs').select('*').eq('payment_status', 'completed').gte('created_at', f"{start_date}T00:00:00").execute()
            payments = result.data or []

            # Calculate revenue breakdown
            total_revenue = sum(float(p.get('amount', 0)) for p in payments)
            by_plan = {}
            by_method = {}

            for payment in payments:
                plan = payment.get('plan', 'unknown')
                by_plan[plan] = by_plan.get(plan, 0) + float(payment.get('amount', 0))

                method = payment.get('payment_method', 'unknown')
                by_method[method] = by_method.get(method, 0) + float(payment.get('amount', 0))

            return {
                "success": True,
                "report": {
                    "period": period,
                    "total_revenue": round(total_revenue, 2),
                    "transaction_count": len(payments),
                    "by_plan": {k: round(v, 2) for k, v in by_plan.items()},
                    "by_payment_method": {k: round(v, 2) for k, v in by_method.items()}
                }
            }
        except Exception as e:
            return {"error": f"Failed to get revenue report: {str(e)}"}

    # ==================== SUBMIT BANK TRANSFER (For Users) ====================

    def submit_bank_transfer(self, user_id: str, plan: str, amount: float, billing_interval: str = 'monthly',
                             slip_url: str = None, reference: str = None, bank_name: str = None) -> Dict[str, Any]:
        """Submit bank transfer payment for approval"""
        if not self.supabase_client:
            return {"error": "Database not available"}

        try:
            # Create payment log
            payment_data = {
                'user_id': user_id,
                'amount': amount,
                'currency': 'NZD',
                'payment_type': 'subscription',
                'payment_method': 'bank_transfer',
                'payment_status': 'pending_approval',
                'plan': plan,
                'billing_interval': billing_interval,
                'bank_transfer_slip_url': slip_url,
                'bank_transfer_reference': reference,
                'bank_name': bank_name
            }

            result = self.supabase_client.table('payment_logs').insert(payment_data).execute()

            # Update user status to pending_payment
            self.supabase_client.table('user_profiles').update({
                'subscription_status': 'pending_payment',
                'updated_at': datetime.now().isoformat()
            }).eq('user_id', user_id).execute()

            return {
                "success": True,
                "message": "Bank transfer submitted for approval",
                "payment_id": result.data[0].get('id') if result.data else None
            }
        except Exception as e:
            return {"error": f"Failed to submit bank transfer: {str(e)}"}


# Create singleton instance
admin_service = AdminService()
