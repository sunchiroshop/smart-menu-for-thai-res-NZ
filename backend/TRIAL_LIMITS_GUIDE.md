# 📋 Trial Limits Guide - ระบบจำกัดการใช้งาน

## 🎯 ข้อจำกัดสำหรับ Free Trial (14 วัน)

### Limits:
- **Menu Items**: 20 รายการ
- **Image Generation**: 5 ภาพ
- **Image Enhancement**: 5 ภาพ

### Subscribed Users:
ข้อจำกัดขึ้นอยู่กับ **Package/Plan** ที่ซื้อ:

#### Starter Plan ($39/month):
- **Menu Items**: 30 รายการ
- **Image Generation**: 30 ภาพ/เดือน
- **Image Enhancement**: 30 ภาพ/เดือน

#### Professional Plan ($89/month):
- **Menu Items**: Unlimited (ไม่จำกัด)
- **Image Generation**: 200 ภาพ/เดือน
- **Image Enhancement**: 200 ภาพ/เดือน

#### Enterprise Plan ($199/month):
- **Menu Items**: Unlimited (ไม่จำกัด)
- **Image Generation**: 500 ภาพ/เดือน
- **Image Enhancement**: 500 ภาพ/เดือน

---

## 📡 API Endpoints

### 1. **Image Generation** - `/api/ai/generate-image`
```json
POST /api/ai/generate-image
{
    "dish_name": "Pad Thai",
    "description": "Traditional Thai stir-fried noodles",
    "cuisine_type": "Thai",
    "style": "professional",
    "user_id": "user_123"  // Required for trial limits
}
```

**Response:**
```json
{
    "success": true,
    "generated_image": "data:image/png;base64,...",
    "generated_image_url": "https://...",
    "trial_info": {
        "remaining": 1,
        "limit": 2,
        "message": "1 generations remaining"
    }
}
```

**Error (Limit Exceeded):**
```json
{
    "detail": {
        "error": "Trial limit exceeded",
        "message": "Trial limit reached for Image Generation. You've used 2/2. Please subscribe to continue.",
        "limit": 2,
        "remaining": 0
    }
}
```

---

### 2. **Image Enhancement** - `/api/ai/enhance-image-upload`
```bash
POST /api/ai/enhance-image-upload
Content-Type: multipart/form-data

file: [image file]
style: "professional"
user_id: "user_123"  // Required for trial limits
```

**Response:**
```json
{
    "success": true,
    "enhanced_image_url": "https://...",
    "enhanced_image": "data:image/png;base64,...",
    "trial_info": {
        "remaining": 0,
        "limit": 1,
        "message": "0 enhancements remaining"
    }
}
```

---

### 3. **Upload Menu for OCR** - `/api/ai/upload-menu-for-ocr` ⭐ NEW
```bash
POST /api/ai/upload-menu-for-ocr
Content-Type: multipart/form-data

file: [PDF or Image file]
user_id: "user_123"  // Required for trial limits
```

**รองรับไฟล์:**
- PDF (.pdf)
- รูปภาพ (.jpg, .jpeg, .png, .webp, .gif)

**Response:**
```json
{
    "success": true,
    "menu_items": [
        {
            "name": "ต้มยำกุ้ง",
            "description": "Spicy and sour soup",
            "price": "$18.50",
            "category": "Soup"
        }
    ],
    "count": 1,
    "trial_info": {
        "remaining": 9,
        "limit": 10,
        "message": "9 OCR requests remaining"
    },
    "file_info": {
        "filename": "menu.pdf",
        "file_type": "PDF",
        "file_size": 123456
    }
}
```

**Use Case:**
- ร้านที่ไม่มีรูปภาพเมนู แต่ต้องการสร้างรูปภาพใหม่จากรายการเมนู
- อัปโหลด PDF หรือรูปภาพเมนู → ทำ OCR → แยกรายการเมนู → สร้างรูปภาพใหม่

---

### 4. **Analyze Menu (OCR)** - `/api/ai/analyze-menu`
```bash
POST /api/ai/analyze-menu
Content-Type: multipart/form-data

image: "data:image/jpeg;base64,..."
user_id: "user_123"  // Required for trial limits
```

---

### 5. **Get Trial Status** - `/api/trial/status/{user_id}`
```bash
GET /api/trial/status/user_123
```

**Response:**
```json
{
    "success": true,
    "user_id": "user_123",
    "is_subscribed": false,
    "subscription_plan": null,
    "is_trial_active": true,
    "trial_start_date": "2024-12-01T00:00:00",
    "trial_end_date": "2024-12-15T00:00:00",
    "trial_days_remaining": 10,
    "image_generation_count": 1,
    "image_enhancement_count": 0,
    "ocr_count": 5,
    "limits": {
        "image_generation": 2,
        "image_enhancement": 1,
        "ocr": 10
    }
}
```

---

### 6. **Initialize Trial** - `/api/trial/initialize`
```json
POST /api/trial/initialize
{
    "user_id": "user_123"
}
```

**Response:**
```json
{
    "success": true,
    "user_id": "user_123",
    "is_trial_active": true,
    "trial_start_date": "2024-12-01T00:00:00",
    "trial_end_date": "2024-12-15T00:00:00",
    "trial_days_remaining": 14,
    ...
}
```

---

## 🔧 การใช้งาน

### Frontend Integration:

```typescript
// 1. Initialize trial when user signs up
const initializeTrial = async (userId: string) => {
    const response = await fetch('/api/trial/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
    });
    return response.json();
};

// 2. Check trial status before making requests
const checkTrialStatus = async (userId: string) => {
    const response = await fetch(`/api/trial/status/${userId}`);
    return response.json();
};

// 3. Generate image with trial check
const generateImage = async (userId: string, dishName: string) => {
    const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            dish_name: dishName,
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

// 4. Upload menu PDF/image for OCR
const uploadMenuForOCR = async (userId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', userId);
    
    const response = await fetch('/api/ai/upload-menu-for-ocr', {
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

## 📊 Data Storage

ข้อมูล trial usage ถูกเก็บใน:
- **File**: `backend/trial_usage_data.json` (สำหรับ MVP)
- **Future**: จะย้ายไปเก็บใน Supabase Database

---

## 🔐 Subscription Integration

เมื่อ user subscribe แล้ว ให้เรียก:
```python
trial_limits_service.set_subscription(user_id, plan_name, is_subscribed=True)
```

---

## 🧪 Testing

```bash
# Test trial status
curl http://localhost:8000/api/trial/status/test_user

# Test image generation (will fail after 2 uses)
curl -X POST http://localhost:8000/api/ai/generate-image \
  -H "Content-Type: application/json" \
  -d '{"dish_name":"Test","user_id":"test_user"}'

# Test menu upload
curl -X POST http://localhost:8000/api/ai/upload-menu-for-ocr \
  -F "file=@menu.pdf" \
  -F "user_id=test_user"
```

---

## 📝 Notes

1. **Default User ID**: สำหรับ testing ใช้ `"default"` แต่ใน production ควรใช้ user ID จาก authentication
2. **Trial Duration**: 14 วัน (สามารถปรับได้ใน `trial_limits.py`)
3. **Limits**: สามารถปรับได้ใน `TrialLimitsService` class
4. **Data Persistence**: ตอนนี้เก็บใน JSON file แต่ควรย้ายไป database ในอนาคต

