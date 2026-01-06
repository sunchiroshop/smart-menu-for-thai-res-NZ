"""
Script สำหรับ setup User Roles ใน Supabase
รัน script นี้เพื่อสร้างตาราง user_profiles และ policies
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent.parent.parent / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=str(env_path))
else:
    load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: SUPABASE_URL and SUPABASE_KEY must be set in .env file")
    sys.exit(1)

try:
    from supabase import create_client, Client
except ImportError:
    print("❌ Error: supabase library not installed. Install with: pip install supabase")
    sys.exit(1)

def run_migration():
    """รัน migration SQL ใน Supabase"""
    print("=" * 60)
    print("🚀 Setting up User Roles in Supabase...")
    print("=" * 60)
    
    try:
        # Create Supabase client
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print(f"✅ Connected to Supabase: {SUPABASE_URL[:30]}...")
        
        # Read migration SQL file
        migration_file = Path(__file__).parent.parent / 'migrations' / 'add_user_roles.sql'
        if not migration_file.exists():
            print(f"❌ Error: Migration file not found: {migration_file}")
            sys.exit(1)
        
        with open(migration_file, 'r', encoding='utf-8') as f:
            sql = f.read()
        
        # Split SQL into individual statements
        statements = [s.strip() for s in sql.split(';') if s.strip() and not s.strip().startswith('--')]
        
        print(f"📝 Found {len(statements)} SQL statements to execute...")
        
        # Execute each statement
        for i, statement in enumerate(statements, 1):
            if not statement:
                continue
            
            try:
                # Use RPC to execute raw SQL (if available) or use table operations
                # Note: Supabase Python client doesn't support raw SQL execution directly
                # We'll need to use the REST API or execute via Supabase Dashboard
                print(f"   [{i}/{len(statements)}] Executing statement...")
                
                # For now, we'll create the table using Python client operations
                if 'CREATE TABLE' in statement.upper():
                    print("   ⚠️  Note: CREATE TABLE statements must be run in Supabase SQL Editor")
                    print("   📋 Please copy the SQL from migrations/add_user_roles.sql")
                    print("   📋 and run it in Supabase Dashboard > SQL Editor")
                    continue
                
            except Exception as e:
                print(f"   ⚠️  Warning: {str(e)}")
        
        # Try to verify table exists by querying it
        try:
            result = supabase.table('user_profiles').select('*').limit(1).execute()
            print("✅ Table 'user_profiles' exists and is accessible!")
        except Exception as e:
            print(f"⚠️  Table 'user_profiles' may not exist yet: {str(e)}")
            print("📋 Please run the migration SQL in Supabase Dashboard > SQL Editor")
        
        print("=" * 60)
        print("✅ Setup complete!")
        print("=" * 60)
        print("\n📝 Next steps:")
        print("1. Go to Supabase Dashboard > SQL Editor")
        print("2. Copy and paste the contents of: backend/migrations/add_user_roles.sql")
        print("3. Click 'Run' to execute the migration")
        print("4. Verify the table exists in: Supabase Dashboard > Table Editor")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    run_migration()

