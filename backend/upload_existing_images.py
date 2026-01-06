"""
Script สำหรับอัปโหลดรูปภาพจาก Base64 ที่มีอยู่แล้วไปยัง Supabase Storage

ใช้สำหรับอัปโหลดรูปภาพที่ generate/enhance ไปแล้วก่อนหน้านี้
แต่ยังไม่ได้ save ลง Supabase Storage
"""
import os
import sys
from dotenv import load_dotenv
import pathlib
import requests
import json

# Load environment variables
env_path = pathlib.Path(__file__).parent.parent / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=str(env_path))
else:
    load_dotenv()

# Backend URL
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:8000')

def upload_base64_image(image_base64: str, folder: str = "generated", bucket_name: str = "menu-images"):
    """
    อัปโหลดรูปภาพจาก Base64 ไปยัง Supabase Storage
    
    Args:
        image_base64: Base64 encoded image (with or without data URL prefix)
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
        
        print(f"📤 Uploading image to Supabase Storage...")
        print(f"   Folder: {folder}")
        print(f"   Bucket: {bucket_name}")
        print(f"   Image size: {len(image_base64)} chars")
        
        response = requests.post(url, json=payload, timeout=60)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Upload successful!")
            print(f"   Public URL: {result.get('public_url')}")
            print(f"   Filename: {result.get('filename')}")
            return result
        else:
            print(f"❌ Upload failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None

def upload_from_file(file_path: str, folder: str = "generated", bucket_name: str = "menu-images"):
    """
    อ่านไฟล์ base64 text แล้วอัปโหลดไปยัง Supabase Storage
    
    Args:
        file_path: Path to file containing base64 image
        folder: Folder name in Supabase Storage
        bucket_name: Bucket name
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            image_base64 = f.read().strip()
        
        return upload_base64_image(image_base64, folder, bucket_name)
        
    except Exception as e:
        print(f"❌ Failed to read file: {str(e)}")
        return None

def upload_from_json(json_path: str, folder: str = "generated", bucket_name: str = "menu-images"):
    """
    อ่าน JSON file ที่มี base64 image แล้วอัปโหลดไปยัง Supabase Storage
    
    JSON format:
    {
        "image_base64": "...",
        "generated_image_base64": "...",
        "enhanced_image_base64": "..."
    }
    
    Args:
        json_path: Path to JSON file
        folder: Folder name in Supabase Storage
        bucket_name: Bucket name
    """
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Try different keys
        image_base64 = (
            data.get('image_base64') or 
            data.get('generated_image_base64') or 
            data.get('enhanced_image_base64') or
            data.get('generated_image', '').split(',')[1] if ',' in data.get('generated_image', '') else None or
            data.get('enhanced_image', '').split(',')[1] if ',' in data.get('enhanced_image', '') else None
        )
        
        if not image_base64:
            print("❌ No image_base64 found in JSON file")
            print(f"   Available keys: {list(data.keys())}")
            return None
        
        return upload_base64_image(image_base64, folder, bucket_name)
        
    except Exception as e:
        print(f"❌ Failed to read JSON file: {str(e)}")
        return None

if __name__ == "__main__":
    print("=" * 80)
    print("📤 Upload Existing Images to Supabase Storage")
    print("=" * 80)
    print("")
    
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python upload_existing_images.py <base64_string>")
        print("  python upload_existing_images.py --file <file_path>")
        print("  python upload_existing_images.py --json <json_path>")
        print("")
        print("Options:")
        print("  --folder <folder_name>     Folder name (default: generated)")
        print("  --bucket <bucket_name>     Bucket name (default: menu-images)")
        print("")
        print("Examples:")
        print("  python upload_existing_images.py 'data:image/png;base64,iVBORw0KG...'")
        print("  python upload_existing_images.py --file image_base64.txt")
        print("  python upload_existing_images.py --json result.json --folder enhanced")
        sys.exit(1)
    
    # Parse arguments
    folder = "generated"
    bucket_name = "menu-images"
    
    args = sys.argv[1:]
    i = 0
    
    while i < len(args):
        if args[i] == "--folder" and i + 1 < len(args):
            folder = args[i + 1]
            i += 2
        elif args[i] == "--bucket" and i + 1 < len(args):
            bucket_name = args[i + 1]
            i += 2
        elif args[i] == "--file" and i + 1 < len(args):
            file_path = args[i + 1]
            upload_from_file(file_path, folder, bucket_name)
            i += 2
        elif args[i] == "--json" and i + 1 < len(args):
            json_path = args[i + 1]
            upload_from_json(json_path, folder, bucket_name)
            i += 2
        else:
            # Assume it's base64 string
            image_base64 = args[i]
            upload_base64_image(image_base64, folder, bucket_name)
            i += 1
    
    print("")
    print("✅ Done!")

