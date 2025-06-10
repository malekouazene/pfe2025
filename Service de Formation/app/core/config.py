# app/core/config.py
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Configuration MongoDB
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB_NAME: str ="training_system" 
    # Ontology Service Configuration
    ESCO_API_URL: str = "https://ec.europa.eu/esco/api" # Example SKOS SPARQL endpoint
    # Configuration API
    API_PORT: int = 8007  # Ajoutez ce champ
     # Configuration Redis
    REDIS_ENABLED: bool = True  # Ajoutez ce champ
    REDIS_URL: str = "redis://localhost:6379"
    CACHE_TTL: int = 3600  # 1 heure en secondes
    # Configuration OpenRouter/Mistral
    OPENROUTER_API_KEY: Optional[str] = None
      
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # Ignore les champs supplémentaires

settings = Settings()