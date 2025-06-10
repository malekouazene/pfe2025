#app/db/ontology.py
from pydantic import BaseModel
from typing import List, Optional

class OntologySkill(BaseModel):
    uri: str
    preferred_label: str
    description: Optional[str]
    skill_type: Optional[str]
    
    class Config:
        json_encoders = {
            "uri": lambda v: str(v)
        }

class CareerPathSuggestion(BaseModel):
    current_skill: str
    suggested_skill: OntologySkill
    relevance_score: float
    related_occupations: List[str]
    