from motor.core import AgnosticCollection
from app.db.models import AccessRecordDB
from datetime import datetime, timedelta
from typing import Dict, Any
from app.services.document_integration import document_client  # Import correct

class AnalyticsService:
    def __init__(self, collection: AgnosticCollection) -> None:
        """Initialise le service analytique avec une collection MongoDB"""
        self.collection = collection
    
    async def record_access(self, access: AccessRecordDB) -> Dict[str, str]:
        """
        Enregistre un accès à un document
        Args:
            access: Données d'accès à enregistrer
        Returns:
            Dict: Confirmation de succès
        """
        await self.collection.insert_one(access.dict())
        return {"status": "success"}
    
    async def get_document_analytics(self, document_id: str, days: int = 30) -> Dict[str, Any]:
        """
        Récupère les statistiques d'utilisation d'un document
        Args:
            document_id: ID du document à analyser
            days: Nombre de jours à prendre en compte (défaut: 30)
        Returns:
            Dict: Statistiques d'utilisation
        """
        start_date = datetime.utcnow() - timedelta(days=days)
        
        total_views = await self.collection.count_documents({
            "document_id": document_id,
            "access_time": {"$gte": start_date}
        })
        
        unique_users = await self.collection.distinct("user_id", {
            "document_id": document_id,
            "access_time": {"$gte": start_date}
        })
        
        return {
            "document_id": document_id,
            "total_views": total_views,
            "unique_users": len(unique_users),
            "time_frame": f"{days}d"
        }
    
    async def get_all_document_stats(self) -> Dict[str, Dict[str, Any]]:
        """
        Récupère les statistiques pour tous les documents
        Returns:
            Dict: Statistiques pour tous les documents (ID → stats)
        """
        document_ids = await document_client.get_document_ids()
        return {
            doc_id: await self.get_document_analytics(doc_id)
            for doc_id in document_ids
        }