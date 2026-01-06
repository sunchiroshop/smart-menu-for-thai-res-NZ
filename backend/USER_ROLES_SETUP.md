# User Roles Setup Guide

## 📋 สร้างตาราง user_profiles ใน Supabase

### วิธีที่ 1: ใช้ Supabase Dashboard (แนะนำ)

1. **เปิด Supabase Dashboard**
   - ไปที่ https://app.supabase.com
   - เลือกโปรเจคของคุณ

2. **เปิด SQL Editor**
   - คลิกที่เมนู "SQL Editor" ทางซ้าย
   - คลิก "New query"

3. **รัน Migration Script**
   - เปิดไฟล์ `backend/migrations/add_user_roles.sql`
   - Copy เนื้อหาทั้งหมด
   - Paste ลงใน SQL Editor
   - คลิก "Run" หรือกด `Ctrl+Enter`

4. **ตรวจสอบผลลัพธ์**
   - ควรเห็นข้อความ "Success. No rows returned" หรือ "Success"
   - ไปที่ "Table Editor" ทางซ้าย
   - ตรวจสอบว่ามีตาราง `user_profiles` อยู่

### วิธีที่ 2: ใช้ API Endpoint (สำหรับตรวจสอบ)

```bash
# ตรวจสอบว่าตารางมีอยู่หรือไม่
curl http://localhost:8000/api/admin/check-table?user_id=YOUR_USER_ID

# Setup table (admin only)
curl -X POST http://localhost:8000/api/admin/setup-roles \
  -H "Content-Type: application/json" \
  -d '{"admin_user_id": "YOUR_ADMIN_USER_ID"}'
```

### วิธีที่ 3: ใช้ Python Script

```bash
cd backend
python scripts/setup_user_roles.py
```

---

## 🔧 สร้าง Admin User

หลังจากสร้างตารางแล้ว ให้สร้าง admin user:

### ใน Supabase SQL Editor:

```sql
-- 1. หา user_id ของคุณ (จาก auth.users)
SELECT id, email FROM auth.users;

-- 2. สร้าง user_profile สำหรับ user ของคุณ
INSERT INTO user_profiles (user_id, role)
VALUES ('YOUR_USER_ID_HERE', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- หรือถ้ามี profile อยู่แล้ว ให้ update
UPDATE user_profiles 
SET role = 'admin' 
WHERE user_id = 'YOUR_USER_ID_HERE';
```

---

## ✅ ตรวจสอบการทำงาน

### 1. ตรวจสอบว่าตารางมีอยู่

```bash
# เรียก API
GET http://localhost:8000/api/admin/check-table?user_id=YOUR_USER_ID
```

### 2. ตรวจสอบ Role ของ User

```bash
GET http://localhost:8000/api/user/role?user_id=YOUR_USER_ID
```

### 3. ทดสอบเปลี่ยน Role (Admin only)

```bash
POST http://localhost:8000/api/user/role
Content-Type: application/json

{
  "user_id": "USER_TO_CHANGE",
  "role": "professional",
  "admin_user_id": "YOUR_ADMIN_USER_ID"
}
```

---

## 🐛 Troubleshooting

### ปัญหา: "relation user_profiles does not exist"

**แก้ไข:**
1. ตรวจสอบว่าได้รัน migration SQL แล้วหรือยัง
2. ตรวจสอบว่าใช้ database ที่ถูกต้อง
3. ลองรัน migration SQL อีกครั้ง

### ปัญหา: "permission denied"

**แก้ไข:**
1. ตรวจสอบว่าใช้ Service Role Key (ไม่ใช่ Anon Key)
2. ตรวจสอบ RLS Policies ใน Supabase Dashboard
3. ตรวจสอบว่า user เป็น admin หรือไม่

### ปัญหา: "Supabase client not available"

**แก้ไข:**
1. ตรวจสอบว่า `.env` มี `SUPABASE_URL` และ `SUPABASE_SERVICE_ROLE_KEY`
2. Restart backend server
3. ตรวจสอบว่า Supabase credentials ถูกต้อง

---

## 📝 สรุป

1. ✅ รัน migration SQL ใน Supabase Dashboard
2. ✅ สร้าง admin user profile
3. ✅ ทดสอบ API endpoints
4. ✅ ใช้ Admin Panel ใน frontend (`/dashboard/admin`)

---

## 🔗 Related Files

- `backend/migrations/add_user_roles.sql` - Migration script
- `backend/services/user_role_service.py` - Role service
- `backend/main_ai.py` - API endpoints
- `webapp/app/dashboard/admin/page.tsx` - Admin UI

