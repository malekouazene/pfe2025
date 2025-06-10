from bson import ObjectId
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List
from pydantic.functional_validators import BeforeValidator
from typing_extensions import Annotated

# Définir un type annoté pour PyObjectId
PyObjectId = Annotated[str, BeforeValidator(lambda x: str(ObjectId(x)) if ObjectId.is_valid(x) else None)]

class NotificationBase(BaseModel):
    """Base notification model"""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    recipient_id: str = Field(..., description="ID de l'utilisateur à notifier")
    document_id: str = Field(..., description="ID du document concerné")
    title: str = Field(..., description="Titre de la notification")
    message: str = Field(..., description="Message détaillé")
    status: str = Field(..., description="Statut (stale, outdated, etc.)")

class NotificationCreate(NotificationBase):
    """Model for creating notifications"""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "recipient_id": "user123",
                "document_id": "doc456",
                "title": "Nouvelle notification",
                "message": "Ceci est un message",
                "status": "new"
            }
        }
    )

class Notification(NotificationBase):
    """Notification model"""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "recipient_id": "user123",
                "document_id": "doc456",
                "title": "Document obsolète",
                "message": "Votre document nécessite une mise à jour.",
                "status": "stale",
                "is_read": False,
                "created_at": "2023-01-01T00:00:00"
            }
        }
    )
    is_read: bool = Field(default=False, description="Notification lue ou non")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Date de création")

class NotificationDB(Notification):
    """Database model for notifications"""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "recipient_id": "user123",
                "document_id": "doc456",
                "title": "Document obsolète",
                "message": "Votre document nécessite une mise à jour.",
                "status": "stale",
                "is_read": False,
                "created_at": "2023-01-01T00:00:00",
                "id": "60c72b2f9b1e8c72d00f1a24"
            }
        }
    )
    id: PyObjectId = Field(default_factory=lambda: str(ObjectId()), alias="_id")

class NotificationUpdate(BaseModel):
    """Model for updating notifications"""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "is_read": True
            }
        }
    )
    is_read: Optional[bool] = Field(None, description="Marquer comme lu")

class NotificationResponse(NotificationDB):
    """Response model for notifications"""
    pass

class NotificationList(BaseModel):
    """Model for paginated notification list"""
    total: int
    items: List[NotificationResponse]