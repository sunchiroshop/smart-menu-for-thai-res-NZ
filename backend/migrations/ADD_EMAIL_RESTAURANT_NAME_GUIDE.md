# คู่มือการเพิ่ม Email และ Restaurant Name ใน user_profiles

## 📋 ภาพรวม

Migration นี้จะเพิ่มคอลัมน์ `email` และ `restaurant_name` ในตาราง `user_profiles` และสร้าง triggers เพื่อ sync ข้อมูลอัตโนมัติจาก:
- **Email**: จาก `auth.users` table
- **Restaurant Name**: จาก `restaurants` table

## 🚀 วิธีใช้งาน

### ขั้นตอนที่ 1: รัน Migration ใน Supabase

1. เปิด **Supabase Dashboard**
2. ไปที่ **SQL Editor**
3. Copy เนื้อหาจากไฟล์ `backend/migrations/add_email_and_restaurant_name_to_user_profiles.sql`
4. Paste และรัน SQL ใน Supabase SQL Editor
5. ตรวจสอบว่ามีข้อความ "Success" หรือไม่

### ขั้นตอนที่ 2: ตรวจสอบผลลัพธ์

1. ไปที่ **Table Editor** ใน Supabase
2. เลือกตาราง `user_profiles`
3. ตรวจสอบว่ามีคอลัมน์ `email` และ `restaurant_name` ปรากฏขึ้น
4. ตรวจสอบว่าข้อมูลถูก sync แล้ว (email และ restaurant_name ควรมีค่า)

## 📊 โครงสร้างตารางหลัง Migration

```sql
user_profiles
├── id (UUID, Primary Key)
├── user_id (UUID, Foreign Key → auth.users.id)
├── role (TEXT)
├── email (TEXT) ← ใหม่! Sync จาก auth.users
├── restaurant_name (TEXT) ← ใหม่! Sync จาก restaurants
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

## 🔄 Triggers ที่ถูกสร้าง

### 1. `sync_email_on_user_update`
- **เมื่อ**: Email ใน `auth.users` เปลี่ยน
- **ทำอะไร**: อัปเดต `email` ใน `user_profiles` อัตโนมัติ

### 2. `sync_restaurant_name_on_update`
- **เมื่อ**: ชื่อร้านใน `restaurants` เปลี่ยน
- **ทำอะไร**: อัปเดต `restaurant_name` ใน `user_profiles` อัตโนมัติ

### 3. `sync_restaurant_name_on_insert`
- **เมื่อ**: สร้าง restaurant ใหม่
- **ทำอะไร**: อัปเดต `restaurant_name` ใน `user_profiles` อัตโนมัติ

### 4. `sync_user_profile_data_on_insert`
- **เมื่อ**: สร้าง `user_profiles` ใหม่
- **ทำอะไร**: Sync `email` และ `restaurant_name` ทันที

## 🔍 การตรวจสอบข้อมูล

### Query 1: ดูข้อมูลทั้งหมดใน user_profiles
```sql
SELECT 
    id,
    user_id,
    role,
    email,
    restaurant_name,
    created_at,
    updated_at
FROM public.user_profiles
ORDER BY created_at DESC;
```

### Query 2: ตรวจสอบว่าข้อมูล sync ถูกต้องหรือไม่
```sql
SELECT 
    up.user_id,
    up.email AS profile_email,
    au.email AS auth_email,
    up.restaurant_name AS profile_restaurant_name,
    r.name AS restaurant_name_from_table
FROM public.user_profiles up
LEFT JOIN auth.users au ON up.user_id = au.id
LEFT JOIN public.restaurants r ON up.user_id = r.user_id
WHERE up.email IS NULL 
   OR up.restaurant_name IS NULL
   OR up.email != au.email
   OR up.restaurant_name != r.name;
```

### Query 3: ใช้ View ที่สร้างไว้ (user_profiles_with_details)
```sql
SELECT * FROM public.user_profiles_with_details
ORDER BY created_at DESC;
```

## 🛠️ การ Sync ข้อมูลด้วยตนเอง (ถ้าจำเป็น)

### Sync Email ทั้งหมด
```sql
UPDATE public.user_profiles up
SET email = au.email,
    updated_at = NOW()
FROM auth.users au
WHERE up.user_id = au.id
  AND (up.email IS NULL OR up.email != au.email);
```

### Sync Restaurant Name ทั้งหมด
```sql
UPDATE public.user_profiles up
SET restaurant_name = r.name,
    updated_at = NOW()
FROM public.restaurants r
WHERE up.user_id = r.user_id
  AND (up.restaurant_name IS NULL OR up.restaurant_name != r.name);
```

## 📝 หมายเหตุ

1. **Email**: จะ sync อัตโนมัติจาก `auth.users.email` เมื่อมีการเปลี่ยนแปลง
2. **Restaurant Name**: จะ sync อัตโนมัติจาก `restaurants.name` เมื่อมีการเปลี่ยนแปลง
3. **Initial Sync**: Migration จะ sync ข้อมูลที่มีอยู่แล้วอัตโนมัติ
4. **Performance**: มี index บน `email` เพื่อเพิ่มความเร็วในการค้นหา

## 🔗 API Endpoints ที่เกี่ยวข้อง

### GET `/api/admin/users`
- ดึงรายชื่อ users ทั้งหมด (admin only)
- ตอนนี้จะ return `email` และ `restaurant_name` ด้วย

### GET `/api/user/profile`
- ดึงข้อมูล user profile
- ข้อมูล email และ restaurant_name จะถูก return ใน response

## ⚠️ Troubleshooting

### ปัญหา: Email ไม่ sync
- **สาเหตุ**: Trigger อาจไม่ทำงาน
- **แก้ไข**: รัน query sync email ด้วยตนเอง (ดูด้านบน)

### ปัญหา: Restaurant Name เป็น NULL
- **สาเหตุ**: User อาจยังไม่มี restaurant
- **แก้ไข**: สร้าง restaurant สำหรับ user นั้นก่อน

### ปัญหา: ข้อมูลไม่ตรงกัน
- **สาเหตุ**: Trigger อาจไม่ทำงาน หรือข้อมูลถูกแก้ไขด้วยตนเอง
- **แก้ไข**: รัน query sync ทั้งหมดด้วยตนเอง (ดูด้านบน)

## ✅ Checklist

- [ ] รัน migration SQL ใน Supabase
- [ ] ตรวจสอบว่าคอลัมน์ถูกเพิ่มแล้ว
- [ ] ตรวจสอบว่าข้อมูลถูก sync แล้ว
- [ ] ทดสอบ API endpoints
- [ ] ตรวจสอบว่า triggers ทำงานถูกต้อง

