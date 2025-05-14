#docuement.py

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class DocumentStatus(str, Enum):
    DRAFT = "draft"
    IN_REVIEW = "in_review"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class ChangeLogEntry(BaseModel):
    version: str
    date: datetime = Field(default_factory=datetime.utcnow)
    author: str
    change_description: str
    changes: List[str] = []


class Document(BaseModel):
    title: str
    description: Optional[str] = None
    author: str
    file_url: str
    version: str
    status: DocumentStatus = DocumentStatus.DRAFT
    tags: List[str] = []
    category: Optional[str] = None
    changelog: List[ChangeLogEntry] = []
    content_type: str = "application/pdf"  # Type MIME du document
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    last_modified_by: Optional[str] = None
    previous_version_id: Optional[str] = None  # Référence à la version précédente
    user_id: str 