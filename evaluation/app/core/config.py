from pydantic_settings import BaseSettings
from typing import ClassVar, Dict

class Settings(BaseSettings):
    # Configuration MongoDB
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_NAME: str = "doc_evaluation"  # Ou le nom correct de votre base
    EVALUATION_COLLECTION: str = "evaluations"
    
    NOTIFICATION_QUEUE: str = "document_notifications"
    RABBITMQ_URL: str = "amqp://guest:guest@rabbitmq/"
    ANALYTICS_SERVICE_URL: str = "http://localhost:8001"
    FEEDBACK_SERVICE_URL: str = "http://localhost:8001" 
    DOCUMENT_SERVICE_URL: str = "http://localhost:8000"
    NOTIFICATION_SERVICE_URL: str = "http://localhost:8005"
    SCHEDULER_INTERVAL_MINUTES: int = 60
 
    NOTIFICATIONS_COLLECTION: str = "notifications"
    
     # Augmentez les timeouts
    HTTPX_TIMEOUT: int = 30
    HTTPX_RETRIES: int = 3
    # Configuration des seuils
    SCORE_THRESHOLDS: ClassVar[Dict[str, float]] = {
        'fresh': 30,
        'stale': 60,
        'outdated': 80
    }

    # Poids des critères
    CRITERIA_WEIGHTS: ClassVar[Dict[str, float]] = {
        'age': 0.35,
        'usage': 0.15,
        'feedback': 0.20,
        'versions': 0.25,
        'related': 0.05
    }

    # Jours avant ré-évaluation
    RE_EVALUATION_DAYS: int = 30

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Permet d'ignorer les variables supplémentaires

settings = Settings()