
# app/services/notification.py
from motor.motor_asyncio import AsyncIOMotorDatabase
from ..db.models.notification import NotificationCreate, NotificationUpdate, NotificationResponse, NotificationList
from bson import ObjectId
from datetime import datetime
from typing import Dict, Optional, Any, List
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.notifications
    
    async def create_notification(self, notification_data: NotificationCreate) -> NotificationResponse:
        """Crée une nouvelle notification"""
        notification_dict = notification_data.dict()
        notification_dict["created_at"] = datetime.utcnow()
        
        result = await self.collection.insert_one(notification_dict)
        created_notification = await self.collection.find_one({"_id": result.inserted_id})
        
        return NotificationResponse(**created_notification)
    
    async def get_notification(self, notification_id: str) -> Optional[NotificationResponse]:
        """Récupère une notification par son ID"""
        try:
            notification = await self.collection.find_one({"_id": ObjectId(notification_id)})
            if notification:
                return NotificationResponse(**notification)
            return None
        except Exception as e:
            logger.error(f"Error retrieving notification {notification_id}: {str(e)}")
            return None
    
    async def get_user_notifications(
        self, 
        user_id: str, 
        limit: int = 10, 
        offset: int = 0,
        filters: Dict[str, Any] = None
    ) -> NotificationList:
        """Récupère la liste des notifications d'un utilisateur avec filtres"""
        # Construire le filtre de base
        query = {"recipient_id": user_id}
        
        # Ajouter les filtres supplémentaires s'ils sont fournis
        if filters:
            for key, value in filters.items():
                if value is not None:
                    query[key] = value
        
        # Compter le total de notifications qui correspondent au filtre
        total = await self.collection.count_documents(query)
        
        # Récupérer les notifications avec pagination
        cursor = self.collection.find(query)
        cursor.sort("created_at", -1)  # Tri par date (plus récente d'abord)
        cursor.skip(offset).limit(limit)
        
        notifications = [NotificationResponse(**doc) async for doc in cursor]
        
        return NotificationList(total=total, items=notifications)
    
    async def update_notification(
        self, 
        notification_id: str, 
        update_data: NotificationUpdate
    ) -> Optional[NotificationResponse]:
        """Met à jour une notification"""
        update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
        
        if not update_dict:
            # Aucune donnée à mettre à jour
            notification = await self.get_notification(notification_id)
            return notification
        
        result = await self.collection.update_one(
            {"_id": ObjectId(notification_id)},
            {"$set": update_dict}
        )
        
        if result.modified_count == 0 and result.matched_count == 0:
            return None
            
        return await self.get_notification(notification_id)
    
    async def mark_as_read(self, notification_id: str) -> Optional[NotificationResponse]:
        """Marque une notification comme lue"""
        update_data = NotificationUpdate(is_read=True)
        return await self.update_notification(notification_id, update_data)
    
    async def mark_all_as_read(self, user_id: str) -> int:
        """Marque toutes les notifications d'un utilisateur comme lues"""
        result = await self.collection.update_many(
            {"recipient_id": user_id, "is_read": False},
            {"$set": {"is_read": True}}
        )
        return result.modified_count
    
    async def delete_notification(self, notification_id: str) -> bool:
        """Supprime une notification"""
        result = await self.collection.delete_one({"_id": notification_id})
        return result.deleted_count > 0
    
    async def create_stale_notification(
        self, 
        author_id: str, 
        document_id: str, 
        document_title: str, 
        score: float
    ) -> NotificationResponse:
        """Crée une notification pour un document obsolète"""
        notification_data = NotificationCreate(
            recipient_id=author_id,
            document_id=document_id,
            title=f"Document obsolète: {document_title}",
            message=f"Votre document '{document_title}' a un score de {score:.2f} et nécessite une mise à jour.",
            status="stale"
        )
        
        return await self.create_notification(notification_data)