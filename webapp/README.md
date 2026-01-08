# SmartMenu Web Application

ระบบเมนูอาหารอัจฉริยะสำหรับร้านอาหารไทยในนิวซีแลนด์ พัฒนาด้วย Next.js, TypeScript, Tailwind CSS และ Supabase

## Features

### Core Features
- **ระบบล็อกอิน/สมัครสมาชิก** - ด้วย Supabase Authentication
- **Responsive Design** - รองรับทุกหน้าจอ Mobile, Tablet และ Desktop
- **Modern UI** - ออกแบบด้วย Tailwind CSS แบบ Professional
- **Protected Routes** - ป้องกันการเข้าถึงหน้าที่ต้องล็อกอิน
- **Fast & Secure** - ใช้ Next.js 14 App Router

### Menu Management
- **Upload Menu Items** - เพิ่มเมนูใหม่พร้อมรูปภาพ
- **Menu Type Selection** - เลือกประเภทเมนู:
  - Main Dish (อาหารจานหลัก) - รองรับตัวเลือกเนื้อสัตว์
  - Snack / Dessert (อาหารทานเล่น/ขนมหวาน)
  - Beverage (เครื่องดื่ม)
- **Category Management** - จัดหมวดหมู่เมนู
- **Meat Options** - ตัวเลือกเนื้อสัตว์สำหรับอาหารจานหลัก
- **Add-ons** - เพิ่มเติมท็อปปิ้ง/ตัวเลือกเสริม
- **Best Seller Badge** - ติดป้ายสินค้าขายดี

### AI Features
- **AI Image Generation** - สร้างรูปอาหารด้วย AI
  - รองรับหลาย Cuisine Types (Thai, Chinese, Japanese, etc.)
  - หลาย Image Styles (Professional, Portrait, Elegant, etc.)
  - Portrait Style แนะนำสำหรับ Snack/Beverage
- **AI Image Enhancement** - ปรับปรุงรูปภาพให้ดูดีขึ้น
- **Logo Overlay** - ใส่โลโก้ร้านอาหารบนรูปเมนู
- **Auto Translation** - แปลชื่อ/คำอธิบายเมนูอัตโนมัติ

### Restaurant Features
- **Multi-Restaurant Support** - รองรับหลายร้านอาหาร
- **QR Code Generator** - สร้าง QR Code สำหรับดูเมนู
- **Menu Templates** - เลือก Template การแสดงผลเมนู
- **POS Integration** - ระบบ POS สำหรับรับออเดอร์
- **Thermal Printing** - พิมพ์ใบเสร็จ/ออเดอร์

### NZ Launch Features
- **Credit Card Surcharging** - คิดค่าธรรมเนียมบัตรเครดิต (ตามกฎหมาย NZ)
- **Demo Data** - ข้อมูลตัวอย่างสำหรับทดสอบ

## Getting Started

### Prerequisites

- Node.js 18+
- npm หรือ yarn
- Supabase Account (สมัครฟรีที่ [supabase.com](https://supabase.com))

### Installation

1. **Clone the repository**
```bash
cd webapp
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup Environment Variables**

สร้างไฟล์ `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

4. **Run the development server**
```bash
npm run dev
```

5. **เปิดเบราว์เซอร์**

ไปที่ [http://localhost:3000](http://localhost:3000)

## Project Structure

```
webapp/
├── app/                      # Next.js App Router
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   ├── login/               # Login/Sign-up page
│   ├── dashboard/           # Protected dashboard
│   ├── upload/              # Upload menu items
│   ├── menus/               # View all menus
│   ├── qr/                  # QR Code generator
│   ├── pos/                 # POS system
│   ├── settings/            # Restaurant settings
│   ├── privacy/             # Privacy policy
│   ├── terms/               # Terms of service
│   └── refunds/             # Refund policy
├── components/              # Reusable components
│   ├── AuthProvider.tsx     # Authentication context
│   ├── ProtectedRoute.tsx   # Route protection
│   ├── ImageGallery.tsx     # Image library
│   ├── RestaurantSelector.tsx
│   └── ...
├── lib/                     # Utility libraries
│   ├── supabase/
│   │   ├── client.ts        # Supabase client
│   │   └── auth.ts          # Auth functions
│   └── api-client.ts        # Backend API client
├── middleware.ts            # Next.js middleware
└── package.json
```

## Tech Stack

- **Frontend Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **AI**: OpenAI (GPT-4, DALL-E, GPT Image)
- **Image Processing**: Backend API

## Recent Changes (Jan 2026)

### Menu Type Selection
- เพิ่มตัวเลือกประเภทเมนูก่อนเริ่มกรอกข้อมูล
- Main Dish - รองรับตัวเลือกเนื้อสัตว์
- Snack/Dessert และ Beverage - ไม่ต้องเลือกเนื้อสัตว์
- Portrait Style สำหรับ AI Image Generation

### Visual Branding
- เพิ่ม Watermark และ Contact Info
- Logo Overlay บนรูปเมนู

### NZ Features
- Credit Card Surcharging
- Thermal Printing Support
- Demo Data for Testing

## TODO / Roadmap

### High Priority
- [ ] Backend support for `menu_type` field in database
- [ ] Portrait style implementation in AI image generation API
- [ ] Menu filtering by type (food/snack/beverage)

### Medium Priority
- [ ] Bulk menu import (CSV/Excel)
- [ ] Menu analytics dashboard
- [ ] Customer feedback system
- [ ] Table reservation system

### Low Priority
- [ ] Social Login (Google, Facebook)
- [ ] Multi-language support (more languages)
- [ ] Dark mode
- [ ] PWA support

### Completed
- [x] Menu Type Selection (Main Dish / Snack / Beverage)
- [x] Hide meat selection for non-food items
- [x] Portrait style for AI image generation
- [x] Dynamic step numbers based on menu type
- [x] Credit Card Surcharging (NZ)
- [x] Thermal Printing
- [x] Logo Overlay
- [x] AI Image Enhancement

## Available Scripts

```bash
# Development
npm run dev          # Start development server

# Production
npm run build        # Build for production
npm run start        # Start production server

# Type Checking
npx tsc --noEmit     # Check TypeScript errors

# Linting
npm run lint         # Run ESLint
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anonymous Key | Yes |
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes |

## Backend API Requirements

The webapp requires these backend endpoints:

- `POST /api/menu` - Save menu item (needs `menu_type` field support)
- `GET /api/menu` - Get menu items
- `POST /api/image/enhance` - Enhance image with AI
- `POST /api/image/generate` - Generate image with AI (needs `portrait` style support)
- `POST /api/image/logo-only` - Apply logo overlay
- `POST /api/translate` - Translate text
- `GET /api/trial/status/:user_id` - Get trial limits

## Security Features

- Environment variables for sensitive data
- Server-side session validation
- Protected routes with middleware
- Secure password hashing (Supabase)
- CSRF protection
- Auto token refresh

## Troubleshooting

### Cannot login
- Check Supabase credentials
- Enable Email Provider in Supabase
- Check browser console for errors

### Page redirect loop
- Clear browser cookies
- Check middleware.ts
- Restart development server

### TypeScript errors
- Run `npx tsc --noEmit` to check errors
- Check type definitions in api-client.ts

---

Made with love for Thai Restaurants in New Zealand
