import qrcode
import base64
from io import BytesIO

def generate_qr(url: str):
    qr = qrcode.make(url)
    buffer = BytesIO()
    qr.save(buffer, format="PNG")
    qr_bytes = buffer.getvalue()
    return base64.b64encode(qr_bytes).decode()
