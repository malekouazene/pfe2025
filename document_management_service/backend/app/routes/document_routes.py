from fastapi import APIRouter, UploadFile, File, Form, Query, HTTPException, Depends
from fastapi.responses import FileResponse
from app.services import document_service
from app.models.document import DocumentStatus
from typing import List, Optional, Dict, Any
from app.utils.file_utils import get_file_mime_type
import os

router = APIRouter()

@router.post("/documents")
async def upload_document(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    author: str = Form(...),
    file: UploadFile = File(...),
    category: Optional[str] = Form(None),
    tags: List[str] = Form([]),
    status: DocumentStatus = Form(DocumentStatus.DRAFT),
    change_description: str = Form("Initial document creation"),
    changes: List[str] = Form([]),
    user_id: str = Form(...),
    
):
    """Crée un nouveau document"""
    return await document_service.create_document(
        title=title,
        description=description,
        author=author,
        file=file,
        category=category,
        tags=tags,
        status=status,
        change_description=change_description,
        changes=changes,
        user_id=user_id
    )

@router.get("/documents")
async def fetch_documents(
    query: str = Query(None, description="Texte de recherche"),
    tags: List[str] = Query(None, description="Filtrer par tags"),
    category: str = Query(None, description="Filtrer par catégorie"),
    status: Optional[DocumentStatus] = Query(None, description="Filtrer par statut"),
    limit: int = Query(50, ge=1, le=100, description="Nombre de résultats par page"),
    skip: int = Query(0, ge=0, description="Nombre de résultats à sauter"),
):
    """Récupère les documents avec filtres et pagination"""
    if query or tags or category:
        return await document_service.search_documents(
            query=query,
            tags=tags,
            category=category,
            status=status,
            limit=limit,
            skip=skip
        )
    else:
        return await document_service.get_all_documents(
            status=status,
            limit=limit,
            skip=skip
        )

@router.get("/documents/{doc_id}")
async def get_doc(doc_id: str):
    """Récupère un document par son ID avec son changelog"""
    return await document_service.get_document_with_changelog(doc_id)

@router.get("/documents/{doc_id}/download")
async def download_document(doc_id: str):
    """Télécharge le fichier associé à un document"""
    doc = await document_service.get_document_by_id(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    file_path = os.path.join("uploads", doc.get("file_url").lstrip("/files/"))
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    filename = os.path.basename(file_path)
    content_type = doc.get("content_type", "application/octet-stream")
    
    return FileResponse(
        path=file_path,
        media_type=content_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
@router.get("/files/{filename}")
async def serve_file(filename: str):
    """Serve un fichier depuis le dossier uploads avec support CORS"""
    upload_dir = os.path.abspath("uploads")
    file_path = os.path.abspath(os.path.join(upload_dir, filename))
    
    # Vérification de sécurité
    if not file_path.startswith(upload_dir):
        raise HTTPException(status_code=400, detail="Invalid file path")
    
    # Liste des extensions à tester
    extensions_to_try = ['']
    if not os.path.splitext(filename)[1]:  # Si pas d'extension dans l'URL
        extensions_to_try.extend([
            '.doc', '.docx', '.pdf', 
            '.jpg', '.jpeg', '.png',
            '.xls', '.xlsx', '.ppt', '.pptx'
        ])
    
    # Chercher le fichier avec différentes extensions
    found_path = None
    for ext in extensions_to_try:
        test_path = file_path + ext
        if os.path.exists(test_path):
            found_path = test_path
            break
    
    if not found_path:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Déterminer le type MIME
    mime_type = get_file_mime_type(found_path)
    filename_display = os.path.basename(found_path)
    
    return FileResponse(
        path=found_path,
        media_type=mime_type,
        headers={
            "Content-Disposition": f"inline; filename={filename_display}",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

@router.get("/documents/by-title/{title}/versions")
async def get_doc_versions(title: str):
    """Récupère toutes les versions d'un document par son titre"""
    return await document_service.get_document_versions(title)

@router.put("/documents/{doc_id}")
async def update_doc(
    doc_id: str,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    author: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    category: Optional[str] = Form(None),
    tags: List[str] = Form([]),
    change_description: str = Form("Updated document"),
    changes: List[str] = Form([]),
):
    """Met à jour un document existant"""
    update_data = {}
    if title:
        update_data["title"] = title
    if description:
        update_data["description"] = description
    if author:
        update_data["author"] = author
    if category:
        update_data["category"] = category
    if tags:
        update_data["tags"] = tags
    
    return await document_service.update_document(
        doc_id=doc_id,
        update_data=update_data,
        file=file,
        change_description=change_description,
        changes=changes
    )

@router.patch("/documents/{doc_id}/status")
async def change_status(doc_id: str, status: DocumentStatus):
    """Change le statut d'un document"""
    return await document_service.change_document_status(
        doc_id=doc_id,
        new_status=status,
        modified_by="system"  # Remplacer par l'utilisateur authentifié
    )

@router.delete("/documents/{doc_id}")
async def delete_doc(doc_id: str, permanent: bool = Query(False, description="Suppression permanente ou archivage")):
    """Supprime ou archive un document"""
    return await document_service.delete_document(doc_id, permanent)



