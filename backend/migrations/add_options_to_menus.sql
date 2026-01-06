-- ============================================================
-- Migration: Add Options Column to Menus Table
-- ============================================================
-- เพิ่มคอลัมน์ options (JSONB) สำหรับเก็บ meats และ addOns
-- ============================================================

-- Add options column (JSONB) to store meats and addOns
ALTER TABLE menus
ADD COLUMN IF NOT EXISTS options JSONB DEFAULT '{}'::jsonb;

-- Add index for JSONB queries (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_menus_options ON menus USING GIN (options);

-- ============================================================
-- Example Options JSON Structure
-- ============================================================
/*
{
  "meats": [
    {
      "name": "หมู",
      "nameEn": "Pork",
      "price": "0"
    },
    {
      "name": "ไก่",
      "nameEn": "Chicken",
      "price": "2"
    }
  ],
  "addOns": [
    {
      "name": "ไข่",
      "nameEn": "Egg",
      "price": "1"
    },
    {
      "name": "ถั่วงอก",
      "nameEn": "Bean Sprouts",
      "price": "0.5"
    }
  ]
}
*/

