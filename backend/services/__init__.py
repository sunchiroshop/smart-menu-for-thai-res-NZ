"""
Backend services for Smart Menu SaaS
"""

from .ai_service import AIService

# Only import Supabase services if needed
try:
    from .menu_service import MenuService
    __all__ = ["AIService", "MenuService"]
except ImportError:
    # Supabase not installed - minimal mode
    __all__ = ["AIService"]

