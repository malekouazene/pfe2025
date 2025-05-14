from motor.motor_asyncio import AsyncIOMotorClient
from app.models.document import Document, DocumentStatus, ChangeLogEntry
from app.utils.file_utils import save_file, get_file_mime_type
from app.config import MONGO_URL, DATABASE_NAME, COLLECTION_NAME
from fastapi import UploadFile, HTTPException
from bson import ObjectId
from datetime import datetime
import os
from typing import List, Dict, Any, Optional
import json
from fastapi.encoders import jsonable_encoder

# Configuration de la connexion MongoDB
client = AsyncIOMotorClient(MONGO_URL)
db = client[DATABASE_NAME]
collection = db[COLLECTION_NAME]

async def publish_event(event_type: str, payload: Dict):
    print(f"Event published: {event_type} - {json.dumps(payload)}")
    pass

async def get_next_version(title: str, change_description: str, author: str, changes: List[str]):
    """Génère la prochaine version et un changelog pour un document"""
    doc = await collection.find_one({"title": title}, sort=[("created_at", -1)])
    
    if not doc:
        new_version = "v1.0"
        changelog = []
    else:
        last_ver = doc.get("version", "v1.0")
        
        if last_ver.startswith('v'):
            last_ver = last_ver[1:]
        
        try:
            major, minor = map(int, last_ver.split("."))
            new_version = f"v{major}.{minor + 1}"
        except ValueError:
            new_version = "v1.0"
        
        changelog = doc.get("changelog", [])
    
    changelog_entry = ChangeLogEntry(
        version=new_version,
        date=datetime.utcnow(),
        author=author,
        change_description=change_description,
        changes=changes
    )
    
    changelog.append(jsonable_encoder(changelog_entry))
    
    return new_version, changelog

async def create_document(
    title: str, 
    description: Optional[str], 
    author: str, 
    file: UploadFile, 
    category: Optional[str] = None,
    tags: List[str] = [], 
    status: DocumentStatus = DocumentStatus.DRAFT,
    change_description: str = "Initial document creation", 
    changes: List[str] = [] ,
    user_id: str = None
) -> Dict:
    """Crée un nouveau document avec versioning"""
    
    existing = await collection.find_one({"title": title})
    if existing:
        raise HTTPException(status_code=409, detail=f"Document with title '{title}' already exists")
    
    file_url = await save_file(file)
    content_type = get_file_mime_type(os.path.join("uploads", file_url.lstrip("/files/")))
    
    version, changelog = await get_next_version(title, change_description, author, changes)
    
    doc = Document(
        title=title,
        description=description,
        author=author,
        file_url=file_url,
        version=version,
        status=status,
        tags=tags,
        category=category,
        changelog=changelog,
        content_type=content_type,
        created_at=datetime.utcnow(),
        last_modified_by=author,
        user_id=user_id
    )
    
    result = await collection.insert_one(jsonable_encoder(doc))
    doc_id = str(result.inserted_id)
    
    await publish_event("document.created", {
        "id": doc_id,
        "title": title,
        "version": version,
        "author": author
    })
    
    return {"id": doc_id, "version": version, "status": status}

async def get_document_by_id(doc_id: str) -> Dict:
    """Récupère un document par son ID"""
    try:
        doc = await collection.find_one({"_id": ObjectId(doc_id)})
        if doc:
            doc["id"] = str(doc["_id"])
            del doc["_id"]
            
            # Trouver l'extension réelle du fichier
            if 'file_url' in doc:
                base_path = os.path.join("uploads", doc['file_url'].lstrip("/files/"))
                if not os.path.exists(base_path):
                    # Chercher avec différentes extensions
                    for ext in ['.doc', '.docx', '.pdf', '.jpg', '.png', '.xls', '.xlsx']:
                        if os.path.exists(base_path + ext):
                            doc['file_url'] = doc['file_url'] + ext
                            break
            
            return doc
        return None
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Document not found: {e}")

async def get_document_versions(title: str) -> List[Dict]:
    """Récupère toutes les versions d'un document par son titre"""
    cursor = collection.find({"title": title}).sort("created_at", 1)
    versions = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        versions.append(doc)
    return versions

async def get_document_with_changelog(doc_id: str) -> Dict:
    """Récupère un document avec son historique de versions"""
    doc = await get_document_by_id(doc_id)
    if doc:
        return {
            "id": doc["id"],
            "title": doc["title"],
            "description": doc.get("description", ""),
            "author": doc["author"],
            "version": doc["version"],
            "status": doc["status"],
            "created_at": doc["created_at"],
            "updated_at": doc.get("updated_at"),
            "tags": doc.get("tags", []),
            "category": doc.get("category"),
            "changelog": doc["changelog"],
            "file_url": doc["file_url"],
            "content_type": doc.get("content_type", "application/pdf")
        }
    raise HTTPException(status_code=404, detail="Document not found")

async def update_document(
    doc_id: str, 
    update_data: Dict,
    file: Optional[UploadFile] = None,
    change_description: str = "Updated document",
    changes: List[str] = []
) -> Dict:
    """Met à jour un document avec gestion des versions"""
    
    doc = await get_document_by_id(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    title = update_data.get("title", doc["title"])
    author = update_data.get("author", doc.get("last_modified_by") or doc["author"])
    
    new_version, changelog = await get_next_version(title, change_description, author, changes)
    
    if file:
        file_url = await save_file(file)
        update_data["file_url"] = file_url
        update_data["content_type"] = get_file_mime_type(os.path.join("Uploads", file_url.lstrip("/files/")))
    
    update_data["version"] = new_version
    update_data["changelog"] = changelog
    update_data["updated_at"] = datetime.utcnow()
    update_data["last_modified_by"] = author
    update_data["previous_version_id"] = doc_id
    
    await collection.update_one({"_id": ObjectId(doc_id)}, {"$set": update_data})
    
    await publish_event("document.updated", {
        "id": doc_id,
        "title": title,
        "version": new_version,
        "modified_by": author
    })
    
    return {
        "message": "Document updated successfully",
        "id": doc_id,
        "new_version": new_version,
        "title": title
    }

async def change_document_status(doc_id: str, new_status: DocumentStatus, modified_by: str) -> Dict:
    """Change le statut d'un document (brouillon, en revue, publié, archivé)"""
    
    doc = await get_document_by_id(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    update_data = {
        "status": new_status.value,
        "updated_at": datetime.utcnow(),
        "last_modified_by": modified_by
    }
    
    await collection.update_one({"_id": ObjectId(doc_id)}, {"$set": update_data})
    
    event_type = f"document.{new_status.value}"
    await publish_event(event_type, {
        "id": doc_id,
        "title": doc["title"],
        "version": doc["version"],
        "modified_by": modified_by
    })
    
    return {
        "message": f"Document status changed to {new_status.value}",
        "id": doc_id,
        "title": doc["title"],
        "status": new_status.value
    }

async def delete_document(doc_id: str, permanent: bool = False) -> Dict:
    """Supprime ou archive un document"""
    
    doc = await get_document_by_id(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if permanent:
        file_path = os.path.join("Uploads", doc.get("file_url").lstrip("/files/"))
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
        
        await collection.delete_one({"_id": ObjectId(doc_id)})
        
        await publish_event("document.deleted", {
            "id": doc_id,
            "title": doc["title"]
        })
        
        return {"message": "Document permanently deleted"}
    else:
        return await change_document_status(doc_id, DocumentStatus.ARCHIVED, doc.get("last_modified_by", doc["author"]))

async def search_documents(
    query: str = "",
    tags: List[str] = None,
    category: str = None,
    status: DocumentStatus = None,
    limit: int = 50,
    skip: int = 0
) -> Dict:
    """Recherche de documents avec filtres"""
    
    filter_query = {}
    
    if query:
        filter_query["$or"] = [
            {"title": {"$regex": query, "$options": "i"}},
            {"description": {"$regex": query, "$options": "i"}}
        ]
    
    if tags:
        filter_query["tags"] = {"$in": tags}
    
    if category:
        filter_query["category"] = category
    
    if status:
        filter_query["status"] = status.value
    else:
        filter_query["status"] = {"$ne": DocumentStatus.ARCHIVED.value}
    
    cursor = collection.find(filter_query).sort("updated_at", -1).skip(skip).limit(limit)
    
    total = await collection.count_documents(filter_query)
    
    results = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        results.append(doc)
    
    return {
        "total": total,
        "results": results,
        "page": skip // limit + 1 if limit > 0 else 1,
        "page_size": limit
    }

async def get_all_documents(
    status: Optional[DocumentStatus] = None,
    limit: int = 50,
    skip: int = 0
) -> Dict:
    """Récupère tous les documents avec pagination"""
    
    filter_query = {}
    
    if status:
        filter_query["status"] = status.value
    else:
        filter_query["status"] = {"$ne": DocumentStatus.ARCHIVED.value}
    
    cursor = collection.find(filter_query).sort("updated_at", -1).skip(skip).limit(limit)
    
    total = await collection.count_documents(filter_query)
    
    documents = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        documents.append(doc)
    
    return {
        "total": total,
        "documents": documents,
        "page": skip // limit + 1 if limit > 0 else 1,
        "page_size": limit
    }