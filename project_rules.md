# PROJECT RULES & BUSINESS LOGIC (DO NOT CHANGE)

---

## 1. Pricing Packages (NZD)
Strictly enforce these limits. Do not invent new plans.

### Free Trial Policy
- **Duration:** 14 Days
- **Eligibility:** New restaurants only (1 time per restaurant)
- **Features during trial:**
  - **Menu Items:** Max 20 items
  - **AI Image Gen:** Max 5 images
  - **AI Enhancement:** Max 5 images
  - **Languages:** Original + English only
- **After Trial Ends:**
  - System automatically locks the menu (Read-only) or downgrades to Inactive.
  - User must subscribe to Starter, Professional, or Enterprise to continue editing.

### Starter ($39/month)
- **Target:** Small takeaway shops
- **Menu Items:** Max 30 items
- **AI Image Gen:** Max 30 images/month
- **AI Enhancement:** Max 30 images/month
- **Languages:** Original + English only (2 languages)
- **Branding:** Cannot remove "Powered by Smart Menu"
- **Custom Logo:** Allowed (Small size)
- **Theme Color:** NOT Allowed
- **Cover Image:** NOT Allowed
- **Multi-branch:** NOT Allowed
- **POS System:** Basic (Kitchen + Staff display)

### Professional ($89/month) - *Best Seller*
- **Target:** Casual dining
- **Menu Items:** Unlimited
- **AI Image Gen:** Max 200 images/month
- **AI Enhancement:** Max 200 images/month
- **Languages:** Original + English only (2 languages)
- **Branding:** Cannot remove "Powered by Smart Menu"
- **Custom Logo:** Allowed (Prominent header)
- **Theme Color:** Allowed
- **Cover Image:** Allowed
- **Multi-branch:** NOT Allowed
- **POS System:** Full features

### Enterprise ($199/month)
- **Target:** Fine dining / Chains
- **Menu Items:** Unlimited
- **AI Image Gen:** Max 500 images/month
- **AI Enhancement:** Max 500 images/month
- **Languages:** 13+ languages (Thai, English, Chinese, Japanese, Korean, Vietnamese, Hindi, Spanish, French, German, Indonesian, Malay, etc.)
- **Branding:** Can remove "Powered by Smart Menu" (White Label)
- **Custom Logo:** Full Customization
- **Theme Color:** Allowed
- **Cover Image:** Allowed
- **Multi-branch:** Allowed (Unlimited branches)
- **POS System:** Full features + Multi-branch support

---

## 2. Language Support by Plan

| Plan | Languages Available |
|------|---------------------|
| Free Trial | Original + English (2) |
| Starter | Original + English (2) |
| Professional | Original + English (2) |
| Enterprise | 13+ languages |

### Available Languages (Enterprise):
1. Original (ภาษาต้นฉบับ)
2. English (อังกฤษ)
3. Thai (ไทย)
4. Chinese (中文)
5. Japanese (日本語)
6. Korean (한국어)
7. Vietnamese (Tiếng Việt)
8. Hindi (हिंदी)
9. Spanish (Español)
10. French (Français)
11. German (Deutsch)
12. Indonesian (Bahasa Indonesia)
13. Malay (Bahasa Melayu)

---

## 3. Translation Caching Rules

- **Menu translations** are cached in Supabase table `menu_translations`
- Cache is keyed by: `restaurant_id` + `menu_id` + `language_code`
- Cache uses `source_hash` to detect content changes
- Cache is **invalidated** when:
  - Menu item is edited
  - Menu item is deleted
  - Menu item is created (no cache yet)
- This saves API costs by not re-translating unchanged content

---

## 4. POS System Rules

### Staff Roles:
| Role | Access | Description |
|------|--------|-------------|
| chef | Kitchen Display | พ่อครัว - ดูและอัปเดตสถานะออเดอร์ |
| waiter | Staff Orders | พนักงานเสิร์ฟ - จัดการออเดอร์และ service requests |
| cashier | Staff Orders | แคชเชียร์ - จัดการออเดอร์และชำระเงิน |
| manager | Staff Orders | ผู้จัดการ - จัดการทุกอย่าง |

### PIN Authentication:
- PIN must be exactly 6 digits
- PIN is hashed before storing in database
- Session expires after 8 hours
- Staff must login with restaurant slug + PIN

### Order Status Flow:
```
pending → cooking → ready → served
   ↓         ↓        ↓       ↓
 (new)   (kitchen)  (done)  (complete)
```

### Service Request Types:
1. `call_waiter` - เรียกพนักงาน
2. `request_sauce` - ขอซอสเพิ่ม
3. `request_water` - ขอน้ำเพิ่ม
4. `request_bill` - ขอเช็คบิล
5. `other` - อื่นๆ (with custom message)

---

## 5. Auto-Translation Rules

### Customer Notes Translation:
- When customer writes notes/special instructions
- System auto-translates to restaurant's **primary language**
- Primary language is set in Dashboard → Settings
- Supports all 12 languages

### Menu Translation:
- Customer can select display language
- Free/Starter/Pro: Original + English only
- Enterprise: 13+ languages
- Translations are cached in Supabase

---

## 6. Technical Rules

- **Database:** Supabase (PostgreSQL)
- **Realtime:** Supabase Realtime for orders and service_requests tables
- **Image Storage:** Supabase Storage bucket 'menu_images' (Must save public URL to DB)
- **Frontend:** Next.js 14 App Router
- **Styling:** Tailwind CSS
- **Backend:** FastAPI (Python)
- **AI Translation:** Google Gemini API
- **AI Image:** OpenAI DALL-E / Gemini Vision

---

## 7. Critical Workflows

### Image Generation:
1. Generate image via AI API
2. Upload to Supabase Storage
3. Get Public URL
4. Update database with URL immediately

### Order System:
1. Customer places order → Insert to `orders` table
2. Supabase Realtime triggers update
3. Kitchen/Staff display receives real-time update
4. Staff updates status → Triggers another update
5. Customer order-status page shows real-time status

### Translation Cache:
1. Customer selects language
2. Check Supabase cache (`menu_translations`)
3. If cached & source_hash matches → Use cache
4. If not cached or changed → Call translate API
5. Save new translation to cache
6. Display translated menu

---

## 8. Database Tables

### Core Tables:
| Table | Purpose |
|-------|---------|
| `users` | User accounts |
| `restaurants` | Restaurant info + settings |
| `menus` | Menu items |
| `orders` | Customer orders |
| `order_items` | Items in orders |
| `staff` | Staff accounts with PIN |
| `service_requests` | Customer service requests |
| `menu_translations` | Translation cache |
| `subscriptions` | Subscription plans |
| `ai_usage` | AI feature usage tracking |
| `generated_images` | AI generated images |

### Important Columns:
- `restaurants.primary_language` - Restaurant's main language (for translating customer notes)
- `restaurants.plan` - Current subscription plan
- `menu_translations.source_hash` - Hash to detect content changes
- `staff.pin_hash` - Hashed PIN for authentication
- `staff.role` - chef/waiter/cashier/manager

---

## 9. Feature Restrictions Summary

| Feature | Free | Starter | Pro | Enterprise |
|---------|------|---------|-----|------------|
| Menu Items | 20 | 30 | Unlimited | Unlimited |
| AI Image Gen | 5 | 30/mo | 200/mo | 500/mo |
| AI Enhance | 5 | 30/mo | 200/mo | 500/mo |
| Languages | 2 | 2 | 2 | 13+ |
| Multi-branch | No | No | No | Yes |
| White Label | No | No | No | Yes |
| Theme Color | No | No | Yes | Yes |
| Cover Image | No | No | Yes | Yes |
| POS System | Basic | Basic | Full | Full |
| Logo Overlay | No | Small | Prominent | Full |

---

## 10. URLs Structure

| Page | URL | Access |
|------|-----|--------|
| Landing | `/` | Public |
| Login | `/login` | Public |
| Register | `/register` | Public |
| Dashboard | `/dashboard` | Authenticated |
| Settings | `/dashboard/settings` | Authenticated |
| Menus | `/menus` | Authenticated |
| Upload | `/upload` | Authenticated |
| QR Code | `/qr` | Authenticated |
| Pricing | `/pricing` | Public |
| POS Login | `/pos/login` | Public (requires PIN) |
| Kitchen | `/pos/kitchen` | Staff (chef) |
| Staff Orders | `/pos/orders` | Staff (waiter/cashier) |
| Customer Menu | `/restaurant/{slug}` | Public |
| Order Status | `/order-status/{id}` | Public |

---

**Last Updated: December 17, 2025**
