-- ============================================================
-- Migration: Add category_english column to menus table
-- Date: 2025-12-13
-- Description: Add English translation for category
-- ============================================================

-- Add category_english column
ALTER TABLE menus 
ADD COLUMN IF NOT EXISTS category_english TEXT;

-- Add comment
COMMENT ON COLUMN menus.category_english IS 'English translation of category (e.g., "Main Course", "Appetizers")';

-- Copy existing category values to category_english as a starting point
-- (if category looks like English already, use it; otherwise leave blank)
UPDATE menus 
SET category_english = category 
WHERE category_english IS NULL 
AND category ~ '^[A-Za-z\s\-&]+$';  -- Only copy if it looks like English

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'menus' AND column_name = 'category_english';


