# 🎨 Customization Guide - Theme Color & Cover Image

## 📋 Overview

ระบบ Customization ช่วยให้ร้านค้าปรับแต่งหน้าตาเมนูได้ตามต้องการ:
- **Theme Color**: สีหลักสำหรับ buttons, borders, และ active states
- **Cover Image**: รูปปก (Banner) สำหรับแสดงที่ด้านบนของเมนู

---

## 🗄️ Database Schema

### Migration Script
รัน migration script เพื่อเพิ่ม columns ใหม่:

```sql
-- File: backend/migrations/add_customization_to_restaurants.sql
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT '#000000';

ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
```

### Columns:
- `theme_color`: TEXT (default: '#000000')
  - สีหลักในรูปแบบ hex (#RRGGBB)
  - ใช้กับ buttons, borders, active states
  
- `cover_image_url`: TEXT (nullable)
  - URL ของรูปปกที่เก็บใน Supabase Storage (bucket: `shop_assets`)

---

## 📡 API Endpoints

### 1. Get Customization
```bash
GET /api/customization/{restaurant_id}
```

**Response:**
```json
{
    "success": true,
    "restaurant_id": "rest_123",
    "theme_color": "#000000",
    "cover_image_url": "https://...",
    "note": "Default values. Database integration needed."
}
```

---

### 2. Update Theme Color
```bash
POST /api/customization/theme-color
Content-Type: application/json

{
    "restaurant_id": "rest_123",
    "theme_color": "#FF5733",
    "user_id": "user_123"
}
```

**Plan Requirements:**
- ✅ **Starter**: ไม่สามารถปรับได้
- ✅ **Standard/Pro**: ปรับได้
- ✅ **Premium**: ปรับได้

**Response:**
```json
{
    "success": true,
    "restaurant_id": "rest_123",
    "theme_color": "#FF5733",
    "plan": "pro",
    "message": "Theme color updated to #FF5733"
}
```

**Error (Starter Plan):**
```json
{
    "detail": {
        "error": "Plan restriction",
        "message": "Theme color customization is not available in Starter plan. Please upgrade to Standard or Premium plan.",
        "current_plan": "starter"
    }
}
```

---

### 3. Upload Cover Image
```bash
POST /api/customization/cover-image
Content-Type: multipart/form-data

restaurant_id: "rest_123"
file: [image file]
user_id: "user_123"
```

**Plan Requirements:**
- ❌ **Starter**: ไม่สามารถอัปโหลดได้
- ❌ **Standard/Pro**: ไม่สามารถอัปโหลดได้
- ✅ **Premium**: อัปโหลดได้

**File Requirements:**
- Format: JPEG, PNG, WebP
- Max Size: 10MB

**Response:**
```json
{
    "success": true,
    "restaurant_id": "rest_123",
    "cover_image_url": "https://xxx.supabase.co/storage/v1/object/public/shop_assets/rest_123/20241204_123456_abc123.png",
    "plan": "premium",
    "message": "Cover image uploaded successfully"
}
```

**Error (Non-Premium Plan):**
```json
{
    "detail": {
        "error": "Plan restriction",
        "message": "Cover image upload is only available in Premium plan. Please upgrade to Premium plan.",
        "current_plan": "pro"
    }
}
```

---

### 4. Delete Cover Image
```bash
DELETE /api/customization/cover-image/{restaurant_id}
Content-Type: application/x-www-form-urlencoded

user_id: "user_123"
```

**Plan Requirements:**
- ✅ **Premium**: ลบได้

**Response:**
```json
{
    "success": true,
    "restaurant_id": "rest_123",
    "message": "Cover image deleted successfully"
}
```

---

## 🎨 Theme Color Usage

### Frontend Implementation:

```css
/* Use theme_color for interactive elements */
.button-primary {
    background-color: var(--theme-color);
    border-color: var(--theme-color);
}

.button-primary:hover {
    background-color: var(--theme-color-dark);
    border-color: var(--theme-color-dark);
}

.border-active {
    border-color: var(--theme-color);
}

.active-state {
    color: var(--theme-color);
}
```

### Accessibility:
- **Text Color**: ใช้สีขาว/ดำมาตรฐานเสมอ (เพื่อให้อ่านง่าย)
- **Background**: ใช้สีขาว/เทาอ่อนมาตรฐาน
- **Theme Color**: ใช้เฉพาะกับ interactive elements เท่านั้น

---

## 📦 Supabase Storage Setup

### Create Bucket: `shop_assets`

1. ไปที่ Supabase Dashboard → Storage
2. สร้าง bucket ใหม่ชื่อ `shop_assets`
3. ตั้งค่าเป็น **Public** bucket
4. ตั้งค่า Policies:
   - **Upload**: Authenticated users only
   - **View**: Public

---

## 🔐 Plan Restrictions Summary

| Feature | Starter | Standard/Pro | Premium |
|---------|---------|--------------|---------|
| Theme Color | ❌ | ✅ | ✅ |
| Cover Image | ❌ | ❌ | ✅ |

---

## 💻 Frontend Integration Example

```typescript
// 1. Get customization
const getCustomization = async (restaurantId: string) => {
    const response = await fetch(`/api/customization/${restaurantId}`);
    return response.json();
};

// 2. Update theme color
const updateThemeColor = async (
    restaurantId: string,
    themeColor: string,
    userId: string
) => {
    const response = await fetch('/api/customization/theme-color', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            restaurant_id: restaurantId,
            theme_color: themeColor,
            user_id: userId
        })
    });
    
    if (response.status === 403) {
        const error = await response.json();
        // Show upgrade prompt
        alert(error.detail.message);
        return null;
    }
    
    return response.json();
};

// 3. Upload cover image
const uploadCoverImage = async (
    restaurantId: string,
    file: File,
    userId: string
) => {
    const formData = new FormData();
    formData.append('restaurant_id', restaurantId);
    formData.append('file', file);
    formData.append('user_id', userId);
    
    const response = await fetch('/api/customization/cover-image', {
        method: 'POST',
        body: formData
    });
    
    if (response.status === 403) {
        const error = await response.json();
        alert(error.detail.message);
        return null;
    }
    
    return response.json();
};
```

---

## 🧪 Testing

```bash
# Test get customization
curl http://localhost:8000/api/customization/rest_123

# Test update theme color
curl -X POST http://localhost:8000/api/customization/theme-color \
  -H "Content-Type: application/json" \
  -d '{
    "restaurant_id": "rest_123",
    "theme_color": "#FF5733",
    "user_id": "user_123"
  }'

# Test upload cover image
curl -X POST http://localhost:8000/api/customization/cover-image \
  -F "restaurant_id=rest_123" \
  -F "file=@banner.jpg" \
  -F "user_id=user_123"
```

---

## 📝 Notes

1. **Database Integration**: ตอนนี้ endpoints ยังไม่เชื่อมต่อกับ database จริง ต้องเพิ่ม logic สำหรับ:
   - Query `theme_color` และ `cover_image_url` จาก `restaurants` table
   - Update `theme_color` และ `cover_image_url` ใน database

2. **Supabase Bucket**: ต้องสร้าง bucket `shop_assets` ใน Supabase Storage ก่อนใช้งาน

3. **Plan Checking**: ระบบจะตรวจสอบ plan ของ user ก่อนอนุญาตให้ใช้งาน features

4. **Default Values**: ถ้า user ไม่ได้ตั้งค่า จะใช้ค่า default:
   - Theme Color: `#000000`
   - Cover Image: `null` (แสดงสี theme color หรือรูป default แทน)

---

## 🚀 Next Steps

1. ✅ Run database migration
2. ✅ Create `shop_assets` bucket in Supabase
3. ⏳ Integrate database queries in endpoints
4. ⏳ Add frontend UI for customization
5. ⏳ Test with different plan levels

