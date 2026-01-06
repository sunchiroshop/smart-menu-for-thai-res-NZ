-- Migration: Add service options to restaurants
-- Date: 2025-12-16
-- Description: Add service_options column to enable/disable dine-in, pickup, delivery

-- Add service_options JSONB column with default values (all enabled)
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS service_options JSONB DEFAULT '{
  "dine_in": true,
  "pickup": true,
  "delivery": true
}'::jsonb;

-- Add comment
COMMENT ON COLUMN restaurants.service_options IS 'JSON object to enable/disable service types: dine_in, pickup, delivery';

-- Example usage:
-- UPDATE restaurants
-- SET service_options = '{"dine_in": true, "pickup": false, "delivery": true}'::jsonb
-- WHERE id = 'restaurant-uuid-here';
