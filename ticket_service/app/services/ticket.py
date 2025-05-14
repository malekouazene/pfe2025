
#services/ticket.py
from motor.motor_asyncio import AsyncIOMotorCollection
from datetime import datetime, timedelta
from fastapi import HTTPException, status
from app.schemas.ticket import TicketCreate
from app.models.ticket import TicketDB
from app.config import settings

class TicketService:
    def __init__(self, collection: AsyncIOMotorCollection):
        self.collection = collection

    async def create(self, ticket: TicketCreate) -> str:
        recent_reports = await self.collection.count_documents({
            "user_id": ticket.user_id,
            "document_id": ticket.document_id,
            "created_at": {"$gte": datetime.utcnow() - timedelta(days=1)}
        })
        
        if recent_reports >= settings.MAX_REPORTS_PER_USER:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many reports for this document"
            )

        ticket_db = TicketDB(**ticket.dict())
        result = await self.collection.insert_one(ticket_db.dict(by_alias=True))
        return str(result.inserted_id)

    async def get_stats(self, document_id: str) -> dict:
        pipeline = [
            {"$match": {"document_id": document_id}},
            {"$group": {
                "_id": "$problem_type",
                "count": {"$sum": 1},
                "latest": {"$max": "$created_at"}
            }}
        ]
        cursor = self.collection.aggregate(pipeline)
        return await cursor.to_list(None)