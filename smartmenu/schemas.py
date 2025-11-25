"""Pydantic schemas shared by the SmartMenu FastAPI app."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class TranslateMenuResponse(BaseModel):
    translated: str


class GenerateImageRequest(BaseModel):
    name: str


class GenerateImageResponse(BaseModel):
    image_base64: str


class QRCodeRequest(BaseModel):
    url: str


class QRCodeResponse(BaseModel):
    qr_image: str


class StaffAskRequest(BaseModel):
    question: str
    menu: str


class StaffAnswerResponse(BaseModel):
    answer: str


class ErrorResponse(BaseModel):
    detail: str


class MenuItem(BaseModel):
    name: str
    price: Optional[str] = None
    description: Optional[str] = None


class PDFExtractionResponse(BaseModel):
    filename: str
    text: str
    menu_items: List[MenuItem]
    translated_menu: Optional[str] = None


class ProcessedMenuBase(BaseModel):
    menu_id: str
    filename: str
    source_type: str
    text: str
    translated_menu: Optional[str] = None
    menu_items: List[MenuItem]
    menu_url: Optional[str] = None
    qr_image: Optional[str] = None
    created_at: datetime


class ProcessMenuResponse(ProcessedMenuBase):
    pass


class StoredMenuResponse(ProcessedMenuBase):
    pass
