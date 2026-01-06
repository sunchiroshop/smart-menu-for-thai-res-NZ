# 🔧 แก้ไขปัญหา Supabase Upload (403 Error)

## ปัญหาที่พบ:
```
Error 403: new row violates row-level security policy
```

## สาเหตุ:
1. **ใช้ Anon Key แทน Service Role Key** → Anon Key มี RLS (Row Level Security) restrictions
2. **Storage Bucket Policies** → อาจต้องตั้งค่า policies ให้อนุญาตการ upload

---

## ✅ วิธีแก้ไข:

### 1. เพิ่ม SUPABASE_SERVICE_ROLE_KEY ใน .env

**ขั้นตอน:**
1. ไปที่ Supabase Dashboard: https://supabase.com/dashboard
2. เลือก Project ของคุณ
3. ไปที่ **Settings** → **API**
4. คัดลอก **`service_role` key** (NOT `anon` key)
5. เพิ่มในไฟล์ `.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # ← เพิ่มบรรทัดนี้
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # สำหรับ frontend
```

**⚠️ สำคัญ:**
- `SUPABASE_SERVICE_ROLE_KEY` = สำหรับ backend (bypasses RLS)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = สำหรับ frontend (มี RLS restrictions)

---

### 2. ตรวจสอบ Storage Bucket Policies

**ขั้นตอน:**
1. ไปที่ Supabase Dashboard → **Storage** → **Policies**
2. เลือก bucket `menu-images`
3. ตรวจสอบว่ามี policies ที่อนุญาตการ upload หรือไม่

**ถ้าไม่มี policies:**
- สร้าง policy ใหม่:
  - Policy Name: `Allow authenticated uploads`
  - Allowed operation: `INSERT`
  - Target roles: `authenticated` หรือ `service_role`

**หรือใช้ Service Role Key** (แนะนำ) → จะ bypass RLS policies ทั้งหมด

---

### 3. ทดสอบอีกครั้ง

หลังจากเพิ่ม `SUPABASE_SERVICE_ROLE_KEY` แล้ว:

```bash
cd backend
python check_supabase_config.py
python test_upload_to_supabase.py
```

---

## 📋 Checklist:

- [ ] เพิ่ม `SUPABASE_SERVICE_ROLE_KEY` ใน `.env`
- [ ] Restart backend server (ถ้ากำลังรันอยู่)
- [ ] รัน `check_supabase_config.py` เพื่อตรวจสอบ
- [ ] รัน `test_upload_to_supabase.py` เพื่อทดสอบ upload
- [ ] ตรวจสอบ Supabase Dashboard → Storage → `menu-images` bucket

---

## 🔍 ตรวจสอบว่าใช้ Key ไหน:

รันคำสั่งนี้เพื่อดูว่าใช้ key ไหน:
```bash
python check_supabase_config.py
```

ควรเห็น:
```
✅ SUPABASE_SERVICE_ROLE_KEY: Found (...)
   ✅ Using Service Role Key - This bypasses RLS policies
```

---

## 💡 Tips:

1. **Service Role Key** = มีสิทธิ์เต็ม (bypass RLS) → ใช้สำหรับ backend
2. **Anon Key** = มี RLS restrictions → ใช้สำหรับ frontend
3. **อย่า commit Service Role Key** → เพิ่มใน `.gitignore` (มีอยู่แล้ว)

---

## 🆘 ถ้ายังไม่ได้:

1. ตรวจสอบว่า bucket `menu-images` มีอยู่จริงใน Supabase Dashboard
2. ตรวจสอบว่า bucket เป็น **Public** หรือไม่
3. ตรวจสอบ Storage Policies ใน Supabase Dashboard
4. ลองสร้าง bucket ใหม่ชื่อ `menu-images` (ถ้ายังไม่มี)

