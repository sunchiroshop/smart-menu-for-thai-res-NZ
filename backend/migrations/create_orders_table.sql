-- ============================================================
-- Migration: Create Orders Table
-- ============================================================
-- สร้างตาราง orders สำหรับรับออเดอร์จากลูกค้า
-- ============================================================

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    table_no TEXT,  -- หมายเลขโต๊ะ (optional)
    
    -- Order items (JSON format)
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Pricing
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax DECIMAL(10,2) DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Status: pending, preparing, ready, completed, cancelled
    status TEXT NOT NULL DEFAULT 'pending',
    
    -- Customer info (optional)
    customer_name TEXT,
    customer_phone TEXT,
    special_instructions TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status ON public.orders(restaurant_id, status);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view orders for their restaurants" ON public.orders;
DROP POLICY IF EXISTS "Users can insert orders for their restaurants" ON public.orders;
DROP POLICY IF EXISTS "Users can update orders for their restaurants" ON public.orders;
DROP POLICY IF EXISTS "Service role can manage all orders" ON public.orders;

-- RLS Policies
-- Users can view orders for their restaurants
CREATE POLICY "Users can view orders for their restaurants"
    ON public.orders FOR SELECT
    USING (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE user_id = auth.uid()
        )
    );

-- Users can insert orders (for their restaurants)
CREATE POLICY "Users can insert orders for their restaurants"
    ON public.orders FOR INSERT
    WITH CHECK (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE user_id = auth.uid()
        )
    );

-- Users can update orders for their restaurants
CREATE POLICY "Users can update orders for their restaurants"
    ON public.orders FOR UPDATE
    USING (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE user_id = auth.uid()
        )
    );

-- Service role can manage all orders (for backend API)
CREATE POLICY "Service role can manage all orders"
    ON public.orders FOR ALL
    USING (true)
    WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_orders_updated_at_trigger ON public.orders;
CREATE TRIGGER update_orders_updated_at_trigger
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_orders_updated_at();

-- Function to set completed_at when status changes to 'completed'
CREATE OR REPLACE FUNCTION set_orders_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set completed_at
DROP TRIGGER IF EXISTS set_orders_completed_at_trigger ON public.orders;
CREATE TRIGGER set_orders_completed_at_trigger
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION set_orders_completed_at();

-- Enable Realtime for orders table (for Supabase Realtime)
-- Note: This needs to be done in Supabase Dashboard > Database > Replication
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- ============================================================
-- Example Order JSON Structure
-- ============================================================
/*
{
  "menu_id": "uuid",
  "name": "Pad Thai",
  "nameEn": "Pad Thai",
  "price": 18.50,
  "quantity": 2,
  "selectedMeat": "Chicken",
  "selectedAddOns": ["Extra Peanuts", "Extra Lime"],
  "notes": "No spicy please",
  "itemTotal": 37.00
}
*/

-- ============================================================
-- Verification Queries
-- ============================================================
-- Check table exists
-- SELECT 'orders table exists' AS status 
-- FROM information_schema.tables 
-- WHERE table_name = 'orders' AND table_schema = 'public';

-- Check RLS status
-- SELECT relname, relrowsecurity 
-- FROM pg_class 
-- WHERE relname = 'orders';

-- Check policies
-- SELECT policyname, permissive, cmd, roles 
-- FROM pg_policies 
-- WHERE tablename = 'orders';

