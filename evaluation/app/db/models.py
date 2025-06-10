
#db/models.py

from enum import Enum
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Dict, List
from bson import ObjectId

class EvaluationStatus(str, Enum):
    """Statuts possibles d'un document"""
    FRESH = "fresh"
    STALE = "stale"
    OUTDATED = "outdated"
    CRITICAL = "critical"

class EvaluationBase(BaseModel):
    """Modèle de base pour l'évaluation"""
    document_id: str = Field(..., description="ID du document évalué")
    score: float = Field(..., ge=0, le=100, description="Score global (0-100%)")
    status: EvaluationStatus = Field(..., description="Statut calculé")
    details: Dict[str, float] = Field(..., description="Scores par critère")
   
    evaluated_at: datetime = Field(default_factory=datetime.utcnow, description="Date d'évaluation")
    next_evaluation: datetime = Field(description="Date de prochaine évaluation")

class EvaluationDB(EvaluationBase):
    """Modèle MongoDB avec ID"""
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "_id": "507f1f77bcf86cd799439011",
                "document_id": "doc_123",
                "score": 65.5,
                "status": "outdated",
                "details": {
                    "age": 70,
                    "usage": 40,
                
                    "feedback": 50,
                    "versions": 60,
                    "related": 30
                },
               
                "evaluated_at": "2023-01-01T00:00:00",
                "next_evaluation": "2023-02-01T00:00:00"
            }
        }