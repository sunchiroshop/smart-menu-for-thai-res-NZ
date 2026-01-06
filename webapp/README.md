# 🍜 SmartMenu Web Application

ระบบเมนูอาหารอัจฉริยะสำหรับร้านอาหารไทยในนิวซีแลนด์ พัฒนาด้วย Next.js, TypeScript, Tailwind CSS และ Supabase

## ✨ Features

- 🔐 **ระบบล็อกอิน/สมัครสมาชิก** - ด้วย Supabase Authentication
- 📱 **Responsive Design** - รองรับทุกหน้าจอ Mobile, Tablet และ Desktop
- 🎨 **Modern UI** - ออกแบบด้วย Tailwind CSS แบบ Professional
- 🔒 **Protected Routes** - ป้องกันการเข้าถึงหน้าที่ต้องล็อกอิน
- ⚡ **Fast & Secure** - ใช้ Next.js 14 App Router

## 🚀 Getting Started

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
# หรือ
yarn install
```

3. **Setup Supabase**

ไปที่ [Supabase Dashboard](https://app.supabase.com) แล้ว:
- สร้าง Project ใหม่
- ไปที่ Settings → API
- คัดลอก `Project URL` และ `anon public key`

4. **Setup Environment Variables**

สร้างไฟล์ `.env.local` และใส่ค่าต่อไปนี้:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

5. **Enable Email Authentication ใน Supabase**

ไปที่ Supabase Dashboard:
- เลือก Authentication → Providers
- เปิดใช้งาน Email Provider
- ตั้งค่า Email Templates (ถ้าต้องการ)

6. **Run the development server**
```bash
npm run dev
# หรือ
yarn dev
```

7. **เปิดเบราว์เซอร์**

ไปที่ [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
webapp/
├── app/                      # Next.js App Router
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   ├── login/               # Login/Sign-up page
│   │   └── page.tsx
│   └── dashboard/           # Protected dashboard
│       └── page.tsx
├── components/              # Reusable components
│   ├── AuthProvider.tsx     # Authentication context
│   └── ProtectedRoute.tsx   # Route protection
├── lib/                     # Utility libraries
│   └── supabase/
│       ├── client.ts        # Supabase client
│       └── auth.ts          # Auth functions
├── middleware.ts            # Next.js middleware
├── .env.local.example       # Environment variables template
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## 🔐 Authentication Flow

1. **Sign Up**: ผู้ใช้กรอกข้อมูล → Supabase ส่ง confirmation email
2. **Login**: ผู้ใช้ล็อกอิน → Supabase สร้าง session → redirect ไป dashboard
3. **Protected Routes**: Middleware ตรวจสอบ session → อนุญาตหรือ redirect ไป login
4. **Sign Out**: ลบ session → redirect ไป login page

## 🛠 Tech Stack

- **Frontend Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **Database**: Supabase (PostgreSQL)

## 📋 Available Scripts

```bash
# Development
npm run dev          # เริ่ม development server

# Production
npm run build        # Build for production
npm run start        # Start production server

# Linting
npm run lint         # Run ESLint
```

## 🎨 UI Components

### Login/Sign-up Page
- ✅ Tab switching (Login ↔ Sign-up)
- ✅ Email validation
- ✅ Password strength indicator
- ✅ Show/Hide password
- ✅ Remember me checkbox
- ✅ Error & success messages
- ✅ Loading states

### Dashboard
- ✅ User profile display
- ✅ Quick actions (Upload, View Menus, QR Code, Settings)
- ✅ Recent menus list
- ✅ Sign out button

## 🔒 Security Features

- ✅ Environment variables สำหรับ sensitive data
- ✅ Server-side session validation
- ✅ Protected routes with middleware
- ✅ Secure password hashing (Supabase)
- ✅ CSRF protection
- ✅ Auto token refresh

## 🐛 Troubleshooting

### ไม่สามารถล็อกอินได้
- ตรวจสอบว่า Supabase credentials ถูกต้อง
- ตรวจสอบว่า Email Provider เปิดใช้งานใน Supabase
- ดู Console สำหรับ error messages

### หน้าเว็บ redirect loop
- ลบ cookies ของเบราว์เซอร์
- ตรวจสอบ middleware.ts
- Restart development server

### Tailwind CSS ไม่ทำงาน
- ตรวจสอบ tailwind.config.ts
- ลบ `.next` folder แล้ว rebuild

## 🌐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anonymous Key | ✅ Yes |
| `NEXT_PUBLIC_API_URL` | Backend API URL | Optional |

## 📝 TODO

- [ ] เชื่อมต่อกับ Backend API (FastAPI)
- [ ] สร้างหน้า Upload Menu
- [ ] สร้างหน้า View All Menus
- [ ] สร้างหน้า QR Code Generator
- [ ] สร้างหน้า Settings
- [ ] เพิ่ม Password Reset
- [ ] เพิ่ม Social Login (Google, Facebook)
- [ ] เพิ่ม Email Templates
- [ ] เพิ่ม User Roles (Admin, Staff, Customer)

## 🤝 Contributing

ยินดีรับ Pull Requests! สำหรับการเปลี่ยนแปลงใหญ่ๆ กรุณาเปิด Issue เพื่อพูดคุยก่อน

## 📄 License

MIT License - ใช้งานได้ฟรี

## 👨‍💻 Author

SmartMenu Team - ระบบเมนูอาหารอัจฉริยะ

## 📞 Support

หากมีปัญหาหรือคำถาม:
- เปิด Issue ใน GitHub
- ติดต่อ Support Team

---

Made with ❤️ for Thai Restaurants in New Zealand 🇹🇭 🇳🇿

