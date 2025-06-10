#schemas/evaluation.py
from pydantic import BaseModel,Field
from datetime import datetime
from typing import List, Dict, Optional
from ..db.models import EvaluationStatus
from bson import ObjectId
class EvaluationRequest(BaseModel):
    """Schéma de requête pour l'évaluation"""
    document_id: str
    force_refresh: Optional[bool] = False

class EvaluationResponse(BaseModel):
    """Schéma de réponse pour une évaluation"""
    id: str = Field(..., alias="_id")
    document_id: str
    score: float
    status: EvaluationStatus
    details: Dict[str, float]

    evaluated_at: datetime
    next_evaluation: datetime

    class Config:
        populate_by_name = True  # Nouveau nom dans Pydantic v2 (remplace allow_population_by_field_name)
        json_encoders = {ObjectId: str}
        arbitrary_types_allowed = True

class BatchEvaluationRequest(BaseModel):
    """Requête pour évaluation par lot"""
    document_ids: List[str]
    force_refresh: Optional[bool] = False

class BatchEvaluationResponse(BaseModel):
    """Réponse pour évaluation par lot"""
    processed_count: int
    failed_count: int
    results: List[EvaluationResponse]
    status_summary: Dict[EvaluationStatus, int]



# New schema for the list endpoint
class EvaluationsListResponse(BaseModel):
    """Response model for list of evaluations with pagination and status summary"""
    total_count: int = Field(..., description="Total number of evaluations matching the criteria")
    page_size: int = Field(..., description="Number of results per page")
    current_page: int = Field(..., description="Current page number")
    evaluations: List[EvaluationResponse] = Field(..., description="List of evaluations")
    status_summary: Dict[str, int] = Field(
        ..., 
        description="Summary of evaluation statuses counts in the filtered results"
    )    