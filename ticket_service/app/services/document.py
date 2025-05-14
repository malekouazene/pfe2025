#services/document.py
import httpx
from fastapi import HTTPException
from ..config import settings
import logging

logger = logging.getLogger(__name__)

class DocumentServiceClient:
   async def verify_document(self, doc_id: str) -> bool:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            # URL corrigée avec le préfixe /api/v1
            response = await client.get(
                f"{settings.DOCUMENT_SERVICE_URL}/documents/{doc_id}"
            )
            
            if response.status_code == 200:
                return True
            elif response.status_code == 404:
                return False
            else:
                response.raise_for_status()
                
    except httpx.RequestError as e:
        logger.error(f"Erreur de connexion: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail=f"Service Document indisponible: {str(e)}"
        )