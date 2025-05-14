from enum import IntEnum
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime 
class StarRating(IntEnum):
    VERY_POOR = 1
    POOR = 2
    AVERAGE = 3
    GOOD = 4
    EXCELLENT = 5

class FeedbackBase(BaseModel):
    document_id: str
    user_id: str
    rating: StarRating
    optional_comment: Optional[str] = None

class FeedbackCreate(FeedbackBase):
    pass

class FeedbackResponse(FeedbackBase):
    id: str
    feedback_date: datetime

    class Config:
        from_attributes = True

class AnalyticsResponse(BaseModel):
    document_id: str
    total_views: int
    unique_users: int
    average_rating: Optional[float]
    rating_distribution: Optional[Dict[int, int]]