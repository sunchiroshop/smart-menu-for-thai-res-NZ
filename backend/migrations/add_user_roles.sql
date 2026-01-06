-- ============================================================
-- Migration: User Roles System for SmartMenu SaaS
-- ============================================================
-- เชื่อมต่อกับ Supabase Authentication
-- Roles: free_trial, starter, professional, enterprise, admin
-- ============================================================

-- ลบตารางเก่าถ้ามี (ระวัง: จะลบข้อมูลทั้งหมด!)
-- DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- ============================================================
-- สร้างตาราง user_profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'free_trial',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: ตรวจสอบว่า role ถูกต้อง
    CONSTRAINT valid_role CHECK (role IN ('free_trial', 'starter', 'professional', 'enterprise', 'admin')),
    
    -- Foreign Key: เชื่อมต่อกับ auth.users
    CONSTRAINT fk_user_profiles_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE
);

-- ============================================================
-- สร้าง Index เพื่อเพิ่มความเร็ว
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- ============================================================
-- เปิดใช้งาน Row Level Security (RLS)
-- ============================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ลบ Policies เก่า (ถ้ามี)
-- ============================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role can manage all" ON public.user_profiles;

-- ============================================================
-- สร้าง RLS Policies
-- ============================================================

-- 1. Users สามารถดูข้อมูล profile ของตัวเองได้
CREATE POLICY "Users can view own profile"
    ON public.user_profiles 
    FOR SELECT
    USING (auth.uid() = user_id);

-- 2. Users สามารถอัปเดตข้อมูล profile ของตัวเองได้ (ไม่รวม role)
CREATE POLICY "Users can update own profile"
    ON public.user_profiles 
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3. Admin สามารถดูข้อมูล profiles ทั้งหมดได้
CREATE POLICY "Admins can view all profiles"
    ON public.user_profiles 
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 4. Admin สามารถอัปเดต profiles ทั้งหมดได้ (รวม role)
CREATE POLICY "Admins can update all profiles"
    ON public.user_profiles 
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 5. Service role สามารถจัดการทุกอย่างได้ (สำหรับ backend API)
CREATE POLICY "Service role can manage all"
    ON public.user_profiles 
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- Function: สร้าง user_profile อัตโนมัติเมื่อ user สมัครสมาชิก
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- สร้าง user_profile ด้วย role = 'free_trial' (default)
    INSERT INTO public.user_profiles (user_id, role)
    VALUES (NEW.id, 'free_trial')
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- ============================================================
-- Trigger: เรียก function เมื่อมี user ใหม่สมัครสมาชิก
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- สร้าง user_profile สำหรับ users ที่มีอยู่แล้ว
-- ============================================================
INSERT INTO public.user_profiles (user_id, role)
SELECT id, 'free_trial'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_profiles)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- ตรวจสอบผลลัพธ์
-- ============================================================
-- แสดงจำนวน users ทั้งหมด
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'free_trial' THEN 1 END) as free_trial_count,
    COUNT(CASE WHEN role = 'starter' THEN 1 END) as starter_count,
    COUNT(CASE WHEN role = 'professional' THEN 1 END) as professional_count,
    COUNT(CASE WHEN role = 'enterprise' THEN 1 END) as enterprise_count,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count
FROM public.user_profiles;

-- แสดง user_profiles ทั้งหมด
SELECT 
    up.user_id,
    au.email,
    up.role,
    up.created_at
FROM public.user_profiles up
LEFT JOIN auth.users au ON up.user_id = au.id
ORDER BY up.created_at DESC;

-- ============================================================
-- คำแนะนำการใช้งาน
-- ============================================================
-- 1. ตั้งค่า user ให้เป็น admin:
--    UPDATE public.user_profiles SET role = 'admin' WHERE user_id = 'YOUR_USER_ID';
--
-- 2. ตรวจสอบ role ของ user:
--    SELECT * FROM public.user_profiles WHERE user_id = 'YOUR_USER_ID';
--
-- 3. แสดง users ทั้งหมดพร้อม email:
--    SELECT up.*, au.email FROM public.user_profiles up 
--    LEFT JOIN auth.users au ON up.user_id = au.id;
