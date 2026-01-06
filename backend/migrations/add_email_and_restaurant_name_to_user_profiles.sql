-- ============================================================
-- Migration: Add Email and Restaurant Name to user_profiles
-- ============================================================
-- เพิ่มคอลัมน์ email และ restaurant_name ในตาราง user_profiles
-- และสร้าง function/trigger เพื่อ sync ข้อมูลจาก auth.users และ restaurants
-- ============================================================

-- ============================================================
-- เพิ่มคอลัมน์ใหม่
-- ============================================================

-- เพิ่มคอลัมน์ email (sync จาก auth.users)
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS email TEXT;

-- เพิ่มคอลัมน์ restaurant_name (sync จาก restaurants table)
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS restaurant_name TEXT;

-- เพิ่ม index สำหรับ email เพื่อเพิ่มความเร็วในการค้นหา
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- ============================================================
-- Function: Sync email จาก auth.users
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
    -- อัปเดต email ใน user_profiles เมื่อ email ใน auth.users เปลี่ยน
    UPDATE public.user_profiles
    SET email = NEW.email,
        updated_at = NOW()
    WHERE user_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Function: Sync restaurant_name จาก restaurants
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_restaurant_name()
RETURNS TRIGGER AS $$
BEGIN
    -- อัปเดต restaurant_name ใน user_profiles เมื่อชื่อร้านใน restaurants เปลี่ยน
    UPDATE public.user_profiles
    SET restaurant_name = NEW.name,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Function: Sync email และ restaurant_name เมื่อสร้าง user_profiles ใหม่
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_user_profile_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync email จาก auth.users
    UPDATE public.user_profiles
    SET email = (
        SELECT email FROM auth.users WHERE id = NEW.user_id
    )
    WHERE user_id = NEW.user_id;
    
    -- Sync restaurant_name จาก restaurants
    UPDATE public.user_profiles
    SET restaurant_name = (
        SELECT name FROM public.restaurants WHERE user_id = NEW.user_id LIMIT 1
    )
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Triggers: Sync ข้อมูลอัตโนมัติ
-- ============================================================

-- Trigger: Sync email เมื่อ auth.users.email เปลี่ยน
DROP TRIGGER IF EXISTS sync_email_on_user_update ON auth.users;
CREATE TRIGGER sync_email_on_user_update
    AFTER UPDATE OF email ON auth.users
    FOR EACH ROW
    WHEN (OLD.email IS DISTINCT FROM NEW.email)
    EXECUTE FUNCTION public.sync_user_email();

-- Trigger: Sync restaurant_name เมื่อ restaurants.name เปลี่ยน
DROP TRIGGER IF EXISTS sync_restaurant_name_on_update ON public.restaurants;
CREATE TRIGGER sync_restaurant_name_on_update
    AFTER UPDATE OF name ON public.restaurants
    FOR EACH ROW
    WHEN (OLD.name IS DISTINCT FROM NEW.name)
    EXECUTE FUNCTION public.sync_restaurant_name();

-- Trigger: Sync restaurant_name เมื่อสร้าง restaurant ใหม่
DROP TRIGGER IF EXISTS sync_restaurant_name_on_insert ON public.restaurants;
CREATE TRIGGER sync_restaurant_name_on_insert
    AFTER INSERT ON public.restaurants
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_restaurant_name();

-- Trigger: Sync email และ restaurant_name เมื่อสร้าง user_profiles ใหม่
DROP TRIGGER IF EXISTS sync_user_profile_data_on_insert ON public.user_profiles;
CREATE TRIGGER sync_user_profile_data_on_insert
    AFTER INSERT ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_user_profile_data();

-- ============================================================
-- อัปเดตข้อมูลที่มีอยู่แล้ว (Initial Sync)
-- ============================================================

-- Sync email จาก auth.users สำหรับ user_profiles ที่มีอยู่แล้ว
UPDATE public.user_profiles up
SET email = au.email,
    updated_at = NOW()
FROM auth.users au
WHERE up.user_id = au.id
  AND (up.email IS NULL OR up.email != au.email);

-- Sync restaurant_name จาก restaurants สำหรับ user_profiles ที่มีอยู่แล้ว
UPDATE public.user_profiles up
SET restaurant_name = r.name,
    updated_at = NOW()
FROM public.restaurants r
WHERE up.user_id = r.user_id
  AND (up.restaurant_name IS NULL OR up.restaurant_name != r.name);

-- ============================================================
-- View: user_profiles_with_details (Optional - สำหรับดูข้อมูลรวม)
-- ============================================================
CREATE OR REPLACE VIEW public.user_profiles_with_details AS
SELECT 
    up.id,
    up.user_id,
    up.role,
    up.email,
    up.restaurant_name,
    up.created_at,
    up.updated_at,
    au.email AS auth_email,  -- Email จาก auth.users (สำหรับตรวจสอบ)
    r.name AS restaurant_name_from_table,  -- ชื่อร้านจาก restaurants (สำหรับตรวจสอบ)
    r.id AS restaurant_id
FROM public.user_profiles up
LEFT JOIN auth.users au ON up.user_id = au.id
LEFT JOIN public.restaurants r ON up.user_id = r.user_id;

-- ============================================================
-- Comments สำหรับ Documentation
-- ============================================================
COMMENT ON COLUMN public.user_profiles.email IS 'Email address synced from auth.users table';
COMMENT ON COLUMN public.user_profiles.restaurant_name IS 'Restaurant name synced from restaurants table';

-- ============================================================
-- Verification Queries (Optional - run after migration)
-- ============================================================
-- ตรวจสอบว่าคอลัมน์ถูกเพิ่มแล้ว
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'user_profiles'
-- AND column_name IN ('email', 'restaurant_name');

-- ตรวจสอบข้อมูลที่ sync แล้ว
-- SELECT 
--     up.user_id,
--     up.email,
--     up.restaurant_name,
--     au.email AS auth_email,
--     r.name AS restaurant_name_from_table
-- FROM public.user_profiles up
-- LEFT JOIN auth.users au ON up.user_id = au.id
-- LEFT JOIN public.restaurants r ON up.user_id = r.user_id
-- LIMIT 10;

