# 👤 User Profile & Billing Management API

## 📋 Overview

API endpoints สำหรับจัดการ User Profile และ Billing Management

---

## 🔌 API Endpoints

### 1. Get User Profile
```http
GET /api/user/profile?user_id={user_id}&restaurant_id={restaurant_id}
```

**Query Parameters:**
- `user_id` (required): User ID
- `restaurant_id` (optional): Restaurant ID (ถ้าไม่ระบุจะดึงร้านแรกของ user)

**Response:**
```json
{
  "success": true,
  "user_id": "user_123",
  "restaurant": {
    "restaurant_id": "rest_123",
    "name": "My Restaurant",
    "phone": "+64 21 123 4567",
    "email": "restaurant@example.com",
    "address": "123 Main St, Auckland, NZ",
    "logo_url": "https://...",
    "theme_color": "#000000",
    "cover_image_url": "https://..."
  },
  "subscription": {
    "plan": "pro",
    "status": "active",
    "is_subscribed": true,
    "trial_days_remaining": 0,
    "current_period_end": "2024-12-31T23:59:59",
    "next_billing_date": "2024-12-31T23:59:59",
    "cancel_at_period_end": false
  }
}
```

---

### 2. Update User Profile
```http
PUT /api/user/profile
Content-Type: application/json

{
  "restaurant_id": "rest_123",
  "user_id": "user_123",
  "name": "Updated Restaurant Name",
  "phone": "+64 21 999 9999",
  "email": "newemail@example.com",
  "address": "New Address",
  "theme_color": "#FF5733"
}
```

**Plan Restrictions:**
- **Starter**: ไม่สามารถแก้ Theme Color ได้
- **Pro/Premium**: แก้ได้ทั้งหมด

**Response:**
```json
{
  "success": true,
  "restaurant_id": "rest_123",
  "plan": "pro",
  "updated_fields": {
    "name": "Updated Restaurant Name",
    "phone": "+64 21 999 9999",
    "email": "newemail@example.com",
    "address": "New Address",
    "theme_color": "#FF5733"
  },
  "message": "Profile updated successfully"
}
```

**Error (Starter Plan trying to change theme):**
```json
{
  "detail": {
    "error": "Plan restriction",
    "message": "Theme color customization is not available in Starter plan. Please upgrade to Pro or Premium plan.",
    "current_plan": "starter"
  }
}
```

---

### 3. Create Stripe Customer Portal Session
```http
POST /api/billing/create-portal-session
Content-Type: application/json

{
  "user_id": "user_123",
  "customer_id": "cus_xxx",
  "return_url": "http://localhost:3000/dashboard/settings?tab=billing"
}
```

**Response:**
```json
{
  "success": true,
  "portal_url": "https://billing.stripe.com/p/session/xxx",
  "message": "Portal session created successfully"
}
```

**Usage:**
```typescript
const portalUrl = await createPortalSession(userId, customerId);
window.location.href = portalUrl; // Redirect to Stripe Customer Portal
```

---

## 🎨 Frontend Integration

### Settings Page Structure

**Route:** `/dashboard/settings`

**Tabs:**
1. **Profile & Branding**
   - Restaurant Information Form
   - Theme Color Picker (with real-time preview)
   - Logo Upload
   - Banner Upload (Premium only)

2. **Subscription & Billing**
   - Current Plan Card
   - Status Badge
   - Next Billing Date
   - Manage Subscription Button

---

## 🔐 Plan Restrictions

| Feature | Starter | Pro | Premium |
|---------|---------|-----|---------|
| Edit Name/Phone/Email | ✅ | ✅ | ✅ |
| Theme Color | ❌ | ✅ | ✅ |
| Logo Upload | ✅ | ✅ | ✅ |
| Banner Upload | ❌ | ❌ | ✅ |

---

## 📝 Notes

1. **Database Integration**: ตอนนี้ endpoints ยังใช้ mock data ต้องเพิ่ม logic สำหรับ:
   - Query `restaurants` table จาก Supabase
   - Query subscription data จาก Stripe API หรือ database
   - Update `restaurants` table เมื่อมีการแก้ไข

2. **Stripe Customer ID**: ต้องเก็บ `customer_id` ใน database หรือดึงจาก Stripe subscription metadata

3. **Authentication**: ต้องเพิ่ม authentication middleware เพื่อตรวจสอบว่า user มีสิทธิ์เข้าถึงข้อมูลหรือไม่

4. **File Upload**: Logo และ Banner จะอัปโหลดไป Supabase Storage (bucket: `shop_assets`)

---

## 🧪 Testing

```bash
# Get profile
curl "http://localhost:8000/api/user/profile?user_id=user_123"

# Update profile
curl -X PUT http://localhost:8000/api/user/profile \
  -H "Content-Type: application/json" \
  -d '{
    "restaurant_id": "rest_123",
    "user_id": "user_123",
    "name": "Test Restaurant",
    "theme_color": "#FF5733"
  }'

# Create portal session
curl -X POST http://localhost:8000/api/billing/create-portal-session \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_123",
    "customer_id": "cus_xxx"
  }'
```

