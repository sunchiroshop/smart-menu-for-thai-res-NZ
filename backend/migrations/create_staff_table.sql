-- Migration: Create staff management tables
-- Date: 2025-12-11
-- Description: Support multiple staff members per restaurant with role-based permissions

-- Create staff_roles enum
CREATE TYPE staff_role AS ENUM ('owner', 'manager', 'chef', 'waiter', 'cashier');

-- Create staff table
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- If user account exists
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  role staff_role NOT NULL DEFAULT 'waiter',
  pin_code VARCHAR(6), -- For quick login at POS
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '{
    "can_view_orders": true,
    "can_update_orders": true,
    "can_manage_menu": false,
    "can_view_analytics": false,
    "can_manage_staff": false
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_staff_restaurant_id ON staff(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(role);
CREATE INDEX IF NOT EXISTS idx_staff_pin_code ON staff(pin_code) WHERE pin_code IS NOT NULL;

-- Create staff activity log table
CREATE TABLE IF NOT EXISTS staff_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL, -- e.g., 'order_created', 'order_updated', 'menu_updated'
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for activity log
CREATE INDEX IF NOT EXISTS idx_staff_activity_staff_id ON staff_activity_log(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_activity_restaurant_id ON staff_activity_log(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_staff_activity_created_at ON staff_activity_log(created_at);

-- Enable Row Level Security
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff table
CREATE POLICY "Users can view staff in their restaurants"
  ON staff FOR SELECT
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage staff in their restaurants"
  ON staff FOR ALL
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for staff_activity_log
CREATE POLICY "Users can view staff activity in their restaurants"
  ON staff_activity_log FOR SELECT
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
  );

-- Add comments
COMMENT ON TABLE staff IS 'Staff members for each restaurant with role-based permissions';
COMMENT ON TABLE staff_activity_log IS 'Activity log for staff actions';
COMMENT ON COLUMN staff.pin_code IS '6-digit PIN for quick POS login';
COMMENT ON COLUMN staff.permissions IS 'JSONB object with granular permissions';

-- Example usage:
-- INSERT INTO staff (restaurant_id, name, email, role, pin_code)
-- VALUES (
--   'restaurant-uuid-here',
--   'John Doe',
--   'john@example.com',
--   'waiter',
--   '123456'
-- );

