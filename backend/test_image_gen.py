"""
Test Image Generation - ตรวจสอบว่า model ไหนใช้ได้จริง
"""
import os
from dotenv import load_dotenv
import pathlib

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
print("=" * 60)

# Test models ที่น่าจะใช้ได้
test_models = [
    "gemini-3-pro-image-preview",
    "imagen-4.0-generate-001",
    "imagen-3.0-generate-001",
    "gemini-2.0-flash-exp",
    "gemini-1.5-pro",
]

test_prompt = "A professional food photography of Pad Thai on a white plate, restaurant quality, appetizing"

for model_name in test_models:
    print(f"\n📡 Testing model: {model_name}")
    try:
        # Try to generate image
        response = client.models.generate_content(
            model=model_name,
            contents=test_prompt
        )
        
        print(f"✅ Response received!")
        print(f"   Response type: {type(response)}")
        print(f"   Response attributes: {[attr for attr in dir(response) if not attr.startswith('_')]}")
        
        # Check for image in response
        has_image = False
        
        if hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
            print(f"   Candidate found: {type(candidate)}")
            if hasattr(candidate, 'content'):
                print(f"   Content found: {type(candidate.content)}")
                if hasattr(candidate.content, 'parts'):
                    print(f"   Parts count: {len(candidate.content.parts)}")
                    for i, part in enumerate(candidate.content.parts):
                        print(f"   Part {i}: {type(part)}")
                        print(f"      Attributes: {[attr for attr in dir(part) if not attr.startswith('_')]}")
                        if hasattr(part, 'inline_data'):
                            print(f"      ✅ Found inline_data!")
                            has_image = True
                        elif hasattr(part, 'image_bytes'):
                            print(f"      ✅ Found image_bytes!")
                            has_image = True
        
        if has_image:
            print(f"   🎉 SUCCESS! This model can generate images!")
        else:
            print(f"   ⚠️  No image found in response (might be text-only model)")
            
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

print("\n" + "=" * 60)
print("✅ Test completed!")

