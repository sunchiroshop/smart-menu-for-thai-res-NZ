"""
User Role Service - จัดการ User Roles และ Permissions
"""
import os
from typing import Optional, Dict, Any, List
from supabase import create_client, Client

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

# Available roles
AVAILABLE_ROLES = ['free_trial', 'starter', 'professional', 'enterprise', 'admin']

class UserRoleService:
    """
    จัดการ User Roles และ Permissions
    
    Roles:
    - free_trial: Free trial users (14 days)
    - starter: Starter plan subscribers
    - professional: Professional plan subscribers
    - enterprise: Enterprise plan subscribers
    - admin: Admin users (unlimited access)
    """
    
    def __init__(self):
        self.supabase_client: Optional[Client] = None
        if SUPABASE_URL and SUPABASE_KEY:
            try:
                self.supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
                print("✅ User Role Service: Supabase client initialized")
            except Exception as e:
                print(f"⚠️ User Role Service: Failed to initialize Supabase client: {str(e)}")
        else:
            print("⚠️ User Role Service: Supabase credentials not found")
    
    def get_user_role(self, user_id: str) -> str:
        """
        ดึง role ของ user
        
        Args:
            user_id: User ID
            
        Returns:
            Role string (default: 'free_trial')
        """
        if not self.supabase_client:
            return 'free_trial'
        
        # Handle non-UUID user_id (like 'default' for testing)
        if user_id == 'default' or not self._is_valid_uuid(user_id):
            # For testing/default users, try to get first admin user from database
            print(f"⚠️ Testing mode: user_id='{user_id}' is not a valid UUID")
            # Try to get first user from database as fallback
            try:
                result = self.supabase_client.table('user_profiles').select('role').limit(1).execute()
                if result.data and len(result.data) > 0:
                    return result.data[0].get('role', 'free_trial')
            except:
                pass
            return 'free_trial'
        
        try:
            result = self.supabase_client.table('user_profiles').select('role').eq('user_id', user_id).execute()
            if result.data and len(result.data) > 0:
                return result.data[0].get('role', 'free_trial')
        except Exception as e:
            error_msg = str(e)
            # If it's a UUID format error, return default role
            if 'invalid input syntax for type uuid' in error_msg.lower():
                print(f"⚠️ Invalid UUID format for user_id: {user_id}, returning default role")
                return 'free_trial'
            print(f"⚠️ Failed to get user role: {error_msg}")
        
        return 'free_trial'
    
    def _is_valid_uuid(self, uuid_string: str) -> bool:
        """ตรวจสอบว่า string เป็น UUID format หรือไม่"""
        import re
        uuid_pattern = re.compile(
            r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
            re.IGNORECASE
        )
        return bool(uuid_pattern.match(uuid_string))
    
    def set_user_role(self, user_id: str, role: str, admin_user_id: str) -> Dict[str, Any]:
        """
        ตั้งค่า role ของ user (ต้องเป็น admin เท่านั้น)
        Admin สามารถเปลี่ยน role ของตัวเองได้
        
        Args:
            user_id: User ID ที่ต้องการเปลี่ยน role
            role: Role ใหม่
            admin_user_id: User ID ของ admin ที่ทำการเปลี่ยน
            
        Returns:
            Dictionary with success status
        """
        if not self.supabase_client:
            return {"success": False, "error": "Supabase client not available"}
        
        # Validate role
        if role not in AVAILABLE_ROLES:
            return {"success": False, "error": f"Invalid role. Must be one of: {', '.join(AVAILABLE_ROLES)}"}
        
        # Check if requester is admin
        requester_role = self.get_user_role(admin_user_id)
        if requester_role != 'admin':
            return {"success": False, "error": "Only admins can change user roles"}
        
        # Handle non-UUID user_id (like 'default' for testing)
        if user_id == 'default' or not self._is_valid_uuid(user_id):
            # For testing/default users, just return success (no database update)
            print(f"⚠️ Non-UUID user_id '{user_id}' - skipping database update (testing mode)")
            return {"success": True, "role": role, "message": "Role updated (testing mode - no database update)"}
        
        try:
            # Check if profile exists
            existing = self.supabase_client.table('user_profiles').select('*').eq('user_id', user_id).execute()
            
            if existing.data and len(existing.data) > 0:
                # Admin can change their own role or other users' roles
                # Update existing profile
                result = self.supabase_client.table('user_profiles').update({
                    'role': role
                }).eq('user_id', user_id).execute()
                
                if result.data:
                    print(f"✅ Updated user {user_id} role to {role}")
                    return {"success": True, "role": role, "message": "Role updated successfully"}
                else:
                    return {"success": False, "error": "Failed to update role - no data returned"}
            else:
                # Create new profile
                result = self.supabase_client.table('user_profiles').insert({
                    'user_id': user_id,
                    'role': role
                }).execute()
                
                if result.data:
                    print(f"✅ Created user profile for {user_id} with role {role}")
                    return {"success": True, "role": role, "message": "Profile created successfully"}
                else:
                    return {"success": False, "error": "Failed to create profile - no data returned"}
        except Exception as e:
            error_msg = str(e)
            print(f"❌ Failed to set user role: {error_msg}")
            
            # Check if table doesn't exist
            if "relation" in error_msg.lower() and "does not exist" in error_msg.lower():
                return {
                    "success": False, 
                    "error": "Table 'user_profiles' does not exist. Please run migration SQL in Supabase Dashboard.",
                    "action_required": "Run migrations/add_user_roles.sql in Supabase SQL Editor"
                }
            
            return {"success": False, "error": error_msg}
    
    def is_admin(self, user_id: str) -> bool:
        """
        ตรวจสอบว่า user เป็น admin หรือไม่
        
        Args:
            user_id: User ID
            
        Returns:
            True if admin, False otherwise
        """
        return self.get_user_role(user_id) == 'admin'
    
    def get_all_users(self, admin_user_id: str) -> List[Dict[str, Any]]:
        """
        ดึงรายชื่อ users ทั้งหมด (admin only)
        รวม email และ restaurant_name จาก user_profiles
        
        Args:
            admin_user_id: User ID ของ admin
            
        Returns:
            List of user profiles with email and restaurant_name
        """
        if not self.is_admin(admin_user_id):
            return []
        
        if not self.supabase_client:
            return []
        
        try:
            # Select all columns including email and restaurant_name
            result = self.supabase_client.table('user_profiles').select('*').execute()
            users = result.data or []
            
            # If email or restaurant_name is missing, try to sync from related tables
            for user in users:
                user_id = user.get('user_id')
                if not user_id:
                    continue
                
                # Sync email from auth.users if missing
                if not user.get('email'):
                    try:
                        # Note: We can't directly query auth.users via Supabase client
                        # The trigger should handle this, but we can try to get from restaurants
                        pass
                    except:
                        pass
                
                # Sync restaurant_name from restaurants if missing
                if not user.get('restaurant_name'):
                    try:
                        restaurant_result = self.supabase_client.table('restaurants').select('name').eq('user_id', user_id).limit(1).execute()
                        if restaurant_result.data and len(restaurant_result.data) > 0:
                            user['restaurant_name'] = restaurant_result.data[0].get('name')
                    except:
                        pass
            
            return users
        except Exception as e:
            print(f"❌ Failed to get all users: {str(e)}")
            return []
    
    def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        ดึงข้อมูล user profile รวม email และ restaurant_name
        
        Args:
            user_id: User ID
            
        Returns:
            Dictionary with user profile data or None
        """
        if not self.supabase_client:
            return None
        
        if not self._is_valid_uuid(user_id):
            return None
        
        try:
            result = self.supabase_client.table('user_profiles').select('*').eq('user_id', user_id).limit(1).execute()
            if result.data and len(result.data) > 0:
                profile = result.data[0]
                
                # If restaurant_name is missing, try to get from restaurants
                if not profile.get('restaurant_name'):
                    try:
                        restaurant_result = self.supabase_client.table('restaurants').select('name').eq('user_id', user_id).limit(1).execute()
                        if restaurant_result.data and len(restaurant_result.data) > 0:
                            profile['restaurant_name'] = restaurant_result.data[0].get('name')
                    except:
                        pass
                
                return profile
            return None
        except Exception as e:
            print(f"❌ Failed to get user profile: {str(e)}")
            return None
    
    def get_role_limits(self, role: str) -> Dict[str, Any]:
        """
        ดึง limits ตาม role
        
        Args:
            role: Role name
            
        Returns:
            Dictionary with limits
        """
        # Admin has unlimited access
        if role == 'admin':
            return {
                "image_generation": float('inf'),
                "image_enhancement": float('inf'),
                "ocr": float('inf'),
                "unlimited": True
            }
        
        # Return limits based on role
        limits = {
            'free_trial': {
                "image_generation": 2,
                "image_enhancement": 1,
                "ocr": 10,
                "unlimited": False
            },
            'starter': {
                "image_generation": 30,
                "image_enhancement": 30,
                "ocr": 30,
                "unlimited": False
            },
            'professional': {
                "image_generation": 70,
                "image_enhancement": 70,
                "ocr": 70,
                "unlimited": False
            },
            'enterprise': {
                "image_generation": 200,  # 200 AI generations/month
                "image_enhancement": 200,  # 200 AI enhancements/month
                "ocr": 200,  # 200 OCR requests/month
                "unlimited": False
            }
        }
        
        return limits.get(role, limits['free_trial'])


# Create singleton instance
user_role_service = UserRoleService()

