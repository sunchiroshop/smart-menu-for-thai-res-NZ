# 🚀 Quick Setup Guide: User Roles System

## Step 1: รัน Migration SQL ใน Supabase

### 1.1 เปิด Supabase Dashboard
1. ไปที่ https://app.supabase.com
2. เลือกโปรเจค "Smart Menu Thai Res NZ"
3. คลิก **SQL Editor** (ทางซ้าย)

### 1.2 รัน Migration
1. คลิก **New query**
2. เปิดไฟล์ `backend/migrations/add_user_roles.sql`
3. **Copy ทั้งหมด** (Ctrl+A, Ctrl+C)
4. **Paste** ลงใน SQL Editor
5. คลิก **Run** (หรือกด Ctrl+Enter)

### 1.3 ตรวจสอบผลลัพธ์
หลังจากรัน SQL แล้ว คุณจะเห็น:
- ตารางสรุปจำนวน users แต่ละ role
- รายชื่อ users พร้อม email และ role

---

## Step 2: ตั้งค่า Admin User

### หา User ID ของคุณ:
```sql
-- รัน SQL นี้เพื่อหา user_id ของคุณ
SELECT id, email FROM auth.users;
```

### ตั้งค่าให้เป็น Admin:
```sql
-- แทนที่ YOUR_USER_ID_HERE ด้วย user_id จริง
UPDATE public.user_profiles 
SET role = 'admin' 
WHERE user_id = 'YOUR_USER_ID_HERE';

-- ตรวจสอบว่าอัปเดตแล้ว
SELECT * FROM public.user_profiles WHERE role = 'admin';
```

---

## Step 3: ทดสอบการทำงาน

### ในหน้าเว็บ:
1. **Restart Backend Server** (ถ้ายังรันอยู่)
2. **Refresh Browser** (F5)
3. ไปที่ `/dashboard`
   - ควรเห็น "Current Plan: Enterprise" (เพราะ admin → enterprise features)
4. ไปที่ `/dashboard/settings`
   - ควรเห็น "Role: Admin" ที่มุมขวาบน
   - ควรเห็นส่วน "Admin: Change Package/Role"
   - ควรแก้ Theme Color ได้
   - ควรอัปโหลด Banner ได้

### ทดสอบเปลี่ยน Role:
1. ไปที่ `/dashboard/settings`
2. Scroll ลงไปส่วน "Admin: Change Package/Role"
3. เลือก role ต่างๆ เช่น:
   - **Starter** → ดู Theme Color ถูก lock
   - **Professional** → แก้ Theme Color ได้
   - **Enterprise** → อัปโหลด Banner ได้
   - **Admin** → ทำได้ทุกอย่างไม่จำกัด

---

## Step 4: ตรวจสอบใน Supabase

### ดู Table Editor:
1. ไปที่ **Table Editor** ทางซ้าย
2. เลือกตาราง `user_profiles`
3. ตรวจสอบว่ามี columns:
   - `id` (UUID)
   - `user_id` (UUID) ← เชื่อมกับ `auth.users`
   - `role` (TEXT)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

### ดู Policies:
1. ไปที่ **Authentication** > **Policies**
2. เลือกตาราง `user_profiles`
3. ตรวจสอบว่ามี 5 policies:
   - Users can view own profile
   - Users can update own profile
   - Admins can view all profiles
   - Admins can update all profiles
   - Service role can manage all

---

## 🐛 Troubleshooting

### ปัญหา: "ยังแสดง Free Trial อยู่"
**แก้ไข:**
1. ตรวจสอบว่ารัน migration SQL แล้ว
2. ตรวจสอบว่าตั้งค่า role เป็น admin แล้วใน Supabase
3. Restart backend server
4. Refresh browser (F5 หรือ Ctrl+Shift+R)

### ปัญหา: "ไม่สามารถแก้ไขได้"
**แก้ไข:**
1. ตรวจสอบว่า role เป็น admin ใน Supabase
2. ตรวจสอบ Console ว่ามี error อะไร
3. ลองเปลี่ยน role ในหน้า Settings

### ปัญหา: "Current Plan ไม่เปลี่ยน"
**แก้ไข:**
1. Refresh browser ทั้งหมด (Ctrl+Shift+R)
2. ล้าง localStorage: `localStorage.clear()` ใน Console
3. ตรวจสอบว่า API `/api/user/profile` return role ถูกต้อง

---

## 📊 Role Permissions Summary

| Role | Image Generation | Image Enhancement | OCR | Theme Color | Banner Upload |
|------|-----------------|-------------------|-----|-------------|---------------|
| **Free Trial** | 2 | 1 | 10 | ❌ | ❌ |
| **Starter** | 30/month | 30/month | 30/month | ❌ | ❌ |
| **Professional** | 70/month | 70/month | 70/month | ✅ | ❌ |
| **Enterprise** | 200/month | 200/month | 200/month | ✅ | ✅ |
| **Admin** | **Unlimited** | **Unlimited** | **Unlimited** | ✅ | ✅ |

---

## ✅ Checklist

- [ ] รัน migration SQL ใน Supabase
- [ ] ตรวจสอบว่าตาราง `user_profiles` ถูกสร้างแล้ว
- [ ] ตั้งค่า user เป็น admin
- [ ] Restart backend server
- [ ] Refresh browser
- [ ] ทดสอบเปลี่ยน role
- [ ] ทดสอบ permissions (Theme Color, Banner Upload)
- [ ] ทดสอบ AI features (Image Generation, Enhancement, OCR)

---

## 🎯 Testing Mode (ไม่ต้องใช้ Supabase)

ถ้ายังไม่ได้ตั้งค่า Supabase:
- ระบบจะใช้ `user_id = 'default'`
- Backend จะ return `role = 'admin'` อัตโนมัติ
- สามารถทดสอบทุกฟีเจอร์ได้ทันที
- ไม่ต้องสร้างตารางก็ทดสอบได้

---

## 📝 SQL Commands สำหรับ Admin

```sql
-- ดู users ทั้งหมดพร้อม role
SELECT 
    up.user_id,
    au.email,
    up.role,
    up.created_at,
    up.updated_at
FROM public.user_profiles up
LEFT JOIN auth.users au ON up.user_id = au.id
ORDER BY up.created_at DESC;

-- ตั้งค่า user เป็น admin
UPDATE public.user_profiles 
SET role = 'admin', updated_at = NOW()
WHERE user_id = 'YOUR_USER_ID_HERE';

-- เปลี่ยน role ของ user ทั้งหมดเป็น admin (ระวัง!)
UPDATE public.user_profiles SET role = 'admin';

-- ลบ user_profile (จะถูกสร้างใหม่อัตโนมัติถ้ามี trigger)
DELETE FROM public.user_profiles WHERE user_id = 'USER_ID';

-- นับจำนวน users แต่ละ role
SELECT role, COUNT(*) as count 
FROM public.user_profiles 
GROUP BY role;
```

