from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.services.analytics import AnalyticsService
from app.schemas import AnalyticsResponse
from app.db.database import get_db
from app.db.models import AccessRecordDB

router = APIRouter(prefix="/analytics", tags=["analytics"])

def get_analytics_service(db: AsyncIOMotorDatabase = Depends(get_db)):
    return AnalyticsService(db["document_access"])

@router.post("/access")
async def record_access(
    access: AccessRecordDB,
    service: AnalyticsService = Depends(get_analytics_service)
):
    return await service.record_access(access)

@router.get("/document/{document_id}", response_model=AnalyticsResponse)
async def get_document_analytics(
    document_id: str,
    days: int = 30,
    service: AnalyticsService = Depends(get_analytics_service)
):
    analytics = await service.get_document_analytics(document_id, days)
    
    # Assurez-vous que la réponse contient les champs requis
    if 'average_rating' not in analytics:
        analytics['average_rating'] = None  # ou une valeur par défaut si nécessaire
    if 'rating_distribution' not in analytics:
        analytics['rating_distribution'] = {}  # ou une valeur par défaut

    return analytics





@router.get("/stats/all")
async def get_all_stats(
    service: AnalyticsService = Depends(get_analytics_service)
):
    """Récupère les statistiques pour tous les documents"""
    return await service.get_all_document_stats()