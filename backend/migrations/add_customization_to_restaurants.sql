-- ============================================================
-- Migration: Add Customization Features to Restaurants
-- Date: 2024-12-04
-- Description: เพิ่ม theme_color และ cover_image_url สำหรับ customization
-- ============================================================

-- Add theme_color column (default: '#000000' - brand color)
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT '#000000';

-- Add cover_image_url column (nullable)
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN restaurants.theme_color IS 'Primary theme color for buttons, borders, and active states (hex format: #RRGGBB)';
COMMENT ON COLUMN restaurants.cover_image_url IS 'URL to custom banner/cover image stored in Supabase Storage (shop_assets bucket)';

-- Update existing restaurants to have default theme color if NULL
UPDATE restaurants 
SET theme_color = '#000000' 
WHERE theme_color IS NULL;

-- ============================================================
-- Verify migration
-- ============================================================
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'restaurants'
-- AND column_name IN ('theme_color', 'cover_image_url');

