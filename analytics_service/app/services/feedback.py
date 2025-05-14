from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorCollection
from app.db.models import FeedbackDB
from typing import Dict, Any, Optional

class FeedbackService:
    def __init__(self, collection: AsyncIOMotorCollection):
        self.collection = collection
    
    async def create_feedback(self, feedback: FeedbackDB) -> str:
        existing = await self.collection.find_one({
            "document_id": feedback.document_id,
            "user_id": feedback.user_id
        })
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already submitted feedback for this document"
            )
        
        result = await self.collection.insert_one(feedback.dict())
        return str(result.inserted_id)
    
    async def get_feedback_stats(self, document_id: str) -> Optional[Dict[str, Any]]:
        pipeline = [
            {"$match": {"document_id": document_id}},
            {"$group": {
                "_id": None,
                "average": {"$avg": "$rating"},
                "count": {"$sum": 1},
                "distribution": {"$push": "$rating"}
            }}
        ]
        
        cursor = self.collection.aggregate(pipeline)
        result = await cursor.to_list(length=1)
        
        if not result:
            return None
            
        stats = result[0]
        distribution = {i: 0 for i in range(1, 6)}
        for rating in stats["distribution"]:
            distribution[rating] += 1
            
        return {
            "average": round(stats["average"], 2),
            "total": stats["count"],
            "distribution": distribution
        }