-- Admin Dashboard Tables Migration
-- Creates: coupons, payment_logs, admin_activity_logs
-- Alters: user_profiles with subscription tracking fields

-- ============================================
-- 1. COUPONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value DECIMAL(10,2) NOT NULL,
    min_order_amount DECIMAL(10,2) DEFAULT 0,
    max_discount_amount DECIMAL(10,2), -- For percentage coupons, cap the discount
    usage_limit INTEGER, -- NULL = unlimited
    usage_count INTEGER DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    applies_to TEXT DEFAULT 'subscription' CHECK (applies_to IN ('subscription', 'all_plans', 'starter', 'professional', 'enterprise')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. PAYMENT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.payment_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'NZD',
    payment_type TEXT NOT NULL CHECK (payment_type IN ('subscription', 'one_time', 'refund')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'bank_transfer', 'manual')),
    payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'pending_approval', 'completed', 'failed', 'refunded', 'cancelled')),
    plan TEXT, -- starter, professional, enterprise
    billing_interval TEXT CHECK (billing_interval IN ('monthly', 'yearly')),
    stripe_payment_id TEXT,
    stripe_invoice_id TEXT,
    stripe_subscription_id TEXT,
    bank_transfer_slip_url TEXT,
    bank_transfer_reference TEXT,
    bank_account_name TEXT,
    bank_name TEXT,
    coupon_code TEXT,
    coupon_discount DECIMAL(10,2) DEFAULT 0,
    admin_approved_by UUID REFERENCES auth.users(id),
    admin_approved_at TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT,
    rejection_reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. ADMIN ACTIVITY LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID NOT NULL REFERENCES auth.users(id),
    admin_email TEXT,
    action TEXT NOT NULL,
    target_type TEXT, -- 'user', 'restaurant', 'order', 'coupon', 'payment', 'subscription'
    target_id TEXT,
    target_name TEXT,
    description TEXT,
    old_value JSONB,
    new_value JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. ALTER USER_PROFILES - Add subscription fields
-- ============================================
DO $$
BEGIN
    -- Subscription status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'subscription_status') THEN
        ALTER TABLE public.user_profiles ADD COLUMN subscription_status TEXT DEFAULT 'trial'
            CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'expired', 'pending_payment'));
    END IF;

    -- Plan
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'plan') THEN
        ALTER TABLE public.user_profiles ADD COLUMN plan TEXT DEFAULT 'free_trial';
    END IF;

    -- Billing interval
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'billing_interval') THEN
        ALTER TABLE public.user_profiles ADD COLUMN billing_interval TEXT DEFAULT 'monthly'
            CHECK (billing_interval IN ('monthly', 'yearly'));
    END IF;

    -- Trial dates
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'trial_start_date') THEN
        ALTER TABLE public.user_profiles ADD COLUMN trial_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'trial_end_date') THEN
        ALTER TABLE public.user_profiles ADD COLUMN trial_end_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days');
    END IF;

    -- Subscription dates
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'subscription_start_date') THEN
        ALTER TABLE public.user_profiles ADD COLUMN subscription_start_date TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'subscription_end_date') THEN
        ALTER TABLE public.user_profiles ADD COLUMN subscription_end_date TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'next_billing_date') THEN
        ALTER TABLE public.user_profiles ADD COLUMN next_billing_date TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Payment method preference
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'payment_method') THEN
        ALTER TABLE public.user_profiles ADD COLUMN payment_method TEXT
            CHECK (payment_method IN ('stripe', 'bank_transfer'));
    END IF;

    -- Stripe IDs
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'stripe_customer_id') THEN
        ALTER TABLE public.user_profiles ADD COLUMN stripe_customer_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'stripe_subscription_id') THEN
        ALTER TABLE public.user_profiles ADD COLUMN stripe_subscription_id TEXT;
    END IF;

    -- Contact info
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'phone') THEN
        ALTER TABLE public.user_profiles ADD COLUMN phone TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'address') THEN
        ALTER TABLE public.user_profiles ADD COLUMN address TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'city') THEN
        ALTER TABLE public.user_profiles ADD COLUMN city TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'country') THEN
        ALTER TABLE public.user_profiles ADD COLUMN country TEXT DEFAULT 'NZ';
    END IF;

    -- Account status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'is_active') THEN
        ALTER TABLE public.user_profiles ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'last_login_at') THEN
        ALTER TABLE public.user_profiles ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'admin_notes') THEN
        ALTER TABLE public.user_profiles ADD COLUMN admin_notes TEXT;
    END IF;
END $$;

-- ============================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON public.coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_dates ON public.coupons(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_payment_logs_user_id ON public.payment_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_status ON public.payment_logs(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_logs_pending ON public.payment_logs(payment_status) WHERE payment_status = 'pending_approval';
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON public.payment_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON public.admin_activity_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON public.admin_activity_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_activity_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription ON public.user_profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_next_billing ON public.user_profiles(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_user_profiles_plan ON public.user_profiles(plan);

-- ============================================
-- 6. ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
DROP POLICY IF EXISTS "Service role coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can view payment logs" ON public.payment_logs;
DROP POLICY IF EXISTS "Users can view own payments" ON public.payment_logs;
DROP POLICY IF EXISTS "Service role payment_logs" ON public.payment_logs;
DROP POLICY IF EXISTS "Admins can view activity logs" ON public.admin_activity_logs;
DROP POLICY IF EXISTS "Service role admin_logs" ON public.admin_activity_logs;

-- Coupons: Admin only access
CREATE POLICY "Admins can manage coupons" ON public.coupons FOR ALL
    USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Service role coupons" ON public.coupons FOR ALL
    TO service_role
    USING (true) WITH CHECK (true);

-- Payment Logs: Admin can see all, users can see own
CREATE POLICY "Admins can view payment logs" ON public.payment_logs FOR ALL
    USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can view own payments" ON public.payment_logs FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Service role payment_logs" ON public.payment_logs FOR ALL
    TO service_role
    USING (true) WITH CHECK (true);

-- Admin Activity Logs: Admin only view
CREATE POLICY "Admins can view activity logs" ON public.admin_activity_logs FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Service role admin_logs" ON public.admin_activity_logs FOR ALL
    TO service_role
    USING (true) WITH CHECK (true);

-- ============================================
-- 7. UPDATED_AT TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_coupons_updated_at ON public.coupons;
CREATE TRIGGER update_coupons_updated_at
    BEFORE UPDATE ON public.coupons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_logs_updated_at ON public.payment_logs;
CREATE TRIGGER update_payment_logs_updated_at
    BEFORE UPDATE ON public.payment_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. HELPER VIEWS
-- ============================================
CREATE OR REPLACE VIEW public.admin_user_overview AS
SELECT
    up.id,
    up.user_id,
    up.email,
    up.restaurant_name,
    up.role,
    up.subscription_status,
    up.plan,
    up.billing_interval,
    up.trial_start_date,
    up.trial_end_date,
    up.subscription_start_date,
    up.subscription_end_date,
    up.next_billing_date,
    up.payment_method,
    up.phone,
    up.city,
    up.country,
    up.is_active,
    up.last_login_at,
    up.created_at,
    (SELECT COUNT(*) FROM public.restaurants r WHERE r.user_id = up.user_id) as branch_count,
    (SELECT COALESCE(SUM(pl.amount), 0) FROM public.payment_logs pl WHERE pl.user_id = up.user_id AND pl.payment_status = 'completed') as total_paid
FROM public.user_profiles up;

-- Grant access to the view
GRANT SELECT ON public.admin_user_overview TO authenticated;
GRANT SELECT ON public.admin_user_overview TO service_role;
