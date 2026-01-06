-- ============================================================
-- Migration: Add Service Type and Customer Details to Orders
-- ============================================================
-- เพิ่ม service_type และ customer_details สำหรับรองรับ Dine-in, Pickup, Delivery
-- ============================================================

-- Create ENUM type for service_type
DO $$ BEGIN
    CREATE TYPE service_type_enum AS ENUM ('dine_in', 'pickup', 'delivery');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add service_type column (default 'dine_in')
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS service_type service_type_enum NOT NULL DEFAULT 'dine_in';

-- Add customer_details column (JSONB)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_details JSONB DEFAULT '{}'::jsonb;

-- Add index for service_type
CREATE INDEX IF NOT EXISTS idx_orders_service_type ON public.orders(service_type);

-- Add index for customer_details (GIN index for JSONB queries)
CREATE INDEX IF NOT EXISTS idx_orders_customer_details ON public.orders USING GIN (customer_details);

-- ============================================================
-- Example customer_details JSON structures:
-- ============================================================
-- Dine-in:
-- {
--   "table_no": "5"
-- }
--
-- Pickup:
-- {
--   "name": "John Doe",
--   "phone": "+64 21 123 4567",
--   "pickup_time": "2024-01-15T18:30:00Z"
-- }
--
-- Delivery:
-- {
--   "name": "Jane Smith",
--   "phone": "+64 21 987 6543",
--   "address": "123 Main Street, Auckland 1010"
-- }
-- ============================================================

-- Migration complete
SELECT 'Migration completed: service_type and customer_details added to orders table' AS status;

