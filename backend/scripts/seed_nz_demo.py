#!/usr/bin/env python3
"""
Seed NZ Demo Data - Thai Basil Auckland
Creates a realistic Thai restaurant demo with 10 popular dishes for NZ launch.

Usage:
    python scripts/seed_nz_demo.py

This script will:
1. Create "Thai Basil Auckland" restaurant with GST details
2. Add 10 popular Thai dishes with NZD prices
3. Set up proper categories and descriptions
"""

import os
import sys
from datetime import datetime
from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

try:
    from supabase import create_client, Client
except ImportError:
    print("Error: supabase package not installed. Run: pip install supabase")
    sys.exit(1)

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = (
    os.getenv('SUPABASE_SERVICE_ROLE_KEY') or
    os.getenv('SUPABASE_KEY') or
    os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
)

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Missing Supabase credentials. Check your .env file.")
    sys.exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ============================================================
# Demo Restaurant Configuration
# ============================================================

DEMO_RESTAURANT = {
    "name": "Thai Basil Auckland",
    "slug": "thai-basil-auckland",
    "description": "Authentic Thai cuisine in the heart of Auckland. Fresh ingredients, traditional recipes, modern presentation.",
    "address": "123 Queen Street, Auckland CBD, Auckland 1010",
    "phone": "+64 9 123 4567",
    "email": "hello@thaibasilauckland.co.nz",
    "theme_color": "#D97706",  # Amber/Thai Gold
    "menu_template": "grid",
    "primary_language": "th",
    "is_active": True,

    # Service options
    "service_options": {
        "dine_in": True,
        "pickup": True,
        "delivery": True
    },

    # Delivery rates (Auckland zones)
    "delivery_rates": [
        {"id": "zone1", "distance_km": 3, "price": 5.00},
        {"id": "zone2", "distance_km": 5, "price": 7.50},
        {"id": "zone3", "distance_km": 8, "price": 10.00},
        {"id": "zone4", "distance_km": 12, "price": 15.00}
    ],

    # Payment settings
    "payment_settings": {
        "accept_card": True,
        "accept_bank_transfer": True,
        "bank_accounts": [
            {
                "bank_name": "ANZ",
                "account_name": "Thai Basil Auckland Ltd",
                "account_number": "06-0123-0456789-00"
            }
        ]
    },

    # NZ Tax details
    "gst_registered": True,
    "gst_number": "123-456-789",
    "ird_number": "12-345-678",
    "business_address": "123 Queen Street, Auckland CBD, Auckland 1010, New Zealand",
    "business_phone": "+64 9 123 4567",

    # Credit card surcharge (disabled by default)
    "credit_card_surcharge_enabled": False,
    "credit_card_surcharge_rate": 2.50,

    # POS theme
    "pos_theme_color": "amber"
}

# ============================================================
# Menu Items - 10 Popular Thai Dishes
# ============================================================

DEMO_MENU_ITEMS = [
    # === STARTERS ===
    {
        "name_original": "ต้มยำกุ้ง",
        "name_english": "Tom Yum Goong",
        "description_original": "ต้มยำกุ้งสูตรต้นตำรับ รสชาติเผ็ดจัดจ้าน หอมเครื่องสมุนไพรไทย",
        "description_english": "Classic spicy & sour prawn soup with lemongrass, galangal, kaffir lime leaves, and fresh Thai herbs",
        "price": 16.90,
        "category": "ซุปและสลัด",
        "category_english": "Soups & Salads",
        "is_best_seller": True,
        "is_featured": True,
        "sort_order": 1
    },
    {
        "name_original": "ส้มตำไทย",
        "name_english": "Som Tum Thai",
        "description_original": "ส้มตำไทยรสจัด มะละกอสด ถั่วลิสง กุ้งแห้ง มะเขือเทศ",
        "description_english": "Fresh green papaya salad with peanuts, dried shrimp, cherry tomatoes, and tangy lime dressing",
        "price": 14.90,
        "category": "ซุปและสลัด",
        "category_english": "Soups & Salads",
        "is_best_seller": False,
        "is_featured": False,
        "sort_order": 2
    },
    {
        "name_original": "ต้มข่าไก่",
        "name_english": "Tom Kha Gai",
        "description_original": "ต้มข่าไก่น้ำข้นนุ่มลิ้น หอมกะทิ รสเปรี้ยวหวานกลมกล่อม",
        "description_english": "Creamy coconut chicken soup with galangal, mushrooms, and aromatic Thai spices",
        "price": 15.90,
        "category": "ซุปและสลัด",
        "category_english": "Soups & Salads",
        "is_best_seller": False,
        "is_featured": False,
        "sort_order": 3
    },

    # === MAIN COURSES ===
    {
        "name_original": "ผัดไทยกุ้งสด",
        "name_english": "Pad Thai Goong",
        "description_original": "ผัดไทยกุ้งสดตัวโต เส้นนุ่ม รสชาติกลมกล่อม เสิร์ฟพร้อมมะนาวและถั่วลิสง",
        "description_english": "Thailand's famous stir-fried rice noodles with juicy prawns, egg, tofu, bean sprouts, served with lime and crushed peanuts",
        "price": 24.90,
        "category": "อาหารจานหลัก",
        "category_english": "Main Course",
        "is_best_seller": True,
        "is_featured": True,
        "sort_order": 10
    },
    {
        "name_original": "แกงเขียวหวานไก่",
        "name_english": "Green Curry Chicken",
        "description_original": "แกงเขียวหวานไก่สูตรโบราณ หอมกะทิ พริกแกงสด มะเขือ ใบโหระพา",
        "description_english": "Aromatic green curry with tender chicken, Thai eggplant, bamboo shoots, and fresh basil in rich coconut cream",
        "price": 22.90,
        "category": "อาหารจานหลัก",
        "category_english": "Main Course",
        "is_best_seller": True,
        "is_featured": True,
        "sort_order": 11
    },
    {
        "name_original": "ผัดกะเพราหมูสับ",
        "name_english": "Pad Kra Pao Moo",
        "description_original": "ผัดกะเพราหมูสับ ใบกะเพราหอมฉุย พริกสด กระเทียม เสิร์ฟพร้อมไข่ดาว",
        "description_english": "Stir-fried minced pork with holy basil, fresh chili, and garlic. Served with jasmine rice and crispy fried egg",
        "price": 21.90,
        "category": "อาหารจานหลัก",
        "category_english": "Main Course",
        "is_best_seller": True,
        "is_featured": False,
        "sort_order": 12
    },
    {
        "name_original": "แกงมัสมั่นเนื้อ",
        "name_english": "Massaman Beef Curry",
        "description_original": "แกงมัสมั่นเนื้อตุ๋นนุ่ม มันฝรั่ง หอมหัวใหญ่ ถั่วลิสง รสชาติเข้มข้น",
        "description_english": "Rich and aromatic Massaman curry with slow-cooked beef, potatoes, roasted peanuts, and warm spices",
        "price": 25.90,
        "category": "อาหารจานหลัก",
        "category_english": "Main Course",
        "is_best_seller": False,
        "is_featured": True,
        "sort_order": 13
    },
    {
        "name_original": "ผัดซีอิ๊วไก่",
        "name_english": "Pad See Ew Chicken",
        "description_original": "ผัดซีอิ๊วเส้นใหญ่ไก่ ผักคะน้า ไข่ ซอสถั่วเหลืองหอมกลมกล่อม",
        "description_english": "Wok-fried wide rice noodles with chicken, Chinese broccoli, egg, and sweet soy sauce",
        "price": 21.90,
        "category": "อาหารจานหลัก",
        "category_english": "Main Course",
        "is_best_seller": False,
        "is_featured": False,
        "sort_order": 14
    },
    {
        "name_original": "แกงแดงเป็ด",
        "name_english": "Red Curry Duck",
        "description_original": "แกงแดงเป็ดย่าง สับปะรด มะเขือเทศ ใบโหระพา หอมกลิ่นพริกแกงเข้มข้น",
        "description_english": "Fragrant red curry with roasted duck, pineapple, cherry tomatoes, and Thai basil",
        "price": 26.90,
        "category": "อาหารจานหลัก",
        "category_english": "Main Course",
        "is_best_seller": False,
        "is_featured": False,
        "sort_order": 15
    },

    # === DESSERTS ===
    {
        "name_original": "ข้าวเหนียวมะม่วง",
        "name_english": "Mango Sticky Rice",
        "description_original": "ข้าวเหนียวมูนกะทิหอมมัน มะม่วงสุกหวานฉ่ำ โรยงาขาว",
        "description_english": "Sweet coconut sticky rice served with fresh ripe mango and toasted sesame seeds",
        "price": 14.90,
        "category": "ของหวาน",
        "category_english": "Desserts",
        "is_best_seller": True,
        "is_featured": True,
        "sort_order": 20
    }
]


def create_demo_restaurant():
    """Create the demo restaurant."""
    print("\n" + "=" * 60)
    print("Creating Thai Basil Auckland Restaurant")
    print("=" * 60)

    # Check if restaurant already exists
    existing = supabase.table('restaurants').select('id, name').eq('slug', DEMO_RESTAURANT['slug']).execute()

    if existing.data and len(existing.data) > 0:
        restaurant_id = existing.data[0]['id']
        print(f"Restaurant already exists: {existing.data[0]['name']}")
        print(f"Restaurant ID: {restaurant_id}")

        # Update existing restaurant with latest settings
        print("Updating restaurant settings...")
        supabase.table('restaurants').update(DEMO_RESTAURANT).eq('id', restaurant_id).execute()
        print("Restaurant settings updated!")
        return restaurant_id

    # Create new restaurant
    result = supabase.table('restaurants').insert(DEMO_RESTAURANT).execute()

    if result.data and len(result.data) > 0:
        restaurant_id = result.data[0]['id']
        print(f"Created restaurant: {result.data[0]['name']}")
        print(f"Restaurant ID: {restaurant_id}")
        print(f"Slug: {result.data[0]['slug']}")
        print(f"GST Number: {result.data[0].get('gst_number', 'N/A')}")
        return restaurant_id
    else:
        print("Error: Failed to create restaurant")
        return None


def create_demo_menu_items(restaurant_id: str):
    """Create demo menu items for the restaurant."""
    print("\n" + "=" * 60)
    print("Creating Menu Items")
    print("=" * 60)

    # Delete existing menu items for this restaurant
    print("Clearing existing menu items...")
    supabase.table('menus').delete().eq('restaurant_id', restaurant_id).execute()

    # Insert new menu items
    created_count = 0
    for item in DEMO_MENU_ITEMS:
        menu_data = {
            "restaurant_id": restaurant_id,
            "name_original": item["name_original"],
            "name_english": item["name_english"],
            "description_original": item["description_original"],
            "description_english": item["description_english"],
            "price": item["price"],
            "category": item["category"],
            "category_english": item["category_english"],
            "language_code": "th",
            "display_mode": "both",
            "is_active": True,
            "is_featured": item.get("is_featured", False),
            "is_best_seller": item.get("is_best_seller", False),
            "sort_order": item.get("sort_order", 0),
            "options": {},
            "variants": []
        }

        result = supabase.table('menus').insert(menu_data).execute()

        if result.data and len(result.data) > 0:
            created_count += 1
            best_seller = " [BEST SELLER]" if item.get("is_best_seller") else ""
            print(f"  + {item['name_english']}: ${item['price']:.2f} NZD{best_seller}")
        else:
            print(f"  ! Failed to create: {item['name_english']}")

    print(f"\nCreated {created_count}/{len(DEMO_MENU_ITEMS)} menu items")
    return created_count


def print_summary(restaurant_id: str):
    """Print summary of created data."""
    print("\n" + "=" * 60)
    print("DEMO DATA CREATED SUCCESSFULLY!")
    print("=" * 60)

    print(f"""
Restaurant: Thai Basil Auckland
ID: {restaurant_id}
URL: /restaurant/thai-basil-auckland

Features Enabled:
  - GST Registered: Yes (123-456-789)
  - Dine In: Yes
  - Pickup: Yes
  - Delivery: Yes (4 zones, $5-$15)
  - Card Payments: Yes
  - Bank Transfer: Yes (ANZ)
  - Credit Card Surcharge: No (can enable in settings)

Menu Items: 10 dishes
  - 3 Soups & Salads
  - 6 Main Courses
  - 1 Dessert
  - 5 Best Sellers marked

Price Range: $14.90 - $26.90 NZD (GST inclusive)

To access the demo:
  1. Customer Menu: http://localhost:3000/restaurant/thai-basil-auckland
  2. Dashboard: Login with restaurant owner credentials
  3. POS: http://localhost:3000/pos/login (create staff first)
""")


def main():
    """Main entry point."""
    print("\n" + "=" * 60)
    print("SMART MENU - NZ DEMO SEEDER")
    print("Thai Basil Auckland")
    print("=" * 60)

    try:
        # Create restaurant
        restaurant_id = create_demo_restaurant()
        if not restaurant_id:
            print("Failed to create restaurant. Exiting.")
            sys.exit(1)

        # Create menu items
        create_demo_menu_items(restaurant_id)

        # Print summary
        print_summary(restaurant_id)

        print("\nDone!")

    except Exception as e:
        print(f"\nError: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
