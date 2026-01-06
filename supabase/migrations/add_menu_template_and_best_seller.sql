-- Add menu_template column to restaurants table
-- This stores the selected menu template (list, grid, magazine, elegant, casual)
ALTER TABLE IF EXISTS restaurants 
ADD COLUMN IF NOT EXISTS menu_template VARCHAR(50) DEFAULT 'grid';

COMMENT ON COLUMN restaurants.menu_template IS 'Menu display template: list, grid, magazine, elegant, casual';

-- Add is_best_seller column to menus table
-- This allows manual marking of best sellers (in addition to analytics)
ALTER TABLE IF EXISTS menus 
ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN menus.is_best_seller IS 'Manual best seller flag (shown prominently in menu)';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_menus_best_seller ON menus(restaurant_id, is_best_seller) WHERE is_best_seller = TRUE;

-- Migration completed
COMMENT ON TABLE restaurants IS 'Restaurant profiles - updated with menu_template support';
COMMENT ON TABLE menus IS 'Menu items - updated with is_best_seller support';

