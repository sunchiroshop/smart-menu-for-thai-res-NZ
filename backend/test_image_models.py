"""
Test Image Generation Models - หา Model ที่ Gen รูปได้จริงและไม่ติด Quota
"""
import os
from dotenv import load_dotenv
import pathlib
import base64

# Load environment variables
env_path = pathlib.Path(__file__).parent.parent / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=str(env_path))
else:
    load_dotenv()

GOOGLE_API_KEY = os.getenv('GEMINI_API_KEY') or os.getenv('GOOGLE_API_KEY')
if not GOOGLE_API_KEY:
    print("❌ ERROR: GOOGLE_API_KEY not found!")
    exit(1)

print(f"✅ API Key found: {GOOGLE_API_KEY[:10]}...")
print("")

import google.genai as genai

# Initialize client
client = genai.Client(api_key=GOOGLE_API_KEY)

print("🔍 Testing Image Generation Models...")
print("=" * 80)
print("")

# Models to test
test_models = [
    "imagen-4.0-fast-generate-001",      # น่าจะเร็วและ Quota เยอะสุด
    "imagen-3.0-generate-001",           # ตัวมาตรฐาน
    "gemini-2.0-flash-exp",              # ลองบังคับเรียกผ่าน generate_image
    "gemini-2.5-flash-image-preview",    # Nano Banana ตัวเล็ก
]

test_prompt = "A professional food photography of a cookie on a white plate, restaurant quality, appetizing"

winner_found = False

for model_name in test_models:
    print(f"📡 Testing: {model_name}")
    print("-" * 80)
    
    try:
        # Method 1: Try generate_image() if available
        if hasattr(client.models, 'generate_image'):
            print(f"  Trying client.models.generate_image()...")
            try:
                response = client.models.generate_image(
                    model=model_name,
                    prompt=test_prompt
                )
                print(f"  ✅ Response received via generate_image()!")
                print(f"     Type: {type(response)}")
                
                # Check for image data
                if hasattr(response, 'images') and response.images:
                    print(f"  🎉 SUCCESS! Found {len(response.images)} image(s)!")
                    winner_found = True
                    print(f"\n{'='*80}")
                    print(f"✅ WINNER: {model_name}")
                    print(f"{'='*80}")
                    break
            except AttributeError:
                print(f"  ⚠️  generate_image() method not available")
        
        # Method 2: Try generate_content() (standard method)
        print(f"  Trying client.models.generate_content()...")
        response = client.models.generate_content(
            model=model_name,
            contents=test_prompt
        )
        
        print(f"  ✅ Response received!")
        print(f"     Type: {type(response)}")
        
        # Extract image from response
        image_found = False
        image_data = None
        
        # Check response structure
        if hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
            if hasattr(candidate, 'content') and candidate.content:
                if hasattr(candidate.content, 'parts') and candidate.content.parts:
                    for part in candidate.content.parts:
                        # Check for inline_data (image data)
                        if hasattr(part, 'inline_data') and part.inline_data:
                            if hasattr(part.inline_data, 'data'):
                                image_data = part.inline_data.data
                                image_found = True
                                print(f"  ✅ Found image in inline_data.data!")
                                break
                        # Check for image_bytes
                        elif hasattr(part, 'image_bytes'):
                            image_data = part.image_bytes
                            image_found = True
                            print(f"  ✅ Found image in image_bytes!")
                            break
                        # Check for base64_data
                        elif hasattr(part, 'base64_data'):
                            image_data = part.base64_data
                            image_found = True
                            print(f"  ✅ Found image in base64_data!")
                            break
        
        # Check response directly
        if not image_found:
            if hasattr(response, 'images') and response.images:
                if len(response.images) > 0:
                    image_data = response.images[0]
                    image_found = True
                    print(f"  ✅ Found image in response.images!")
            elif hasattr(response, 'image_base64'):
                image_data = response.image_base64
                image_found = True
                print(f"  ✅ Found image in response.image_base64!")
            elif hasattr(response, 'data'):
                image_data = response.data
                image_found = True
                print(f"  ✅ Found image in response.data!")
        
        if image_found and image_data:
            # Save image to verify
            if isinstance(image_data, bytes):
                image_bytes = image_data
            elif isinstance(image_data, str):
                # If it's base64 string, decode it
                if ',' in image_data:
                    image_data = image_data.split(',')[1]
                image_bytes = base64.b64decode(image_data)
            else:
                print(f"  ⚠️  Unknown image_data type: {type(image_data)}")
                image_bytes = None
            
            if image_bytes:
                filename = f"test_{model_name.replace('-', '_').replace('/', '_')}.png"
                with open(filename, "wb") as f:
                    f.write(image_bytes)
                print(f"  ✅ Image saved to: {filename}")
                print(f"     File size: {len(image_bytes)} bytes")
                
                winner_found = True
                print(f"\n{'='*80}")
                print(f"✅ WINNER: {model_name}")
                print(f"{'='*80}")
                break
            else:
                print(f"  ⚠️  Image data found but couldn't decode")
        else:
            # Check if it's text response
            if hasattr(response, 'text'):
                text_preview = response.text[:100] if response.text else ""
                print(f"  ⚠️  No image found. Response is text: {text_preview}...")
            else:
                print(f"  ⚠️  No image found in response")
                print(f"     Response attributes: {[attr for attr in dir(response) if not attr.startswith('_') and 'image' in attr.lower()]}")
        
    except Exception as e:
        error_str = str(e)
        error_code = None
        
        # Extract error code
        if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str or "quota" in error_str.lower():
            error_code = 429
            print(f"  ⚠️  Quota Limit: {model_name}")
            print(f"     Error: {error_str[:200]}")
        elif "404" in error_str or "NOT_FOUND" in error_str:
            error_code = 404
            print(f"  ❌ Model Not Found: {model_name}")
            print(f"     Error: {error_str[:200]}")
        else:
            print(f"  ❌ Error: {error_str[:200]}")
    
    print("")

if not winner_found:
    print("=" * 80)
    print("⚠️  No working model found!")
    print("=" * 80)
    print("\n💡 Suggestions:")
    print("   1. Check your API quota at: https://ai.dev/usage?tab=rate-limit")
    print("   2. Wait for quota reset (usually daily)")
    print("   3. Upgrade your Google AI plan if needed")
    print("   4. Try again later")

print("\n✅ Test completed!")

