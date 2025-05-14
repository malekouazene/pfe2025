import httpx
from app.config import settings
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

class DocumentServiceClient:
    async def get_document_ids(self) -> list[str]:
        """Récupère tous les IDs de documents"""
        timeout = httpx.Timeout(10.0)  # Timeout de 10 secondes
        async with httpx.AsyncClient(timeout=timeout) as client:
            try:
                logger.info(f"Connecting to Document Service at {settings.DOCUMENT_SERVICE_URL}")
                response = await client.get(
                    f"{settings.DOCUMENT_SERVICE_URL}/documents",
                    params={"limit": 1000, "fields": "id"}
                )
                response.raise_for_status()
                return [doc["_id"] for doc in response.json()]
            
            except httpx.ConnectError as e:
                logger.error(f"Connection failed to Document Service: {e}")
                raise HTTPException(
                    status_code=503,
                    detail="Document Service unavailable"
                )
            except Exception as e:
                logger.error(f"Error fetching document IDs: {e}")
                raise HTTPException(
                    status_code=502,
                    detail=f"Document Service error: {str(e)}"
                )

document_client = DocumentServiceClient()