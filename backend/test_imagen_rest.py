"""
Test Imagen API via REST - ใช้ REST API โดยตรง
"""
import os
from dotenv import load_dotenv
import pathlib
import requests
import json
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

print("🔍 Testing Imagen Models via REST API...")
print("=" * 80)
print("")

# Test Imagen models via REST API
test_models = [
    "imagen-4.0-fast-generate-001",
    "imagen-4.0-generate-001",
    "imagen-3.0-generate-001",
]

test_prompt = "A professional food photography of a cookie on a white plate, restaurant quality, appetizing"

# REST API endpoint for Imagen
base_url = "https://generativelanguage.googleapis.com/v1beta"

winner_found = False

for model_name in test_models:
    print(f"📡 Testing: {model_name}")
    print("-" * 80)
    
    # Try different REST API endpoints
    endpoints = [
        f"{base_url}/{model_name}:generateContent",
        f"{base_url}/{model_name}:generateImage",
        f"https://ai.googleapis.com/v1beta/{model_name}:generateImage",
        f"https://ai.googleapis.com/v1beta/{model_name}:generateContent",
    ]
    
    for endpoint in endpoints:
        try:
            print(f"  Trying: {endpoint}")
            
            headers = {
                "Content-Type": "application/json",
            }
            
            # Try different request formats
            payloads = [
                {
                    "prompt": test_prompt
                },
                {
                    "contents": [{
                        "parts": [{
                            "text": test_prompt
                        }]
                    }]
                },
                {
                    "instances": [{
                        "prompt": test_prompt
                    }]
                }
            ]
            
            for payload in payloads:
                try:
                    response = requests.post(
                        f"{endpoint}?key={GOOGLE_API_KEY}",
                        headers=headers,
                        json=payload,
                        timeout=30
                    )
                    
                    print(f"     Status: {response.status_code}")
                    
                    if response.status_code == 200:
                        data = response.json()
                        print(f"     ✅ Success! Response keys: {list(data.keys())}")
                        
                        # Check for image data
                        if "images" in data or "image" in data or "data" in data:
                            print(f"     🎉 Found image data!")
                            winner_found = True
                            print(f"\n{'='*80}")
                            print(f"✅ WINNER: {model_name}")
                            print(f"   Endpoint: {endpoint}")
                            print(f"   Payload format: {list(payload.keys())}")
                            print(f"{'='*80}")
                            break
                        else:
                            print(f"     Response: {json.dumps(data, indent=2)[:200]}...")
                    elif response.status_code == 429:
                        print(f"     ⚠️  Quota Limit")
                        break
                    elif response.status_code == 404:
                        print(f"     ❌ Not Found")
                        break
                    else:
                        print(f"     ❌ Error: {response.text[:200]}")
                        
                except Exception as e:
                    print(f"     ❌ Exception: {str(e)[:200]}")
            
            if winner_found:
                break
                
        except Exception as e:
            print(f"  ❌ Error: {str(e)[:200]}")
    
    if winner_found:
        break
    
    print("")

if not winner_found:
    print("=" * 80)
    print("⚠️  No working model found via REST API!")
    print("=" * 80)
    print("\n💡 Next steps:")
    print("   1. Check Google AI Studio: https://aistudio.google.com/")
    print("   2. Verify Imagen API access in your project")
    print("   3. Check API documentation for correct endpoint")

print("\n✅ Test completed!")

