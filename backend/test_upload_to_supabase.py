"""
Test Upload Image to Supabase Storage
สร้างรูปภาพทดสอบแล้วอัปโหลดไป Supabase เพื่อทดสอบว่า upload ทำงานได้หรือไม่
"""
import os
import sys
import base64
import io
from dotenv import load_dotenv
import pathlib
import requests
from PIL import Image, ImageDraw, ImageFont
from datetime import datetime

# Load environment variables
env_path = pathlib.Path(__file__).parent.parent / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=str(env_path))
else:
    load_dotenv()

# Backend URL
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:8000')

def create_test_image(text: str = "Test Image") -> str:
    """
    สร้างรูปภาพทดสอบและแปลงเป็น base64
    
    Args:
        text: ข้อความที่จะแสดงบนรูปภาพ
        
    Returns:
        Base64 encoded image string
    """
    # สร้างรูปภาพ 800x600 พื้นหลังสีขาว
    img = Image.new('RGB', (800, 600), color='white')
    draw = ImageDraw.Draw(img)
    
    # วาดสี่เหลี่ยมสี
    draw.rectangle([50, 50, 750, 550], fill='#FF6B6B', outline='#333333', width=5)
    
    # วาดวงกลม
    draw.ellipse([200, 150, 600, 450], fill='#4ECDC4', outline='#333333', width=5)
    
    # พยายามใช้ฟอนต์ (ถ้ามี)
    try:
        # ลองใช้ฟอนต์มาตรฐาน
        font = ImageFont.truetype("arial.ttf", 60)
    except:
        try:
            font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 60)
        except:
            # ถ้าไม่มีฟอนต์ ใช้ default
            font = ImageFont.load_default()
    
    # วาดข้อความ
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    text_x = (800 - text_width) // 2
    text_y = (600 - text_height) // 2
    
    # วาดเงา
    draw.text((text_x + 3, text_y + 3), text, font=font, fill='#000000')
    # วาดข้อความจริง
    draw.text((text_x, text_y), text, font=font, fill='#FFFFFF')
    
    # วาดวันที่และเวลา
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    try:
        small_font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 30)
    except:
        small_font = ImageFont.load_default()
    
    draw.text((400, 500), timestamp, font=small_font, fill='#333333', anchor='mm')
    
    # แปลงเป็น base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    image_bytes = buffer.getvalue()
    image_base64 = base64.b64encode(image_bytes).decode('utf-8')
    
    return image_base64

def upload_to_supabase(image_base64: str, folder: str = "generated", bucket_name: str = "menu-images"):
    """
    อัปโหลดรูปภาพไปยัง Supabase Storage ผ่าน API
    
    Args:
        image_base64: Base64 encoded image
        folder: Folder name in Supabase Storage
        bucket_name: Bucket name
        
    Returns:
        Dictionary with upload result
    """
    try:
        url = f"{BACKEND_URL}/api/ai/upload-image"
        
        payload = {
            "image_base64": image_base64,
            "folder": folder,
            "bucket_name": bucket_name
        }
        
        print(f"📤 Uploading test image to Supabase Storage...")
        print(f"   Backend URL: {BACKEND_URL}")
        print(f"   Folder: {folder}")
        print(f"   Bucket: {bucket_name}")
        print(f"   Image size: {len(image_base64)} chars ({len(image_base64) * 3 // 4} bytes)")
        
        response = requests.post(url, json=payload, timeout=60)
        
        print(f"\n📥 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Upload successful!")
            print(f"   Success: {result.get('success')}")
            print(f"   Public URL: {result.get('public_url')}")
            print(f"   Filename: {result.get('filename')}")
            print(f"   Folder: {result.get('folder')}")
            print(f"   Bucket: {result.get('bucket_name')}")
            print(f"\n🎉 Test PASSED! Image uploaded successfully!")
            print(f"\n📋 Copy this URL to test in browser:")
            print(f"   {result.get('public_url')}")
            return result
        else:
            print(f"❌ Upload failed!")
            print(f"   Status Code: {response.status_code}")
            print(f"   Response: {response.text}")
            try:
                error_data = response.json()
                print(f"   Error Detail: {error_data}")
            except:
                pass
            return None
            
    except requests.exceptions.ConnectionError:
        print(f"❌ Connection Error: Cannot connect to backend at {BACKEND_URL}")
        print(f"   Make sure the backend server is running!")
        print(f"   Run: cd backend && ..\\.venv\\Scripts\\python.exe -m uvicorn main_ai:app --host 0.0.0.0 --port 8000")
        return None
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def test_direct_upload():
    """
    ทดสอบ upload โดยตรงผ่าน ai_image_service
    """
    try:
        print("\n" + "=" * 80)
        print("🧪 Testing Direct Upload (via ai_service)")
        print("=" * 80)
        
        from services.ai_service import ai_service
        
        # สร้างรูปทดสอบ
        print("\n1️⃣ Creating test image...")
        image_base64 = create_test_image("Direct Upload Test")
        print(f"   ✅ Test image created ({len(image_base64)} chars)")
        
        # Upload โดยตรง
        print("\n2️⃣ Uploading to Supabase Storage...")
        public_url = ai_service.upload_image_to_supabase(
            image_base64=image_base64,
            bucket_name="menu-images",
            folder="test"
        )
        
        if public_url:
            print(f"\n✅ Direct Upload successful!")
            print(f"   Public URL: {public_url}")
            return public_url
        else:
            print(f"\n❌ Direct Upload failed!")
            return None
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    print("=" * 80)
    print("🧪 Test Upload Image to Supabase Storage")
    print("=" * 80)
    print("")
    
    # Test 1: Upload via API endpoint
    print("Test 1: Upload via API Endpoint")
    print("-" * 80)
    
    # สร้างรูปทดสอบ
    print("\n📸 Creating test image...")
    image_base64 = create_test_image("Supabase Upload Test")
    print(f"   ✅ Test image created")
    
    # Upload ไป Supabase
    result = upload_to_supabase(image_base64, folder="test", bucket_name="menu-images")
    
    if result:
        print("\n" + "=" * 80)
        print("✅ Test 1 PASSED!")
        print("=" * 80)
    else:
        print("\n" + "=" * 80)
        print("❌ Test 1 FAILED!")
        print("=" * 80)
        print("\n💡 Trying direct upload method...")
        
        # Test 2: Direct upload
        print("\nTest 2: Direct Upload (via ai_service)")
        print("-" * 80)
        direct_result = test_direct_upload()
        
        if direct_result:
            print("\n" + "=" * 80)
            print("✅ Test 2 PASSED!")
            print("=" * 80)
        else:
            print("\n" + "=" * 80)
            print("❌ Test 2 FAILED!")
            print("=" * 80)
    
    print("\n✅ Test completed!")

