import zipfile
import tempfile
import os

def extract_zip_with_structure(zip_bytes):
    """
    รับไฟล์ zip แล้วแตกออกเป็นโฟลเดอร์ชั่วคราว
    คืนค่าเป็น dict {category: [file_paths]}
    """
    temp_dir = tempfile.mkdtemp()

    zip_path = os.path.join(temp_dir, "upload.zip")
    with open(zip_path, "wb") as f:
        f.write(zip_bytes)

    with zipfile.ZipFile(zip_path, "r") as zip_ref:
        zip_ref.extractall(temp_dir)

    categorized = {}

    for root, dirs, files in os.walk(temp_dir):
        for file in files:
            if not file.lower().endswith((".jpg", ".jpeg", ".png", ".pdf")):
                continue

            category = os.path.basename(root)
            filepath = os.path.join(root, file)

            if category not in categorized:
                categorized[category] = []
            categorized[category].append(filepath)

    return categorized
