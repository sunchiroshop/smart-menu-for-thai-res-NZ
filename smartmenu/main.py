import io
import os  
from datetime import datetime, timezone
from typing import Dict, List
from uuid import uuid4

from fastapi import FastAPI, UploadFile, File, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from openai import OpenAIError

from smartmenu.utils.ocr_reader import extract_text_from_image, extract_text_from_scanned_pdf
from smartmenu.utils.pdf_reader import (
    PDFReadError,
    extract_menu_items,
    extract_text_from_pdf,
)
from smartmenu.utils.unzipper import extract_zip_with_structure

from smartmenu.agents.translator import translate_menu
from smartmenu.agents.image_generator import generate_food_image
from smartmenu.agents.staff_helper import staff_answer
from smartmenu.schemas import (
    ErrorResponse,
    GenerateImageRequest,
    GenerateImageResponse,
    MenuItem,
    PDFExtractionResponse,
    ProcessMenuResponse,
    QRCodeRequest,
    QRCodeResponse,
    StaffAnswerResponse,
    StaffAskRequest,
    StoredMenuResponse,
    TranslateMenuResponse,
)
from smartmenu.utils.openai_client import MissingOpenAIKeyError
from smartmenu.utils.qr_generator import generate_qr
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env", override=True)


def _load_allowed_origins() -> list[str]:
    env_value = os.getenv("ALLOWED_ORIGINS")
    if env_value:
        return [origin.strip() for origin in env_value.split(",") if origin.strip()]
    return [
        "https://menu-magic-nz.lovable.app",
        "https://lovable.dev",
        "http://localhost:3000",
        "http://localhost:5173",
    ]


app = FastAPI(title="SmartMenu + StaffHelper API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_load_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_TRANSLATE_FILE_SIZE = 2 * 1024 * 1024  # 2 MB
ALLOWED_TRANSLATE_EXTENSIONS = {".txt", ".md", ".csv", ".json"}
ALLOWED_TRANSLATE_MIME_TYPES = {
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/json",
}

MAX_PROCESS_FILE_SIZE = 8 * 1024 * 1024  # 8 MB
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}
TEXT_EXTENSIONS = {".txt", ".md", ".csv", ".json"}

processed_menus: Dict[str, ProcessMenuResponse] = {}


def _extract_pdf_text_with_fallback(pdf_bytes: bytes) -> str:
    """Use PyPDF2 first, then OCR if the PDF contains only images."""

    text = ""
    try:
        text = extract_text_from_pdf(pdf_bytes)
    except PDFReadError:
        text = ""

    if not text.strip():
        text = extract_text_from_scanned_pdf(pdf_bytes)

    return text


def _classify_upload(file: UploadFile) -> str:
    extension = os.path.splitext((file.filename or "").lower())[1]
    content_type = (file.content_type or "").lower()

    if content_type == "application/pdf" or extension == ".pdf":
        return "pdf"
    if content_type.startswith("image/") or extension in IMAGE_EXTENSIONS:
        return "image"
    return "text"


def _extract_text_from_upload(file: UploadFile, raw_bytes: bytes) -> tuple[str, str]:
    source_type = _classify_upload(file)

    if source_type == "pdf":
        text = _extract_pdf_text_with_fallback(raw_bytes)
    elif source_type == "image":
        text = extract_text_from_image(io.BytesIO(raw_bytes))
    else:
        try:
            text = raw_bytes.decode("utf-8")
        except UnicodeDecodeError as exc:  # pragma: no cover - encoding errors
            raise ValueError("Menu text must be UTF-8 encoded") from exc

    return text, source_type


def _extract_pdf_text_with_fallback(pdf_bytes: bytes) -> str:
    """Use PyPDF2 first, then OCR if the PDF contains only images."""

    text = ""
    try:
        text = extract_text_from_pdf(pdf_bytes)
    except PDFReadError:
        text = ""

    if not text.strip():
        text = extract_text_from_scanned_pdf(pdf_bytes)

    return text


@app.exception_handler(MissingOpenAIKeyError)
async def missing_key_handler(_, exc: MissingOpenAIKeyError):
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content=ErrorResponse(detail=str(exc)).model_dump(),
    )


@app.exception_handler(OpenAIError)
async def openai_error_handler(_, exc: OpenAIError):
    return JSONResponse(
        status_code=status.HTTP_502_BAD_GATEWAY,
        content=ErrorResponse(detail=str(exc)).model_dump(),
    )

@app.get("/")
def root():
    return {"message": "SmartMenu API OK"}

# -----------------------------
# 1) Upload + Translate Menu
# -----------------------------
@app.post("/menu/translate", response_model=TranslateMenuResponse)
async def translate_menu_endpoint(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must include a filename",
        )

    extension = os.path.splitext(file.filename)[1].lower()
    if (
        (file.content_type not in ALLOWED_TRANSLATE_MIME_TYPES)
        and (extension not in ALLOWED_TRANSLATE_EXTENSIONS)
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only text-based menu files (.txt, .md, .csv, .json) are supported",
        )

    content = await file.read()
    if len(content) > MAX_TRANSLATE_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Menu file exceeds the 2 MB limit",
        )

    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Menu file must be UTF-8 encoded text",
        ) from exc

    if not text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Menu file appears to be empty",
        )

    result = translate_menu(text)
    return TranslateMenuResponse(translated=result)

@app.post("/menu/upload-multiple")
async def upload_multiple_menus(files: List[UploadFile] = File(...)):
    all_text = ""

    for file in files:
        ext = file.filename.lower().split(".")[-1]
        content = await file.read()

        if ext in ["png", "jpg", "jpeg"]:
            # ต้อง reset file pointer ก่อนอ่าน OCR
            file.file.seek(0)
            text = extract_text_from_image(file.file)

        elif ext == "pdf":
            text = _extract_pdf_text_with_fallback(content)

        else:
            return {"error": f"Unsupported file type: {file.filename}"}

        all_text += f"\n\n===== {file.filename} =====\n{text}"

    translated = translate_menu(all_text)

    return {
        "files_uploaded": [f.filename for f in files],
        "original_text_combined": all_text,
        "translated_menu": translated
    }
@app.post("/menu/upload-folder")
async def upload_folder_zip(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".zip"):
        return {"error": "Please upload a .zip file only"}

    zip_bytes = await file.read()
    categories = extract_zip_with_structure(zip_bytes)

    all_text = {}

    for category, files in categories.items():
        category_text = ""

        for fpath in files:
            ext = fpath.lower().split(".")[-1]

            if ext in ["png", "jpg", "jpeg"]:
                with open(fpath, "rb") as img:
                    text = extract_text_from_image(img)

            elif ext == "pdf":
                with open(fpath, "rb") as pdf:
                    text = _extract_pdf_text_with_fallback(pdf.read())

            category_text += text + "\n"

        all_text[category] = category_text

    # แปลแต่ละหมวดหมู่
    translated = {
        cat: translate_menu(text)
        for cat, text in all_text.items()
    }

    return {
        "categories": list(categories.keys()),
        "original_text": all_text,
        "translated": translated
    }


@app.post("/menu/pdf/extract", response_model=PDFExtractionResponse)
async def extract_pdf_menu_endpoint(
    file: UploadFile = File(...),
    translate: bool = Query(True, description="Also return translated text"),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported",
        )

    pdf_bytes = await file.read()
    text = _extract_pdf_text_with_fallback(pdf_bytes)

    if not text.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Unable to extract text from the provided PDF",
        )

    items = extract_menu_items(text)
    translated = translate_menu(text) if translate else None

    return PDFExtractionResponse(
        filename=file.filename,
        text=text,
        menu_items=items,
        translated_menu=translated,
    )


@app.post("/menu/process", response_model=ProcessMenuResponse)
async def process_menu_endpoint(
    file: UploadFile = File(...),
    translate: bool = Query(True, description="Translate extracted menu"),
    generate_qr_code: bool = Query(True, description="Return QR code for menu URL"),
    menu_url: str | None = Query(None, description="Existing URL to encode in QR"),
):
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Menu file must include a filename",
        )

    raw_bytes = await file.read()
    if len(raw_bytes) > MAX_PROCESS_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Menu file exceeds the 8 MB limit",
        )

    try:
        text, source_type = _extract_text_from_upload(file, raw_bytes)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    if not text.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Unable to extract text from the provided menu",
        )

    menu_items = extract_menu_items(text)
    translated_menu = translate_menu(text) if translate else None

    menu_id = uuid4().hex
    created_at = datetime.now(timezone.utc)
    final_menu_url = menu_url or f"https://smartmenu.local/menu/{menu_id}"
    qr_image = generate_qr(final_menu_url) if generate_qr_code else None

    record = ProcessMenuResponse(
        menu_id=menu_id,
        filename=file.filename,
        source_type=source_type,
        text=text,
        translated_menu=translated_menu,
        menu_items=[MenuItem(**item) for item in menu_items],
        menu_url=final_menu_url,
        qr_image=qr_image,
        created_at=created_at,
    )

    processed_menus[menu_id] = record
    return record


@app.get("/menu/process/{menu_id}", response_model=StoredMenuResponse)
async def get_processed_menu(menu_id: str):
    record = processed_menus.get(menu_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Processed menu not found",
        )

    return StoredMenuResponse(**record.model_dump())

# -----------------------------
# 2) Generate Food Image
# -----------------------------
@app.post("/menu/generate-image", response_model=GenerateImageResponse)
async def generate_image_endpoint(payload: GenerateImageRequest):
    dish_name = payload.name.strip()
    if not dish_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dish name is required",
        )

    img = generate_food_image(dish_name)
    if not img:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate image",
        )
    return GenerateImageResponse(image_base64=img)

# -----------------------------
# 3) Generate QR for Menu
# -----------------------------
@app.post("/menu/qr", response_model=QRCodeResponse)
async def qr_endpoint(payload: QRCodeRequest):
    menu_url = payload.url.strip()
    if not menu_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Menu URL is required",
        )

    qr_b64 = generate_qr(menu_url)
    return QRCodeResponse(qr_image=qr_b64)

# -----------------------------
# 4) Staff Helper AI
# -----------------------------
@app.post("/staff/ask", response_model=StaffAnswerResponse)
async def staff_ask_endpoint(payload: StaffAskRequest):
    question = payload.question.strip()
    menu_text = payload.menu.strip()

    if not question:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question is required",
        )
    if not menu_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Menu context is required",
        )

    answer = staff_answer(question, menu_text)
    return StaffAnswerResponse(answer=answer)

# Run:
# uvicorn main:app --reload
