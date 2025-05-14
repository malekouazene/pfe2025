
#CONFIG.PY
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # MongoDB
    MONGO_URL: str = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    DB_NAME: str = os.getenv("DB_NAME", "knowledge_db")
    TICKET_COLLECTION: str = os.getenv("TICKET_COLLECTION", "tickets")
    
    # Document Service
    DOCUMENT_SERVICE_URL: str = os.getenv("DOCUMENT_SERVICE_URL", "http://127.0.0.1:8000/api/v1")
    
    # Ticket Settings
    MAX_REPORTS_PER_DAY: int = 3
    MAX_REPORTS_PER_USER: int = 5  
    AUTO_CLOSE_DAYS: int = 30
    
    class Config:
        env_file = ".env"

settings = Settings()
