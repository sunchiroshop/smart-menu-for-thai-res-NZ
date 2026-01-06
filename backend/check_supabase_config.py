"""
Check Supabase Configuration
ตรวจสอบว่า Supabase credentials ถูกต้องและพร้อมใช้งานหรือไม่
"""
import os
from dotenv import load_dotenv
import pathlib

# Load environment variables
env_path = pathlib.Path(__file__).parent.parent / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=str(env_path))
    print(f"✅ Loaded .env from: {env_path}")
else:
    load_dotenv()
    print("⚠️  .env file not found, using system environment variables")

print("\n" + "=" * 80)
print("🔍 Supabase Configuration Check")
print("=" * 80)
print("")

# Check Supabase URL
supabase_url = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
if supabase_url:
    print(f"✅ SUPABASE_URL: {supabase_url[:50]}...")
else:
    print("❌ SUPABASE_URL: Not found!")
    print("   Add to .env: SUPABASE_URL=https://xxxxx.supabase.co")

print("")

# Check Service Role Key (Preferred for backend)
service_role_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
if service_role_key:
    print(f"✅ SUPABASE_SERVICE_ROLE_KEY: Found ({service_role_key[:20]}...)")
    print("   ✅ Using Service Role Key - This bypasses RLS policies")
else:
    print("⚠️  SUPABASE_SERVICE_ROLE_KEY: Not found!")
    print("   💡 This is REQUIRED for backend Storage operations")
    print("   📋 How to get it:")
    print("      1. Go to Supabase Dashboard → Settings → API")
    print("      2. Copy 'service_role' key (NOT 'anon' key)")
    print("      3. Add to .env: SUPABASE_SERVICE_ROLE_KEY=your_service_role_key")

print("")

# Check Custom Key
custom_key = os.getenv('SUPABASE_KEY')
if custom_key:
    print(f"✅ SUPABASE_KEY: Found ({custom_key[:20]}...)")
else:
    print("ℹ️  SUPABASE_KEY: Not found (optional)")

print("")

# Check Anon Key
anon_key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
if anon_key:
    print(f"✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: Found ({anon_key[:20]}...)")
    print("   ⚠️  Note: Anon Key may have RLS restrictions")
else:
    print("ℹ️  NEXT_PUBLIC_SUPABASE_ANON_KEY: Not found (optional for backend)")

print("")

# Determine which key will be used
print("=" * 80)
print("📋 Key Priority (which key will be used):")
print("=" * 80)

if service_role_key:
    print("1️⃣  SUPABASE_SERVICE_ROLE_KEY ✅ (Will be used)")
    print("   ✅ This is the BEST choice for backend operations")
elif custom_key:
    print("1️⃣  SUPABASE_SERVICE_ROLE_KEY ❌ (Not found)")
    print("2️⃣  SUPABASE_KEY ✅ (Will be used)")
    print("   ⚠️  Make sure this is a Service Role Key, not Anon Key")
elif anon_key:
    print("1️⃣  SUPABASE_SERVICE_ROLE_KEY ❌ (Not found)")
    print("2️⃣  SUPABASE_KEY ❌ (Not found)")
    print("3️⃣  NEXT_PUBLIC_SUPABASE_ANON_KEY ✅ (Will be used)")
    print("   ❌ WARNING: Anon Key may cause RLS policy errors!")
    print("   💡 Recommendation: Use SUPABASE_SERVICE_ROLE_KEY instead")
else:
    print("❌ No Supabase key found!")
    print("   Add SUPABASE_SERVICE_ROLE_KEY to .env file")

print("")

# Test Supabase connection
if supabase_url and (service_role_key or custom_key or anon_key):
    print("=" * 80)
    print("🧪 Testing Supabase Connection")
    print("=" * 80)
    
    try:
        from supabase import create_client, Client
        
        # Use the same priority as ai_image_service
        key_to_use = service_role_key or custom_key or anon_key
        
        supabase_client = create_client(supabase_url, key_to_use)
        
        # Try to list buckets
        try:
            buckets = supabase_client.storage.list_buckets()
            print(f"✅ Connection successful!")
            print(f"   Found {len(buckets)} bucket(s)")
            
            for bucket in buckets:
                print(f"   - {bucket.name} ({'Public' if bucket.public else 'Private'})")
            
            # Check if menu-images bucket exists
            bucket_names = [b.name for b in buckets]
            if "menu-images" in bucket_names:
                print(f"\n✅ 'menu-images' bucket found!")
            else:
                print(f"\n⚠️  'menu-images' bucket NOT found!")
                print(f"   Available buckets: {bucket_names}")
                print(f"   💡 Create 'menu-images' bucket in Supabase Dashboard")
            
        except Exception as e:
            print(f"⚠️  Connection successful but cannot list buckets")
            print(f"   Error: {str(e)}")
            if "403" in str(e) or "Unauthorized" in str(e):
                print(f"   💡 This suggests RLS policy restrictions")
                print(f"   💡 Use SUPABASE_SERVICE_ROLE_KEY instead of Anon Key")
        
    except ImportError:
        print("❌ Supabase library not installed")
        print("   Install with: pip install supabase")
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")

print("")
print("=" * 80)
print("✅ Configuration check completed!")
print("=" * 80)

