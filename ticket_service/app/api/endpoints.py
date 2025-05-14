#API/endpoints.py
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.services.ticket import TicketService
from app.services.document import DocumentServiceClient
from app.schemas.ticket import TicketCreate, TicketResponse
from app.db.mongodb import get_db
from app.config import settings
import logging  # Import ajouté

# Configurez le logger
logger = logging.getLogger(__name__)

router = APIRouter()
security = HTTPBearer()

async def get_ticket_service(db: AsyncIOMotorDatabase = Depends(get_db)):
    return TicketService(db[settings.TICKET_COLLECTION])

@router.post("/tickets", response_model=TicketResponse, status_code=201)
async def create_ticket(
    ticket: TicketCreate,
    service: TicketService = Depends(get_ticket_service),
    doc_client: DocumentServiceClient = Depends()
):
    try:
        # Debug: Log l'URL utilisée
        logger.info(f"Checking document at: {settings.DOCUMENT_SERVICE_URL}/documents/{ticket.document_id}")
        
        if not await doc_client.verify_document(ticket.document_id):
            raise HTTPException(
                status_code=404,
                detail=f"Document {ticket.document_id} not found at {settings.DOCUMENT_SERVICE_URL}"
            )
            
        ticket_id = await service.create(ticket)
        logger.info(f"Ticket created successfully: {ticket_id}")
        return {**ticket.dict(), "id": ticket_id, "status": "open"}
        
    except HTTPException as e:
        logger.error(f"Document verification failed: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/tickets/{document_id}/stats")
async def get_ticket_stats(
    document_id: str,
    service: TicketService = Depends(get_ticket_service)
):
    logger.info(f"Fetching stats for document: {document_id}")
    return await service.get_stats(document_id)