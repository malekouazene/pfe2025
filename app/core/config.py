
# app/core/config.py
from pydantic_settings import BaseSettings
from typing import Dict, Any

class Settings(BaseSettings):
    # Nom de l'application
    APP_NAME: str = "Notification Service"
    API_PREFIX: str = "/api/v1"
    
    # Configuration MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_NOTIFICATIONS_DATABASE: str = "notifications_db"
    MONGODB_NOTIFICATIONS_COLLECTION: str = "notifications"
    
    # Paramètres de l'API
    DEFAULT_LIMIT: int = 100
    DEFAULT_OFFSET: int = 0
    
    # Configuration de logging
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
