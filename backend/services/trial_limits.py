"""
Trial Limits Service - จัดการข้อจำกัดสำหรับ Free Trial และ Subscription Plans
Updated pricing structure:
- Trial: 20 menus, 5 gen, 5 enhance
- Starter ($39): 30 menus, 30 gen, 30 enhance
- Professional ($89): Unlimited menus, 200 gen, 200 enhance
- Enterprise ($199): Unlimited menus, 500 gen, 500 enhance
"""
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from collections import defaultdict
import json
import os
from pathlib import Path
from .user_role_service import user_role_service

class TrialLimitsService:
    """
    จัดการข้อจำกัดการใช้งานสำหรับ Free Trial (14 วัน) และ Subscription Plans
    
    Limits สำหรับ Free Trial:
    - Menu Items: 20 รายการ
    - Image Generation: 5 ภาพ
    - Image Enhancement: 5 ภาพ
    """
    
    def __init__(self):
        # In-memory storage (สำหรับ MVP)
        # ภายหลังควรย้ายไปเก็บใน database
        self.usage_data: Dict[str, Dict[str, Any]] = defaultdict(lambda: {
            "user_id": "",
            "trial_start_date": None,
            "trial_end_date": None,
            "is_subscribed": False,
            "subscription_plan": None,
            "menu_items_count": 0,
            "image_generation_count": 0,
            "image_enhancement_count": 0,
            "last_reset": None
        })
        
        # Trial limits (14 days)
        self.TRIAL_DURATION_DAYS = 14
        self.TRIAL_MENU_ITEMS_LIMIT = 20  # 20 menu items for Free Trial
        self.TRIAL_IMAGE_GENERATION_LIMIT = 5  # 5 AI generations for Free Trial
        self.TRIAL_IMAGE_ENHANCEMENT_LIMIT = 5  # 5 enhancements for Free Trial
        
        # Subscription plan limits (per month)
        # Based on actual plans: Starter ($39), Professional ($89), Enterprise ($199)
        self.SUBSCRIPTION_LIMITS = {
            "starter": {
                "menu_items": 30,  # Max 30 menu items
                "image_generation": 30,  # 30 AI generations/month
                "image_enhancement": 30,  # 30 enhancements/month
            },
            "professional": {
                "menu_items": 999999,  # Unlimited menu items
                "image_generation": 200,  # 200 AI generations/month
                "image_enhancement": 200,  # 200 enhancements/month
            },
            "enterprise": {
                "menu_items": 999999,  # Unlimited menu items
                "image_generation": 500,  # 500 AI generations/month
                "image_enhancement": 500,  # 500 enhancements/month
            },
            # Legacy plan names (for backward compatibility)
            "standard": {  # Map to professional
                "menu_items": 999999,
                "image_generation": 200,
                "image_enhancement": 200,
            },
            "premium": {  # Map to enterprise
                "menu_items": 999999,
                "image_generation": 500,
                "image_enhancement": 500,
            },
            "pro": {  # Map to professional
                "menu_items": 999999,
                "image_generation": 200,
                "image_enhancement": 200,
            }
        }
        
        # Load from file if exists
        self.data_file = Path(__file__).parent.parent / "trial_usage_data.json"
        self.load_data()
    
    def load_data(self):
        """โหลดข้อมูล usage จากไฟล์"""
        try:
            if self.data_file.exists():
                with open(self.data_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    # Convert date strings back to datetime
                    for user_id, user_data in data.items():
                        if user_data.get('trial_start_date'):
                            user_data['trial_start_date'] = datetime.fromisoformat(user_data['trial_start_date'])
                        if user_data.get('trial_end_date'):
                            user_data['trial_end_date'] = datetime.fromisoformat(user_data['trial_end_date'])
                        if user_data.get('last_reset'):
                            user_data['last_reset'] = datetime.fromisoformat(user_data['last_reset'])
                    self.usage_data.update(data)
        except Exception as e:
            print(f"⚠️ Failed to load trial usage data: {str(e)}")
    
    def save_data(self):
        """บันทึกข้อมูล usage ลงไฟล์"""
        try:
            # Convert datetime to ISO string for JSON serialization
            data_to_save = {}
            for user_id, user_data in self.usage_data.items():
                data_to_save[user_id] = user_data.copy()
                if isinstance(data_to_save[user_id].get('trial_start_date'), datetime):
                    data_to_save[user_id]['trial_start_date'] = data_to_save[user_id]['trial_start_date'].isoformat()
                if isinstance(data_to_save[user_id].get('trial_end_date'), datetime):
                    data_to_save[user_id]['trial_end_date'] = data_to_save[user_id]['trial_end_date'].isoformat()
                if isinstance(data_to_save[user_id].get('last_reset'), datetime):
                    data_to_save[user_id]['last_reset'] = data_to_save[user_id]['last_reset'].isoformat()
            
            with open(self.data_file, 'w', encoding='utf-8') as f:
                json.dump(data_to_save, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"⚠️ Failed to save trial usage data: {str(e)}")
    
    def initialize_user(self, user_id: str) -> Dict[str, Any]:
        """
        เริ่มต้น trial สำหรับ user ใหม่
        
        Args:
            user_id: User ID
            
        Returns:
            Dictionary with trial information
        """
        if user_id not in self.usage_data or not self.usage_data[user_id].get('trial_start_date'):
            now = datetime.now()
            trial_end = now + timedelta(days=self.TRIAL_DURATION_DAYS)
            
            self.usage_data[user_id] = {
                "user_id": user_id,
                "trial_start_date": now,
                "trial_end_date": trial_end,
                "is_subscribed": False,
                "subscription_plan": None,
                "menu_items_count": 0,
                "image_generation_count": 0,
                "image_enhancement_count": 0,
                "last_reset": now
            }
            self.save_data()
        
        return self.get_user_status(user_id)
    
    def get_user_status(self, user_id: str) -> Dict[str, Any]:
        """
        ดึงสถานะ trial ของ user
        
        Args:
            user_id: User ID
            
        Returns:
            Dictionary with user status and limits
        """
        # Get user role from Supabase
        user_role = user_role_service.get_user_role(user_id)
        
        # Map role to subscription plan
        role_to_plan = {
            'free_trial': None,
            'starter': 'starter',
            'professional': 'professional',
            'enterprise': 'enterprise',
            'admin': 'enterprise'  # Admin gets enterprise features
        }
        
        plan_from_role = role_to_plan.get(user_role)
        is_subscribed = plan_from_role is not None
        
        # Initialize if not exists
        if user_id not in self.usage_data:
            self.initialize_user(user_id)
        
        user_data = self.usage_data[user_id]
        now = datetime.now()
        
        # Check if trial expired
        trial_end = user_data.get('trial_end_date')
        if trial_end and isinstance(trial_end, str):
            trial_end = datetime.fromisoformat(trial_end)
        
        is_trial_active = (
            user_role == 'free_trial' and
            trial_end and
            now < trial_end
        )
        
        # Override subscription status based on role
        if is_subscribed:
            user_data['is_subscribed'] = True
            user_data['subscription_plan'] = plan_from_role
        
        return {
            "user_id": user_id,
            "role": user_role,  # Include role in response
            "is_subscribed": is_subscribed,
            "subscription_plan": plan_from_role,
            "is_trial_active": is_trial_active,
            "trial_start_date": user_data.get('trial_start_date'),
            "trial_end_date": user_data.get('trial_end_date'),
            "trial_days_remaining": (trial_end - now).days if trial_end and now < trial_end else 0,
            "menu_items_count": user_data.get('menu_items_count', 0),
            "image_generation_count": user_data.get('image_generation_count', 0),
            "image_enhancement_count": user_data.get('image_enhancement_count', 0),
            "limits": self._get_limits_for_user(user_data)
        }
    
    def check_limit(self, user_id: str, action: str) -> Dict[str, Any]:
        """
        ตรวจสอบว่ายังสามารถใช้งานได้หรือไม่
        
        Args:
            user_id: User ID
            action: 'menu_items', 'image_generation', หรือ 'image_enhancement'
            
        Returns:
            Dictionary with:
            - allowed: bool
            - remaining: int
            - limit: int
            - message: str
        """
        # Check if user is admin - admins have unlimited access
        if user_role_service.is_admin(user_id):
            return {
                "allowed": True,
                "remaining": 999999,  # Use large number instead of inf for JSON compatibility
                "limit": 999999,
                "message": "Unlimited access (Admin)"
            }
        
        status = self.get_user_status(user_id)
        
        # Subscribed users have limits based on their plan
        if status['is_subscribed']:
            plan = status.get('subscription_plan', 'starter')
            # Map legacy plan names to new names
            plan_mapping = {
                'pro': 'professional',
                'standard': 'professional',
                'premium': 'enterprise'
            }
            plan = plan_mapping.get(plan, plan)
            plan_limits = self.SUBSCRIPTION_LIMITS.get(plan, self.SUBSCRIPTION_LIMITS['starter'])
            
            limit = plan_limits.get(action, 0)
            count_key = f"{action}_count"
            count = status.get(count_key, 0)
            
            # Check if feature is not available in plan (limit = 0)
            if limit == 0:
                action_name = {
                    'menu_items': 'Menu Items',
                    'image_generation': 'Image Generation',
                    'image_enhancement': 'Image Enhancement',
                }.get(action, action)
                
                return {
                    "allowed": False,
                    "remaining": 0,
                    "limit": 0,
                    "message": f"{action_name} is not available in {plan.title()} plan. Please upgrade to Professional or Enterprise plan."
                }
            
            # Check if limit is unlimited (represented as -1 or very large number)
            if limit == float('inf') or limit == -1 or limit >= 999999:
                return {
                    "allowed": True,
                    "remaining": 999999,  # Use large number instead of inf for JSON compatibility
                    "limit": 999999,
                    "message": f"Unlimited access (Plan: {plan.title()})"
                }
            
            remaining = max(0, limit - count)
            allowed = remaining > 0
            
            if not allowed:
                action_name = {
                    'menu_items': 'Menu Items',
                    'image_generation': 'Image Generation',
                    'image_enhancement': 'Image Enhancement',
                }.get(action, action)
                
                return {
                    "allowed": False,
                    "remaining": 0,
                    "limit": limit,
                    "message": f"Plan limit reached for {action_name}. You've used {limit}/{limit} this month. Please upgrade your plan to continue."
                }
            
            return {
                "allowed": True,
                "remaining": remaining,
                "limit": limit,
                "message": f"{remaining} {action} remaining this month (Plan: {plan.title()})"
            }
        
        # Check if trial is active
        if not status['is_trial_active']:
            return {
                "allowed": False,
                "remaining": 0,
                "limit": 0,
                "message": "Trial expired. Please subscribe to continue."
            }
        
        # Get current count and limit
        count_key = f"{action}_count"
        count = status.get(count_key, 0)
        limit = status['limits'].get(action, 0)
        
        remaining = max(0, limit - count)
        allowed = remaining > 0
        
        if not allowed:
            action_name = {
                'menu_items': 'Menu Items',
                'image_generation': 'Image Generation',
                'image_enhancement': 'Image Enhancement',
            }.get(action, action)
            
            return {
                "allowed": False,
                "remaining": 0,
                "limit": limit,
                "message": f"Trial limit reached for {action_name}. You've used {limit}/{limit}. Please subscribe to continue."
            }
        
        return {
            "allowed": True,
            "remaining": remaining,
            "limit": limit,
            "message": f"{remaining} {action} remaining in trial"
        }
    
    def increment_usage(self, user_id: str, action: str) -> Dict[str, Any]:
        """
        เพิ่มจำนวนการใช้งาน
        
        Args:
            user_id: User ID
            action: 'menu_items', 'image_generation', หรือ 'image_enhancement'
            
        Returns:
            Updated user status
        """
        # Initialize if not exists
        if user_id not in self.usage_data:
            self.initialize_user(user_id)
        
        count_key = f"{action}_count"
        self.usage_data[user_id][count_key] = self.usage_data[user_id].get(count_key, 0) + 1
        self.save_data()
        
        return self.get_user_status(user_id)
    
    def set_subscription(self, user_id: str, plan: str, is_subscribed: bool = True):
        """
        ตั้งค่าสถานะ subscription
        
        Args:
            user_id: User ID
            plan: Subscription plan name
            is_subscribed: Whether user is subscribed
        """
        if user_id not in self.usage_data:
            self.initialize_user(user_id)
        
        self.usage_data[user_id]['is_subscribed'] = is_subscribed
        self.usage_data[user_id]['subscription_plan'] = plan if is_subscribed else None
        self.save_data()
    
    def reset_trial(self, user_id: str):
        """
        Reset trial สำหรับ user (สำหรับ admin/testing)
        
        Args:
            user_id: User ID
        """
        self.initialize_user(user_id)
        self.save_data()
    
    def _get_limits_for_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        ดึง limits ตาม subscription plan
        
        Args:
            user_data: User data dictionary
            
        Returns:
            Dictionary with limits for each action
        """
        if user_data.get('is_subscribed'):
            plan = user_data.get('subscription_plan', 'starter')
            # Map legacy plan names to new names
            plan_mapping = {
                'pro': 'professional',
                'standard': 'professional',
                'premium': 'enterprise'
            }
            plan = plan_mapping.get(plan, plan)
            plan_limits = self.SUBSCRIPTION_LIMITS.get(plan, self.SUBSCRIPTION_LIMITS['starter'])
            return {
                "menu_items": plan_limits.get('menu_items', 0),
                "image_generation": plan_limits.get('image_generation', 0),
                "image_enhancement": plan_limits.get('image_enhancement', 0),
            }
        else:
            return {
                "menu_items": self.TRIAL_MENU_ITEMS_LIMIT,
                "image_generation": self.TRIAL_IMAGE_GENERATION_LIMIT,
                "image_enhancement": self.TRIAL_IMAGE_ENHANCEMENT_LIMIT,
            }


# Create singleton instance
trial_limits_service = TrialLimitsService()
