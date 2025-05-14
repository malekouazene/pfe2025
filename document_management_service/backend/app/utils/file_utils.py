import os
import uuid
import mimetypes
from fastapi import UploadFile
from app.config import UPLOAD_FOLDER

# Dictionnaire des extensions par type MIME
MIME_EXTENSIONS = {
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/pdf': '.pdf',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    # Ajoutez d'autres types selon vos besoins
}

async def save_file(file: UploadFile) -> str:
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    
    # Obtenir l'extension à partir du nom de fichier ou du type MIME
    file_ext = os.path.splitext(file.filename)[1].lower()
    if not file_ext and file.content_type in MIME_EXTENSIONS:
        file_ext = MIME_EXTENSIONS[file.content_type]
    
    unique_id = str(uuid.uuid4())
    file_name = f"{unique_id}{file_ext}"
    file_path = os.path.join(UPLOAD_FOLDER, file_name)
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    return f"/files/{file_name}"





def get_file_mime_type(file_path: str) -> str:
    if not mimetypes.inited:
        mimetypes.init()
    
    mime_type, _ = mimetypes.guess_type(file_path)
    if not mime_type:
        mime_type = "application/octet-stream"
    
    return mime_type