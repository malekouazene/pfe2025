# app/models.py
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
    """Modèle pour créer une nouvelle discussion"""
    model_config = ConfigDict(json_encoders={ObjectId: str})
    
    title: str
    content: str
    category: Optional[str] = None
    tags: Optional[List[str]] = Field(default_factory=list)

class MessageCreate(BaseModel):
    """Modèle pour créer un nouveau message"""
    content: str
    attachments: Optional[List[str]] = Field(default_factory=list)

class Message(BaseModel):
    """Modèle pour représenter un message"""
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: Annotated[PyObjectId, Field(default_factory=PyObjectId, alias="_id")]
    discussion_id: PyObjectId
    sender_id: str
    sender_type: str
    content: str
    attachments: Optional[List[str]] = Field(default_factory=list)
    sent_at: datetime
    read: bool = Field(default=False)

class Discussion(BaseModel):
    """Modèle pour représenter une discussion complète"""
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: Annotated[PyObjectId, Field(default_factory=PyObjectId, alias="_id")]
    title: str
    content: str
    user_id: str
    expert_id: Optional[str] = None
    document_id: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = Field(default_factory=list)
    status: str = Field(default="open")
    created_at: datetime
    last_activity: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    messages: Optional[List[Message]] = Field(default_factory=list)