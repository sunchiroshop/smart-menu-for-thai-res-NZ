"""
Smart Menu SaaS - Full AI Backend
รวมทุก AI features: Translation, Image Enhancement, Generation
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from contextlib import asynccontextmanager
import os
import base64
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path="../.env")

# Import AI services
from services.ai_service import ai_service  # Unified AI service (cost-optimized)
from services.menu_storage import menu_storage  # Keep for backward compatibility
from services.menu_service import menu_service  # New: Supabase-based menu service
from services.stripe_service import stripe_service
from services.trial_limits import trial_limits_service
from services.customization_service import customization_service
from services.user_role_service import user_role_service
from services.restaurant_service import restaurant_service
from services.orders_service import orders_service
from services.best_sellers_service import best_sellers_service
from services.email_service import email_service  # Email notifications
from services.analytics_service import analytics_service  # Analytics & Reports
from services.staff_service import staff_service  # Staff Management
from services.image_library_service import image_library_service  # Shared Image Library
from services.delivery_service import delivery_service  # Delivery distance calculation

# Lifespan handler for graceful startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application lifespan events"""
    # Startup
    try:
        print("🚀 Smart Menu AI API starting up...")
        # Services will be initialized lazily on first use
        yield
    except asyncio.CancelledError:
        # This is normal during reload/shutdown - don't log as error, just pass through
        pass
    except Exception as e:
        print(f"⚠️ Startup error: {str(e)}")
        raise
    finally:
        # Shutdown
        try:
            print("🛑 Smart Menu AI API shutting down gracefully...")
            # Clean up resources if needed
            pass
        except Exception as e:
            # Don't raise during shutdown cleanup
            pass

# Initialize FastAPI with lifespan handler
app = FastAPI(
    title="Smart Menu AI API",
    description="Full AI-powered backend: Translation, Image Enhancement, Generation",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# Models
# ============================================================

class TranslateRequest(BaseModel):
    text: str
    source_lang: str
    target_lang: str = "English"

class TranslateResponse(BaseModel):
    original_text: str
    translated_text: str
    source_lang: str
    target_lang: str

class BatchTranslateRequest(BaseModel):
    texts: List[str]
    source_lang: str = "auto"
    target_lang: str = "en"

class BatchTranslateResponse(BaseModel):
    translations: List[str]
    source_lang: str
    target_lang: str
    count: int

class DetectLanguageRequest(BaseModel):
    text: str

class EnhancementStyle(BaseModel):
    style: str = "professional"  # natural, vivid, professional

class MenuItemInput(BaseModel):
    name: str
    description: str
    category: str = "Main Course"
    language: str = "English"

class SaveMenuItemRequest(BaseModel):
    name: str
    nameEn: Optional[str] = ""
    description: Optional[str] = ""
    descriptionEn: Optional[str] = ""
    price: str
    category: str
    categoryEn: Optional[str] = ""
    photo_url: Optional[str] = ""
    meats: Optional[List[Dict[str, Any]]] = []  # NEW: Choose Meat options
    addOns: Optional[List[Dict[str, Any]]] = []
    showBothLanguages: Optional[bool] = True
    primaryLanguage: Optional[str] = "original"
    restaurant_id: Optional[str] = "default"
    is_best_seller: Optional[bool] = False  # NEW: Best Seller flag

class CreateCheckoutSessionRequest(BaseModel):
    price_id: str
    user_id: str
    user_email: str
    plan_id: str
    interval: str = "monthly"

class VerifySessionRequest(BaseModel):
    session_id: str
    user_id: str

class CancelSubscriptionRequest(BaseModel):
    subscription_id: str

class TrialStatusRequest(BaseModel):
    user_id: str

class UpdateThemeColorRequest(BaseModel):
    restaurant_id: str
    theme_color: str
    user_id: str  # For plan checking

class UploadCoverImageRequest(BaseModel):
    restaurant_id: str
    image_base64: str
    user_id: str  # For plan checking

class UpdateProfileRequest(BaseModel):
    restaurant_id: str
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    theme_color: Optional[str] = None
    menu_template: Optional[str] = None  # list, grid, magazine, elegant, casual
    user_id: str  # For plan checking

class CreatePortalSessionRequest(BaseModel):
    user_id: str
    customer_id: str  # Stripe Customer ID
    return_url: Optional[str] = None

# Payment System Models
class CreatePaymentIntentRequest(BaseModel):
    order_id: str
    amount: float
    currency: str = "nzd"
    restaurant_id: str
    customer_email: Optional[str] = None

class ConfirmPaymentRequest(BaseModel):
    payment_intent_id: str
    order_id: str

class CreateRefundRequest(BaseModel):
    payment_intent_id: str
    amount: Optional[float] = None  # None for full refund
    reason: str = "requested_by_customer"

class BankAccount(BaseModel):
    bank_name: str
    account_name: str
    account_number: str

class UpdatePaymentSettingsRequest(BaseModel):
    accept_card: Optional[bool] = None
    accept_bank_transfer: Optional[bool] = None
    bank_accounts: Optional[List[BankAccount]] = None

class UploadPaymentSlipRequest(BaseModel):
    order_id: str
    slip_image_base64: str

# ============================================================
# Translation Routes (Existing)
# ============================================================

@app.get("/")
async def root():
    """API health check"""
    return {
        "status": "ok",
        "message": "Smart Menu AI API is running",
        "version": "1.0.0",
        "features": [
            "Translation (50+ languages)",
            "AI Photo Enhancement (Analysis)",
            "AI Image Generation (Prompt creation)",
            "Food Image Analysis"
        ],
        "note": "Full AI capabilities. Imagen generation requires Paid tier."
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    # Check AI service
    ai_status = "error"
    try:
        ai_status = "connected" if (hasattr(ai_service, 'ready') and ai_service.ready) else "error"
    except Exception as e:
        print(f"⚠️ AI Service health check error: {str(e)}")
        ai_status = "error"
    
    return {
        "status": "healthy",
        "services": {
            "ai_service": ai_status,
        },
        "capabilities": {
            "translation": ai_status == "connected",
            "image_analysis": ai_status == "connected",
            "image_enhancement": ai_status == "connected",
            "image_generation": ai_status == "connected",
        }
    }

@app.post("/api/translate", response_model=TranslateResponse)
async def translate_text(request: TranslateRequest):
    """
    แปลข้อความจากภาษาใดก็ได้ → อังกฤษ
    ใช้ Gemini API (Free Tier OK)
    """
    try:
        # Validate input
        if not request.text or not request.text.strip():
            raise HTTPException(status_code=400, detail="Text to translate cannot be empty")
        
        if not request.source_lang:
            raise HTTPException(status_code=400, detail="Source language is required")
        
        # Translate using AI Service (cost-optimized: gemini-1.5-flash)
        if not ai_service.ready:
            raise HTTPException(status_code=503, detail="AI service is not available. Please check API key configuration.")
        
        translated = await ai_service.translate(
            text=request.text,
            source_lang=request.source_lang,
            target_lang=request.target_lang
        )
        
        # Validate translation result
        if not translated or translated == request.text:
            # If translation failed or returned original, log warning but don't fail
            print(f"⚠️ Translation may have failed: original='{request.text}', translated='{translated}'")
        
        return TranslateResponse(
            original_text=request.text,
            translated_text=translated,
            source_lang=request.source_lang,
            target_lang=request.target_lang
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Translate endpoint error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")

@app.post("/api/translate/batch", response_model=BatchTranslateResponse)
async def translate_batch(request: BatchTranslateRequest):
    """
    แปลข้อความหลายรายการพร้อมกัน (Batch Translation)
    ใช้สำหรับแปลเมนูทั้งหมดในครั้งเดียว
    """
    try:
        # Validate input
        if not request.texts or len(request.texts) == 0:
            raise HTTPException(status_code=400, detail="Texts array cannot be empty")

        # Check AI service
        if not ai_service.ready:
            raise HTTPException(status_code=503, detail="AI service is not available. Please check API key configuration.")

        # Language code mapping
        lang_names = {
            'en': 'English',
            'th': 'Thai',
            'zh': 'Chinese',
            'ja': 'Japanese',
            'ko': 'Korean',
            'vi': 'Vietnamese',
            'hi': 'Hindi',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'id': 'Indonesian',
            'ms': 'Malay',
        }

        target_lang_name = lang_names.get(request.target_lang, request.target_lang)

        print(f"📝 Batch Translation Request: {len(request.texts)} texts → {target_lang_name}")

        # Translate each text
        translations = []
        for i, text in enumerate(request.texts):
            if not text or not text.strip():
                translations.append('')
                continue

            try:
                translated = await ai_service.translate(
                    text=text,
                    source_lang=request.source_lang if request.source_lang != 'auto' else 'auto-detect',
                    target_lang=target_lang_name
                )
                translations.append(translated or text)
            except Exception as e:
                print(f"⚠️ Translation failed for text {i}: {str(e)}")
                translations.append(text)  # Fallback to original

        print(f"✅ Batch Translation Complete: {len(translations)} texts translated")

        return BatchTranslateResponse(
            translations=translations,
            source_lang=request.source_lang,
            target_lang=request.target_lang,
            count=len(translations)
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Batch translate error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Batch translation failed: {str(e)}")

@app.post("/api/detect-language")
async def detect_language(request: DetectLanguageRequest):
    """ตรวจจับภาษาของข้อความ"""
    try:
        # Validate input
        if not request.text or not request.text.strip():
            raise HTTPException(status_code=400, detail="Text to detect cannot be empty")
        
        # Detect language using AI Service (cost-optimized: gemini-1.5-flash)
        if not ai_service.ready:
            raise HTTPException(status_code=503, detail="AI service is not available. Please check API key configuration.")
        
        detected = await ai_service.detect_language(request.text)
        
        return {
            "text": request.text,
            "detected_language": detected,
            "confidence": 0.95
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Detect language error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Language detection failed: {str(e)}")

# ============================================================
# Translation Cache API (Menu Translations)
# ============================================================

class SaveMenuTranslationsRequest(BaseModel):
    restaurant_id: str
    language_code: str
    translations: List[Dict[str, Any]]  # List of {menu_id, name, description, category, meats, addons, source_hash}

@app.get("/api/translations/menu/{restaurant_id}", summary="Get Cached Menu Translations")
async def get_menu_translations(restaurant_id: str, language_code: str):
    """
    ดึง cached translations สำหรับเมนูของร้าน

    Args:
        restaurant_id: Restaurant ID หรือ slug
        language_code: รหัสภาษา (th, en, zh, ja, ko, etc.)

    Returns:
        Dictionary with cached translations
    """
    try:
        # Convert slug to UUID if needed
        restaurant = restaurant_service.get_restaurant_by_id_or_slug(restaurant_id)
        if not restaurant:
            raise HTTPException(status_code=404, detail=f"Restaurant not found: {restaurant_id}")

        actual_restaurant_id = restaurant.get("id")

        # Get cached translations
        result = supabase.table("menu_translations") \
            .select("*") \
            .eq("restaurant_id", actual_restaurant_id) \
            .eq("language_code", language_code) \
            .execute()

        # Convert to dictionary keyed by menu_id
        translations_map = {}
        if result.data:
            for item in result.data:
                translations_map[item["menu_id"]] = {
                    "translated_name": item.get("translated_name"),
                    "translated_description": item.get("translated_description"),
                    "translated_category": item.get("translated_category"),
                    "translated_meats": item.get("translated_meats", []),
                    "translated_addons": item.get("translated_addons", []),
                    "source_hash": item.get("source_hash"),
                    "updated_at": item.get("updated_at")
                }

        return {
            "success": True,
            "restaurant_id": actual_restaurant_id,
            "language_code": language_code,
            "count": len(translations_map),
            "translations": translations_map
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Get menu translations error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/translations/menu", summary="Save Menu Translations to Cache")
async def save_menu_translations(request: SaveMenuTranslationsRequest):
    """
    บันทึก translations ลง cache เพื่อไม่ต้องแปลซ้ำ

    Args:
        restaurant_id: Restaurant ID
        language_code: รหัสภาษา
        translations: List of translations to cache

    Returns:
        Dictionary with save result
    """
    try:
        # Convert slug to UUID if needed
        restaurant = restaurant_service.get_restaurant_by_id_or_slug(request.restaurant_id)
        if not restaurant:
            raise HTTPException(status_code=404, detail=f"Restaurant not found: {request.restaurant_id}")

        actual_restaurant_id = restaurant.get("id")

        saved_count = 0
        for trans in request.translations:
            try:
                # Upsert translation
                data = {
                    "restaurant_id": actual_restaurant_id,
                    "menu_id": trans.get("menu_id"),
                    "language_code": request.language_code,
                    "translated_name": trans.get("name"),
                    "translated_description": trans.get("description"),
                    "translated_category": trans.get("category"),
                    "translated_meats": trans.get("meats", []),
                    "translated_addons": trans.get("addons", []),
                    "source_hash": trans.get("source_hash"),
                    "updated_at": "now()"
                }

                # Use upsert (insert or update on conflict)
                supabase.table("menu_translations").upsert(
                    data,
                    on_conflict="restaurant_id,menu_id,language_code"
                ).execute()

                saved_count += 1
            except Exception as e:
                print(f"⚠️ Failed to save translation for menu {trans.get('menu_id')}: {str(e)}")

        print(f"✅ Saved {saved_count} menu translations for restaurant {actual_restaurant_id}, lang: {request.language_code}")

        return {
            "success": True,
            "saved_count": saved_count,
            "language_code": request.language_code
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Save menu translations error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/translations/menu/{restaurant_id}/{menu_id}", summary="Invalidate Menu Translation Cache")
async def invalidate_menu_translation(restaurant_id: str, menu_id: str):
    """
    ลบ cache ของเมนูที่ถูกแก้ไข (เพื่อให้แปลใหม่)

    Args:
        restaurant_id: Restaurant ID
        menu_id: Menu ID ที่ต้องการ invalidate cache

    Returns:
        Dictionary with delete result
    """
    try:
        # Convert slug to UUID if needed
        restaurant = restaurant_service.get_restaurant_by_id_or_slug(restaurant_id)
        if not restaurant:
            raise HTTPException(status_code=404, detail=f"Restaurant not found: {restaurant_id}")

        actual_restaurant_id = restaurant.get("id")

        # Delete all language translations for this menu item
        result = menu_service.supabase_client.table("menu_translations") \
            .delete() \
            .eq("restaurant_id", actual_restaurant_id) \
            .eq("menu_id", menu_id) \
            .execute()

        print(f"✅ Invalidated translation cache for menu {menu_id}")

        return {
            "success": True,
            "menu_id": menu_id,
            "message": "Translation cache invalidated"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Invalidate menu translation error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/translations/menu/{restaurant_id}", summary="Clear All Menu Translation Cache")
async def clear_all_menu_translations(restaurant_id: str, language_code: Optional[str] = None):
    """
    ลบ cache ทั้งหมดของร้าน (หรือเฉพาะภาษา)

    Args:
        restaurant_id: Restaurant ID
        language_code: รหัสภาษา (optional - ถ้าไม่ระบุจะลบทุกภาษา)

    Returns:
        Dictionary with delete result
    """
    try:
        # Convert slug to UUID if needed
        restaurant = restaurant_service.get_restaurant_by_id_or_slug(restaurant_id)
        if not restaurant:
            raise HTTPException(status_code=404, detail=f"Restaurant not found: {restaurant_id}")

        actual_restaurant_id = restaurant.get("id")

        # Build delete query
        query = supabase.table("menu_translations") \
            .delete() \
            .eq("restaurant_id", actual_restaurant_id)

        if language_code:
            query = query.eq("language_code", language_code)

        result = query.execute()

        print(f"✅ Cleared translation cache for restaurant {actual_restaurant_id}" +
              (f", language: {language_code}" if language_code else ""))

        return {
            "success": True,
            "message": f"Translation cache cleared" + (f" for {language_code}" if language_code else "")
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Clear menu translations error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# AI Image Enhancement Routes (NEW)
# ============================================================

# DEPRECATED: Use /api/ai/enhance-image-upload instead
# Note: This endpoint is defined after enhance_image_upload to avoid forward reference


# ============================================================
# AI Image Generation Routes (NEW)
# ============================================================

# DEPRECATED: Use /api/ai/generate-image instead (accepts JSON)
@app.post("/api/ai/generate-photo", deprecated=True)
async def generate_photo(menu_item: MenuItemInput):
    """
    DEPRECATED: Use /api/ai/generate-image instead
    
    This endpoint is kept for backward compatibility.
    New code should use /api/ai/generate-image which accepts JSON.
    """
    try:
        result = ai_service.generate_food_image_from_description(
            menu_item.name,
            menu_item.description or "",
            "general",
            "professional"
        )
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Generation failed: {str(e)}"
        )


# ============================================================
# Tier/Feature Info Routes
# ============================================================

@app.get("/api/features")
async def get_features():
    """
    Get available features and tier requirements
    """
    return {
        "free_tier": {
            "translation": True,
            "language_detection": True,
            "image_analysis": True,
            "limits": {
                "requests_per_minute": 15,
                "max_file_size": "10MB"
            }
        },
        "pro_tier": {
            "all_free_features": True,
            "image_enhancement_analysis": True,
            "generation_prompts": True,
            "batch_processing": True,
            "limits": {
                "requests_per_minute": 60,
                "max_file_size": "50MB",
                "ai_enhancements_per_month": 50
            },
            "price": "$69/month"
        },
        "premium_tier": {
            "all_pro_features": True,
            "unlimited_enhancements": True,
            "ai_image_generation": "Coming soon (Requires Imagen API)",
            "priority_support": True,
            "limits": {
                "requests_per_minute": "unlimited",
                "max_file_size": "100MB",
                "ai_generations_per_month": 200
            },
            "price": "$99/month"
        },
        "note": (
            "Actual image generation/editing requires Imagen API. "
            "Currently providing analysis and prompt generation only."
        )
    }

@app.get("/api/pricing")
async def get_pricing():
    """Get pricing information"""
    return {
        "starter": {
            "name": "Starter",
            "price": 39,
            "currency": "NZD",
            "billing": "monthly",
            "features": [
                "Smart Menu with QR Code",
                "Translation (50+ languages)",
                "Manual photo upload",
                "Up to 20 menu items",
                "Basic analytics"
            ]
        },
        "pro": {
            "name": "Pro",
            "price": 69,
            "currency": "NZD",
            "billing": "monthly",
            "features": [
                "Everything in Starter",
                "AI Photo Enhancement (Analysis)",
                "Food image analysis",
                "Up to 50 menu items",
                "50 AI analyses/month",
                "Priority support"
            ],
            "most_popular": True
        },
        "premium": {
            "name": "Premium",
            "price": 99,
            "currency": "NZD",
            "billing": "monthly",
            "features": [
                "Everything in Pro",
                "AI Image Generation (Coming soon)",
                "Batch processing",
                "Up to 200 menu items",
                "200 AI generations/month",
                "Custom branding",
                "Dedicated support"
            ]
        }
    }

# ============================================================
# Menu Management Routes (NEW)
# ============================================================

@app.post("/api/menu", summary="Save Menu Item")
async def save_menu_item(menu_item: SaveMenuItemRequest):
    """
    บันทึก menu item ใหม่
    
    รองรับ:
    - ชื่อภาษาท้องถิ่น + อังกฤษ
    - คำอธิบายภาษาท้องถิ่น + อังกฤษ
    - Category
    - Add-ons
    - รูปภาพ
    """
    try:
        menu_data = menu_item.dict()
        
        # Allow saving without image_url if generation failed
        if not menu_data.get("image_url") and menu_data.get("photo_url"):
            menu_data["image_url"] = menu_data["photo_url"]
        
        # Validate restaurant_id
        if not menu_item.restaurant_id or menu_item.restaurant_id == 'default':
            raise HTTPException(status_code=400, detail="Valid restaurant_id is required. Please select a restaurant.")
        
        print(f"🔄 Saving menu item for restaurant: {menu_item.restaurant_id}")
        print(f"   Name: {menu_data.get('name', 'N/A')}")
        print(f"   Price: {menu_data.get('price', 'N/A')}")
        print(f"   Category: {menu_data.get('category', 'N/A')}")
        print(f"   Meats: {len(menu_data.get('meats', []))} options")
        print(f"   AddOns: {len(menu_data.get('addOns', []))} options")
        print(f"   Is Best Seller: {menu_data.get('is_best_seller', False)}")
        
        # Save to Supabase (NO FALLBACK!)
        saved_item = menu_service.create_menu_item(menu_item.restaurant_id, menu_data)
        
        if not saved_item:
            raise HTTPException(status_code=500, detail="Failed to save menu item to database. Please check logs.")
        
        print(f"✅ Menu item saved successfully with ID: {saved_item.get('menu_id')}")
        
        return {
            "success": True,
            "message": "Menu item saved successfully",
            "menu_item": saved_item
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Failed to save menu item: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to save menu item: {str(e)}")

@app.get("/api/menus", summary="Get All Menu Items")
async def get_menu_items(restaurant_id: str = "default"):
    """
    ดึง menu items ทั้งหมดของร้าน
    IMPORTANT: ดึงจาก Supabase Database เท่านั้น (ไม่ใช้ mock data)
    """
    try:
        # Use menu_service (Supabase) instead of menu_storage (in-memory)
        # First, try to get restaurant_id from user_id if restaurant_id is "default"
        if restaurant_id == "default":
            # Try to get restaurant for current user (if authenticated)
            # For now, return empty if default
            items = []
        else:
            # Validate UUID format
            if menu_service._is_valid_uuid(restaurant_id):
                items = menu_service.get_menu_items(restaurant_id)
            else:
                # Fallback to menu_storage for backward compatibility (will be removed)
                items = menu_storage.get_menu_items(restaurant_id)
        
        return {
            "success": True,
            "count": len(items),
            "items": items
        }
    except Exception as e:
        print(f"❌ Failed to fetch menu items: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch menu items: {str(e)}")

@app.get("/api/menu/{menu_id}", summary="Get Single Menu Item")
async def get_menu_item(menu_id: str, restaurant_id: str = "default"):
    """
    ดึง menu item เดียว (from Supabase)
    """
    try:
        # Try Supabase first
        item = None
        if menu_service._is_valid_uuid(menu_id):
            item = menu_service.get_menu_item(menu_id)
        
        # Fallback to in-memory if not found
        if not item:
            item = menu_storage.get_menu_item(menu_id, restaurant_id)
        
        if not item:
            raise HTTPException(status_code=404, detail="Menu item not found")
        
        return {
            "success": True,
            "menu_item": item
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch menu item: {str(e)}")

@app.put("/api/menu/{menu_id}", summary="Update Menu Item")
async def update_menu_item(menu_id: str, menu_item: SaveMenuItemRequest):
    """
    แก้ไข menu item
    Updates menu item in Supabase database
    """
    try:
        menu_data = menu_item.dict()

        # Debug logging for is_best_seller
        print(f"📝 PUT /api/menu/{menu_id}")
        print(f"   is_best_seller in request: {menu_data.get('is_best_seller')}")

        # Try Supabase first (preferred)
        updated_item = None
        try:
            updated_item = menu_service.update_menu_item(menu_id, menu_data)
        except Exception as e:
            print(f"❌ Menu Service update failed: {str(e)}")
            # Fallback to in-memory storage for backward compatibility
            updated_item = menu_storage.update_menu_item(menu_id, menu_data, menu_item.restaurant_id or "default")
        
        if not updated_item:
            raise HTTPException(status_code=404, detail="Menu item not found")
        
        return {
            "success": True,
            "message": "Menu item updated successfully",
            "menu_item": updated_item
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Failed to update menu item: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to update menu item: {str(e)}")

@app.delete("/api/menu/{menu_id}", summary="Delete Menu Item")
async def delete_menu_item(menu_id: str, restaurant_id: str = "default"):
    """
    ลบ menu item
    """
    try:
        success = menu_storage.delete_menu_item(menu_id, restaurant_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Menu item not found")
        
        return {
            "success": True,
            "message": "Menu item deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete menu item: {str(e)}")

@app.get("/api/menu-stats", summary="Get Menu Statistics")
async def get_menu_stats(restaurant_id: str = "default"):
    """
    สถิติของร้าน (from Supabase)
    """
    try:
        # Use Supabase instead of in-memory storage
        if restaurant_id == "default" or not menu_service._is_valid_uuid(restaurant_id):
            # Return empty stats if invalid restaurant_id
            return {
                "success": True,
                "stats": {
                    "total_items": 0,
                    "categories": 0,
                    "with_images": 0
                }
            }
        
        # Get menus from Supabase
        menus = menu_service.get_menu_items(restaurant_id)
        
        # Calculate stats
        categories = set()
        with_images = 0
        
        for menu in menus:
            if menu.get('category'):
                categories.add(menu.get('category'))
            if menu.get('image_url') or menu.get('photo_url'):
                with_images += 1
        
        stats = {
            "total_items": len(menus),
            "categories": len(categories),
            "with_images": with_images
        }
        
        return {
            "success": True,
            "stats": stats
        }
    except Exception as e:
        print(f"❌ Failed to fetch menu stats: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch stats: {str(e)}")

# ============================================================
# AI Image Generation Routes
# ============================================================

@app.post("/api/ai/enhance-image", summary="AI Image Enhancement (JSON)", deprecated=True)
async def enhance_image(request: Dict[str, Any]):
    """
    DEPRECATED: Use /api/ai/enhance-image-upload instead for better performance.
    
    This endpoint accepts JSON with base64 image for backward compatibility.
    New code should use /api/ai/enhance-image-upload which accepts file upload directly.
    """
    try:
        image = request.get("image", "")
        style = request.get("style", "professional")
        
        if not image:
            raise HTTPException(status_code=400, detail="image is required")
        
        # Convert base64 to bytes for enhance_image_with_ai
        if ',' in image:
            image = image.split(',')[1]
        
        import base64
        image_bytes = base64.b64decode(image)
        
        # Use the new enhance_image_with_ai function
        result = ai_service.enhance_image_with_ai(image_bytes, style)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image enhancement failed: {str(e)}")

@app.post("/api/ai/enhance-image-upload", summary="AI Image Enhancement (Upload File)")
async def enhance_image_upload(
    file: UploadFile = File(...),
    style: Optional[str] = Form("professional"),
    user_instruction: Optional[str] = Form(None),  # User's custom instruction
    user_id: Optional[str] = Form("default"),  # Default for testing, should come from auth
    logo_overlay: Optional[str] = Form(None)  # JSON string with logo overlay config
):
    """
    อัปเกรดรูปภาพถ่ายให้สวยระดับมืออาชีพ
    
    รับไฟล์รูปภาพที่อัปโหลดมา แล้วใช้ AI (gemini-3-pro-image-preview) 
    เพื่อปรับแต่งให้เป็นภาพถ่ายอาหารระดับมืออาชีพ พร้อมอัปโหลดไปยัง Supabase Storage
    
    Trial Limit: 1 image enhancement สำหรับ Free Trial
    
    Args:
        file: ไฟล์รูปภาพที่อัปโหลด
        style: สไตล์การปรับแต่ง (professional, natural, vibrant) - default: professional
        user_instruction: คำสั่งเพิ่มเติมจากผู้ใช้ (optional, e.g., "make it brighter", "change plate to white")
        user_id: User ID สำหรับตรวจสอบ trial limits
        
    Returns:
        Dictionary with:
        - success: bool
        - enhanced_image_url: Public URL จาก Supabase Storage
        - enhanced_image: Base64 data URL สำหรับ preview
        - style: สไตล์ที่ใช้
        - model_used: Model ที่ใช้
        - note: ข้อความอธิบาย
    """
    try:
        # Check trial limits
        limit_check = trial_limits_service.check_limit(user_id, "image_enhancement")
        if not limit_check["allowed"]:
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "Trial limit exceeded",
                    "message": limit_check["message"],
                    "limit": limit_check["limit"],
                    "remaining": limit_check["remaining"]
                }
            )
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="File must be an image (JPEG, PNG, etc.)"
            )
        
        # Read image bytes
        image_bytes = await file.read()
        
        if len(image_bytes) == 0:
            raise HTTPException(
                status_code=400,
                detail="Image file is empty"
            )
        
        # Validate style
        valid_styles = ["professional", "natural", "vibrant"]
        if style not in valid_styles:
            style = "professional"
        
        print(f"📸 Image Enhancement Request:")
        print(f"   File: {file.filename}")
        print(f"   Size: {len(image_bytes)} bytes")
        print(f"   Style: {style}")
        
        # Parse logo_overlay if provided
        logo_overlay_config = None
        if logo_overlay:
            try:
                import json
                logo_overlay_config = json.loads(logo_overlay)
                print(f"   Logo Overlay: {logo_overlay_config.get('position', 'N/A')}")
            except:
                print("   ⚠️ Failed to parse logo_overlay, ignoring")

        # Get user's plan for watermark (Enterprise = no watermark)
        user_plan = user_role_service.get_user_role(user_id) if user_id != "default" else "free_trial"
        print(f"   User Plan: {user_plan}")

        # Call AI enhancement service
        result = ai_service.enhance_image_with_ai(image_bytes, style, user_instruction, logo_overlay_config, user_plan)
        
        if not result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Image enhancement failed")
            )
        
        print(f"✅ Image Enhancement Result: success={result.get('success')}")
        if result.get("enhanced_image_url"):
            print(f"   Public URL: {result.get('enhanced_image_url')}")
        
        # Increment usage count if successful
        if result.get("success"):
            trial_limits_service.increment_usage(user_id, "image_enhancement")
            status = trial_limits_service.get_user_status(user_id)
            # Handle infinity values for JSON serialization
            remaining = limit_check["remaining"]
            limit = limit_check["limit"]
            if remaining == float('inf') or remaining >= 999999:
                remaining = 999999
            if limit == float('inf') or limit >= 999999:
                limit = 999999
            
            result["trial_info"] = {
                "remaining": max(0, remaining - 1) if remaining < 999999 else 999999,
                "limit": limit,
                "message": f"{max(0, remaining - 1) if remaining < 999999 else 'Unlimited'} enhancements remaining"
            }
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Image enhancement error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Image enhancement failed: {str(e)}"
        )

@app.post("/api/image/apply-logo", summary="Apply Logo Only (No AI Enhancement)")
async def apply_logo_only(
    file: UploadFile = File(...),
    logo_url: str = Form(...),
    position: Optional[str] = Form("top-right")
):
    """
    ใส่โลโก้ร้านอาหารบนรูปภาพโดยไม่มีการแก้ไขภาพใดๆ

    ฟังก์ชันนี้จะใส่โลโก้อย่างเดียว ไม่มี AI enhancement, ไม่มี sharpening, ไม่มี contrast adjustment
    เหมาะสำหรับเมื่อผู้ใช้ต้องการใส่โลโก้บนรูปที่มีอยู่แล้วโดยไม่ต้องการเปลี่ยนแปลงภาพ

    Args:
        file: ไฟล์รูปภาพที่ต้องการใส่โลโก้
        logo_url: URL ของโลโก้ร้านอาหาร
        position: ตำแหน่งของโลโก้ (top-left, top-center, top-right, bottom-left, bottom-center, bottom-right)

    Returns:
        Dictionary with:
        - success: bool
        - image_url: Public URL ของภาพที่ใส่โลโก้แล้ว
        - position: ตำแหน่งที่ใส่โลโก้
        - note: ข้อความอธิบาย
    """
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="File must be an image (JPEG, PNG, etc.)"
            )

        # Read image bytes
        image_bytes = await file.read()

        if len(image_bytes) == 0:
            raise HTTPException(
                status_code=400,
                detail="Image file is empty"
            )

        # Validate logo_url
        if not logo_url or not logo_url.startswith('http'):
            raise HTTPException(
                status_code=400,
                detail="Valid logo URL is required"
            )

        # Validate position
        valid_positions = ["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"]
        if position not in valid_positions:
            position = "top-right"

        print(f"🎨 Apply Logo Only Request:")
        print(f"   File: {file.filename}")
        print(f"   Size: {len(image_bytes)} bytes")
        print(f"   Logo URL: {logo_url[:50]}...")
        print(f"   Position: {position}")

        # Call AI service to apply logo (no enhancement)
        result = ai_service.apply_logo_only(image_bytes, logo_url, position)

        if not result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Failed to apply logo")
            )

        print(f"✅ Logo Applied Successfully: {result.get('image_url', '')[:50]}...")

        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Apply logo error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to apply logo: {str(e)}"
        )

@app.post("/api/ai/generate-image", summary="AI Image Generation from Description")
async def generate_image(request: Dict[str, Any]):
    """
    สร้างรูปอาหารจากคำอธิบายด้วย AI
    
    Trial Limit: 2 image generations สำหรับ Free Trial
    
    Args:
        dish_name: ชื่ออาหาร
        description: คำอธิบายอาหาร
        cuisine_type: ประเภทอาหาร
        style: สไตล์ภาพ
        user_id: User ID สำหรับตรวจสอบ trial limits (optional, default: "default")
    """
    try:
        dish_name = request.get("dish_name", "")
        description = request.get("description", "")
        cuisine_type = request.get("cuisine_type", "general")
        style = request.get("style", "professional")
        user_id = request.get("user_id", "default")  # Default for testing, should come from auth
        logo_overlay = request.get("logo_overlay")  # Logo overlay configuration
        
        print(f"🎨 Image Generation Request:")
        print(f"   Dish: {dish_name}")
        print(f"   Description: {description[:50]}...")
        print(f"   Cuisine: {cuisine_type}")
        print(f"   Style: {style}")
        print(f"   User ID: {user_id}")
        if logo_overlay:
            print(f"   Logo Overlay: {logo_overlay.get('position', 'N/A')}")
        
        if not dish_name:
            raise HTTPException(status_code=400, detail="dish_name is required")
        
        # Check trial limits
        limit_check = trial_limits_service.check_limit(user_id, "image_generation")
        if not limit_check["allowed"]:
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "Trial limit exceeded",
                    "message": limit_check["message"],
                    "limit": limit_check["limit"],
                    "remaining": limit_check["remaining"]
                }
            )

        # Get user's plan for watermark (Enterprise = no watermark)
        user_plan = user_role_service.get_user_role(user_id) if user_id != "default" else "free_trial"
        print(f"   User Plan: {user_plan}")

        result = ai_service.generate_food_image_from_description(
            dish_name, description, cuisine_type, style, logo_overlay, user_plan
        )
        
        print(f"✅ Image Generation Result: success={result.get('success', False)}")
        if result.get('error'):
            print(f"   Error: {result.get('error')}")
        if result.get('generated_image'):
            print(f"   Image generated! Size: {len(result.get('generated_image_base64', ''))} bytes")
        else:
            print(f"   Note: {result.get('note', 'No note')}")
        
        # Increment usage count if successful
        if result.get("success"):
            trial_limits_service.increment_usage(user_id, "image_generation")
            # Handle infinity values for JSON serialization
            remaining = limit_check["remaining"]
            limit = limit_check["limit"]
            if remaining == float('inf') or remaining >= 999999:
                remaining = 999999
            if limit == float('inf') or limit >= 999999:
                limit = 999999
            
            result["trial_info"] = {
                "remaining": max(0, remaining - 1) if remaining < 999999 else 999999,
                "limit": limit,
                "message": f"{max(0, remaining - 1) if remaining < 999999 else 'Unlimited'} generations remaining"
            }
            
            # If menu_id is provided, update image_url in database
            menu_id = request.get("menu_id")
            if menu_id and result.get("generated_image_url"):
                try:
                    updated = menu_service.update_menu_image_url(menu_id, result.get("generated_image_url"))
                    if updated:
                        print(f"✅ Updated image_url for menu {menu_id}")
                        result["menu_updated"] = True
                    else:
                        print(f"⚠️ Failed to update image_url for menu {menu_id}")
                except Exception as e:
                    print(f"⚠️ Error updating menu image_url: {str(e)}")
                    # Don't fail the request if menu update fails
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Image Generation Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")

@app.post("/api/ai/upload-image", summary="Upload Base64 Image to Supabase")
async def upload_image_to_supabase(request: Dict[str, Any]):
    """
    อัปโหลดรูปภาพจาก Base64 ไปยัง Supabase Storage
    
    ใช้สำหรับอัปโหลดรูปภาพที่ generate/enhance ไปแล้วก่อนหน้านี้
    หรือรูปภาพที่มี base64 อยู่แล้ว
    
    Args:
        image_base64: Base64 encoded image (with or without data URL prefix)
        folder: Folder name in Supabase Storage (default: "generated")
        bucket_name: Bucket name (default: "menu-images")
        
    Returns:
        Dictionary with:
        - success: bool
        - public_url: Public URL จาก Supabase Storage
        - filename: ชื่อไฟล์ที่อัปโหลด
    """
    try:
        image_base64 = request.get("image_base64", "")
        folder = request.get("folder", "generated")
        bucket_name = request.get("bucket_name", "menu-images")
        
        if not image_base64:
            raise HTTPException(
                status_code=400,
                detail="image_base64 is required"
            )
        
        print(f"📤 Upload Image Request:")
        print(f"   Folder: {folder}")
        print(f"   Bucket: {bucket_name}")
        print(f"   Image size: {len(image_base64)} chars")
        
        # Upload to Supabase Storage
        public_url = ai_service.upload_image_to_supabase(
            image_base64=image_base64,
            bucket_name=bucket_name,
            folder=folder
        )
        
        if not public_url:
            raise HTTPException(
                status_code=500,
                detail="Failed to upload image to Supabase Storage"
            )
        
        # Extract filename from URL
        filename = public_url.split('/')[-1] if '/' in public_url else "unknown"
        
        print(f"✅ Image uploaded successfully: {public_url}")
        
        return {
            "success": True,
            "public_url": public_url,
            "filename": filename,
            "folder": folder,
            "bucket_name": bucket_name,
            "note": f"Image uploaded successfully to {bucket_name}/{folder}/"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Image upload error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Image upload failed: {str(e)}"
        )


@app.get("/api/trial/status/{user_id}", summary="Get Trial Status")
async def get_trial_status(user_id: str):
    """
    ดูสถานะ Trial และจำนวนการใช้งานที่เหลือ
    
    Args:
        user_id: User ID
        
    Returns:
        Dictionary with trial status and limits
    """
    try:
        status = trial_limits_service.get_user_status(user_id)
        return {
            "success": True,
            **status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/trial/initialize", summary="Initialize Trial for User")
async def initialize_trial(request: TrialStatusRequest):
    """
    เริ่มต้น Trial สำหรับ user ใหม่
    
    Args:
        user_id: User ID
        
    Returns:
        Dictionary with trial information
    """
    try:
        status = trial_limits_service.initialize_user(request.user_id)
        return {
            "success": True,
            **status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# Stripe Payment Routes
# ============================================================

@app.post("/api/stripe/create-checkout-session", summary="Create Stripe Checkout Session")
async def create_checkout_session(request: CreateCheckoutSessionRequest):
    """
    สร้าง Stripe Checkout Session สำหรับการชำระเงิน
    """
    try:
        result = stripe_service.create_checkout_session(
            price_id=request.price_id,
            user_id=request.user_id,
            user_email=request.user_email,
            plan_id=request.plan_id,
            interval=request.interval,
        )
        
        return {
            "success": True,
            "session_id": result['session_id'],
            "checkout_url": result['checkout_url'],
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/stripe/verify-session", summary="Verify Stripe Checkout Session")
async def verify_session(request: VerifySessionRequest):
    """
    ตรวจสอบ Stripe Checkout Session หลังจากชำระเงินสำเร็จ
    """
    try:
        result = stripe_service.verify_session(request.session_id)
        
        # Here you can save subscription details to your database
        # For now, we'll just return the data
        
        return {
            "success": True,
            "subscription": result.get('subscription'),
            "payment_status": result.get('payment_status'),
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/stripe/cancel-subscription", summary="Cancel Stripe Subscription")
async def cancel_subscription(request: CancelSubscriptionRequest):
    """
    ยกเลิก Stripe Subscription
    """
    try:
        result = stripe_service.cancel_subscription(request.subscription_id)
        
        return {
            "success": True,
            "subscription_id": result['subscription_id'],
            "status": result['status'],
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stripe/subscription/{subscription_id}", summary="Get Subscription Details")
async def get_subscription(subscription_id: str):
    """
    ดูรายละเอียด Subscription
    """
    try:
        result = stripe_service.get_subscription(subscription_id)
        
        return {
            "success": True,
            "subscription": result,
        }
        
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

# ============================================================
# Payment System Routes (Order Payments)
# ============================================================

@app.post("/api/payments/create-intent", summary="Create Payment Intent")
async def create_payment_intent(request: CreatePaymentIntentRequest):
    """
    สร้าง Stripe Payment Intent สำหรับการชำระเงินของ Order

    Args:
        order_id: Order ID
        amount: ยอดเงิน (NZD)
        restaurant_id: Restaurant ID
        customer_email: Optional email for receipt
    """
    try:
        # Get order to verify it exists
        order = orders_service.get_order(request.order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        # Create payment intent
        result = stripe_service.create_payment_intent(
            amount=request.amount,
            currency=request.currency,
            order_id=request.order_id,
            restaurant_id=request.restaurant_id,
            customer_email=request.customer_email,
            description=f"Order payment for {request.restaurant_id}",
        )

        # Update order with payment_intent_id
        orders_service.update_order(
            order_id=request.order_id,
            data={
                "payment_intent_id": result["payment_intent_id"],
                "payment_status": "processing",
                "payment_method": "card"
            }
        )

        return {
            "success": True,
            "client_secret": result["client_secret"],
            "payment_intent_id": result["payment_intent_id"],
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/payments/confirm", summary="Confirm Payment")
async def confirm_payment(request: ConfirmPaymentRequest):
    """
    ยืนยันว่า Payment สำเร็จแล้ว และอัปเดต Order status
    """
    try:
        # Verify payment with Stripe
        result = stripe_service.confirm_payment(
            payment_intent_id=request.payment_intent_id,
            order_id=request.order_id
        )

        if result["paid"]:
            # Update order status to paid and move to kitchen queue
            from datetime import datetime
            orders_service.update_order(
                order_id=request.order_id,
                data={
                    "payment_status": "paid",
                    "paid_at": datetime.now().isoformat(),
                    "payment_receipt_url": result.get("receipt_url"),
                    "status": "pending"  # Move to kitchen queue
                }
            )

            return {
                "success": True,
                "paid": True,
                "receipt_url": result.get("receipt_url"),
                "message": "Payment successful. Order sent to kitchen."
            }
        else:
            return {
                "success": False,
                "paid": False,
                "status": result["status"],
                "message": "Payment not completed"
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/payments/refund", summary="Create Refund")
async def create_refund(request: CreateRefundRequest):
    """
    สร้าง Refund สำหรับ Order ที่ยกเลิก
    """
    try:
        result = stripe_service.create_refund(
            payment_intent_id=request.payment_intent_id,
            amount=request.amount,
            reason=request.reason
        )

        return {
            "success": True,
            "refund_id": result["refund_id"],
            "status": result["status"],
            "amount": result["amount"],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/payments/bank-transfer/confirm", summary="Confirm Bank Transfer Payment")
async def confirm_bank_transfer(order_id: str):
    """
    เจ้าของร้านยืนยันว่าได้รับเงินจาก Bank Transfer แล้ว (Manual verification)
    """
    try:
        from datetime import datetime

        # Update order payment status
        updated = orders_service.update_order(
            order_id=order_id,
            data={
                "payment_status": "paid",
                "paid_at": datetime.now().isoformat(),
                "status": "pending"  # Move to kitchen queue
            }
        )

        if not updated:
            raise HTTPException(status_code=404, detail="Order not found")

        return {
            "success": True,
            "message": "Bank transfer confirmed. Order sent to kitchen."
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/payments/upload-slip", summary="Upload Payment Slip")
async def upload_payment_slip(request: UploadPaymentSlipRequest):
    """
    ลูกค้าอัปโหลดสลิปการโอนเงิน
    """
    try:
        import base64

        # Decode base64 image
        image_data = base64.b64decode(request.slip_image_base64)

        # Upload to Supabase Storage using ai_service's supabase client
        if not ai_service.supabase_client:
            raise HTTPException(status_code=500, detail="Storage not available")

        file_path = f"payment-slips/{request.order_id}.jpg"

        # Upload image
        result = ai_service.supabase_client.storage.from_("payment-slips").upload(
            file_path,
            image_data,
            {"content-type": "image/jpeg", "upsert": "true"}
        )

        # Get public URL
        public_url = ai_service.supabase_client.storage.from_("payment-slips").get_public_url(file_path)

        # Update order with slip URL
        orders_service.update_order(
            order_id=request.order_id,
            data={
                "payment_slip_url": public_url,
                "payment_status": "processing"  # Waiting for verification
            }
        )

        return {
            "success": True,
            "slip_url": public_url,
            "message": "Payment slip uploaded. Waiting for verification."
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# Restaurant Payment Settings Routes
# ============================================================

@app.get("/api/restaurant/{restaurant_id}/payment-settings", summary="Get Payment Settings")
async def get_payment_settings(restaurant_id: str):
    """
    ดึงข้อมูล Payment Settings ของร้าน
    """
    try:
        restaurant = restaurant_service.get_restaurant_by_id(restaurant_id)
        if not restaurant:
            raise HTTPException(status_code=404, detail="Restaurant not found")

        payment_settings = restaurant.get("payment_settings", {
            "accept_card": True,
            "accept_bank_transfer": False,
            "bank_accounts": []
        })

        return {
            "success": True,
            "restaurant_id": restaurant_id,
            "payment_settings": payment_settings
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/restaurant/{restaurant_id}/payment-settings", summary="Update Payment Settings")
async def update_payment_settings(restaurant_id: str, request: UpdatePaymentSettingsRequest):
    """
    อัปเดต Payment Settings ของร้าน

    Args:
        accept_card: รับชำระด้วยบัตร (Stripe)
        accept_bank_transfer: รับชำระด้วยโอนเงิน
        bank_accounts: รายการบัญชีธนาคาร
    """
    try:
        # Get current settings
        restaurant = restaurant_service.get_restaurant_by_id(restaurant_id)
        if not restaurant:
            raise HTTPException(status_code=404, detail="Restaurant not found")

        current_settings = restaurant.get("payment_settings", {
            "accept_card": True,
            "accept_bank_transfer": False,
            "bank_accounts": []
        })

        # Update only provided fields
        if request.accept_card is not None:
            current_settings["accept_card"] = request.accept_card
        if request.accept_bank_transfer is not None:
            current_settings["accept_bank_transfer"] = request.accept_bank_transfer
        if request.bank_accounts is not None:
            current_settings["bank_accounts"] = [acc.dict() for acc in request.bank_accounts]

        # Validate: At least one payment method must be enabled
        if not current_settings.get("accept_card") and not current_settings.get("accept_bank_transfer"):
            raise HTTPException(
                status_code=400,
                detail="At least one payment method must be enabled"
            )

        # Save to database using restaurant_service's supabase client
        if not restaurant_service.supabase_client:
            raise HTTPException(status_code=500, detail="Database connection not available")

        result = restaurant_service.supabase_client.table("restaurants").update({
            "payment_settings": current_settings
        }).eq("id", restaurant_id).execute()

        return {
            "success": True,
            "restaurant_id": restaurant_id,
            "payment_settings": current_settings,
            "message": "Payment settings updated successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# Customization Routes (Theme Color & Cover Image)
# ============================================================

@app.get("/api/customization/{restaurant_id}", summary="Get Restaurant Customization")
async def get_customization(restaurant_id: str):
    """
    ดึงข้อมูล Customization ของร้าน (Theme Color และ Cover Image)
    
    Args:
        restaurant_id: Restaurant ID
        
    Returns:
        Dictionary with customization data
    """
    try:
        # TODO: Query from database
        # For now, return default values
        return {
            "success": True,
            "restaurant_id": restaurant_id,
            "theme_color": "#000000",
            "cover_image_url": None,
            "note": "Default values. Database integration needed."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/customization/theme-color", summary="Update Theme Color")
async def update_theme_color(request: UpdateThemeColorRequest):
    """
    อัปเดต Theme Color ของร้าน
    
    Plan Requirements:
    - Starter: ไม่สามารถปรับได้
    - Standard/Pro: ปรับได้
    - Premium: ปรับได้
    
    Args:
        restaurant_id: Restaurant ID
        theme_color: Hex color (e.g., '#FF5733' or 'FF5733')
        user_id: User ID สำหรับตรวจสอบ plan
        
    Returns:
        Dictionary with updated theme color
    """
    try:
        # Check user plan
        user_status = trial_limits_service.get_user_status(request.user_id)
        plan = user_status.get('subscription_plan', 'starter') if user_status.get('is_subscribed') else 'starter'
        
        # Starter plan cannot customize (only Pro and Premium can)
        if plan == 'starter':
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "Plan restriction",
                    "message": "Theme color customization is not available in Starter plan. Please upgrade to Pro or Premium plan.",
                    "current_plan": plan
                }
            )
        
        # Validate theme color
        if not customization_service.validate_theme_color(request.theme_color):
            raise HTTPException(
                status_code=400,
                detail="Invalid theme color format. Please use hex color (e.g., '#FF5733' or 'FF5733')"
            )
        
        # Normalize theme color
        normalized_color = customization_service.normalize_theme_color(request.theme_color)
        
        # Update theme_color in Supabase
        restaurant = restaurant_service.get_restaurant_by_id(request.restaurant_id)
        if not restaurant:
            # Try to get by user_id
            restaurant = restaurant_service.get_restaurant_by_user_id(request.user_id)
        
        if restaurant:
            updated = restaurant_service.update_restaurant(
                restaurant.get('id'),
                request.user_id,
                {'theme_color': normalized_color}
            )
            if not updated:
                print(f"⚠️ Failed to update theme_color in database")
        else:
            print(f"⚠️ Restaurant not found")
        
        print(f"🎨 Theme color updated:")
        print(f"   Restaurant ID: {request.restaurant_id}")
        print(f"   Theme Color: {normalized_color}")
        print(f"   Plan: {plan}")
        
        return {
            "success": True,
            "restaurant_id": request.restaurant_id,
            "theme_color": normalized_color,
            "plan": plan,
            "message": f"Theme color updated to {normalized_color}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Theme color update error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/customization/logo", summary="Upload Logo")
async def upload_logo(
    restaurant_id: str = Form(...),
    file: UploadFile = File(...),
    user_id: str = Form("default")
):
    """
    อัปโหลด Logo สำหรับร้าน
    
    Args:
        restaurant_id: Restaurant ID
        file: ไฟล์รูปภาพ (JPEG, PNG, WebP)
        user_id: User ID
        
    Returns:
        Dictionary with logo URL
    """
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="File must be an image (JPEG, PNG, WebP, etc.)"
            )
        
        # Read image bytes
        image_bytes = await file.read()
        
        if len(image_bytes) == 0:
            raise HTTPException(
                status_code=400,
                detail="Image file is empty"
            )
        
        # Check file size (max 4MB for logo)
        max_size = 4 * 1024 * 1024  # 4MB
        if len(image_bytes) > max_size:
            raise HTTPException(
                status_code=400,
                detail=f"Image file is too large. Maximum size is 4MB. Recommended size: 200x200px to 500x500px."
            )
        
        # Convert to base64
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        image_data_url = f"data:{file.content_type};base64,{image_base64}"
        
        print(f"📸 Logo Upload Request:")
        print(f"   Restaurant ID: {restaurant_id}")
        print(f"   File: {file.filename}")
        print(f"   Size: {len(image_bytes)} bytes ({len(image_bytes) / 1024 / 1024:.2f} MB)")
        print(f"   Content type: {file.content_type}")
        
        # Upload to Supabase Storage
        logo_url = await customization_service.upload_logo(image_data_url, restaurant_id, file.content_type)
        
        if not logo_url:
            raise HTTPException(
                status_code=500,
                detail="Failed to upload logo to Supabase Storage"
            )
        
        # Update logo_url in Supabase
        restaurant = restaurant_service.get_restaurant_by_id(restaurant_id)
        if not restaurant:
            # Try to get by user_id
            restaurant = restaurant_service.get_restaurant_by_user_id(user_id)
        
        if restaurant:
            updated = restaurant_service.update_restaurant_logo(
                restaurant.get('id'),
                user_id,
                logo_url
            )
            if not updated:
                print(f"⚠️ Failed to update logo_url in database, but image uploaded successfully")
        else:
            print(f"⚠️ Restaurant not found, but image uploaded successfully")
        
        print(f"✅ Logo uploaded successfully: {logo_url}")
        
        return {
            "success": True,
            "restaurant_id": restaurant_id,
            "logo_url": logo_url,
            "message": "Logo uploaded successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Logo upload error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/customization/cover-image", summary="Upload Cover Image")
async def upload_cover_image(
    restaurant_id: str = Form(...),
    file: UploadFile = File(...),
    user_id: str = Form("default")
):
    """
    อัปโหลด Cover Image (Banner) สำหรับร้าน

    Plan Requirements:
    - Enterprise plan หรือ Admin role เท่านั้นที่อัปโหลดได้

    Args:
        restaurant_id: Restaurant ID
        file: ไฟล์รูปภาพ (JPEG, PNG, WebP)
        user_id: User ID สำหรับตรวจสอบ plan

    Returns:
        Dictionary with cover image URL
    """
    try:
        # Check user plan and role
        user_status = trial_limits_service.get_user_status(user_id)
        plan = user_status.get('subscription_plan', 'starter') if user_status.get('is_subscribed') else 'starter'
        role = user_status.get('role', 'free_trial')

        # Only Enterprise or Admin can upload cover image (check both plan and role)
        if plan not in ['enterprise'] and role not in ['enterprise', 'admin']:
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "Plan restriction",
                    "message": "Cover image upload is only available in Enterprise plan. Please upgrade to Enterprise plan.",
                    "current_plan": plan,
                    "current_role": role
                }
            )

        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="File must be an image (JPEG, PNG, WebP, etc.)"
            )
        
        # Read image bytes
        image_bytes = await file.read()
        
        if len(image_bytes) == 0:
            raise HTTPException(
                status_code=400,
                detail="Image file is empty"
            )
        
        # Check file size (max 4MB for banner)
        max_size = 4 * 1024 * 1024  # 4MB
        if len(image_bytes) > max_size:
            raise HTTPException(
                status_code=400,
                detail=f"Image file is too large. Maximum size is 4MB. Recommended size: 1200x400px to 1920x600px."
            )
        
        # Convert to base64
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        image_data_url = f"data:{file.content_type};base64,{image_base64}"
        
        print(f"📸 Cover Image Upload Request:")
        print(f"   Restaurant ID: {restaurant_id}")
        print(f"   File: {file.filename}")
        print(f"   Size: {len(image_bytes)} bytes ({len(image_bytes) / 1024 / 1024:.2f} MB)")
        print(f"   Content type: {file.content_type}")
        print(f"   Plan: {plan}")
        
        # Upload to Supabase Storage
        cover_image_url = await customization_service.upload_cover_image(image_data_url, restaurant_id, file.content_type)
        
        if not cover_image_url:
            raise HTTPException(
                status_code=500,
                detail="Failed to upload cover image to Supabase Storage"
            )
        
        # Update cover_image_url in Supabase
        restaurant = restaurant_service.get_restaurant_by_id(restaurant_id)
        if not restaurant:
            # Try to get by user_id
            restaurant = restaurant_service.get_restaurant_by_user_id(user_id)
        
        if restaurant:
            updated = restaurant_service.update_restaurant_banner(
                restaurant.get('id'),
                user_id,
                cover_image_url
            )
            if not updated:
                print(f"⚠️ Failed to update cover_image_url in database, but image uploaded successfully")
        else:
            print(f"⚠️ Restaurant not found, but image uploaded successfully")
        
        print(f"✅ Cover image uploaded successfully: {cover_image_url}")
        
        return {
            "success": True,
            "restaurant_id": restaurant_id,
            "cover_image_url": cover_image_url,
            "plan": plan,
            "message": "Cover image uploaded successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Cover image upload error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/customization/cover-image/{restaurant_id}", summary="Delete Cover Image")
async def delete_cover_image(
    restaurant_id: str,
    user_id: str = Form("default")
):
    """
    ลบ Cover Image ของร้าน

    Plan Requirements:
    - Enterprise plan หรือ Admin role เท่านั้นที่ลบได้

    Args:
        restaurant_id: Restaurant ID
        user_id: User ID สำหรับตรวจสอบ plan

    Returns:
        Dictionary with deletion status
    """
    try:
        # Check user plan and role
        user_status = trial_limits_service.get_user_status(user_id)
        plan = user_status.get('subscription_plan', 'starter') if user_status.get('is_subscribed') else 'starter'
        role = user_status.get('role', 'free_trial')

        # Only Enterprise or Admin can delete cover image (check both plan and role)
        if plan not in ['enterprise'] and role not in ['enterprise', 'admin']:
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "Plan restriction",
                    "message": "Cover image deletion is only available in Enterprise plan.",
                    "current_plan": plan,
                    "current_role": role
                }
            )
        
        # TODO: Get cover_image_url from database
        # SELECT cover_image_url FROM restaurants WHERE id = restaurant_id
        
        # For now, return success (actual deletion will happen when database is integrated)
        return {
            "success": True,
            "restaurant_id": restaurant_id,
            "message": "Cover image deletion requested (database integration needed)"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# User Profile & Billing Routes
# ============================================================

@app.get("/api/user/profile", summary="Get User Profile")
async def get_user_profile(
    user_id: str,
    restaurant_id: Optional[str] = None
):
    """
    ดึงข้อมูล Profile ของ User และร้านอาหาร
    
    รวมข้อมูล:
    - ข้อมูลร้าน (ชื่อ, โลโก้, สีธีม, รูปปก)
    - Subscription จาก Stripe (Plan, สถานะ, วันหมดอายุ)
    
    Args:
        user_id: User ID
        restaurant_id: Restaurant ID (optional, ถ้าไม่ระบุจะดึงร้านแรกของ user)
        
    Returns:
        Dictionary with user profile and subscription data
    """
    try:
        # Validate user_id is a valid UUID
        import re
        is_valid_uuid = re.match(
            r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
            user_id,
            re.IGNORECASE
        )
        
        # Get restaurant data from Supabase
        restaurant = None
        if is_valid_uuid:
            if restaurant_id:
                restaurant = restaurant_service.get_restaurant_by_id(restaurant_id)
            else:
                # Get active restaurant first, or fallback to first restaurant
                all_restaurants = restaurant_service.get_all_restaurants_by_user_id(user_id)
                if all_restaurants:
                    # Find active restaurant
                    active = next((r for r in all_restaurants if r.get('is_active')), None)
                    restaurant = active or all_restaurants[0]
                else:
                    restaurant = None
            
            # If restaurant doesn't exist, create a default one
            if not restaurant:
                print(f"⚠️ No restaurant found for user {user_id}, creating default...")
                default_restaurant_data = {
                    "name": "My Restaurant",
                    "phone": "",
                    "email": "",
                    "address": ""
                }
                # Only add theme_color if column exists (will be handled in service)
                restaurant = restaurant_service.create_restaurant(user_id, default_restaurant_data)
        else:
            print(f"⚠️ Invalid UUID format for user_id: {user_id}, skipping restaurant lookup")
        
        # Prepare restaurant data response
        if restaurant:
            # Get service options (default all enabled)
            service_options = restaurant.get("service_options") or {
                "dine_in": True,
                "pickup": True,
                "delivery": True
            }

            restaurant_data = {
                "restaurant_id": restaurant.get("id"),
                "id": restaurant.get("id"),  # Add id for compatibility
                "slug": restaurant.get("slug"),  # ⭐ ADD SLUG HERE
                "name": restaurant.get("name", ""),
                "phone": restaurant.get("phone", ""),
                "email": restaurant.get("email", ""),
                "address": restaurant.get("address", ""),
                "logo_url": restaurant.get("logo_url"),
                "theme_color": restaurant.get("theme_color", "#000000"),
                "cover_image_url": restaurant.get("cover_image_url"),
                "menu_template": restaurant.get("menu_template", "grid"),
                "service_options": service_options,
                "primary_language": restaurant.get("primary_language", "th"),
                "delivery_rates": restaurant.get("delivery_rates") or []
            }
        else:
            # Fallback if creation failed
            restaurant_data = {
                "restaurant_id": None,
                "id": None,
                "slug": None,  # ⭐ ADD SLUG HERE
                "name": "",
                "phone": "",
                "email": "",
                "address": "",
                "logo_url": None,
                "theme_color": "#000000",
                "cover_image_url": None,
                "menu_template": "grid",
                "service_options": {"dine_in": True, "pickup": True, "delivery": True},
                "delivery_rates": []
            }
        
        # Get user role from Supabase
        user_role = user_role_service.get_user_role(user_id)
        
        # Map role to subscription plan
        role_to_plan = {
            'free_trial': 'trial',
            'starter': 'starter',
            'professional': 'pro',
            'enterprise': 'premium',
            'admin': 'premium'  # Admin gets premium features
        }
        
        plan_from_role = role_to_plan.get(user_role, 'trial')
        
        # Get subscription status
        user_status = trial_limits_service.get_user_status(user_id)
        
        # Determine if subscribed based on role (not trial)
        is_subscribed = user_role not in ['free_trial', None]
        
        # TODO: Get subscription from Stripe or database
        # For now, return based on user_role
        subscription_data = {
            "plan": plan_from_role,
            "role": user_role,  # Include role in response
            "status": "active" if is_subscribed else ("trial" if user_role == 'free_trial' else "expired"),
            "is_subscribed": is_subscribed,
            "trial_days_remaining": user_status.get('trial_days_remaining', 0) if user_role == 'free_trial' else 0,
            "current_period_end": None,  # TODO: Get from Stripe subscription
            "next_billing_date": None,  # TODO: Get from Stripe subscription
            "cancel_at_period_end": False  # TODO: Get from Stripe subscription
        }
        
        return {
            "success": True,
            "user_id": user_id,
            "restaurant": restaurant_data,
            "subscription": subscription_data
        }
        
    except Exception as e:
        print(f"❌ Get user profile error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/user/profile", summary="Update User Profile")
async def update_user_profile(request: UpdateProfileRequest):
    """
    อัปเดตข้อมูล Profile ของร้าน
    
    Plan Restrictions:
    - Starter: ไม่สามารถแก้ Theme Color ได้
    - Pro/Premium: แก้ได้ทั้งหมด
    
    Args:
        restaurant_id: Restaurant ID
        name: ชื่อร้าน (optional)
        phone: เบอร์โทร (optional)
        email: อีเมล (optional)
        address: ที่อยู่ (optional)
        theme_color: สีธีม (optional, ต้องเช็ค plan)
        user_id: User ID สำหรับตรวจสอบ plan
        
    Returns:
        Dictionary with updated profile data
    """
    try:
        # Check user plan
        user_status = trial_limits_service.get_user_status(request.user_id)
        plan = user_status.get('subscription_plan', 'starter') if user_status.get('is_subscribed') else 'starter'
        
        # Check theme color permission
        if request.theme_color and plan == 'starter':
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "Plan restriction",
                    "message": "Theme color customization is not available in Starter plan. Please upgrade to Pro or Premium plan.",
                    "current_plan": plan
                }
            )
        
        # Validate theme color if provided
        if request.theme_color:
            if not customization_service.validate_theme_color(request.theme_color):
                raise HTTPException(
                    status_code=400,
                    detail="Invalid theme color format. Please use hex color (e.g., '#FF5733' or 'FF5733')"
                )
            request.theme_color = customization_service.normalize_theme_color(request.theme_color)
        
        # Prepare update data (only include fields that are provided)
        update_data = {}
        if request.name is not None:
            update_data['name'] = request.name
        if request.phone is not None:
            update_data['phone'] = request.phone
        if request.email is not None:
            update_data['email'] = request.email
        if request.address is not None:
            update_data['address'] = request.address
        if request.theme_color is not None:
            update_data['theme_color'] = request.theme_color
        if request.menu_template is not None:
            # Validate menu_template
            valid_templates = ['list', 'grid', 'magazine', 'elegant', 'casual']
            if request.menu_template in valid_templates:
                update_data['menu_template'] = request.menu_template
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid menu template. Must be one of: {', '.join(valid_templates)}"
                )
        
        # Update in database using restaurant_service
        if not update_data:
            raise HTTPException(
                status_code=400,
                detail="No fields to update. Please provide at least one field to update."
            )
        
        updated_restaurant = restaurant_service.update_restaurant(
            request.restaurant_id,
            request.user_id,
            update_data
        )
        
        if not updated_restaurant:
            raise HTTPException(
                status_code=500,
                detail="Failed to update restaurant profile in database. Please check restaurant_id and try again."
            )
        
        print(f"📝 Profile updated successfully:")
        print(f"   Restaurant ID: {request.restaurant_id}")
        print(f"   Plan: {plan}")
        print(f"   Updated fields: {update_data}")
        
        return {
            "success": True,
            "restaurant_id": request.restaurant_id,
            "plan": plan,
            "updated_fields": update_data,
            "message": "Profile updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Update profile error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# Service Options API
# ============================================================

class DeliveryRateItem(BaseModel):
    id: str
    distance_km: float
    price: float

class DeliverySettingsItem(BaseModel):
    pricing_mode: str = 'per_km'  # 'tier' or 'per_km'
    price_per_km: float = 1.50
    base_fee: float = 3.00
    max_distance_km: float = 15
    free_delivery_above: float = 0  # 0 = no free delivery

class UpdateServiceOptionsRequest(BaseModel):
    restaurant_id: str
    user_id: str
    service_options: Dict[str, bool]  # {"dine_in": true, "pickup": false, "delivery": true}
    primary_language: Optional[str] = None  # 'th', 'en', 'zh', 'ja', 'ko', etc.
    delivery_rates: Optional[List[DeliveryRateItem]] = None  # [{"id": "uuid", "distance_km": 5, "price": 3.50}]
    delivery_settings: Optional[DeliverySettingsItem] = None  # Per-km pricing settings

@app.put("/api/restaurant/service-options", summary="Update Service Options")
async def update_service_options(request: UpdateServiceOptionsRequest):
    """
    อัปเดตตัวเลือกบริการ (Dine-in, Pickup, Delivery) และภาษาหลัก

    Args:
        restaurant_id: Restaurant ID
        user_id: User ID
        service_options: Object with service toggles
        primary_language: Primary language code (optional)

    Returns:
        Dictionary with updated service options
    """
    try:
        # Validate service_options
        valid_keys = {'dine_in', 'pickup', 'delivery'}
        for key in request.service_options:
            if key not in valid_keys:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid service option key: {key}. Valid keys: {valid_keys}"
                )

        # Validate primary_language if provided
        valid_languages = ['th', 'en', 'zh', 'ja', 'ko', 'vi', 'hi', 'es', 'fr', 'de', 'id', 'ms']
        if request.primary_language and request.primary_language not in valid_languages:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid primary_language: {request.primary_language}. Valid: {valid_languages}"
            )

        # Update in database
        update_data = {"service_options": request.service_options}
        if request.primary_language:
            update_data["primary_language"] = request.primary_language
        if request.delivery_rates is not None:
            # Convert to list of dicts for JSON storage
            update_data["delivery_rates"] = [rate.model_dump() for rate in request.delivery_rates]
        if request.delivery_settings is not None:
            # Save delivery settings (per-km pricing)
            update_data["delivery_settings"] = request.delivery_settings.model_dump()

        updated_restaurant = restaurant_service.update_restaurant(
            request.restaurant_id,
            request.user_id,
            update_data
        )

        if not updated_restaurant:
            raise HTTPException(
                status_code=500,
                detail="Failed to update service options"
            )

        delivery_rates_count = len(request.delivery_rates) if request.delivery_rates else 0
        print(f"✅ Service options updated for restaurant {request.restaurant_id}: {request.service_options}, language: {request.primary_language}, delivery_rates: {delivery_rates_count} tiers, delivery_settings: {request.delivery_settings}")

        return {
            "success": True,
            "restaurant_id": request.restaurant_id,
            "service_options": request.service_options,
            "primary_language": request.primary_language,
            "delivery_rates": [rate.model_dump() for rate in request.delivery_rates] if request.delivery_rates else [],
            "delivery_settings": request.delivery_settings.model_dump() if request.delivery_settings else None,
            "message": "Service options updated successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Update service options error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/billing/create-portal-session", summary="Create Stripe Customer Portal Session")
async def create_portal_session(request: CreatePortalSessionRequest):
    """
    สร้าง Stripe Customer Portal Session สำหรับจัดการการชำระเงิน
    
    Args:
        user_id: User ID
        customer_id: Stripe Customer ID
        return_url: URL สำหรับ redirect กลับมาหลังจากจัดการเสร็จ (optional)
        
    Returns:
        Dictionary with portal_url for redirect
    """
    try:
        # Set return URL
        if not request.return_url:
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
            request.return_url = f"{frontend_url}/dashboard/settings?tab=billing"
        
        # Create portal session
        result = stripe_service.create_customer_portal_session(
            customer_id=request.customer_id,
            return_url=request.return_url
        )
        
        return {
            "success": True,
            "portal_url": result['portal_url'],
            "message": "Portal session created successfully"
        }
        
    except Exception as e:
        print(f"❌ Create portal session error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# Run Server
# ============================================================

if __name__ == "__main__":
    import uvicorn
    
    print("=" * 60)
    print("🚀 Smart Menu AI API Starting...")
    print("=" * 60)
    print("✅ Translation: Enabled")
    print("✅ Image Analysis: Enabled")
    print("⚠️  Image Generation: Prompt creation only (Imagen API required)")
    print("=" * 60)
    print(f"📍 Docs: http://localhost:8000/docs")
    print(f"🔧 API: http://localhost:8000/api")
    print(f"💰 Pricing: http://localhost:8000/api/pricing")
    print("=" * 60)
    
# ============================================================
# User Role Management API
# ============================================================

class GetUserRoleRequest(BaseModel):
    user_id: str

class SetUserRoleRequest(BaseModel):
    user_id: str  # User to change
    role: str  # New role
    admin_user_id: str  # Admin making the change

class GetAllUsersRequest(BaseModel):
    admin_user_id: str

@app.get("/api/user/role")
async def get_user_role(user_id: str):
    """
    ดึง role ของ user
    
    Returns:
        Role string
    """
    try:
        role = user_role_service.get_user_role(user_id)
        return {
            "success": True,
            "user_id": user_id,
            "role": role
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/user/role")
async def set_user_role(request: SetUserRoleRequest):
    """
    ตั้งค่า role ของ user (admin only)
    
    Roles: free_trial, starter, professional, enterprise, admin
    """
    try:
        result = user_role_service.set_user_role(
            request.user_id,
            request.role,
            request.admin_user_id
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=403 if "admin" in result.get("error", "").lower() else 400,
                detail=result.get("error", "Failed to set user role")
            )
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/admin/users")
async def get_all_users(request: GetAllUsersRequest):
    """
    ดึงรายชื่อ users ทั้งหมด (admin only)
    """
    try:
        users = user_role_service.get_all_users(request.admin_user_id)
        return {
            "success": True,
            "users": users
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/user/role/limits")
async def get_role_limits(role: str):
    """
    ดึง limits ตาม role
    """
    try:
        limits = user_role_service.get_role_limits(role)
        return {
            "success": True,
            "role": role,
            "limits": limits
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/admin/setup-roles")
async def setup_user_roles_table(admin_user_id: str):
    """
    สร้างตาราง user_profiles ใน Supabase (admin only)
    ใช้สำหรับ setup ครั้งแรก
    """
    try:
        # Check if user is admin
        if not user_role_service.is_admin(admin_user_id):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        if not user_role_service.supabase_client:
            raise HTTPException(status_code=500, detail="Supabase client not available")
        
        # Try to create table using Supabase client
        # Note: Supabase Python client doesn't support DDL operations directly
        # This endpoint will verify table exists and create initial data if needed
        
        # Check if table exists by trying to query it
        try:
            result = user_role_service.supabase_client.table('user_profiles').select('*').limit(1).execute()
            return {
                "success": True,
                "message": "Table 'user_profiles' already exists",
                "table_exists": True
            }
        except Exception as e:
            # Table doesn't exist - need to create via SQL Editor
            return {
                "success": False,
                "message": "Table 'user_profiles' does not exist. Please run migration SQL in Supabase Dashboard.",
                "table_exists": False,
                "instructions": [
                    "1. Go to Supabase Dashboard > SQL Editor",
                    "2. Copy contents from: backend/migrations/add_user_roles.sql",
                    "3. Paste and run the SQL",
                    "4. Verify table exists in Table Editor"
                ]
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/check-table")
async def check_user_profiles_table(user_id: str):
    """
    ตรวจสอบว่าตาราง user_profiles มีอยู่หรือไม่
    """
    try:
        if not user_role_service.supabase_client:
            return {
                "success": False,
                "table_exists": False,
                "message": "Supabase client not available"
            }
        
        try:
            # Try to query the table
            result = user_role_service.supabase_client.table('user_profiles').select('*').limit(1).execute()
            return {
                "success": True,
                "table_exists": True,
                "message": "Table 'user_profiles' exists and is accessible"
            }
        except Exception as e:
            return {
                "success": False,
                "table_exists": False,
                "message": f"Table 'user_profiles' does not exist: {str(e)}",
                "action_required": "Run migration SQL in Supabase Dashboard > SQL Editor"
            }
    except Exception as e:
        return {
            "success": False,
            "table_exists": False,
            "message": str(e)
        }

# ============================================================
# Public Menu API (for customer-facing menu page)
# ============================================================

@app.get("/api/public/menu/{restaurant_id}", summary="Get Public Menu with Branding")
async def get_public_menu(restaurant_id: str):
    """
    ดึงเมนูสาธารณะพร้อมข้อมูล branding (logo, theme_color, cover_image)
    สำหรับหน้าเมนูลูกค้า
    
    Args:
        restaurant_id: Restaurant ID หรือ slug (ไม่รองรับ "default")
        
    Returns:
        Dictionary with menu items and restaurant branding
    """
    try:
        # Handle "default" case - return helpful error
        if restaurant_id == "default":
            raise HTTPException(
                status_code=400, 
                detail="Invalid restaurant_id: 'default' is not allowed for public menu. Please use a valid restaurant ID or slug."
            )
        
        # Get restaurant info (supports both UUID and slug)
        restaurant = restaurant_service.get_restaurant_by_id_or_slug(restaurant_id)
        
        if not restaurant:
            raise HTTPException(
                status_code=404, 
                detail=f"Restaurant not found: '{restaurant_id}'. Please check the restaurant ID or slug."
            )
        
        # Get menu items
        try:
            menu_items = menu_service.get_menu_items(restaurant.get("id"))
        except Exception as e:
            print(f"❌ Get public menu items error: {str(e)}")
            menu_items = []
        
        # Get restaurant owner's plan for branding restrictions
        owner_user_id = restaurant.get("user_id")
        owner_plan = "free_trial"  # Default
        if owner_user_id:
            owner_role = user_role_service.get_user_role(owner_user_id)
            owner_plan = owner_role or "free_trial"

        # Determine if "Powered by Smart Menu" should be hidden (Enterprise only)
        is_enterprise = owner_plan in ["enterprise", "admin"]

        # Get restaurant branding
        branding = {
            "logo_url": restaurant.get("logo_url"),
            "theme_color": restaurant.get("theme_color", "#000000"),
            "cover_image_url": restaurant.get("cover_image_url"),
            "name": restaurant.get("name"),
            "menu_template": restaurant.get("menu_template", "grid"),
            "hide_powered_by": is_enterprise,  # Only Enterprise can hide "Powered by Smart Menu"
        }

        # Get service options (default all enabled)
        service_options = restaurant.get("service_options") or {
            "dine_in": True,
            "pickup": True,
            "delivery": True
        }

        # Get delivery rates
        delivery_rates = restaurant.get("delivery_rates") or []

        return {
            "success": True,
            "restaurant": {
                "id": restaurant.get("id"),
                "name": restaurant.get("name"),
                "slug": restaurant.get("slug"),
                "description": restaurant.get("description"),
                "address": restaurant.get("address"),
                "phone": restaurant.get("phone"),
                "email": restaurant.get("email"),
            },
            "branding": branding,
            "service_options": service_options,
            "delivery_rates": delivery_rates,  # Delivery fee tiers
            "plan": owner_plan,  # For language restriction: enterprise = multi-language, others = English only
            "menu_items": menu_items,
            "count": len(menu_items)
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Get public menu error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# Orders API
# ============================================================

class CreateOrderRequest(BaseModel):
    restaurant_id: str
    items: List[Dict[str, Any]]
    table_no: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    special_instructions: Optional[str] = None
    tax: Optional[float] = 0
    delivery_fee: Optional[float] = 0  # Delivery fee for delivery orders
    subtotal: Optional[float] = 0  # Subtotal before fees
    service_type: Optional[str] = "dine_in"  # 'dine_in', 'pickup', 'delivery'
    customer_details: Optional[Dict[str, Any]] = None

@app.post("/api/orders", summary="Create New Order")
async def create_order(request: CreateOrderRequest):
    """
    สร้างออเดอร์ใหม่จากลูกค้า
    
    Args:
        restaurant_id: Restaurant ID หรือ slug
        items: List of menu items with quantities and options
        table_no: Table number (optional)
        customer_name: Customer name (optional)
        customer_phone: Customer phone (optional)
        special_instructions: Special instructions (optional)
        tax: Tax amount (optional, default: 0)
        
    Returns:
        Dictionary with created order
    """
    try:
        # Convert slug to UUID if needed
        restaurant = restaurant_service.get_restaurant_by_id_or_slug(request.restaurant_id)
        if not restaurant:
            raise HTTPException(status_code=404, detail=f"Restaurant not found: {request.restaurant_id}")
        
        actual_restaurant_id = restaurant.get("id")
        
        order_data = {
            "items": request.items,
            "table_no": request.table_no,
            "customer_name": request.customer_name,
            "customer_phone": request.customer_phone,
            "special_instructions": request.special_instructions,
            "tax": request.tax or 0,
            "delivery_fee": request.delivery_fee or 0,
            "subtotal": request.subtotal or 0,
            "service_type": request.service_type or "dine_in",
            "customer_details": request.customer_details or {},
        }
        
        order = orders_service.create_order(actual_restaurant_id, order_data)
        
        if not order:
            raise HTTPException(status_code=500, detail="Failed to create order")
        
        # Send order confirmation email if customer email is provided
        customer_email = request.customer_details.get('email') if request.customer_details else None
        if customer_email:
            try:
                # Use already fetched restaurant data
                restaurant_name = restaurant.get('name', 'Restaurant') if restaurant else 'Restaurant'
                
                email_service.send_order_confirmation(
                    to_email=customer_email,
                    order=order,
                    restaurant_name=restaurant_name
                )
                print(f"✅ Order confirmation email sent to {customer_email}")
            except Exception as e:
                # Don't fail order creation if email fails
                print(f"⚠️ Failed to send order confirmation email: {str(e)}")
        
        return {
            "success": True,
            "message": "Order created successfully",
            "order": order
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Create order error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/orders", summary="Get Orders")
async def get_orders(restaurant_id: str, status: Optional[str] = None):
    """
    ดึงออเดอร์ทั้งหมดของร้าน
    
    Args:
        restaurant_id: Restaurant ID
        status: Filter by status (optional: pending, preparing, ready, completed, cancelled)
        
    Returns:
        List of orders
    """
    try:
        orders = orders_service.get_orders(restaurant_id, status)
        
        return {
            "success": True,
            "count": len(orders),
            "orders": orders
        }
    except Exception as e:
        print(f"❌ Get orders error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class UpdateOrderStatusRequest(BaseModel):
    status: str

@app.put("/api/orders/{order_id}/status", summary="Update Order Status")
async def update_order_status(order_id: str, request: UpdateOrderStatusRequest):
    """
    อัปเดตสถานะออเดอร์
    
    Args:
        order_id: Order ID
        status: New status (pending, preparing, ready, completed, cancelled)
        
    Returns:
        Dictionary with updated order
    """
    try:
        order = orders_service.update_order_status(order_id, request.status)
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        return {
            "success": True,
            "message": f"Order status updated to {request.status}",
            "order": order
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Update order status error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# Service Requests API (Call Waiter, Request Sauce, etc.)
# ============================================================

class CreateServiceRequestRequest(BaseModel):
    restaurant_id: str
    table_no: str
    request_type: str  # 'call_waiter', 'request_sauce', 'request_water', 'request_bill', 'other'
    message: Optional[str] = None

@app.post("/api/service-requests", summary="Create Service Request")
async def create_service_request(request: CreateServiceRequestRequest):
    """
    สร้างคำขอบริการใหม่ (เรียกพนักงาน, ขอซอส, ขอน้ำ, ขอบิล, อื่นๆ)

    Args:
        restaurant_id: Restaurant ID
        table_no: Table number
        request_type: Type of request
        message: Additional message (optional)

    Returns:
        Dictionary with created service request
    """
    try:
        # Convert slug to UUID if needed
        restaurant = restaurant_service.get_restaurant_by_id_or_slug(request.restaurant_id)
        if not restaurant:
            raise HTTPException(status_code=404, detail=f"Restaurant not found: {request.restaurant_id}")

        actual_restaurant_id = restaurant.get("id")

        # Validate request type
        valid_types = ['call_waiter', 'request_sauce', 'request_water', 'request_bill', 'other']
        if request.request_type not in valid_types:
            raise HTTPException(status_code=400, detail=f"Invalid request_type. Must be one of: {valid_types}")

        # Create service request in Supabase
        service_request_data = {
            "restaurant_id": actual_restaurant_id,
            "table_no": request.table_no,
            "request_type": request.request_type,
            "message": request.message,
            "status": "pending"
        }

        result = supabase.table("service_requests").insert(service_request_data).execute()

        if result.data:
            return {
                "success": True,
                "message": "Service request created successfully",
                "service_request": result.data[0]
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to create service request")
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Create service request error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/service-requests", summary="Get Service Requests")
async def get_service_requests(restaurant_id: str, status: Optional[str] = None):
    """
    ดึงคำขอบริการทั้งหมดของร้าน

    Args:
        restaurant_id: Restaurant ID
        status: Filter by status (optional: pending, acknowledged, completed)

    Returns:
        List of service requests
    """
    try:
        # Convert slug to UUID if needed
        restaurant = restaurant_service.get_restaurant_by_id_or_slug(restaurant_id)
        if not restaurant:
            raise HTTPException(status_code=404, detail=f"Restaurant not found: {restaurant_id}")

        actual_restaurant_id = restaurant.get("id")

        # Build query
        query = supabase.table("service_requests") \
            .select("*") \
            .eq("restaurant_id", actual_restaurant_id) \
            .order("created_at", desc=True)

        if status:
            query = query.eq("status", status)

        result = query.execute()

        return {
            "success": True,
            "count": len(result.data) if result.data else 0,
            "service_requests": result.data or []
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Get service requests error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class UpdateServiceRequestStatusRequest(BaseModel):
    status: str  # 'pending', 'acknowledged', 'completed'
    acknowledged_by: Optional[str] = None  # Staff ID who acknowledged

@app.put("/api/service-requests/{request_id}/status", summary="Update Service Request Status")
async def update_service_request_status(request_id: str, request: UpdateServiceRequestStatusRequest):
    """
    อัปเดตสถานะคำขอบริการ

    Args:
        request_id: Service Request ID
        status: New status (pending, acknowledged, completed)
        acknowledged_by: Staff ID who acknowledged (optional)

    Returns:
        Dictionary with updated service request
    """
    try:
        valid_statuses = ['pending', 'acknowledged', 'completed']
        if request.status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

        update_data = {"status": request.status}

        # Add timestamps based on status
        from datetime import datetime
        if request.status == 'acknowledged':
            update_data["acknowledged_at"] = datetime.now().isoformat()
            if request.acknowledged_by:
                update_data["acknowledged_by"] = request.acknowledged_by
        elif request.status == 'completed':
            update_data["completed_at"] = datetime.now().isoformat()

        result = supabase.table("service_requests") \
            .update(update_data) \
            .eq("id", request_id) \
            .execute()

        if result.data:
            return {
                "success": True,
                "message": f"Service request status updated to {request.status}",
                "service_request": result.data[0]
            }
        else:
            raise HTTPException(status_code=404, detail="Service request not found")
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Update service request status error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# Best Sellers API
# ============================================================

@app.get("/api/best-sellers", summary="Get Best Selling Menu Items")
async def get_best_sellers(
    restaurant_id: str,
    days: int = 7,
    limit: int = 5
):
    """
    ดึงเมนูขายดีจากยอดขายย้อนหลัง N วัน

    Args:
        restaurant_id: Restaurant ID
        days: จำนวนวันย้อนหลัง (default: 7)
        limit: จำนวนเมนูที่ต้องการ (default: 5)

    Returns:
        List of best selling menu items with sales count
    """
    try:
        print(f"📊 GET /api/best-sellers: restaurant_id={restaurant_id}, days={days}, limit={limit}")
        best_sellers = best_sellers_service.get_best_sellers(restaurant_id, days, limit)
        print(f"📊 Best sellers result: {len(best_sellers)} items")

        return {
            "success": True,
            "count": len(best_sellers),
            "best_sellers": best_sellers,
            "period_days": days
        }
    except Exception as e:
        print(f"❌ Get best sellers error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/best-sellers/update", summary="Update Bestseller Flags for Restaurant")
async def update_bestseller_flags(restaurant_id: str, days: int = 14):
    """
    อัพเดท is_best_seller flag ตามยอดสั่งซื้อ

    - เมนูที่ถูก checkbox ไว้จะยังคงเป็น bestseller (pinned)
    - เมนูที่มียอดสั่งสูงสุด 5 อันดับแรกจะได้รับ flag เช่นกัน
    - ลำดับจะเรียงตามยอดสั่ง โดย pinned items มาก่อน

    Args:
        restaurant_id: Restaurant ID
        days: จำนวนวันย้อนหลัง (default: 14 = 2 สัปดาห์)

    Returns:
        Update results
    """
    try:
        result = best_sellers_service.update_bestseller_flags(restaurant_id, days=days)
        return result
    except Exception as e:
        print(f"❌ Update bestseller flags error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/best-sellers/update-all", summary="Update Bestseller Flags for All Restaurants")
async def update_all_bestseller_flags(days: int = 14, admin_key: str = None):
    """
    อัพเดท bestseller flags สำหรับทุกร้าน (สำหรับ cron job หรือ admin)

    ควรเรียกทุก 2 สัปดาห์เพื่ออัพเดท bestsellers อัตโนมัติ

    Args:
        days: จำนวนวันย้อนหลัง (default: 14)
        admin_key: Admin API key (optional, for security)

    Returns:
        Update results for all restaurants
    """
    try:
        # Optional: Add admin key verification here
        # if admin_key != os.getenv('ADMIN_API_KEY'):
        #     raise HTTPException(status_code=403, detail="Invalid admin key")

        result = best_sellers_service.update_all_restaurants_bestsellers(days=days)
        return result
    except Exception as e:
        print(f"❌ Update all bestseller flags error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# Customer Order Tracker API
# ============================================================

@app.get("/api/orders/{order_id}", summary="Get Single Order by ID")
async def get_order(order_id: str):
    """
    ดึงออเดอร์เดียว (สำหรับ Customer Order Tracker)
    
    Args:
        order_id: Order ID
        
    Returns:
        Dictionary with order details
    """
    try:
        order = orders_service.get_order(order_id)
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        return {
            "success": True,
            "order": order
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Get order error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# Analytics & Reports API
# ============================================================

@app.get("/api/analytics/revenue", summary="Get Revenue Statistics")
async def get_revenue_stats(
    restaurant_id: str,
    days: int = 30
):
    """
    ดึงสถิติรายได้ของร้าน
    
    Args:
        restaurant_id: Restaurant ID
        days: จำนวนวันย้อนหลัง (default: 30)
        
    Returns:
        Revenue statistics including daily breakdown
    """
    try:
        from datetime import datetime, timedelta
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        stats = analytics_service.get_revenue_stats(restaurant_id, start_date, end_date)
        return stats
    except Exception as e:
        print(f"❌ Get revenue stats error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/popular-items", summary="Get Popular Menu Items")
async def get_popular_items_analytics(
    restaurant_id: str,
    days: int = 30,
    limit: int = 10
):
    """
    ดึงเมนูยอดนิยม
    
    Args:
        restaurant_id: Restaurant ID
        days: จำนวนวันย้อนหลัง (default: 30)
        limit: จำนวนเมนูที่ต้องการ (default: 10)
        
    Returns:
        Popular items with order counts
    """
    try:
        result = analytics_service.get_popular_items(restaurant_id, days, limit)
        return result
    except Exception as e:
        print(f"❌ Get popular items error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/staff/create", summary="Create Staff Member")
async def create_staff(request: dict):
    """
    สร้างพนักงานใหม่
    
    Args:
        restaurant_id: Restaurant ID
        name: Staff name
        email: Staff email (optional)
        phone: Staff phone (optional)
        role: Staff role (owner, manager, chef, waiter, cashier)
        
    Returns:
        Created staff member
    """
    try:
        restaurant_id = request.get('restaurant_id')
        staff_data = {
            'name': request.get('name'),
            'email': request.get('email'),
            'phone': request.get('phone'),
            'role': request.get('role', 'waiter'),
            'pin_code': request.get('pin_code')  # FIX: Include PIN code
        }

        print(f"📝 Creating staff with PIN: {staff_data.get('pin_code')}")
        staff = staff_service.create_staff(restaurant_id, staff_data)
        
        if not staff:
            raise HTTPException(status_code=500, detail="Failed to create staff member")
        
        return {
            "success": True,
            "message": "Staff member created successfully",
            "staff": staff
        }
    except Exception as e:
        print(f"❌ Create staff error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/staff/list", summary="Get All Staff Members")
async def list_staff(restaurant_id: str):
    """
    ดึงรายชื่อพนักงานทั้งหมดของร้าน
    
    Args:
        restaurant_id: Restaurant ID
        
    Returns:
        List of staff members
    """
    try:
        staff_list = staff_service.get_staff_by_restaurant(restaurant_id)
        
        return {
            "success": True,
            "count": len(staff_list),
            "staff": staff_list
        }
    except Exception as e:
        print(f"❌ List staff error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/staff/{staff_id}", summary="Update Staff Member")
async def update_staff(staff_id: str, request: dict):
    """
    อัปเดตข้อมูลพนักงาน
    
    Args:
        staff_id: Staff ID
        request: Update data
        
    Returns:
        Updated staff member
    """
    try:
        staff = staff_service.update_staff(staff_id, request)
        
        if not staff:
            raise HTTPException(status_code=404, detail="Staff member not found")
        
        return {
            "success": True,
            "message": "Staff member updated successfully",
            "staff": staff
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Update staff error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/staff/{staff_id}", summary="Deactivate Staff Member")
async def deactivate_staff(staff_id: str):
    """
    ปิดการใช้งานพนักงาน (soft delete)
    
    Args:
        staff_id: Staff ID
        
    Returns:
        Success status
    """
    try:
        success = staff_service.deactivate_staff(staff_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Staff member not found")
        
        return {
            "success": True,
            "message": "Staff member deactivated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Deactivate staff error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/staff/verify-pin", summary="Verify Staff PIN Code")
async def verify_staff_pin(request: dict):
    """
    ตรวจสอบ PIN code สำหรับ POS login
    
    Args:
        restaurant_id: Restaurant ID
        pin_code: 6-digit PIN
        
    Returns:
        Staff member data if PIN is valid
    """
    try:
        restaurant_id = request.get('restaurant_id')
        pin_code = request.get('pin_code')
        
        if not pin_code or len(pin_code) != 6:
            raise HTTPException(status_code=400, detail="Invalid PIN code format")
        
        staff = staff_service.verify_pin(restaurant_id, pin_code)
        
        if not staff:
            raise HTTPException(status_code=401, detail="Invalid PIN code")
        
        # Log login activity
        staff_service.log_activity(
            staff['id'],
            restaurant_id,
            'staff_login',
            f"{staff['name']} logged in via PIN"
        )
        
        return {
            "success": True,
            "staff": staff
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Verify PIN error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/images/library", summary="Get All Images for User (Shared Library)")
async def get_image_library(user_id: str, limit: int = 100):
    """
    ดึงรูปภาพทั้งหมดของ user จากทุกร้าน (Shared Image Library)

    **Available for ALL PLANS**

    Args:
        user_id: User ID
        limit: จำนวนรูปสูงสุด (default: 100)

    Returns:
        List of images with metadata (restaurant name, menu name, etc.)
    """
    try:
        images = image_library_service.get_all_images_by_user(user_id, limit)
        
        return {
            "success": True,
            "count": len(images),
            "images": images
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Get image library error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/images/restaurant/{restaurant_id}", summary="Get Images by Restaurant - ALL PLANS")
async def get_restaurant_images(restaurant_id: str, user_id: str, limit: int = 50):
    """
    ดึงรูปภาพของร้านหนึ่งๆ (OWN RESTAURANT ONLY)
    
    **Available for ALL PLANS** - แต่เห็นเฉพาะรูปของร้านตัวเอง
    
    Args:
        restaurant_id: Restaurant ID
        user_id: User ID (for ownership verification)
        limit: จำนวนรูปสูงสุด
        
    Returns:
        List of images from this restaurant
    """
    try:
        # Verify that this restaurant belongs to the user
        restaurant = restaurant_service.get_restaurant_by_id(restaurant_id)
        
        if not restaurant:
            raise HTTPException(status_code=404, detail="Restaurant not found")
        
        # Check ownership
        if restaurant.get('user_id') != user_id:
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to access this restaurant's images"
            )
        
        images = image_library_service.get_images_by_restaurant(restaurant_id, limit)
        
        return {
            "success": True,
            "count": len(images),
            "restaurant_id": restaurant_id,
            "restaurant_name": restaurant.get('name'),
            "images": images
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Get restaurant images error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/images/search", summary="Search Images by Menu Name - ENTERPRISE ONLY")
async def search_images(user_id: str, q: str, limit: int = 50):
    """
    ค้นหารูปภาพตามชื่อเมนู
    
    **ENTERPRISE ONLY FEATURE**
    
    Args:
        user_id: User ID
        q: คำค้นหา (menu name)
        limit: จำนวนรูปสูงสุด
        
    Returns:
        List of matching images
    """
    try:
        # Check if user has Enterprise plan
        trial_status = trial_limits_service.get_trial_status(user_id)
        user_plan = trial_status.get('plan', 'free_trial')
        
        if user_plan != 'enterprise':
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "Image Library is an Enterprise-only feature",
                    "message": "Upgrade to Enterprise to search across all your restaurant images",
                    "current_plan": user_plan,
                    "required_plan": "enterprise"
                }
            )
        
        images = image_library_service.search_images(user_id, q, limit)
        
        return {
            "success": True,
            "count": len(images),
            "query": q,
            "images": images
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Search images error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/images/recent", summary="Get Recent Image Uploads")
async def get_recent_images(user_id: str, days: int = 7, limit: int = 20):
    """
    ดึงรูปที่อัปโหลดล่าสุด

    **Available for ALL PLANS**

    Args:
        user_id: User ID
        days: จำนวนวันย้อนหลัง (default: 7)
        limit: จำนวนรูปสูงสุด (default: 20)

    Returns:
        List of recent images
    """
    try:
        images = image_library_service.get_recent_uploads(user_id, days, limit)
        
        return {
            "success": True,
            "count": len(images),
            "period": f"Last {days} days",
            "images": images
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Get recent images error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/restaurants", summary="Get All Restaurants for User")
async def list_user_restaurants(user_id: str):
    """
    ดึงร้านอาหารทั้งหมดของ user (Multi-restaurant support)
    
    Args:
        user_id: User ID
        
    Returns:
        List of restaurants owned by user
    """
    try:
        restaurants = restaurant_service.get_all_restaurants_by_user_id(user_id)
        
        return {
            "success": True,
            "count": len(restaurants),
            "restaurants": restaurants
        }
    except Exception as e:
        print(f"❌ List restaurants error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/restaurant", summary="Create New Restaurant")
async def create_restaurant(request: Dict[str, Any]):
    """
    สร้างร้านอาหารใหม่
    
    Args:
        user_id: User ID
        name: Restaurant name (required)
        description: Description (optional)
        address: Address (optional)
        phone: Phone (optional)
        email: Email (optional)
        
    Returns:
        Created restaurant data
    """
    try:
        user_id = request.get("user_id")
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id is required")
        
        restaurant_data = {
            "name": request.get("name"),
            "description": request.get("description"),
            "address": request.get("address"),
            "phone": request.get("phone"),
            "email": request.get("email"),
        }
        
        if not restaurant_data["name"]:
            raise HTTPException(status_code=400, detail="name is required")
        
        restaurant = restaurant_service.create_restaurant(user_id, restaurant_data)
        
        if restaurant:
            return {
                "success": True,
                "restaurant": restaurant
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to create restaurant")
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Create restaurant error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/restaurant/{restaurant_id}", summary="Update Restaurant")
async def update_restaurant(restaurant_id: str, request: Dict[str, Any]):
    """
    อัปเดตข้อมูลร้านอาหาร
    
    Args:
        restaurant_id: Restaurant ID
        user_id: User ID (for verification)
        name, description, address, phone, email: Fields to update
        
    Returns:
        Updated restaurant data
    """
    try:
        user_id = request.get("user_id")
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id is required")
        
        update_data = {
            "name": request.get("name"),
            "description": request.get("description"),
            "address": request.get("address"),
            "phone": request.get("phone"),
            "email": request.get("email"),
        }
        
        # Remove None values
        update_data = {k: v for k, v in update_data.items() if v is not None}
        
        restaurant = restaurant_service.update_restaurant(restaurant_id, user_id, update_data)
        
        if restaurant:
            return {
                "success": True,
                "restaurant": restaurant
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to update restaurant")
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Update restaurant error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/restaurant/{restaurant_id}", summary="Delete Restaurant")
async def delete_restaurant(restaurant_id: str, user_id: str):
    """
    ลบร้านอาหาร (CASCADE: จะลบ menus, orders ทั้งหมดด้วย)
    
    Args:
        restaurant_id: Restaurant ID
        user_id: User ID (for verification)
        
    Returns:
        Success status
    """
    try:
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id is required")
        
        # Verify ownership before delete
        restaurant = restaurant_service.get_restaurant_by_id(restaurant_id)
        if not restaurant:
            raise HTTPException(status_code=404, detail="Restaurant not found")
        
        if restaurant.get('user_id') != user_id:
            raise HTTPException(status_code=403, detail="You don't have permission to delete this restaurant")
        
        # Delete (CASCADE will handle menus, orders, etc.)
        success = restaurant_service.delete_restaurant(restaurant_id, user_id)
        
        if success:
            return {
                "success": True,
                "message": "Restaurant deleted successfully"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to delete restaurant")
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Delete restaurant error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/user/set-restaurant", summary="Set Active Restaurant")
async def set_active_restaurant(request: Dict[str, Any]):
    """
    เปลี่ยนร้านที่กำลัง active (สำหรับ multi-restaurant)
    
    Args:
        user_id: User ID
        restaurant_id: Restaurant ID to set as active
        
    Returns:
        Success status
    """
    try:
        user_id = request.get("user_id")
        restaurant_id = request.get("restaurant_id")
        
        if not user_id or not restaurant_id:
            raise HTTPException(status_code=400, detail="user_id and restaurant_id are required")
        
        # Verify ownership
        restaurant = restaurant_service.get_restaurant_by_id(restaurant_id)
        if not restaurant:
            raise HTTPException(status_code=404, detail="Restaurant not found")
        
        if restaurant.get('user_id') != user_id:
            raise HTTPException(status_code=403, detail="You don't have permission to access this restaurant")
        
        # Update active restaurant in database
        # Set all restaurants to inactive first
        all_restaurants = restaurant_service.get_all_restaurants_by_user_id(user_id)
        for rest in all_restaurants:
            if rest.get('id') != restaurant_id:
                # Set others to inactive
                restaurant_service.update_restaurant(rest.get('id'), user_id, {'is_active': False})
        
        # Set selected restaurant as active
        restaurant_service.update_restaurant(restaurant_id, user_id, {'is_active': True})
        
        return {
            "success": True,
            "message": "Active restaurant changed",
            "restaurant_id": restaurant_id,
            "restaurant": restaurant
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Set active restaurant error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/trends", summary="Get Order Trends")
async def get_order_trends(
    restaurant_id: str,
    days: int = 30
):
    """
    ดึง order trends (hourly/daily distribution, peak times)
    
    Args:
        restaurant_id: Restaurant ID
        days: จำนวนวันย้อนหลัง (default: 30)
        
    Returns:
        Order trends and peak times
    """
    try:
        result = analytics_service.get_order_trends(restaurant_id, days)
        return result
    except Exception as e:
        print(f"❌ Get order trends error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# IMAGE LIBRARY ENDPOINTS
# ============================================================================
# Note: /api/best-sellers endpoint is defined earlier in this file (around line 2804)
# Note: Image library endpoints (/api/images/*) are defined earlier in this file (around line 2401)

@app.post("/api/menus/copy-to-restaurant", summary="Copy Menu to Another Restaurant")
async def copy_menu_to_restaurant(request: Dict[str, Any]):
    """
    คัดลอกเมนูไปยังร้านอื่น (Enterprise feature)
    
    Args:
        user_id: User ID
        menu_id: Menu ID to copy
        target_restaurant_id: Target restaurant ID
        
    Returns:
        New menu item
    """
    try:
        user_id = request.get("user_id")
        menu_id = request.get("menu_id")
        target_restaurant_id = request.get("target_restaurant_id")
        
        if not all([user_id, menu_id, target_restaurant_id]):
            raise HTTPException(
                status_code=400,
                detail="user_id, menu_id, and target_restaurant_id are required"
            )
        
        # Verify user has Enterprise/Premium plan
        user_profile = user_role_service.get_user_profile(user_id)
        role = user_profile.get('role', 'free_trial')
        
        if role not in ['enterprise', 'premium', 'admin']:
            raise HTTPException(
                status_code=403,
                detail="This feature is only available for Enterprise/Premium users"
            )
        
        # Verify source menu exists and belongs to user
        source_menu = menu_service.get_menu_item(menu_id)
        if not source_menu:
            raise HTTPException(status_code=404, detail="Source menu not found")
        
        # Verify target restaurant belongs to user
        target_restaurant = restaurant_service.get_restaurant_by_id(target_restaurant_id)
        if not target_restaurant or target_restaurant.get('user_id') != user_id:
            raise HTTPException(
                status_code=403,
                detail="Target restaurant not found or you don't have permission"
            )
        
        # Copy menu item (with all translations including meats/addOns)
        new_menu_data = {
            'name': source_menu.get('name'),
            'nameEn': source_menu.get('nameEn') or source_menu.get('name_english'),
            'description': source_menu.get('description'),
            'descriptionEn': source_menu.get('descriptionEn') or source_menu.get('description_english'),
            'price': source_menu.get('price'),
            'category': source_menu.get('category'),
            'categoryEn': source_menu.get('categoryEn') or source_menu.get('category_english'),
            'image_url': source_menu.get('image_url') or source_menu.get('photo_url'),
            'is_best_seller': source_menu.get('is_best_seller', False),
            'meats': source_menu.get('meats', []),
            'addOns': source_menu.get('addOns', []),
            'restaurant_id': target_restaurant_id
        }
        
        new_menu = menu_service.create_menu_item(target_restaurant_id, new_menu_data)
        
        return {
            "success": True,
            "message": "Menu copied successfully",
            "menu": new_menu
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Copy menu error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# Delivery Distance Calculation API (Google Maps)
# ============================================================

class DeliveryCalculationRequest(BaseModel):
    restaurant_id: str
    customer_address: str

class UpdateRestaurantLocationRequest(BaseModel):
    restaurant_id: str
    address: Optional[str] = None  # Address to geocode
    latitude: Optional[float] = None  # Or provide coordinates directly
    longitude: Optional[float] = None

@app.post("/api/delivery/calculate")
async def calculate_delivery_fee(request: DeliveryCalculationRequest):
    """
    Calculate delivery fee based on customer address and restaurant location

    1. Gets restaurant location (lat/lng) from database
    2. Geocodes customer address using Nominatim
    3. Calculates distance using Haversine formula
    4. Returns delivery fee based on restaurant's delivery settings (per-km or tier-based)
    """
    try:
        # Get restaurant details
        restaurant = restaurant_service.get_restaurant_by_id(request.restaurant_id)
        if not restaurant:
            raise HTTPException(status_code=404, detail="Restaurant not found")

        # Check if restaurant has coordinates
        restaurant_lat = restaurant.get("latitude")
        restaurant_lng = restaurant.get("longitude")

        if not restaurant_lat or not restaurant_lng:
            raise HTTPException(
                status_code=400,
                detail="Restaurant location not configured. Please set restaurant coordinates in settings."
            )

        # Get delivery settings and rates
        delivery_settings = restaurant.get("delivery_settings") or {}
        delivery_rates = restaurant.get("delivery_rates") or []
        pricing_mode = delivery_settings.get("pricing_mode", "per_km")

        # Default settings
        base_fee = delivery_settings.get("base_fee", 3.00)
        price_per_km = delivery_settings.get("price_per_km", 1.50)
        max_distance_km = delivery_settings.get("max_distance_km", 15)
        free_delivery_above = delivery_settings.get("free_delivery_above", 0)

        # Geocode customer address
        customer_location = await delivery_service.geocode_address(request.customer_address)
        if not customer_location:
            return {
                "success": False,
                "error": "Could not find the address. Please check and try again."
            }

        # Calculate distance
        distance_km = delivery_service.haversine_distance(
            float(restaurant_lat), float(restaurant_lng),
            customer_location["lat"], customer_location["lng"]
        )

        # Apply road distance factor (roads are typically 1.3x longer than straight line)
        distance_km = delivery_service.estimate_road_distance(distance_km)
        duration_minutes = delivery_service.estimate_duration(distance_km)

        # Check if within range
        if pricing_mode == "per_km":
            max_dist = max_distance_km
        else:
            # For tier-based, get max from delivery rates
            max_dist = max(rate.get("distance_km", 0) for rate in delivery_rates) if delivery_rates else 15

        if distance_km > max_dist:
            return {
                "success": True,
                "is_within_range": False,
                "distance_km": round(distance_km, 1),
                "distance_text": f"{round(distance_km, 1)} km",
                "max_distance_km": max_dist,
                "message": f"Sorry, we only deliver within {max_dist} km",
                "formatted_address": customer_location.get("formatted_address")
            }

        # Calculate delivery fee
        if pricing_mode == "per_km":
            # Per-km pricing: base_fee + (distance * price_per_km)
            delivery_fee = base_fee + (distance_km * price_per_km)
            delivery_fee = round(delivery_fee, 2)
        else:
            # Tier-based pricing
            delivery_fee = 0
            for rate in sorted(delivery_rates, key=lambda x: x.get("distance_km", 0)):
                if distance_km <= rate.get("distance_km", 0):
                    delivery_fee = rate.get("price", 0)
                    break
            if delivery_fee == 0 and delivery_rates:
                # Use highest tier if beyond all tiers
                delivery_fee = max(rate.get("price", 0) for rate in delivery_rates)

        return {
            "success": True,
            "is_within_range": True,
            "customer_location": {
                "lat": customer_location["lat"],
                "lng": customer_location["lng"],
                "formatted_address": customer_location.get("formatted_address")
            },
            "distance_km": round(distance_km, 1),
            "distance_text": f"{round(distance_km, 1)} km",
            "duration_minutes": duration_minutes,
            "duration_text": f"{duration_minutes} mins",
            "delivery_fee": delivery_fee,
            "pricing_mode": pricing_mode,
            "free_delivery_above": free_delivery_above,
            "formatted_address": customer_location.get("formatted_address"),
            "message": f"Delivery fee calculated"
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Delivery calculation error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/delivery/geocode")
async def geocode_address(address: str = Form(...)):
    """
    Geocode an address to get coordinates using Google Maps API
    """
    try:
        result = await delivery_service.geocode_address(address)

        if result:
            return {
                "success": True,
                "location": result
            }
        else:
            return {
                "success": False,
                "error": "Could not geocode the address. Please try a different address."
            }

    except Exception as e:
        print(f"❌ Geocode error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/restaurant/update-location")
async def update_restaurant_location(request: UpdateRestaurantLocationRequest):
    """
    Update restaurant location (coordinates)
    Can provide either an address to geocode or direct lat/lng coordinates
    """
    try:
        lat = request.latitude
        lng = request.longitude

        # If address provided, geocode it
        if request.address and (not lat or not lng):
            geocode_result = await delivery_service.geocode_address(request.address)
            if geocode_result:
                lat = geocode_result["lat"]
                lng = geocode_result["lng"]
            else:
                raise HTTPException(
                    status_code=400,
                    detail="Could not geocode the address. Please try a different address or provide coordinates directly."
                )

        if not lat or not lng:
            raise HTTPException(
                status_code=400,
                detail="Please provide either an address or latitude/longitude coordinates"
            )

        # Update restaurant in database
        from supabase import create_client
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
        supabase = create_client(supabase_url, supabase_key)

        result = supabase.table("restaurants").update({
            "latitude": lat,
            "longitude": lng
        }).eq("id", request.restaurant_id).execute()

        if result.data:
            return {
                "success": True,
                "message": "Restaurant location updated successfully",
                "location": {
                    "latitude": lat,
                    "longitude": lng
                }
            }
        else:
            raise HTTPException(status_code=404, detail="Restaurant not found")

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Update location error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/restaurant/{restaurant_id}/location")
async def get_restaurant_location(restaurant_id: str):
    """
    Get restaurant location (coordinates)
    """
    try:
        restaurant = restaurant_service.get_restaurant_by_id(restaurant_id)
        if not restaurant:
            raise HTTPException(status_code=404, detail="Restaurant not found")

        return {
            "success": True,
            "location": {
                "latitude": restaurant.get("latitude"),
                "longitude": restaurant.get("longitude"),
                "address": restaurant.get("address")
            },
            "has_location": bool(restaurant.get("latitude") and restaurant.get("longitude"))
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Get location error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main_ai:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

