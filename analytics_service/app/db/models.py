from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional

class FeedbackDB(BaseModel):
    document_id: str
    user_id: str
    rating: int
    optional_comment: Optional[str] = None
    feedback_date: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True  # Anciennement orm_mode=True

class AccessRecordDB(BaseModel):
    document_id: str
    user_id: str
    access_time: datetime = Field(default_factory=datetime.utcnow)
    session_duration: Optional[float] = None
    department: Optional[str] = None
    access_source: str = Field("web", min_length=1)
    action_type: Optional[str] = Field(None)  # Ajoutez ce champ
    class Config:
        from_attributes = True