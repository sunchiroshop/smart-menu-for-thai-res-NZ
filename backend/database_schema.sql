-- ============================================================
-- Smart Menu SaaS - Database Schema
-- ใช้กับ Supabase PostgreSQL
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Table: restaurants
-- ข้อมูลร้านอาหาร
-- ============================================================

CREATE TABLE IF NOT EXISTS restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_restaurants_user_id ON restaurants(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON restaurants(slug);

-- ============================================================
-- Table: menus
-- รายการเมนูอาหาร
-- ============================================================

CREATE TABLE IF NOT EXISTS menus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    
    -- Menu names
    name_original TEXT NOT NULL,
    name_english TEXT,
    
    -- Descriptions
    description_original TEXT,
    description_english TEXT,
    
    -- Pricing
    price DECIMAL(10,2) NOT NULL,
    
    -- Image
    image_url TEXT,
    
    -- Category
    category TEXT DEFAULT 'Main Course',
    
    -- Language
    language_code TEXT NOT NULL,  -- e.g. 'th', 'zh', 'ko'
    
    -- Display mode
    display_mode TEXT DEFAULT 'both', -- 'original', 'english', 'both'
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Sort order
    sort_order INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_menus_restaurant_id ON menus(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menus_category ON menus(category);
CREATE INDEX IF NOT EXISTS idx_menus_is_active ON menus(is_active);
CREATE INDEX IF NOT EXISTS idx_menus_created_at ON menus(created_at DESC);

-- ============================================================
-- Table: categories
-- หมวดหมู่เมนู
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_categories_restaurant_id ON categories(restaurant_id);

-- ============================================================
-- Table: qr_codes
-- QR codes สำหรับร้าน
-- ============================================================

CREATE TABLE IF NOT EXISTS qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    qr_url TEXT NOT NULL,
    menu_url TEXT NOT NULL,
    scan_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_qr_codes_restaurant_id ON qr_codes(restaurant_id);

-- ============================================================
-- Table: analytics (optional)
-- เก็บสถิติการเข้าชม
-- ============================================================

CREATE TABLE IF NOT EXISTS analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    menu_id UUID REFERENCES menus(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'view', 'click', 'scan'
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_restaurant_id ON analytics(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_menu_id ON analytics(menu_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at DESC);

-- ============================================================
-- Storage Buckets (run in Supabase Dashboard)
-- ============================================================

-- 1. menu-images (สำหรับรูปอาหาร)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('menu-images', 'menu-images', true);

-- 2. qr-codes (สำหรับ QR codes)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('qr-codes', 'qr-codes', true);

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Drop existing policies (if any) to avoid conflicts
-- ============================================================

-- Restaurants policies
DROP POLICY IF EXISTS "Users can view own restaurants" ON restaurants;
DROP POLICY IF EXISTS "Users can insert own restaurants" ON restaurants;
DROP POLICY IF EXISTS "Users can update own restaurants" ON restaurants;
DROP POLICY IF EXISTS "Users can delete own restaurants" ON restaurants;

-- Menus policies
DROP POLICY IF EXISTS "Users can view menus for their restaurants" ON menus;
DROP POLICY IF EXISTS "Users can insert menus for their restaurants" ON menus;
DROP POLICY IF EXISTS "Users can update menus for their restaurants" ON menus;
DROP POLICY IF EXISTS "Users can delete menus for their restaurants" ON menus;
DROP POLICY IF EXISTS "Anyone can view active menus" ON menus;

-- Categories policies
DROP POLICY IF EXISTS "Users can view categories for their restaurants" ON categories;
DROP POLICY IF EXISTS "Users can manage categories for their restaurants" ON categories;

-- QR Codes policies
DROP POLICY IF EXISTS "Users can view QR codes for their restaurants" ON qr_codes;
DROP POLICY IF EXISTS "Users can manage QR codes for their restaurants" ON qr_codes;

-- Analytics policies
DROP POLICY IF EXISTS "Users can view analytics for their restaurants" ON analytics;

-- ============================================================
-- Create Policies
-- ============================================================

-- Restaurants: Users can only see/edit their own restaurants
CREATE POLICY "Users can view own restaurants"
    ON restaurants FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own restaurants"
    ON restaurants FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own restaurants"
    ON restaurants FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own restaurants"
    ON restaurants FOR DELETE
    USING (auth.uid() = user_id);

-- Menus: Users can manage menus for their restaurants
CREATE POLICY "Users can view menus for their restaurants"
    ON menus FOR SELECT
    USING (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert menus for their restaurants"
    ON menus FOR INSERT
    WITH CHECK (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update menus for their restaurants"
    ON menus FOR UPDATE
    USING (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete menus for their restaurants"
    ON menus FOR DELETE
    USING (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE user_id = auth.uid()
        )
    );

-- Public can view active menus (for customer menu page)
CREATE POLICY "Anyone can view active menus"
    ON menus FOR SELECT
    USING (is_active = true);

-- Categories: Users can manage categories for their restaurants
CREATE POLICY "Users can view categories for their restaurants"
    ON categories FOR SELECT
    USING (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage categories for their restaurants"
    ON categories FOR ALL
    USING (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE user_id = auth.uid()
        )
    );

-- QR Codes: Users can manage QR codes for their restaurants
CREATE POLICY "Users can view QR codes for their restaurants"
    ON qr_codes FOR SELECT
    USING (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage QR codes for their restaurants"
    ON qr_codes FOR ALL
    USING (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE user_id = auth.uid()
        )
    );

-- Analytics: Users can view analytics for their restaurants
CREATE POLICY "Users can view analytics for their restaurants"
    ON analytics FOR SELECT
    USING (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE user_id = auth.uid()
        )
    );

-- ============================================================
-- Functions (optional - for auto-updating timestamps)
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_restaurants_updated_at
    BEFORE UPDATE ON restaurants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menus_updated_at
    BEFORE UPDATE ON menus
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qr_codes_updated_at
    BEFORE UPDATE ON qr_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Seed Data (optional - for testing)
-- ============================================================

-- Sample restaurant (for testing)
-- INSERT INTO restaurants (user_id, name, slug, description)
-- VALUES (
--     auth.uid(),
--     'Thai Garden Restaurant',
--     'thai-garden',
--     'Authentic Thai cuisine in New Zealand'
-- );

-- ============================================================
-- Notes
-- ============================================================

/*
วิธีใช้:

1. ไปที่ Supabase Dashboard → SQL Editor
2. Copy schema ทั้งหมดนี้
3. Run SQL
4. เสร็จแล้ว! Database พร้อมใช้งาน

Storage Buckets:
- ต้องสร้างใน Supabase Dashboard → Storage
- สร้าง 2 buckets: "menu-images" และ "qr-codes"
- ตั้งเป็น Public

RLS Policies:
- ป้องกันไม่ให้ user อื่นแก้ไขข้อมูลของกันและกัน
- Public สามารถดูเมนูได้ (สำหรับลูกค้า)
*/

