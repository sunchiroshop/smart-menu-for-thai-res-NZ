-- Migration: Add menu variants/sizes support
-- Date: 2025-12-11
-- Description: Allow menu items to have multiple size options (Small, Medium, Large)

-- Add variants column to menus table
-- NOTE: The table is named 'menus' not 'menu_items'
ALTER TABLE menus 
ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;

-- Example variant structure:
-- [
--   {"size": "Small", "price": "10.00", "size_en": "Small"},
--   {"size": "Medium", "price": "15.00", "size_en": "Medium"},
--   {"size": "Large", "price": "20.00", "size_en": "Large"}
-- ]

-- Add comment
COMMENT ON COLUMN menus.variants IS 'Menu item size variants with pricing (JSONB array)';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_menus_variants ON menus USING GIN (variants);

-- Example usage:
-- UPDATE menu_items 
-- SET variants = '[
--   {"size": "Small", "size_en": "Small", "price": "10.00"},
--   {"size": "Medium", "size_en": "Medium", "price": "15.00"},
--   {"size": "Large", "size_en": "Large", "price": "20.00"}
-- ]'::jsonb
-- WHERE id = 'some-menu-item-id';

