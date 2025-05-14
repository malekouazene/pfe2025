from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.services.feedback import FeedbackService
from app.schemas import FeedbackCreate
from app.db.database import get_db
from app.db.models import FeedbackDB

router = APIRouter(prefix="/feedback", tags=["feedback"])

def get_feedback_service(db: AsyncIOMotorDatabase = Depends(get_db)):
    return FeedbackService(db["feedbacks"])

@router.post("/", response_model=str, status_code=status.HTTP_201_CREATED)
async def submit_feedback(
    feedback: FeedbackCreate,
    service: FeedbackService = Depends(get_feedback_service)
):
    feedback_db = FeedbackDB(**feedback.dict())
    return await service.create_feedback(feedback_db)

@router.get("/stats/{document_id}")
async def get_feedback_stats(
    document_id: str,
    service: FeedbackService = Depends(get_feedback_service)
):
    stats = await service.get_feedback_stats(document_id)
    if not stats:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No feedback found for this document"
        )
    return stats