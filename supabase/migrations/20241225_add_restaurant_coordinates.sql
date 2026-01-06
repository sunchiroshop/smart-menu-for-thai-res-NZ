-- Add latitude and longitude columns to restaurants table for delivery distance calculation
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add comments
COMMENT ON COLUMN restaurants.latitude IS 'Restaurant latitude coordinate for delivery distance calculation';
COMMENT ON COLUMN restaurants.longitude IS 'Restaurant longitude coordinate for delivery distance calculation';
