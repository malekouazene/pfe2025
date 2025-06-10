from enum import Enum
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime

class DifficultyLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

class Guide(BaseModel):
    title: str
    url: str

class TrainingModuleBase(BaseModel):
    title: str = Field(..., max_length=100)
    description: str = Field(..., max_length=500)
    difficulty_level: DifficultyLevel
    required_skills: List[str] = Field(default_factory=list)
    learning_goals: List[str] = Field(default_factory=list)
    guides: List[Guide] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @validator('difficulty_level', pre=True)
    def map_difficulty_level(cls, v):
        mapping = {
            'débutant': 'beginner',
            'intermédiaire': 'intermediate',
            'avancé': 'advanced'
        }
        return mapping.get(v.lower(), v)

class TrainingModuleCreate(TrainingModuleBase):
    pass

class TrainingModule(TrainingModuleBase):
    id: str = Field(..., alias="_id")

    class Config:
        allow_population_by_field_name = True
        json_encoders = {datetime: lambda dt: dt.isoformat()}