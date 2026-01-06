"""
Staff Management Service - Manage restaurant staff members
"""
import os
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv
import pathlib
import secrets

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

class StaffService:
    """Service for managing restaurant staff"""
    
    def __init__(self):
        self.supabase_client: Optional[Client] = None
        if SUPABASE_AVAILABLE and SUPABASE_URL and SUPABASE_KEY:
            try:
                self.supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
                print("✅ Staff Service: Supabase client initialized")
            except Exception as e:
                print(f"⚠️ Staff Service: Failed to initialize: {str(e)}")
    
    def create_staff(
        self,
        restaurant_id: str,
        staff_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Create new staff member
        
        Args:
            restaurant_id: Restaurant ID
            staff_data: Staff information (name, email, role, etc.)
            
        Returns:
            Created staff member or None
        """
        if not self.supabase_client:
            return None
        
        try:
            # Generate PIN code if not provided
            if not staff_data.get('pin_code'):
                staff_data['pin_code'] = str(secrets.randbelow(1000000)).zfill(6)
            
            # Set default permissions based on role
            if not staff_data.get('permissions'):
                staff_data['permissions'] = self._get_default_permissions(
                    staff_data.get('role', 'waiter')
                )
            
            staff_data['restaurant_id'] = restaurant_id
            
            result = self.supabase_client.table('staff').insert(staff_data).execute()
            
            if result.data and len(result.data) > 0:
                print(f"✅ Staff created: {result.data[0].get('name')}")
                return result.data[0]
            
            return None
            
        except Exception as e:
            print(f"❌ Failed to create staff: {str(e)}")
            return None
    
    def get_staff_by_restaurant(self, restaurant_id: str) -> List[Dict[str, Any]]:
        """Get all staff members for a restaurant"""
        if not self.supabase_client:
            return []
        
        try:
            result = self.supabase_client.table('staff').select('*').eq(
                'restaurant_id', restaurant_id
            ).eq(
                'is_active', True
            ).execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            print(f"❌ Failed to get staff: {str(e)}")
            return []
    
    def update_staff(
        self,
        staff_id: str,
        update_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update staff member information"""
        if not self.supabase_client:
            return None
        
        try:
            # Add updated_at timestamp
            update_data['updated_at'] = 'NOW()'
            
            result = self.supabase_client.table('staff').update(
                update_data
            ).eq('id', staff_id).execute()
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            
            return None
            
        except Exception as e:
            print(f"❌ Failed to update staff: {str(e)}")
            return None
    
    def deactivate_staff(self, staff_id: str) -> bool:
        """Deactivate (soft delete) staff member"""
        if not self.supabase_client:
            return False
        
        try:
            result = self.supabase_client.table('staff').update({
                'is_active': False,
                'updated_at': 'NOW()'
            }).eq('id', staff_id).execute()
            
            return bool(result.data)
            
        except Exception as e:
            print(f"❌ Failed to deactivate staff: {str(e)}")
            return False
    
    def verify_pin(self, restaurant_id: str, pin_code: str) -> Optional[Dict[str, Any]]:
        """
        Verify staff PIN code for POS login

        Args:
            restaurant_id: Restaurant ID
            pin_code: 6-digit PIN code

        Returns:
            Staff member data if PIN is valid
        """
        if not self.supabase_client:
            print("❌ Verify PIN: Supabase client not available")
            return None

        try:
            # Ensure PIN is string and 6 digits
            pin_code = str(pin_code).strip()

            print(f"🔍 Verifying PIN for restaurant: {restaurant_id}")
            print(f"🔍 PIN code (masked): {'*' * len(pin_code)}")

            # First, check if there are any staff for this restaurant
            all_staff = self.supabase_client.table('staff').select('id, name, role, pin_code, is_active').eq(
                'restaurant_id', restaurant_id
            ).execute()

            print(f"📋 Total staff found for restaurant: {len(all_staff.data) if all_staff.data else 0}")

            if all_staff.data:
                for staff in all_staff.data:
                    staff_pin = str(staff.get('pin_code', '')).strip() if staff.get('pin_code') else ''
                    is_active = staff.get('is_active', False)
                    print(f"   - {staff.get('name')}: PIN exists={bool(staff_pin)}, is_active={is_active}, PIN match={staff_pin == pin_code}")

            # Now do the actual verification
            result = self.supabase_client.table('staff').select('*').eq(
                'restaurant_id', restaurant_id
            ).eq(
                'pin_code', pin_code
            ).eq(
                'is_active', True
            ).limit(1).execute()

            if result.data and len(result.data) > 0:
                staff = result.data[0]
                print(f"✅ PIN verified for staff: {staff.get('name')} ({staff.get('role')})")
                return staff

            print(f"❌ No matching staff found with given PIN")
            return None

        except Exception as e:
            print(f"❌ Failed to verify PIN: {str(e)}")
            import traceback
            traceback.print_exc()
            return None
    
    def log_activity(
        self,
        staff_id: str,
        restaurant_id: str,
        action: str,
        description: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Log staff activity"""
        if not self.supabase_client:
            return False
        
        try:
            log_data = {
                'staff_id': staff_id,
                'restaurant_id': restaurant_id,
                'action': action,
                'description': description,
                'metadata': metadata or {}
            }
            
            result = self.supabase_client.table('staff_activity_log').insert(log_data).execute()
            return bool(result.data)
            
        except Exception as e:
            print(f"❌ Failed to log activity: {str(e)}")
            return False
    
    def _get_default_permissions(self, role: str) -> Dict[str, bool]:
        """Get default permissions based on role"""
        permissions_by_role = {
            'owner': {
                'can_view_orders': True,
                'can_update_orders': True,
                'can_manage_menu': True,
                'can_view_analytics': True,
                'can_manage_staff': True,
                'can_manage_settings': True
            },
            'manager': {
                'can_view_orders': True,
                'can_update_orders': True,
                'can_manage_menu': True,
                'can_view_analytics': True,
                'can_manage_staff': True,
                'can_manage_settings': False
            },
            'chef': {
                'can_view_orders': True,
                'can_update_orders': True,
                'can_manage_menu': False,
                'can_view_analytics': False,
                'can_manage_staff': False,
                'can_manage_settings': False
            },
            'waiter': {
                'can_view_orders': True,
                'can_update_orders': True,
                'can_manage_menu': False,
                'can_view_analytics': False,
                'can_manage_staff': False,
                'can_manage_settings': False
            },
            'cashier': {
                'can_view_orders': True,
                'can_update_orders': False,
                'can_manage_menu': False,
                'can_view_analytics': True,
                'can_manage_staff': False,
                'can_manage_settings': False
            }
        }
        
        return permissions_by_role.get(role, permissions_by_role['waiter'])


# Create singleton instance
staff_service = StaffService()

