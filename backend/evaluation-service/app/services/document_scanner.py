

### backend/app/services/document_scanner.py
from app.models.document import get_all_documents

def scan_documents():
    return get_all_documents()