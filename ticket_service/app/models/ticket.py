#models/ticket.py
from enum import Enum
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional
from bson import ObjectId

class ProblemType(str, Enum):
    OUTDATED = "outdated"
    ERROR = "error"
    MISLEADING = "misleading"
    OTHER = "other"

class Severity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class TicketBase(BaseModel):
    document_id: str = Field(..., min_length=1)
    user_id: str = Field(..., min_length=1)
    problem_type: ProblemType = ProblemType.OTHER
    severity: Severity = Severity.MEDIUM
    description: Optional[str] = Field(None, max_length=500)

class TicketCreate(TicketBase):
    pass

class TicketDB(TicketBase):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = "open"
    
    class Config:
        from_attributes = True
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "_id": "507f1f77bcf86cd799439011",
                "document_id": "681217f9e30b109ab563e5ea",
                "user_id": "user123",
                "problem_type": "error",
                "severity": "medium",
                "description": "Issue with the document formatting",
                "created_at": "2025-05-01T18:03:59.819",
                "status": "open"
            }
        }