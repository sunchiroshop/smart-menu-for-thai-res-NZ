"""OCR helpers for SmartMenu that work with Thai + English text."""

from __future__ import annotations

import os
from typing import BinaryIO

import pytesseract
from PIL import Image
from pdf2image import convert_from_bytes


TESSERACT_CMD = os.getenv("TESSERACT_CMD")
if TESSERACT_CMD:
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD

POPPLER_PATH = os.getenv("POPPLER_PATH")


def extract_text_from_image(image_file: BinaryIO | str, lang: str = "tha+eng") -> str:
    """Run Tesseract on an image file-like object or path."""

    image = Image.open(image_file)
    return pytesseract.image_to_string(image, lang=lang)


def extract_text_from_scanned_pdf(pdf_bytes: bytes, lang: str = "tha+eng", dpi: int = 200) -> str:
    """Convert each page of a scanned PDF into text via OCR."""

    images = convert_from_bytes(pdf_bytes, dpi=dpi, poppler_path=POPPLER_PATH)
    text_chunks = [pytesseract.image_to_string(image, lang=lang) for image in images]
    return "\n".join(chunk.strip() for chunk in text_chunks if chunk.strip())
