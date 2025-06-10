# app/schemas.py
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Annotated
from datetime import datetime
from bson import ObjectId
from pydantic_core import core_schema

class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type, handler
    ):
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema([
                core_schema.is_instance_schema(ObjectId),
                core_schema.chain_schema([
                    core_schema.str_schema(),
                    core_schema.no_info_plain_validator_function(cls.validate),
                ])
            ]),
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x)
            ),
        )

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

class DiscussionCreate(BaseModel):
    """Schema pour créer une nouvelle discussion"""
    model_config = ConfigDict(
        json_encoders={ObjectId: str},
        json_schema_extra={
            "example": {
                "title": "Question sur le document",
                "content": "J'ai une question concernant la section 2.3...",
                "category": "technique",
                "tags": ["mongodb", "python"]
            }
        }
    )
    
    title: str = Field(..., min_length=1, max_length=200, description="Titre de la discussion")
    content: str = Field(..., min_length=1, description="Contenu initial de la discussion")
    category: Optional[str] = Field(None, description="Catégorie de la discussion")
    tags: Optional[List[str]] = Field(default_factory=list, description="Tags associés à la discussion")

class MessageCreate(BaseModel):
    """Schema pour créer un nouveau message"""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "content": "Merci pour votre réponse, j'ai maintenant compris...",
                "attachments": []
            }
        }
    )
    
    content: str = Field(..., min_length=1, description="Contenu du message")
    attachments: Optional[List[str]] = Field(default_factory=list, description="Liste des pièces jointes")

class Message(BaseModel):
    """Schema pour représenter un message"""
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str},
        json_schema_extra={
            "example": {
                "id": "60d5ecb74f3d4b2f8c8e4a1b",
                "discussion_id": "60d5ecb74f3d4b2f8c8e4a1a",
                "sender_id": "user123",
                "sender_type": "user",
                "content": "Voici ma question...",
                "attachments": [],
                "sent_at": "2023-06-25T10:30:00Z",
                "read": False
            }
        }
    )
    
    id: Annotated[PyObjectId, Field(default_factory=PyObjectId, alias="_id")]
    discussion_id: PyObjectId
    sender_id: str
    sender_type: str = Field(..., description="Type d'expéditeur: 'user' ou 'expert'")
    content: str
    attachments: Optional[List[str]] = Field(default_factory=list)
    sent_at: datetime
    read: bool = Field(default=False)

class Discussion(BaseModel):
    """Schema pour représenter une discussion complète"""
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str},
        json_schema_extra={
            "example": {
                "id": "60d5ecb74f3d4b2f8c8e4a1a",
                "title": "Question sur MongoDB",
                "content": "Comment optimiser les requêtes?",
                "user_id": "user123",
                "expert_id": "expert456",
                "document_id": "doc789",
                "category": "technique",
                "tags": ["mongodb", "optimisation"],
                "status": "open",
                "created_at": "2023-06-25T10:00:00Z",
                "last_activity": "2023-06-25T10:30:00Z",
                "closed_at": None,
                "messages": []
            }
        }
    )
    
    id: Annotated[PyObjectId, Field(default_factory=PyObjectId, alias="_id")]
    title: str
    content: str
    user_id: str
    expert_id: Optional[str] = None 
    document_id: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = Field(default_factory=list)
    status: str = Field(default="open", description="Statut: 'open', 'closed', 'pending'")
    created_at: datetime
    last_activity: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    messages: Optional[List[Message]] = Field(default_factory=list)

class DiscussionSummary(BaseModel):
    """Schema pour un résumé de discussion (sans les messages)"""
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: Annotated[PyObjectId, Field(default_factory=PyObjectId, alias="_id")]
    title: str
    user_id: str
    expert_id: Optional[str] = None
    document_id: Optional[str] = None
    category: Optional[str] = None
    status: str
    created_at: datetime
    last_activity: Optional[datetime] = None
    message_count: Optional[int] = 0
    unread_count: Optional[int] = 0

class ExpertAssignment(BaseModel):
    """Schema pour assigner un expert"""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "expert_id": "expert456"
            }
        }
    )
    
    expert_id: str = Field(..., description="ID de l'expert à assigner")

class DiscussionStats(BaseModel):
    """Schema pour les statistiques des discussions"""
    total_discussions: int
    open_discussions: int
    closed_discussions: int
    pending_discussions: int
    total_messages: int
    unread_messages: int