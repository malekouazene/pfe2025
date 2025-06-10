from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

# --- Enums ---
class FeedbackType(str, Enum):
    USER_EXPERIENCE = "USER_EXPERIENCE"
    SUGGESTION = "SUGGESTION"
    PROBLEM = "PROBLEM"
    SUPPORT_REQUEST = "SUPPORT_REQUEST"

class SuggestionType(str, Enum):
    CONTENT_ADDITION = "Ajout de contenu"
    FEATURE_IMPROVEMENT = "Amélioration de fonctionnalité"
    PROCESS_OPTIMIZATION = "Optimisation de processus"

class ProblemType(str, Enum):
    FACTUAL_ERROR = "Erreur factuelle"
    INCOMPLETE_CONTENT = "Contenu incomplet"
    OUTDATED_CONTENT = "Contenu obsolète"
    POOR_STRUCTURE = "Structure mal organisée"
    INAPPROPRIATE_LANGUAGE = "Langage inadapté"
    LACK_OF_CONTEXT = "Manque de contexte"

class Priority(str, Enum):
    LOW = "Basse"
    MEDIUM = "Moyenne"
    HIGH = "Élevée"

class Severity(str, Enum):
    MINOR = "Mineur"
    MODERATE = "Modéré"
    CRITICAL = "Critique"

class Urgency(str, Enum):
    NORMAL = "Normale"
    URGENT = "Urgente"

class ResourceType(str, Enum):
    GUIDE = "Guide/Tutoriel"
    TEMPLATE = "Modèle/Exemple"
    TRAINING = "Formation/Vidéo"
    OTHER = "Autre"

# --- Modèle d'entrée (POST) ---
class FeedbackCreate(BaseModel):
    feedback_type: FeedbackType
    user_id: str = Field(..., min_length=1, description="ID de l'utilisateur")
    user_name: str = Field(..., min_length=1, description="Nom de l'utilisateur")
    # --- UX Feedback ---
    rating: Optional[float] = Field(None, ge=1, le=5)
    navigation_score: Optional[int] = Field(None, ge=1, le=5)
    access_score: Optional[int] = Field(None, ge=1, le=5)
    clarity_score: Optional[int] = Field(None, ge=1, le=5)
    experience_description: Optional[str] = None

    # --- Suggestion ---
    suggestion_type: Optional[SuggestionType] = None
    resource_concerned: Optional[str] = None
    suggestion_description: Optional[str] = None
    priority: Optional[Priority] = Priority.MEDIUM
    attachment: Optional[str] = None

    # --- Problème ---
    problem_resource: Optional[str] = None
    problem_type: Optional[ProblemType] = None
    problem_description: Optional[str] = None
    severity: Optional[Severity] = None

    # --- Support ---
    support_subject: Optional[str] = None
    support_context: Optional[str] = None
    urgency: Optional[Urgency] = None
    resource_type: Optional[ResourceType] = None

# --- Modèle de sortie (GET) ---
class FeedbackResponse(FeedbackCreate):
    id: str
    status: str
    created_at: datetime
    sentiment: Optional[str] = None
    raw_label: Optional[str] = None
    confidence: Optional[float] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }