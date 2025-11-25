"""PDF utilities for extracting machine text and heuristically parsing menu items."""

from __future__ import annotations

import io
import re
from typing import List, Dict

from PyPDF2 import PdfReader


class PDFReadError(RuntimeError):
    """Raised when a PDF cannot be parsed via PyPDF2."""


def extract_text_from_pdf(pdf_bytes: bytes, max_pages: int | None = None) -> str:
    """Return concatenated text from a PDF represented as bytes."""

    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
    except Exception as exc:  # pragma: no cover - PdfReader internal errors
        raise PDFReadError("Unable to read PDF bytes") from exc

    page_text: List[str] = []
    total_pages = len(reader.pages)
    limit = max_pages if max_pages is not None else total_pages

    for index in range(min(limit, total_pages)):
        page = reader.pages[index]
        text = (page.extract_text() or "").strip()
        if text:
            page_text.append(text)

    return "\n".join(page_text)


MENU_LINE_RE = re.compile(
    r"^(?P<name>[\w\s\-&,'.()\/]+?)\s{2,}(?P<price>[$฿]?\s?\d+[\d,.]*)$",
    re.IGNORECASE,
)


def extract_menu_items(text: str) -> List[Dict[str, str]]:
    """Heuristically split raw menu text into name/price pairs."""

    items: List[Dict[str, str]] = []
    description_buffer: List[str] = []

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue

        match = MENU_LINE_RE.match(line)
        if match:
            if description_buffer and items:
                items[-1]["description"] = " ".join(description_buffer).strip()
                description_buffer.clear()

            items.append(
                {
                    "name": match.group("name").strip(),
                    "price": match.group("price").strip(),
                }
            )
        else:
            description_buffer.append(line)

    if description_buffer and items:
        items[-1]["description"] = " ".join(description_buffer).strip()

    return items
