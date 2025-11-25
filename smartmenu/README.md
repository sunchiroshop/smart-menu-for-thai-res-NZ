# Smart Menu API

FastAPI backend for the Smart Menu project powering automatic Thai ↔ multi-language translations, OCR ingestion, and staff helper tools. The API is designed to pair with the Lovable front-end at [menu-magic-nz.lovable.app](https://menu-magic-nz.lovable.app/).

## Features

- Upload/translate plain-text menus with validation
- OCR for PDFs and images (Thai + English) with PyPDF2 fallback
- Food image generation via OpenAI image API
- Staff helper Q&A powered by OpenAI chat completions
- QR code generation and combined workflow endpoint that extracts text, translates, and stores processed menus in-memory
- Configurable CORS for external web clients

## Project Structure

```
smartmenu/
├── main.py              # FastAPI app & endpoints
├── agents/              # OpenAI-based agents (translator, images, staff helper)
├── utils/               # OCR, PDF, QR helpers, shared OpenAI client
├── schemas.py           # Pydantic request/response models
├── requirements.txt     # Python dependencies
├── .env                 # Local environment variables (not committed)
└── README.md            # You are here
```

## Requirements

- Python 3.11+
- Tesseract OCR (Windows installer e.g. UB Mannheim build)
- Poppler for Windows (for `pdf2image`)
- OpenAI API key with access to GPT-4o mini + gpt-image-1

## Setup

```powershell
# Clone repo / open workspace
Set-Location -Path "d:\Smart menu for Thai Res NZ\smartmenu"

# (Optional) Create virtual environment
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy env template and fill in secrets
Copy-Item .env.example .env
```

### Required Environment Variables

See `.env.example` for the full list. Key values:

- `OPENAI_API_KEY`: OpenAI access token
- `ALLOWED_ORIGINS`: Comma-separated list for CORS (defaults include Lovable app & localhost)
- `TESSERACT_CMD`: Path to `tesseract.exe` if not on PATH
- `POPPLER_PATH`: Poppler `bin` folder for PDF → image conversion
- `IMAGE_STORAGE_PATH`, `QR_CODE_PATH`: Optional output directories

## Running Locally

```powershell
Set-Location -Path "d:\Smart menu for Thai Res NZ\smartmenu"
.\venv\Scripts\activate
uvicorn main:app --reload
```

App is available at `http://127.0.0.1:8000`. Docs: `http://127.0.0.1:8000/docs`.

## Deployment Notes

1. Provision a Python-friendly host (Render, Railway, Azure, etc.).
2. Set environment variables from `.env.example`.
3. Ensure Tesseract + Poppler are available on the host (install packages or add to container image).
4. Start with `uvicorn main:app --host 0.0.0.0 --port $PORT` (platform dependent).

## Key Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/menu/translate` | Upload plain-text (txt/md/csv/json) to translate |
| `POST` | `/menu/upload-multiple` | OCR/translate multiple files |
| `POST` | `/menu/upload-folder` | Upload zip of categorized menus |
| `POST` | `/menu/pdf/extract` | Extract text + heuristic items from PDF, optionally translate |
| `POST` | `/menu/process` | Full pipeline (OCR → translate → QR + store) |
| `GET` | `/menu/process/{menu_id}` | Retrieve processed menu record |
| `POST` | `/menu/generate-image` | Generate dish photo via OpenAI |
| `POST` | `/menu/qr` | Generate QR code for URL |
| `POST` | `/staff/ask` | Staff helper Q&A with menu context |

### Example: Full Menu Workflow

```powershell
curl -X POST \
     -F "file=@./samples/menu.pdf" \
     "http://127.0.0.1:8000/menu/process?translate=true&generate_qr_code=true"
```

Sample response (abbreviated):

```json
{
  "menu_id": "d3bcb1a2b67c4c0f8d44a7c9de59da54",
  "filename": "menu.pdf",
  "source_type": "pdf",
  "text": "...",
  "translated_menu": "...",
  "menu_items": [
    { "name": "Pad Thai", "price": "$18", "description": "Stir-fried rice noodles" }
  ],
  "menu_url": "https://smartmenu.local/menu/d3bcb1a2b67c4c0f8d44a7c9de59da54",
  "qr_image": "iVBORw0KGgoAAAANSUhEUgAA...",
  "created_at": "2025-11-19T06:45:00.123456+00:00"
}
```

### Example: Lovable Front-end Fetch

```javascript
const API_BASE = "https://api.smartmenu.nz"; // replace with deployment URL

export async function processMenu(file) {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(`${API_BASE}/menu/process?translate=true&generate_qr_code=true`, {
    method: "POST",
    body: form,
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
}
```

## OCR Configuration

- **Windows**: Install Tesseract from https://github.com/UB-Mannheim/tesseract/wiki.
- **Poppler**: Download release from https://github.com/oschwartz10612/poppler-windows/releases/, extract, and set `POPPLER_PATH`.
- Ensure fonts for Thai are installed to improve accuracy.

## Testing

Basic smoke test:

```powershell
.\venv\Scripts\python.exe -c "import main; print('APP IMPORT OK')"
```

(Add pytest or integration tests as the next improvement.)

## Next Steps

- Persist processed menus to SQLite/Postgres instead of in-memory dict
- Add auth/API keys for per-restaurant access control
- Expand automated tests and logging
- Provide front-end components (React/Vue) for uploading menus and previewing translations
