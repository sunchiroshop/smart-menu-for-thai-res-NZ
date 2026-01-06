# SweetAsMenu Backend API

FastAPI backend for SweetAsMenu - Next-Gen Restaurant OS with Google Gemini & Imagen AI integration.

**Main Entry Point:** `main_ai.py` (not main.py)

---

## ✅ Features

- **Translation API** - Translate menu items (any language → English) using Gemini AI
- **Menu Management** - Full CRUD operations for menus
- **Image Upload** - Upload food images to Supabase Storage
- **QR Code Generation** - Generate QR codes for restaurant menus
- **Public Menu API** - Serve menu data to customers

---

## 🛠️ Tech Stack

- **FastAPI** - Modern Python web framework
- **Gemini AI** - Translation and text generation (Free Tier)
- **Supabase** - PostgreSQL database + Storage
- **QR Code** - QR code generation
- **Uvicorn** - ASGI server

---

## 📦 Installation

### **Option 1: Using install.bat (Windows)**

```bash
# Just double-click install.bat
.\install.bat
```

### **Option 2: Manual**

```bash
# 1. Create virtual environment
python -m venv .venv

# 2. Activate
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Mac/Linux

# 3. Install dependencies
pip install -r requirements.txt
```

---

## 🔧 Configuration

### **1. Environment Variables**

Make sure `.env` file exists in the parent directory (`d:\Smart menu for Thai Res NZ\.env`) with:

```env
# Gemini API
GOOGLE_API_KEY=your_gemini_api_key_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Base URL (for QR codes)
BASE_URL=https://smartmenu.vercel.app
```

### **2. Database Setup**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Open SQL Editor
3. Copy and run `database_schema.sql`
4. Create Storage Buckets:
   - `menu-images` (Public)
   - `qr-codes` (Public)

---

## 🚀 Running the Server

### **Option 1: Using start.bat (Windows)**

```bash
.\start.bat
```

### **Option 2: Manual**

```bash
# Activate virtual environment
.venv\Scripts\activate

# Run server
python main_ai.py
```

Server will start at:
- **API:** http://localhost:8000
- **Docs:** http://localhost:8000/docs (Swagger UI)
- **Health Check:** http://localhost:8000/health

---

## 📚 API Endpoints

### **Health & Status**

```
GET  /                    # API info
GET  /health              # Health check
```

### **Translation**

```
POST /api/translate       # Translate text
POST /api/translate/batch # Translate multiple texts
```

**Example:**
```json
POST /api/translate
{
  "text": "ผัดไทย",
  "source_lang": "Thai",
  "target_lang": "English"
}

Response:
{
  "original_text": "ผัดไทย",
  "translated_text": "Pad Thai",
  "source_lang": "Thai",
  "target_lang": "English"
}
```

### **Menu Management**

```
POST   /api/menus             # Create menu item
GET    /api/menus?restaurant_id=xxx  # List all menus
GET    /api/menus/{menu_id}   # Get single menu
PUT    /api/menus/{menu_id}   # Update menu
DELETE /api/menus/{menu_id}   # Delete menu
```

**Example:**
```json
POST /api/menus
Form-Data:
- restaurant_id: "uuid"
- name_original: "ผัดไทย"
- name_english: "Pad Thai"
- price: 12.50
- category: "Noodles"
- language_code: "th"
- display_mode: "both"
- image: [file]

Response:
{
  "id": "uuid",
  "restaurant_id": "uuid",
  "name_original": "ผัดไทย",
  "name_english": "Pad Thai",
  "price": 12.50,
  "image_url": "https://...",
  ...
}
```

### **Public Menu (for customers)**

```
GET  /api/restaurant/{restaurant_id}/menu
```

Returns complete menu with all items grouped by category.

### **QR Code**

```
POST /api/qr/{restaurant_id}  # Generate QR code
GET  /api/qr/{restaurant_id}  # Get existing QR
```

### **Image Upload**

```
POST /api/upload/image
Form-Data:
- file: [image file]
- restaurant_id: "uuid"
```

---

## 📁 Project Structure

```
backend/
├── main_ai.py              # FastAPI application + routes (main entry)
├── requirements.txt        # Python dependencies
├── database_schema.sql     # Supabase database schema
├── install.bat             # Installation script
├── start.bat               # Start server script
├── README.md               # This file
│
└── services/
    ├── __init__.py
    ├── gemini_service.py   # Gemini AI integration
    ├── menu_service.py     # Menu CRUD operations
    └── qr_service.py       # QR code generation
```

---

## 🧪 Testing

### **1. Using Swagger UI**

Go to http://localhost:8000/docs and test endpoints interactively.

### **2. Using curl**

```bash
# Health check
curl http://localhost:8000/health

# Translate
curl -X POST http://localhost:8000/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "ผัดไทย", "source_lang": "Thai"}'
```

---

## 💰 Cost

**Development:**
- ✅ $0/month (Free Tier for everything!)

**Production (per 20 customers):**
- Gemini API: $0 (Free Tier OK for 20-30 customers)
- Supabase: $0-25/month
- Backend Hosting: $0-7/month (Render/Railway free tier)

**Total:** $0-32/month for 20 customers  
**Revenue:** $780/month ($39 × 20)  
**Profit:** $748-780/month (96-100%)

---

## 🔒 Security

- **CORS:** Configured for Next.js frontend
- **RLS:** Row Level Security enabled in Supabase
- **Authentication:** Handled by Supabase Auth
- **API Keys:** Stored in `.env` (not committed to git)

---

## 🐛 Troubleshooting

### **"GOOGLE_API_KEY not found"**
→ Make sure `.env` file exists in parent directory with correct API key

### **"Supabase credentials not found"**
→ Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env`

### **"Failed to upload image"**
→ Make sure Storage buckets are created and set to Public in Supabase

### **"ModuleNotFoundError"**
→ Run `install.bat` or `pip install -r requirements.txt`

---

## 📝 Next Steps

1. ✅ Backend API ready
2. 🟡 Connect Frontend to Backend
3. 🟡 Deploy to Render/Railway
4. 🟡 Test end-to-end
5. 🟡 Launch MVP!

---

## 🚀 Deployment

### **Render (Recommended - Free Tier)**

1. Create account at [Render.com](https://render.com)
2. New → Web Service
3. Connect GitHub repo
4. Settings:
   - Build Command: `pip install -r backend/requirements.txt`
   - Start Command: `cd backend && python main_ai.py`
   - Environment Variables: Add all from `.env`
5. Deploy!

### **Railway (Alternative)**

1. Create account at [Railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Add environment variables
4. Deploy!

---

## 📞 Support

Need help? Check:
- API Docs: http://localhost:8000/docs
- Supabase Docs: https://supabase.com/docs
- FastAPI Docs: https://fastapi.tiangolo.com/

---

**Made with ❤️ for Smart Menu SaaS**

