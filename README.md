# SweetAsMenu - Next-Gen Restaurant OS

> Making restaurant operations "Sweet As" using AI

AI-powered restaurant management system built specifically for the New Zealand market.

ระบบจัดการร้านอาหารครบวงจร พร้อม AI สำหรับร้านอาหารใน New Zealand

**Project Status:** See [PROJECT_STATUS_REPORT.md](./PROJECT_STATUS_REPORT.md) for detailed audit report.

---

## Features

### For Restaurant Owners (สำหรับเจ้าของร้าน)
- Upload and manage menu items with photos
- AI-powered translation to 50+ languages
- AI image generation and enhancement
- QR code generation for tables
- Real-time order management
- Staff management with PIN access
- Multiple branches support (Enterprise)
- Analytics and revenue tracking

### For Kitchen Staff (สำหรับครัว)
- Real-time order display
- Sound notifications for new orders
- Order status management (pending → cooking → ready)
- Auto-translated customer notes
- PIN-based secure login

### For Service Staff (สำหรับพนักงาน)
- Order confirmation and management
- Service request notifications (call waiter, request bill, etc.)
- Real-time updates via Supabase
- Auto-translated customer messages

### For Customers (สำหรับลูกค้า)
- Scan QR code to view menu
- Multi-language menu (13+ languages)
- Easy ordering with customizations
- Call waiter / Request service
- Order tracking

---

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- Supabase account
- Google AI API key (Gemini)

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd "Smart menu for Thai Res NZ"
```

### 2. Setup Backend
```bash
cd backend
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your API keys

# Run backend
python main_ai.py
```
Backend runs at: http://localhost:8000

### 3. Setup Frontend
```bash
cd webapp
npm install

# Create .env.local file
cp .env.example .env.local
# Edit .env.local with your Supabase keys

# Run frontend
npm run dev
```
Frontend runs at: http://localhost:3000

### 4. Setup Database
1. Go to Supabase Dashboard → SQL Editor
2. Run migrations from `supabase/migrations/`
3. Enable Realtime for tables: `orders`, `service_requests`

---

## Project Structure

```
Smart menu for Thai Res NZ/
├── backend/                 # FastAPI Backend
│   ├── main_ai.py          # Main API server
│   ├── services/           # Business logic
│   └── requirements.txt    # Python dependencies
│
├── webapp/                  # Next.js Frontend
│   ├── app/
│   │   ├── dashboard/      # Owner dashboard
│   │   ├── menus/          # Menu management
│   │   ├── upload/         # Add menu item
│   │   ├── restaurant/     # Customer menu
│   │   └── pos/            # POS system
│   │       ├── login/      # Staff login
│   │       ├── kitchen/    # Kitchen display
│   │       └── orders/     # Staff orders
│   ├── components/         # React components
│   └── lib/                # Utilities
│
├── supabase/               # Database
│   └── migrations/         # SQL migrations
│
└── docs/                   # Documentation
    ├── POS_USER_GUIDE.md
    └── COMPLETED_FEATURES.md
```

---

## Key Pages & URLs

| Page | URL | Description |
|------|-----|-------------|
| Landing | `/` | Homepage |
| Login | `/login` | User authentication |
| Dashboard | `/dashboard` | Owner dashboard |
| Menu Management | `/menus` | Manage menu items |
| Add Menu | `/upload` | Add new menu item |
| QR Generator | `/qr` | Generate QR codes |
| Settings | `/dashboard/settings` | Restaurant settings |
| **POS Login** | `/pos/login` | Staff/Kitchen login |
| **Kitchen Display** | `/pos/kitchen` | Kitchen order display |
| **Staff Orders** | `/pos/orders` | Staff order management |
| **Customer Menu** | `/restaurant/{slug}` | Public menu |
| Order Status | `/order-status/{id}` | Order tracking |

---

## POS System Usage

### How to Login to POS

1. Go to `/pos/login`
2. Select role: **Staff** or **Kitchen**
3. Enter restaurant slug (e.g., `thai-smile-auckland`)
4. Enter 6-digit PIN
5. Redirects to Kitchen Display or Staff Orders

### Kitchen Display Features
- Real-time order updates
- Sound notifications
- Status updates: pending → cooking → ready → served
- Auto-translated customer notes

### Staff Orders Features
- Order confirmation/cancellation
- Service requests (call waiter, request bill, etc.)
- Real-time notifications

See [POS_USER_GUIDE.md](./POS_USER_GUIDE.md) for detailed instructions.

---

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase Auth & Realtime

### Backend
- FastAPI (Python)
- Google Gemini AI
- Supabase PostgreSQL

### Infrastructure
- Vercel (Frontend hosting)
- Render/Railway (Backend hosting)
- Supabase (Database + Storage)
- Stripe (Payments)

---

## Environment Variables

### Backend (.env)
```env
# Google AI
GOOGLE_API_KEY=your_gemini_api_key

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_key

# OpenAI (optional, for image generation)
OPENAI_API_KEY=your_openai_key
```

### Frontend (.env.local)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Stripe (optional)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

---

## Subscription Plans

| Plan | Price | Menu Items | AI Images | Languages |
|------|-------|------------|-----------|-----------|
| Free Trial | $0 (14 days) | 20 | 5 | 2 (Original + EN) |
| Starter | $39/mo | 30 | 30/mo | 2 (Original + EN) |
| Professional | $89/mo | Unlimited | 200/mo | 2 (Original + EN) |
| Enterprise | $199/mo | Unlimited | 500/mo | 13+ languages |

### Plan Features:
- **Free Trial**: 14 days, basic features
- **Starter**: Small takeaway shops, basic branding
- **Professional**: Casual dining, custom theme colors, cover image
- **Enterprise**: Fine dining/Chains, white-label, multi-branch, 13+ languages

See [project_rules.md](./project_rules.md) for detailed feature restrictions.

---

## Documentation

- [POS User Guide](./POS_USER_GUIDE.md) - How to use POS system
- [Completed Features](./COMPLETED_FEATURES.md) - Feature summary
- [API Documentation](http://localhost:8000/docs) - Swagger docs

---

## Support

For issues and questions:
- Check documentation files
- API docs at `/docs` endpoint
- Create GitHub issue

---

## License

MIT License

---

**Smart Menu - Built for Thai Restaurants in New Zealand**

**Powered by Google Gemini AI**
