-- Migration: Add delivery_settings to restaurants
-- Date: 2025-12-29
-- Description: Add delivery_settings column for per-km pricing

-- Add delivery_settings JSONB column for per-km pricing
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS delivery_settings JSONB DEFAULT '{
  "pricing_mode": "per_km",
  "base_fee": 3.00,
  "price_per_km": 1.50,
  "max_distance_km": 15,
  "free_delivery_above": 0
}'::jsonb;

-- Add comment
COMMENT ON COLUMN restaurants.delivery_settings IS 'JSON object for delivery pricing: pricing_mode, base_fee, price_per_km, max_distance_km, free_delivery_above';
