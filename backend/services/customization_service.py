"""
Customization Service - จัดการ Theme Color และ Cover Image สำหรับร้านค้า
"""
import os
import base64
import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from dotenv import load_dotenv
import pathlib

# Supabase for image storage
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    print("⚠️ Supabase library not available. Install with: pip install supabase")

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


class CustomizationService:
    """Service for managing restaurant customization (theme color and cover image)"""
    
    def __init__(self):
        self.supabase_client = None
        if SUPABASE_AVAILABLE and SUPABASE_URL and SUPABASE_KEY:
            try:
                self.supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
                print("✅ Customization Service initialized with Supabase")
            except Exception as e:
                print(f"⚠️ Failed to initialize Supabase client: {str(e)}")
                self.supabase_client = None
        else:
            print("⚠️ Supabase credentials not found")
    
    def validate_theme_color(self, color: str) -> bool:
        """
        Validate theme color format (hex color)
        
        Args:
            color: Hex color string (e.g., '#000000' or '000000')
            
        Returns:
            True if valid, False otherwise
        """
        if not color:
            return False
        
        # Remove # if present
        color = color.lstrip('#')
        
        # Check if it's a valid hex color (6 characters)
        if len(color) != 6:
            return False
        
        # Check if all characters are valid hex digits
        try:
            int(color, 16)
            return True
        except ValueError:
            return False
    
    def normalize_theme_color(self, color: str) -> str:
        """
        Normalize theme color to #RRGGBB format
        
        Args:
            color: Hex color string
            
        Returns:
            Normalized hex color with # prefix
        """
        if not color:
            return '#000000'
        
        # Remove # if present
        color = color.lstrip('#').upper()
        
        # Validate and return with #
        if self.validate_theme_color('#' + color):
            return '#' + color
        
        return '#000000'  # Default fallback
    
    async def upload_logo(self, image_base64: str, restaurant_id: str, content_type: str = "image/png") -> Optional[str]:
        """
        Upload logo to Supabase Storage
        
        Args:
            image_base64: Base64 encoded image
            restaurant_id: Restaurant ID
            content_type: MIME type of the image
            
        Returns:
            Public URL of uploaded image, or None if failed
        """
        if not self.supabase_client:
            print("⚠️ Supabase client not available. Skipping upload.")
            return None
        
        try:
            # Remove data URL prefix if present
            if ',' in image_base64:
                image_base64 = image_base64.split(',')[1]
            
            # Decode base64 to bytes
            image_bytes = base64.b64decode(image_base64)
            
            # Generate unique filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            random_id = str(uuid.uuid4())[:8]
            
            # Determine file extension from content type
            ext = "png"
            if "jpeg" in content_type or "jpg" in content_type:
                ext = "jpg"
            elif "webp" in content_type:
                ext = "webp"
            elif "gif" in content_type:
                ext = "gif"
            
            filename = f"logos/{restaurant_id}_{timestamp}_{random_id}.{ext}"
            
            print(f"📤 Uploading logo to Supabase Storage:")
            print(f"   Bucket: shop_assets")
            print(f"   Filename: {filename}")
            print(f"   File size: {len(image_bytes)} bytes")
            print(f"   Content type: {content_type}")
            
            # Upload to Supabase Storage
            try:
                response = self.supabase_client.storage.from_('shop_assets').upload(
                    path=filename,
                    file=image_bytes,
                    file_options={"content-type": content_type, "upsert": "true"}
                )
                print(f"   Upload response: {response}")
            except Exception as upload_error:
                print(f"❌ Upload failed: {str(upload_error)}")
                import traceback
                traceback.print_exc()
                return None
            
            # Get public URL
            try:
                public_url_response = self.supabase_client.storage.from_('shop_assets').get_public_url(filename)
                
                # Handle different response formats
                if isinstance(public_url_response, dict):
                    public_url = public_url_response.get('publicUrl') or public_url_response.get('public_url') or str(public_url_response)
                elif isinstance(public_url_response, str):
                    public_url = public_url_response
                else:
                    public_url = getattr(public_url_response, 'publicUrl', None) or getattr(public_url_response, 'public_url', None) or str(public_url_response)
                
                if not public_url:
                    # Fallback: construct URL manually
                    supabase_url = SUPABASE_URL.rstrip('/')
                    if not supabase_url.endswith('/storage/v1'):
                        supabase_url = f"{supabase_url}/storage/v1"
                    public_url = f"{supabase_url}/object/public/shop_assets/{filename}"
                    print(f"   Using fallback URL: {public_url}")
                
                print(f"✅ Logo uploaded successfully: {public_url}")
                return public_url
            except Exception as url_error:
                print(f"❌ Failed to get public URL: {str(url_error)}")
                import traceback
                traceback.print_exc()
                # Fallback: construct URL manually
                supabase_url = SUPABASE_URL.rstrip('/')
                if not supabase_url.endswith('/storage/v1'):
                    supabase_url = f"{supabase_url}/storage/v1"
                public_url = f"{supabase_url}/object/public/shop_assets/{filename}"
                print(f"   Using fallback URL: {public_url}")
                return public_url
            
        except Exception as e:
            print(f"❌ Failed to upload logo: {str(e)}")
            import traceback
            traceback.print_exc()
            return None
    
    async def upload_cover_image(self, image_base64: str, restaurant_id: str, content_type: str = "image/png") -> Optional[str]:
        """
        Upload cover image to Supabase Storage
        
        Args:
            image_base64: Base64 encoded image
            restaurant_id: Restaurant ID
            content_type: MIME type of the image
            
        Returns:
            Public URL of uploaded image, or None if failed
        """
        if not self.supabase_client:
            print("⚠️ Supabase client not available. Skipping upload.")
            return None
        
        try:
            # Remove data URL prefix if present
            if ',' in image_base64:
                image_base64 = image_base64.split(',')[1]
            
            # Decode base64 to bytes
            image_bytes = base64.b64decode(image_base64)
            
            # Generate unique filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            random_id = str(uuid.uuid4())[:8]
            
            # Determine file extension from content type
            ext = "png"
            if "jpeg" in content_type or "jpg" in content_type:
                ext = "jpg"
            elif "webp" in content_type:
                ext = "webp"
            elif "gif" in content_type:
                ext = "gif"
            
            filename = f"covers/{restaurant_id}_{timestamp}_{random_id}.{ext}"
            
            print(f"📤 Uploading cover image to Supabase Storage:")
            print(f"   Bucket: shop_assets")
            print(f"   Filename: {filename}")
            print(f"   File size: {len(image_bytes)} bytes")
            print(f"   Content type: {content_type}")
            
            # Upload to Supabase Storage
            try:
                response = self.supabase_client.storage.from_('shop_assets').upload(
                    path=filename,
                    file=image_bytes,
                    file_options={"content-type": content_type, "upsert": "true"}
                )
                print(f"   Upload response: {response}")
            except Exception as upload_error:
                print(f"❌ Upload failed: {str(upload_error)}")
                import traceback
                traceback.print_exc()
                return None
            
            # Get public URL
            try:
                public_url_response = self.supabase_client.storage.from_('shop_assets').get_public_url(filename)
                
                # Handle different response formats
                if isinstance(public_url_response, dict):
                    public_url = public_url_response.get('publicUrl') or public_url_response.get('public_url') or str(public_url_response)
                elif isinstance(public_url_response, str):
                    public_url = public_url_response
                else:
                    public_url = getattr(public_url_response, 'publicUrl', None) or getattr(public_url_response, 'public_url', None) or str(public_url_response)
                
                if not public_url:
                    # Fallback: construct URL manually
                    supabase_url = SUPABASE_URL.rstrip('/')
                    if not supabase_url.endswith('/storage/v1'):
                        supabase_url = f"{supabase_url}/storage/v1"
                    public_url = f"{supabase_url}/object/public/shop_assets/{filename}"
                    print(f"   Using fallback URL: {public_url}")
                
                print(f"✅ Cover image uploaded successfully: {public_url}")
                return public_url
            except Exception as url_error:
                print(f"❌ Failed to get public URL: {str(url_error)}")
                import traceback
                traceback.print_exc()
                # Fallback: construct URL manually
                supabase_url = SUPABASE_URL.rstrip('/')
                if not supabase_url.endswith('/storage/v1'):
                    supabase_url = f"{supabase_url}/storage/v1"
                public_url = f"{supabase_url}/object/public/shop_assets/{filename}"
                print(f"   Using fallback URL: {public_url}")
                return public_url
            
        except Exception as e:
            print(f"❌ Failed to upload cover image: {str(e)}")
            import traceback
            traceback.print_exc()
            return None
    
    def delete_cover_image(self, image_url: str) -> bool:
        """
        Delete cover image from Supabase Storage
        
        Args:
            image_url: Public URL of the image to delete
            
        Returns:
            True if deleted successfully, False otherwise
        """
        if not self.supabase_client:
            print("⚠️ Supabase client not available. Skipping delete.")
            return False
        
        try:
            # Extract filename from URL
            # URL format: https://xxx.supabase.co/storage/v1/object/public/shop_assets/restaurant_id/filename.png
            if '/shop_assets/' in image_url:
                filename = image_url.split('/shop_assets/')[1]
            else:
                print(f"⚠️ Invalid image URL format: {image_url}")
                return False
            
            print(f"🗑️ Deleting cover image: {filename}")
            
            # Delete from Supabase Storage
            response = self.supabase_client.storage.from_('shop_assets').remove([filename])
            
            print(f"✅ Cover image deleted successfully")
            return True
            
        except Exception as e:
            print(f"❌ Failed to delete cover image: {str(e)}")
            import traceback
            traceback.print_exc()
            return False


# Create singleton instance
customization_service = CustomizationService()

