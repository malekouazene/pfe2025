# app/models/profile.py
from pydantic import BaseModel, Field
from typing import List
from enum import Enum
from pydantic import BaseModel, Field, validator
class UserLevel(str, Enum):
    BEGINNER = "débutant"
    INTERMEDIATE = "intermédiaire"
    ADVANCED = "avancee"

class UserProfileForm(BaseModel):
    user_id: str
    current_level: UserLevel
    existing_skills: List[str] = Field(default_factory=list)
    learning_goals: List[str] = Field(default_factory=list)

    @validator('existing_skills', 'learning_goals')
    def ensure_non_empty_list(cls, v):
        # Ne vérifions pas la longueur minimum, acceptons les listes vides
        # mais assurons-nous que c'est bien une liste
        if not isinstance(v, list):
            return []
        return v    