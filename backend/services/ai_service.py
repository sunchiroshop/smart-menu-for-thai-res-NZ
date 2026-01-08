"""
AI Service - Unified AI Service for Text and Image Tasks
COST OPTIMIZATION: Uses gemini-1.5-flash for text, imagen-3.0-generate-001 for images
"""

import os
import base64
import io
import uuid
import requests
from typing import Optional, Dict, Any
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont

# CORRECT IMPORT: Use google.generativeai (Classic SDK)
import google.generativeai as genai

# Supabase for image storage
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    print("⚠️ Supabase library not available. Install with: pip install supabase")

from dotenv import load_dotenv
import pathlib

# Load environment variables
env_path = pathlib.Path(__file__).parent.parent.parent / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=str(env_path))
else:
    load_dotenv()

# ✅ VERIFIED MODELS (December 2025 - Google AI Documentation)
# Text models: gemini-2.0-flash (stable), gemini-2.5-flash (latest)
TEXT_MODEL_NAME = "gemini-2.0-flash"  # Stable, fast text model
TRANSLATION_MODEL_NAME = "gemini-2.0-flash"  # Translation (stable)

# Image models: gemini-2.5-flash-image-preview (supports generation & editing)
# Reference: https://developers.googleblog.com/en/introducing-gemini-2-5-flash-image/
IMAGE_ENHANCEMENT_MODEL = "gemini-2.5-flash-image-preview"  # ✅ Image editing/enhancement
IMAGE_GENERATION_MODEL = "gemini-2.5-flash-image-preview"  # ✅ Image generation

# API Key Configuration
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY') or os.getenv('GOOGLE_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("⚠️ WARNING: GEMINI_API_KEY or GOOGLE_API_KEY not found in environment")

# Supabase Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = (
    os.getenv('SUPABASE_SERVICE_ROLE_KEY') or
    os.getenv('SUPABASE_KEY') or
    os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
)


class AIService:
    """
    Unified AI Service for Text and Image Tasks
    
    Cost Optimization:
    - Text tasks (translation, OCR, menu description): gemini-1.5-flash
    - Image generation: imagen-3.0-generate-001
    """
    
    def __init__(self):
        """Initialize AI Service"""
        self.api_key = GEMINI_API_KEY
        if not self.api_key:
            print("⚠️ WARNING: GEMINI_API_KEY not found. AI features will not work.")
            self.ready = False
        else:
            print(f"✅ AI Service initialized")
            print(f"💰 Cost optimization: Text={TEXT_MODEL_NAME}, Enhancement={IMAGE_ENHANCEMENT_MODEL}, Generation={IMAGE_GENERATION_MODEL}")
            self.ready = True
        
        # Initialize Supabase client for image storage
        self.supabase_client = None
        if SUPABASE_AVAILABLE and SUPABASE_URL and SUPABASE_KEY:
            try:
                self.supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
                print("✅ Supabase client initialized for image storage")
            except Exception as e:
                print(f"⚠️ Failed to initialize Supabase client: {str(e)}")
                self.supabase_client = None
    
    def translate_text(self, text: str, target_lang: str, source_lang: str = "auto") -> str:
        """
        Translate text using a high-quality Gemini model (defaults to gemini-1.5-pro with flash fallback)

        Args:
            text: Text to translate
            target_lang: Target language (e.g., "English", "Thai", "Chinese", "Japanese")
            source_lang: Source language (default: "auto" for auto-detect)

        Returns:
            Translated text (or original text if translation fails)
        """
        if not self.ready:
            print("⚠️ AI Service not ready, returning original text")
            return text

        if not text or not text.strip():
            return text

        try:
            # Normalize language names
            lang_normalize = {
                "English": "English", "en": "English", "EN": "English",
                "Japanese": "Japanese", "日本語": "Japanese", "ja": "Japanese", "JP": "Japanese",
                "Thai": "Thai", "ไทย": "Thai", "th": "Thai",
                "Chinese": "Chinese", "中文": "Chinese", "zh": "Chinese",
                "Korean": "Korean", "한국어": "Korean", "ko": "Korean",
                "Vietnamese": "Vietnamese", "Tiếng Việt": "Vietnamese", "vi": "Vietnamese",
                "Hindi": "Hindi", "हिंदी": "Hindi", "hi": "Hindi",
                "Spanish": "Spanish", "Español": "Spanish", "es": "Spanish",
                "French": "French", "Français": "French", "fr": "French",
                "German": "German", "Deutsch": "German", "de": "German",
                "Indonesian": "Indonesian", "Bahasa Indonesia": "Indonesian", "id": "Indonesian",
                "Malay": "Malay", "Bahasa Melayu": "Malay", "ms": "Malay",
            }

            source_lang_normalized = lang_normalize.get(source_lang.strip(), source_lang.strip()) if source_lang != "auto" else "auto"
            target_lang_normalized = lang_normalize.get(target_lang.strip(), target_lang.strip())

            print(f"🔄 Translating: '{text[:50]}...' to {target_lang_normalized}")

            # Use higher-quality model for translation, fallback to flash if needed
            model_name = TRANSLATION_MODEL_NAME or TEXT_MODEL_NAME
            generation_config = {
                "temperature": 0.2,
                "top_p": 0.9,
                "top_k": 40,
                "max_output_tokens": 256,
            }
            system_instruction = (
                f"You are a professional translator specializing in restaurant menu translation. "
                f"Translate dish names and descriptions to {target_lang_normalized}. "
                f"Use clear, appetizing {target_lang_normalized} names that customers can understand. "
                f"Provide natural, fluent translations in {target_lang_normalized}."
            )

            prompt = f"""Translate this restaurant menu text to {target_lang_normalized}.

CRITICAL RULES:
- Translate to natural, fluent {target_lang_normalized}
- Use descriptive, appetizing names
- Professional restaurant style
- NO symbols, NO parentheses, NO extra explanations
- Just the translated text in {target_lang_normalized}

Text to translate:
{text}

{target_lang_normalized} translation only:"""

            def run_translation(selected_model: str):
                model = genai.GenerativeModel(
                    selected_model,
                    system_instruction=system_instruction,
                    generation_config=generation_config,
                )
                return model.generate_content(prompt)

            try:
                response = run_translation(model_name)
            except Exception as primary_error:
                print(f"⚠️ Primary translation model '{model_name}' failed, falling back to {TEXT_MODEL_NAME}: {primary_error}")
                response = run_translation(TEXT_MODEL_NAME)
            
            # Extract translated text
            translated = response.text.strip()
            
            # Clean up the translation
            if (translated.startswith('"') and translated.endswith('"')) or \
               (translated.startswith("'") and translated.endswith("'")):
                translated = translated[1:-1].strip()
            
            # Remove common prefixes
            prefixes_to_remove = [
                "Translation:", "Translated text:", "Here's the translation:",
                f"The {target_lang_normalized} translation is:",
                f"{target_lang_normalized}:", f"English translation:",
                f"Translation ({target_lang_normalized}):",
            ]
            for prefix in prefixes_to_remove:
                if translated.lower().startswith(prefix.lower()):
                    translated = translated[len(prefix):].strip()
            
            if not translated or translated == text:
                print(f"⚠️ Translation may have failed - returned original text")
            else:
                print(f"✅ Successfully translated to {target_lang_normalized}")
            
            return translated if translated else text
            
        except Exception as e:
            print(f"❌ TRANSLATION FAILED: {e}")
            import traceback
            traceback.print_exc()
            return text  # Silent fallback - return original text
    
    def generate_menu_image(self, prompt: str) -> Optional[str]:
        """
        Generate menu image using imagen-3.0-generate-001
        
        Args:
            prompt: Image generation prompt
        
        Returns:
            Public URL of generated image (uploaded to Supabase) or None if failed
        """
        if not self.ready:
            print("⚠️ AI Service not ready")
            return None
        
        try:
            print(f"🎨 Generating image with {IMAGE_GENERATION_MODEL}...")
            
            # Use gemini-3-pro-image-preview for image generation
            model = genai.GenerativeModel(IMAGE_GENERATION_MODEL)
            response = model.generate_content(prompt)
            
            # Extract image from response
            image_base64 = None
            
            # Try different response structures
            if hasattr(response, 'candidates') and response.candidates:
                candidate = response.candidates[0]
                if hasattr(candidate, 'content') and candidate.content:
                    if hasattr(candidate.content, 'parts') and candidate.content.parts:
                        for part in candidate.content.parts:
                            if hasattr(part, 'inline_data') and part.inline_data:
                                if hasattr(part.inline_data, 'data'):
                                    image_base64 = part.inline_data.data
                                    break
                            elif hasattr(part, 'image_bytes'):
                                image_base64 = part.image_bytes
                                break
                            elif hasattr(part, 'base64_data'):
                                image_base64 = part.base64_data
                                break
            
            if not image_base64:
                print(f"⚠️ No image found in response from {IMAGE_GENERATION_MODEL}")
                return None
            
            # Convert to base64 string if bytes
            if isinstance(image_base64, bytes):
                image_base64_str = base64.b64encode(image_base64).decode('utf-8')
            else:
                image_base64_str = str(image_base64)
            
            # Upload to Supabase Storage (CRITICAL: Must upload to persist)
            public_url = self._upload_image_to_supabase(image_base64_str, bucket_name="menu-images", folder="generated")
            
            if public_url:
                print(f"✅ Image generated and uploaded: {public_url}")
                return public_url
            else:
                print(f"⚠️ Image generated but upload failed")
                return None
                
        except Exception as e:
            print(f"❌ Image generation failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return None
    
    def _upload_image_to_supabase(self, image_base64: str, bucket_name: str = "menu-images", folder: str = "generated") -> Optional[str]:
        """
        Upload image to Supabase Storage and return public URL

        HIGH QUALITY: Resizes image to max 1600px width (if larger) and converts to WebP format
        with quality=95 for sharp, clear images suitable for restaurant menus.
        
        Args:
            image_base64: Base64 encoded image
            bucket_name: Supabase Storage bucket name
            folder: Folder within bucket
        
        Returns:
            Public URL of uploaded image or None if failed
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
            
            # OPTIMIZATION: High quality resize and convert to WebP
            print(f"🔧 Optimizing image: high quality processing for sharp output...")
            image = Image.open(io.BytesIO(image_bytes))

            # Get original size
            original_width, original_height = image.size
            original_size = len(image_bytes)
            print(f"📏 Original size: {original_width}x{original_height}, {original_size / 1024:.1f} KB")

            # Resize if width > 1600px (higher quality than before)
            max_width = 1600
            if original_width > max_width:
                # Calculate new height to maintain aspect ratio
                aspect_ratio = original_height / original_width
                new_width = max_width
                new_height = int(new_width * aspect_ratio)
                image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
                print(f"✂️ Resized to: {new_width}x{new_height}")

            # Apply sharpening filter for crisp output
            from PIL import ImageFilter, ImageEnhance
            # Mild sharpening to enhance details
            image = image.filter(ImageFilter.UnsharpMask(radius=1.5, percent=100, threshold=3))
            # Slight contrast boost for sharper appearance
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(1.05)
            print(f"✨ Applied sharpening and contrast enhancement")
            
            # Convert to RGB if necessary (WebP doesn't support RGBA well)
            if image.mode in ('RGBA', 'LA', 'P'):
                # Create white background
                background = Image.new('RGB', image.size, (255, 255, 255))
                if image.mode == 'P':
                    image = image.convert('RGBA')
                background.paste(image, mask=image.split()[-1] if image.mode in ('RGBA', 'LA') else None)
                image = background
            elif image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Save as WebP with quality 95 (maximum quality for sharp, clear images)
            output_buffer = io.BytesIO()
            image.save(output_buffer, format='WEBP', quality=95, method=6)
            optimized_bytes = output_buffer.getvalue()
            optimized_size = len(optimized_bytes)
            
            print(f"✅ Optimized size: {optimized_size / 1024:.1f} KB (saved {((original_size - optimized_size) / original_size * 100):.1f}%)")
            
            # Generate unique filename with .webp extension
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            random_id = str(uuid.uuid4())[:8]
            filename = f"{folder}/{timestamp}_{random_id}.webp"
            
            print(f"📤 Uploading optimized image to Supabase Storage: {bucket_name}/{filename}")
            
            # Upload to Supabase Storage
            try:
                response = self.supabase_client.storage.from_(bucket_name).upload(
                    path=filename,
                    file=optimized_bytes,
                    file_options={"content-type": "image/webp", "upsert": "false"}
                )
            except Exception as upload_error:
                # Retry with upsert=true
                try:
                    response = self.supabase_client.storage.from_(bucket_name).upload(
                        path=filename,
                        file=optimized_bytes,
                        file_options={"content-type": "image/webp", "upsert": "true"}
                    )
                except Exception as retry_error:
                    print(f"❌ Upload failed: {str(retry_error)}")
                    return None
            
            # Get public URL
            try:
                public_url_response = self.supabase_client.storage.from_(bucket_name).get_public_url(filename)
                
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
                    public_url = f"{supabase_url}/object/public/{bucket_name}/{filename}"
                
                print(f"✅ Image uploaded successfully: {public_url}")
                return public_url
                
            except Exception as url_error:
                print(f"❌ Failed to get public URL: {str(url_error)}")
                return None
            
        except Exception as e:
            print(f"❌ Failed to upload image to Supabase: {str(e)}")
            import traceback
            traceback.print_exc()
            return None
    
    # Compatibility methods for existing code
    async def translate(self, text: str, source_lang: str, target_lang: str = "English") -> str:
        """Async wrapper for translate_text (for backward compatibility)"""
        return self.translate_text(text, target_lang, source_lang)
    
    async def detect_language(self, text: str) -> str:
        """
        Detect language of text using gemini-1.5-flash
        
        Args:
            text: Text to detect
        
        Returns:
            Language name (e.g., "Thai", "Chinese", "English")
        """
        if not self.ready:
            return "Unknown"
        
        try:
            model = genai.GenerativeModel(TEXT_MODEL_NAME)
            prompt = f"""Detect the language of this text: {text}

Return ONLY the language name in English (e.g. "Thai", "Chinese", "Korean", "Japanese", "Vietnamese", etc.)
No explanations, just the language name."""
            
            response = model.generate_content(prompt)
            language = response.text.strip()
            return language if language else "Unknown"
        except Exception as e:
            print(f"❌ Language detection error: {str(e)}")
            return "Unknown"
    
    async def generate_description(self, dish_name: str, language: str = "English", max_words: int = 50) -> str:
        """
        Generate menu description using gemini-1.5-flash
        
        Args:
            dish_name: Name of the dish
            language: Target language (default: "English")
            max_words: Maximum words (default: 50)
        
        Returns:
            Generated description
        """
        if not self.ready:
            return dish_name
        
        try:
            model = genai.GenerativeModel(TEXT_MODEL_NAME)
            prompt = f"""Translate this menu item to English and provide a short appetizing description: {dish_name}

Requirements:
- Translate the menu item name to English if it's not already in English
- Write a brief, appetizing description in English
- Maximum {max_words} words
- Make it sound appealing and professional
- Mention key ingredients or cooking style if relevant
- Restaurant menu quality tone

Return only the translated name and description, no title or extra text."""
            
            response = model.generate_content(prompt)
            description = response.text.strip()
            return description if description else dish_name
        except Exception as e:
            print(f"❌ Description generation error: {str(e)}")
            return dish_name
    
    def analyze_menu_document(self, image_base64: str) -> Dict[str, Any]:
        """
        Analyze menu document (OCR) using gemini-1.5-flash
        
        Args:
            image_base64: Base64 encoded image
        
        Returns:
            Dictionary with extracted menu items
        """
        if not self.ready:
            return {"success": False, "error": "AI Service not ready"}
        
        try:
            # Decode base64 image
            if ',' in image_base64:
                image_base64 = image_base64.split(',')[1]
            
            image_bytes = base64.b64decode(image_base64)
            image = Image.open(io.BytesIO(image_bytes))
            
            # Use gemini-1.5-flash for OCR
            model = genai.GenerativeModel(TEXT_MODEL_NAME)
            
            prompt = """Analyze this menu document and extract all menu items in JSON format.

For each menu item, extract:
1. name (in original language)
2. description (if available)
3. price (if available)
4. category (Appetizer, Main Course, Dessert, etc.)

Return a JSON array of menu items.
If you see multiple languages, include both.

Example format:
[
  {
    "name": "ต้มยำกุ้ง (Tom Yum Goong)",
    "description": "Spicy and sour soup with prawns",
    "price": "$18.50",
    "category": "Soup"
  }
]

Just return the JSON array, no additional text."""
            
            response = model.generate_content([prompt, image])
            extracted_text = response.text
            
            # Try to parse as JSON
            import json
            try:
                # Remove markdown code blocks if present
                if '```json' in extracted_text:
                    extracted_text = extracted_text.split('```json')[1].split('```')[0]
                elif '```' in extracted_text:
                    extracted_text = extracted_text.split('```')[1].split('```')[0]
                
                menu_items = json.loads(extracted_text.strip())
                
                return {
                    "success": True,
                    "menu_items": menu_items,
                    "count": len(menu_items),
                    "note": "Extracted menu items from document. Review and edit as needed."
                }
            except json.JSONDecodeError:
                return {
                    "success": True,
                    "raw_text": extracted_text,
                    "note": "Could not parse as JSON. Here's the raw extracted text."
                }
        except Exception as e:
            print(f"❌ Menu analysis error: {str(e)}")
            import traceback
            traceback.print_exc()
            return {"success": False, "error": str(e)}
    
    def enhance_image_with_ai(self, image_bytes: bytes, style: str = "professional", user_instruction: Optional[str] = None, logo_overlay: Optional[Dict[str, Any]] = None, user_plan: str = "free_trial") -> Dict[str, Any]:
        """
        Enhance food photo using AI

        Args:
            image_bytes: Raw image bytes
            style: Enhancement style (professional, natural, vibrant)
            user_instruction: Optional custom instruction
            logo_overlay: Optional dict with {'enabled': bool, 'logo_url': str, 'position': str}
            user_plan: User's subscription plan (for watermark: non-enterprise gets watermark)

        Returns:
            Dictionary with enhanced image URL and metadata
        """
        if not self.ready:
            return {"success": False, "error": "AI Service not ready"}
        
        try:
            image = Image.open(io.BytesIO(image_bytes))
            
            enhancement_prompt = f"""ทำภาพนี้ให้เป็นภาพถ่ายอาหารระดับมืออาชีพ แสงไฟสตูดิโอ จัดองค์ประกอบภาพใหม่ให้ดูน่าทานที่สุด ความละเอียด 4K โดยยังคงรักษาหน้าตาของอาหารจานเดิมไว้
            
Requirements:
- Professional studio lighting with soft shadows
- Perfect color balance and vibrancy
- Sharp focus on the dish
- Beautiful composition and food styling
- 4K quality resolution
- Maintain the original dish appearance
- Make it look irresistibly appetizing
- Restaurant menu quality photography"""
            
            style_adjustments = {
                "professional": "High-end restaurant quality, Michelin-star presentation, studio lighting",
                "natural": "Natural lighting, authentic appearance, subtle enhancements",
                "vibrant": "Vibrant colors, high contrast, eye-catching presentation"
            }
            
            full_prompt = f"{enhancement_prompt}\n\nStyle: {style_adjustments.get(style, style_adjustments['professional'])}"
            
            if user_instruction and user_instruction.strip():
                full_prompt += f"\n\nAdditional user instruction: {user_instruction.strip()}"
            
            # Use IMAGE_ENHANCEMENT_MODEL for image enhancement
            model = genai.GenerativeModel(IMAGE_ENHANCEMENT_MODEL)
            response = model.generate_content([full_prompt, image])
            
            # Extract enhanced image from response
            image_base64 = None
            if hasattr(response, 'candidates') and response.candidates:
                candidate = response.candidates[0]
                if hasattr(candidate, 'content') and candidate.content:
                    if hasattr(candidate.content, 'parts') and candidate.content.parts:
                        for part in candidate.content.parts:
                            if hasattr(part, 'inline_data') and part.inline_data:
                                if hasattr(part.inline_data, 'data'):
                                    image_base64 = part.inline_data.data
                                    break
                            elif hasattr(part, 'image_bytes'):
                                image_base64 = part.image_bytes
                                break
            
            if not image_base64:
                return {"success": False, "error": "No enhanced image found in response"}
            
            # Convert to base64 string
            if isinstance(image_base64, bytes):
                image_base64_str = base64.b64encode(image_base64).decode('utf-8')
            else:
                image_base64_str = str(image_base64)
            
            # Track logo position for watermark collision avoidance
            applied_logo_position = None

            # Apply logo overlay if requested
            if logo_overlay and logo_overlay.get('enabled') and logo_overlay.get('logo_url'):
                try:
                    # Decode base64 to PIL Image
                    enhanced_image_bytes = base64.b64decode(image_base64_str)
                    enhanced_image = Image.open(io.BytesIO(enhanced_image_bytes))

                    # Get logo position for collision avoidance
                    applied_logo_position = logo_overlay.get('position', 'top-right')

                    # Apply logo overlay with size option
                    enhanced_image = self._apply_logo_overlay(
                        enhanced_image,
                        logo_overlay['logo_url'],
                        applied_logo_position,
                        logo_overlay.get('size', 'medium')
                    )

                    # Convert back to base64
                    output_buffer = io.BytesIO()
                    enhanced_image.save(output_buffer, format='PNG')
                    image_base64_str = base64.b64encode(output_buffer.getvalue()).decode('utf-8')
                except Exception as e:
                    print(f"⚠️ Logo overlay failed in enhancement: {str(e)}")
                    applied_logo_position = None  # Reset if logo overlay failed
                    # Continue without logo overlay

            # Apply "SweetAsMenu" watermark for non-Enterprise plans
            if user_plan not in ["enterprise", "admin"]:
                try:
                    # Decode base64 to PIL Image
                    watermark_image_bytes = base64.b64decode(image_base64_str)
                    watermark_image = Image.open(io.BytesIO(watermark_image_bytes))

                    # Apply watermark with logo position for collision avoidance
                    watermark_image = self._apply_watermark(
                        watermark_image,
                        logo_position=applied_logo_position
                    )

                    # Convert back to base64
                    output_buffer = io.BytesIO()
                    watermark_image.save(output_buffer, format='PNG')
                    image_base64_str = base64.b64encode(output_buffer.getvalue()).decode('utf-8')
                    print(f"✅ Watermark applied for {user_plan} plan (enhancement)")
                except Exception as e:
                    print(f"⚠️ Watermark failed in enhancement: {str(e)}")
                    # Continue without watermark

            # Upload to Supabase
            public_url = self._upload_image_to_supabase(image_base64_str, bucket_name="menu-images", folder="enhanced")
            
            enhanced_image_data_url = f"data:image/png;base64,{image_base64_str}"
            
            if public_url:
                return {
                    "success": True,
                    "enhanced_image_url": public_url,
                    "enhanced_image": enhanced_image_data_url,
                    "enhanced_image_base64": image_base64_str,
                    "style": style,
                    "model_used": IMAGE_ENHANCEMENT_MODEL,
                    "note": f"Image enhanced successfully! Uploaded to Supabase: {public_url}"
                }
            else:
                return {
                    "success": True,
                    "enhanced_image": enhanced_image_data_url,
                    "enhanced_image_base64": image_base64_str,
                    "style": style,
                    "model_used": IMAGE_ENHANCEMENT_MODEL,
                    "note": "Image enhanced successfully but Supabase upload failed. Using base64."
                }
        except Exception as e:
            print(f"❌ Image enhancement failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return {"success": False, "error": str(e)}
    
    def generate_food_image_from_description(self, dish_name: str, description: str, cuisine_type: str = "general", style: str = "professional", logo_overlay: Optional[Dict[str, Any]] = None, user_plan: str = "free_trial") -> Dict[str, Any]:
        """
        Generate food image from description

        Args:
            dish_name: Name of the dish
            description: Description of the dish
            cuisine_type: Type of cuisine
            style: Visual style
            logo_overlay: Optional dict with {'enabled': bool, 'logo_url': str, 'position': str}
            user_plan: User's subscription plan (for watermark: non-enterprise gets watermark)

        Returns:
            Dictionary with generated image
        """
        if not self.ready:
            return {"success": False, "error": "AI Service not ready"}
        
        try:
            base_prompt = f"""Create a professional food photography image of {dish_name}.

Description: {description}
Cuisine: {cuisine_type}
Style: {style}

Requirements:
- High-quality restaurant-style food photography
- Appetizing presentation on white or neutral background
- Natural lighting with soft shadows
- Sharp focus on the dish
- Garnished and styled beautifully
- Colors should be vibrant but natural
- Shot from a 45-degree angle
- Professional depth of field
- Make it look irresistibly delicious"""
            
            style_adjustments = {
                "professional": "High-end restaurant quality, Michelin-star presentation",
                "rustic": "Homestyle, warm and cozy atmosphere, rustic tableware",
                "elegant": "Fine dining, sophisticated plating, elegant garnish",
                "casual": "Approachable, friendly, everyday meal setting",
                "modern": "Contemporary plating, minimalist, artistic presentation",
                "portrait": "Vertical portrait orientation, tall glass/cup for beverages, stacked presentation for snacks/desserts, menu card style composition, centered subject, clean background, ideal for menu displays"
            }
            
            full_prompt = f"{base_prompt}\n\n{style_adjustments.get(style, style_adjustments['professional'])}"
            
            # Optimize prompt with cheaper model first (cost optimization)
            model_text = genai.GenerativeModel(TEXT_MODEL_NAME)
            optimization_prompt = f"""Optimize this image generation prompt for Imagen 4 to create the best food photography. Keep it concise and under 200 words:

{full_prompt}

Return ONLY the optimized prompt, no explanations."""
            
            optimized_response = model_text.generate_content(optimization_prompt)
            optimized_prompt = optimized_response.text.strip()
            
            # Clean up optimized prompt
            if optimized_prompt.startswith('"') and optimized_prompt.endswith('"'):
                optimized_prompt = optimized_prompt[1:-1]
            if optimized_prompt.startswith("'") and optimized_prompt.endswith("'"):
                optimized_prompt = optimized_prompt[1:-1]
            
            # Generate image using IMAGE_GENERATION_MODEL (gemini-3-pro-image-preview)
            model_image = genai.GenerativeModel(IMAGE_GENERATION_MODEL)
            
            response = model_image.generate_content(optimized_prompt)
            
            # Extract image
            image_base64 = None
            if hasattr(response, 'candidates') and response.candidates:
                candidate = response.candidates[0]
                if hasattr(candidate, 'content') and candidate.content:
                    if hasattr(candidate.content, 'parts') and candidate.content.parts:
                        for part in candidate.content.parts:
                            if hasattr(part, 'inline_data') and part.inline_data:
                                if hasattr(part.inline_data, 'data'):
                                    image_base64 = part.inline_data.data
                                    break
                            elif hasattr(part, 'image_bytes'):
                                image_base64 = part.image_bytes
                                break
            
            if not image_base64:
                return {"success": False, "error": "No image found in response"}
            
            # Convert to base64 string
            if isinstance(image_base64, bytes):
                image_base64_str = base64.b64encode(image_base64).decode('utf-8')
            else:
                image_base64_str = str(image_base64)
            
            # Track logo position for watermark collision avoidance
            applied_logo_position = None

            # Apply logo overlay if requested
            if logo_overlay and logo_overlay.get('enabled') and logo_overlay.get('logo_url'):
                try:
                    # Decode base64 to PIL Image
                    generated_image_bytes = base64.b64decode(image_base64_str)
                    generated_image = Image.open(io.BytesIO(generated_image_bytes))

                    # Get logo position for collision avoidance
                    applied_logo_position = logo_overlay.get('position', 'top-right')

                    # Apply logo overlay with size option
                    generated_image = self._apply_logo_overlay(
                        generated_image,
                        logo_overlay['logo_url'],
                        applied_logo_position,
                        logo_overlay.get('size', 'medium')
                    )

                    # Convert back to base64
                    output_buffer = io.BytesIO()
                    generated_image.save(output_buffer, format='PNG')
                    image_base64_str = base64.b64encode(output_buffer.getvalue()).decode('utf-8')
                except Exception as e:
                    print(f"⚠️ Logo overlay failed in generation: {str(e)}")
                    applied_logo_position = None  # Reset if logo overlay failed
                    # Continue without logo overlay

            # Apply "SweetAsMenu" watermark for non-Enterprise plans
            if user_plan not in ["enterprise", "admin"]:
                try:
                    # Decode base64 to PIL Image
                    watermark_image_bytes = base64.b64decode(image_base64_str)
                    watermark_image = Image.open(io.BytesIO(watermark_image_bytes))

                    # Apply watermark with logo position for collision avoidance
                    watermark_image = self._apply_watermark(
                        watermark_image,
                        logo_position=applied_logo_position
                    )

                    # Convert back to base64
                    output_buffer = io.BytesIO()
                    watermark_image.save(output_buffer, format='PNG')
                    image_base64_str = base64.b64encode(output_buffer.getvalue()).decode('utf-8')
                    print(f"✅ Watermark applied for {user_plan} plan")
                except Exception as e:
                    print(f"⚠️ Watermark failed in generation: {str(e)}")
                    # Continue without watermark

            # Upload to Supabase
            public_url = self._upload_image_to_supabase(image_base64_str, bucket_name="menu-images", folder="generated")
            
            generated_image_data_url = f"data:image/png;base64,{image_base64_str}"
            
            return {
                "success": True,
                "generated_image": generated_image_data_url,
                "generated_image_base64": image_base64_str,
                "generated_image_url": public_url,
                "generation_prompt": optimized_prompt,
                "original_prompt": full_prompt,
                "dish_name": dish_name,
                "style": style,
                "model_used": IMAGE_GENERATION_MODEL,
                "note": f"Image generated successfully!" + (f" Uploaded to Supabase: {public_url}" if public_url else "")
            }
        except Exception as e:
            print(f"❌ Image generation failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return {"success": False, "error": str(e)}
    
    def _apply_logo_overlay(self, image: Image.Image, logo_url: str, position: str = 'top-right', logo_size: str = 'medium', opacity: float = 0.8) -> Image.Image:
        """
        Apply restaurant logo overlay on image

        Args:
            image: PIL Image object
            logo_url: URL or path to logo image
            position: Position of logo ('top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right')
            logo_size: Size of logo ('small', 'medium', 'large') - default 'medium' = 18%
            opacity: Logo opacity/transparency (0.0 to 1.0) - default 0.8 = 80%

        Returns:
            PIL Image with logo overlay
        """
        try:
            print(f"🎨 Applying logo overlay at position: {position}")
            
            # Download logo from URL
            if logo_url.startswith('http'):
                response = requests.get(logo_url, timeout=10)
                logo = Image.open(io.BytesIO(response.content))
            else:
                logo = Image.open(logo_url)
            
            # Convert logo to RGBA if needed
            if logo.mode != 'RGBA':
                logo = logo.convert('RGBA')
            
            # Get image dimensions
            img_width, img_height = image.size
            aspect_ratio = img_width / img_height

            print(f"📐 Image size: {img_width}x{img_height}, aspect ratio: {aspect_ratio:.2f}")

            # Calculate safe zone based on aspect ratio
            # When displayed as square with object-cover:
            # - Landscape (wide): left/right edges get cropped
            # - Portrait (tall): top/bottom edges get cropped

            base_margin = 0.05  # 5% base margin from visible edge

            if aspect_ratio > 1.0:  # Landscape image
                # When displayed in square, left/right will be cropped
                # Crop amount on each side (as fraction of image width)
                crop_fraction_x = (1 - 1/aspect_ratio) / 2
                # Safe margin = crop area + base margin (relative to visible area)
                safe_margin_x = crop_fraction_x + (base_margin * (1/aspect_ratio))
                safe_margin_y = base_margin
                print(f"📐 Landscape: crop_x={crop_fraction_x:.2%}, safe_margin_x={safe_margin_x:.2%}")
            elif aspect_ratio < 1.0:  # Portrait image
                # When displayed in square, top/bottom will be cropped
                crop_fraction_y = (1 - aspect_ratio) / 2
                safe_margin_x = base_margin
                safe_margin_y = crop_fraction_y + (base_margin * aspect_ratio)
                print(f"📐 Portrait: crop_y={crop_fraction_y:.2%}, safe_margin_y={safe_margin_y:.2%}")
            else:  # Square image (no cropping)
                safe_margin_x = base_margin
                safe_margin_y = base_margin
                print(f"📐 Square image: no cropping needed")

            # Clamp margins to reasonable range (max 35% to leave room for logo)
            safe_margin_x = min(safe_margin_x, 0.35)
            safe_margin_y = min(safe_margin_y, 0.35)

            margin_x = int(img_width * safe_margin_x)
            margin_y = int(img_height * safe_margin_y)

            print(f"📐 Final margins: x={margin_x}px ({safe_margin_x:.2%}), y={margin_y}px ({safe_margin_y:.2%})")

            # Logo size options
            size_percentages = {
                'small': 0.12,   # 12% of visible area
                'medium': 0.18,  # 18% of visible area (default)
                'large': 0.25,   # 25% of visible area
            }
            size_percent = size_percentages.get(logo_size, 0.18)

            # Resize logo based on VISIBLE area width
            # For landscape: visible width = img_height (when shown in square)
            # For portrait: visible width = img_width
            if aspect_ratio > 1.0:
                visible_width = img_height  # Square crop of landscape shows height as width
            else:
                visible_width = img_width

            logo_width = int(visible_width * size_percent)
            logo_aspect = logo.height / logo.width
            logo_height = int(logo_width * logo_aspect)
            logo = logo.resize((logo_width, logo_height), Image.Resampling.LANCZOS)

            print(f"🖼️ Logo resized to: {logo_width}x{logo_height} (size: {logo_size} = {size_percent*100:.0f}%)")

            # Apply transparency/opacity to logo (default 80%)
            if opacity < 1.0:
                # Ensure logo has alpha channel
                if logo.mode != 'RGBA':
                    logo = logo.convert('RGBA')

                # Apply opacity to alpha channel
                alpha = logo.split()[3]
                alpha = alpha.point(lambda p: int(p * opacity))
                logo.putalpha(alpha)
                print(f"🔍 Logo transparency applied: {opacity*100:.0f}% opacity")

            positions = {
                'top-left': (margin_x, margin_y),
                'top-center': ((img_width - logo_width) // 2, margin_y),
                'top-right': (img_width - logo_width - margin_x, margin_y),
                'bottom-left': (margin_x, img_height - logo_height - margin_y),
                'bottom-center': ((img_width - logo_width) // 2, img_height - logo_height - margin_y),
                'bottom-right': (img_width - logo_width - margin_x, img_height - logo_height - margin_y),
            }
            
            pos = positions.get(position, positions['top-right'])
            
            # Create a copy of the image
            result = image.copy()
            if result.mode != 'RGBA':
                result = result.convert('RGBA')
            
            # Paste logo with alpha channel
            result.paste(logo, pos, logo)
            
            # Convert back to RGB
            if result.mode == 'RGBA':
                background = Image.new('RGB', result.size, (255, 255, 255))
                background.paste(result, mask=result.split()[3])
                result = background
            
            print(f"✅ Logo overlay applied successfully at {position}")
            return result
            
        except Exception as e:
            print(f"⚠️ Logo overlay failed: {str(e)}")
            # Return original image if logo overlay fails
            return image

    def _apply_watermark(
        self,
        image: Image.Image,
        logo_position: str = None
    ) -> Image.Image:
        """
        Apply company logo watermark on image for non-Enterprise plans.
        Uses smart collision avoidance to prevent overlap with restaurant logo.

        Args:
            image: PIL Image object
            logo_position: Position of restaurant logo overlay if present ('top-left', 'top-right',
                          'bottom-left', 'bottom-right', 'top-center', 'bottom-center')
                          Used to avoid collision with restaurant logo.

        Returns:
            PIL Image with company logo watermark at bottom-right
        """
        try:
            print(f"🏷️ Applying company logo watermark")
            if logo_position:
                print(f"📍 Restaurant logo detected at: {logo_position} - applying collision avoidance")

            # Get the path to company logo
            current_dir = pathlib.Path(__file__).parent
            logo_path = current_dir.parent / 'assets' / 'company-logo.png'

            if not logo_path.exists():
                print(f"⚠️ Company logo not found at: {logo_path}")
                return image

            # Load company logo
            watermark_logo = Image.open(logo_path)

            # Convert logo to RGBA if needed
            if watermark_logo.mode != 'RGBA':
                watermark_logo = watermark_logo.convert('RGBA')

            # Create a copy of the image
            result = image.copy()
            if result.mode != 'RGBA':
                result = result.convert('RGBA')

            img_width, img_height = result.size

            # Calculate watermark size (approximately 12% of image width)
            watermark_width = int(img_width * 0.12)
            logo_aspect = watermark_logo.height / watermark_logo.width
            watermark_height = int(watermark_width * logo_aspect)

            # Resize watermark logo
            watermark_logo = watermark_logo.resize(
                (watermark_width, watermark_height),
                Image.Resampling.LANCZOS
            )

            # Apply semi-transparency to watermark (70% opacity)
            alpha = watermark_logo.split()[3]
            alpha = alpha.point(lambda p: int(p * 0.7))
            watermark_logo.putalpha(alpha)

            # Calculate position - default bottom-right with padding
            padding = int(img_width * 0.03)  # 3% padding from edges

            # Smart positioning with collision avoidance
            if logo_position in ['bottom-right']:
                # Restaurant logo at bottom-right, move watermark to bottom-left
                x = padding
                y = img_height - watermark_height - padding
                print(f"📐 Watermark moved to bottom-left to avoid restaurant logo")
            else:
                # Default: bottom-right
                x = img_width - watermark_width - padding
                y = img_height - watermark_height - padding
                print(f"📐 Watermark at bottom-right (default position)")

            # Paste watermark with alpha channel
            result.paste(watermark_logo, (x, y), watermark_logo)

            # Convert back to RGB
            background = Image.new('RGB', result.size, (255, 255, 255))
            background.paste(result, mask=result.split()[3])
            result = background

            print(f"✅ Logo watermark applied successfully at ({x}, {y}), size: {watermark_width}x{watermark_height}")
            return result

        except Exception as e:
            print(f"⚠️ Logo watermark failed: {str(e)}")
            import traceback
            traceback.print_exc()
            # Return original image if watermark fails
            return image

    def upload_image_to_supabase(self, image_base64: str, bucket_name: str = "menu-images", folder: str = "generated") -> Optional[str]:
        """Public method for uploading images to Supabase"""
        return self._upload_image_to_supabase(image_base64, bucket_name, folder)

    def apply_logo_only(self, image_bytes: bytes, logo_url: str, position: str = 'top-right', logo_size: str = 'medium') -> Dict[str, Any]:
        """
        Apply logo overlay to an image WITHOUT any AI enhancement or modification.
        This is a simple logo placement function - no sharpening, no contrast, no AI.

        Args:
            image_bytes: Raw image bytes
            logo_url: URL of the restaurant logo
            position: Position of logo ('top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right')
            logo_size: Size of logo ('small', 'medium', 'large') - default 'medium'

        Returns:
            Dictionary with image URL (logo applied)
        """
        try:
            print(f"🎨 Applying logo ONLY (no enhancement) at position: {position}")

            # Open the original image
            image = Image.open(io.BytesIO(image_bytes))

            # Ensure image is in RGB mode for consistent output
            if image.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', image.size, (255, 255, 255))
                if image.mode == 'P':
                    image = image.convert('RGBA')
                if image.mode in ('RGBA', 'LA'):
                    background.paste(image, mask=image.split()[-1])
                else:
                    background.paste(image)
                image = background
            elif image.mode != 'RGB':
                image = image.convert('RGB')

            # Apply logo overlay with size option
            image_with_logo = self._apply_logo_overlay(image, logo_url, position, logo_size)

            # Convert to bytes for upload (NO sharpening, NO contrast)
            output_buffer = io.BytesIO()
            image_with_logo.save(output_buffer, format='WEBP', quality=95, method=6)
            image_bytes_result = output_buffer.getvalue()

            # Generate unique filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            random_id = str(uuid.uuid4())[:8]
            filename = f"logo_applied/{timestamp}_{random_id}.webp"

            # Upload directly to Supabase without additional processing
            if self.supabase_client:
                try:
                    response = self.supabase_client.storage.from_("menu-images").upload(
                        path=filename,
                        file=image_bytes_result,
                        file_options={"content-type": "image/webp", "upsert": "true"}
                    )

                    # Get public URL
                    public_url_response = self.supabase_client.storage.from_("menu-images").get_public_url(filename)

                    if isinstance(public_url_response, dict):
                        public_url = public_url_response.get('publicUrl') or public_url_response.get('public_url') or str(public_url_response)
                    elif isinstance(public_url_response, str):
                        public_url = public_url_response
                    else:
                        public_url = str(public_url_response)

                    print(f"✅ Logo applied and uploaded: {public_url}")

                    return {
                        "success": True,
                        "image_url": public_url,
                        "position": position,
                        "note": "Logo applied successfully without any image modification"
                    }

                except Exception as upload_error:
                    print(f"❌ Upload failed: {str(upload_error)}")
                    # Return base64 as fallback
                    image_base64 = base64.b64encode(image_bytes_result).decode('utf-8')
                    return {
                        "success": True,
                        "image_url": f"data:image/webp;base64,{image_base64}",
                        "position": position,
                        "note": "Logo applied but upload failed, returning base64"
                    }
            else:
                # No Supabase, return base64
                image_base64 = base64.b64encode(image_bytes_result).decode('utf-8')
                return {
                    "success": True,
                    "image_url": f"data:image/webp;base64,{image_base64}",
                    "position": position,
                    "note": "Logo applied (no Supabase available)"
                }

        except Exception as e:
            print(f"❌ Apply logo failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return {"success": False, "error": str(e)}
    
    def extract_menu_from_file(self, file_bytes: bytes, content_type: str) -> Dict[str, Any]:
        """
        Extract menu items from file (PDF or image)
        
        Args:
            file_bytes: File bytes
            content_type: MIME type of file
        
        Returns:
            Dictionary with extracted menu items
        """
        # Convert file to base64 and call analyze_menu_document
        image_base64 = base64.b64encode(file_bytes).decode('utf-8')
        
        # Add data URL prefix
        if content_type == "application/pdf":
            image_data_url = f"data:application/pdf;base64,{image_base64}"
        else:
            image_data_url = f"data:{content_type};base64,{image_base64}"
        
        return self.analyze_menu_document(image_data_url)


# Create singleton instance
ai_service = AIService()

