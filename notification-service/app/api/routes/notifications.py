
# app/api/routes/notifications.py
from fastapi import APIRouter, Depends, HTTPException, Query, Body, Path, status
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from ...core.config import settings
from ...db.database import get_db
from ...db.models.notification import (
    NotificationCreate, 
    NotificationResponse, 
    NotificationUpdate,
    NotificationList
)
from ...services.notification import NotificationService

router = APIRouter(tags=["notifications"])

async def get_notification_service(db: AsyncIOMotorDatabase = Depends(get_db)) -> NotificationService:
    """Dépendance pour obtenir le service de notification"""
    return NotificationService(db)

@router.post(
    "", 
    response_model=NotificationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Créer une nouvelle notification"
)
async def create_notification(
    notification: NotificationCreate = Body(...),
    service: NotificationService = Depends(get_notification_service)
):
    """
    Crée une nouvelle notification:
    
    - **recipient_id**: ID de l'utilisateur destinataire
    - **document_id**: ID du document concerné
    - **title**: Titre de la notification
    - **message**: Message détaillé
    - **status**: Statut (stale, outdated, critical, etc.)
    """
    return await service.create_notification(notification)

@router.get(
    "/user/{user_id}", 
    response_model=NotificationList,
    summary="Récupérer les notifications d'un utilisateur"
)
async def get_user_notifications(
    user_id: str = Path(..., description="ID de l'utilisateur"),
    limit: int = Query(10, ge=1, le=100, description="Nombre maximum de résultats"),
    offset: int = Query(0, ge=0, description="Nombre de résultats à ignorer (pagination)"),
    status: Optional[str] = Query(None, description="Filtrer par statut"),
    is_read: Optional[bool] = Query(None, description="Filtrer par lu/non lu"),
    service: NotificationService = Depends(get_notification_service)
):
    """
    Récupère la liste des notifications d'un utilisateur avec options de filtrage et pagination.
    """
    return await service.get_user_notifications(
        user_id=user_id,
        limit=limit,
        offset=offset,
        filters={
            "status": status,
            "is_read": is_read
        }
    )

@router.get(
    "/{notification_id}", 
    response_model=NotificationResponse,
    summary="Récupérer une notification par son ID"
)
async def get_notification(
    notification_id: str = Path(..., description="ID de la notification"),
    service: NotificationService = Depends(get_notification_service)
):
    """
    Récupère une notification spécifique par son ID.
    """
    notification = await service.get_notification(notification_id)
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification non trouvée"
        )
    return notification

@router.patch(
    "/{notification_id}", 
    response_model=NotificationResponse,
    summary="Mettre à jour une notification"
)
async def update_notification(
    notification_id: str = Path(..., description="ID de la notification"),
    update_data: NotificationUpdate = Body(...),
    service: NotificationService = Depends(get_notification_service)
):
    """
    Mettre à jour une notification. Actuellement, seul le statut de lecture peut être modifié.
    """
    notification = await service.update_notification(notification_id, update_data)
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification non trouvée"
        )
    return notification

@router.post(
    "/read/{notification_id}",
    response_model=NotificationResponse,
    summary="Marquer une notification comme lue"
)
async def mark_as_read(
    notification_id: str = Path(..., description="ID de la notification"),
    service: NotificationService = Depends(get_notification_service)
):
    """
    Marque une notification comme lue (raccourci).
    """
    notification = await service.mark_as_read(notification_id)
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification non trouvée"
        )
    return notification

@router.post(
    "/read-all/user/{user_id}",
    summary="Marquer toutes les notifications d'un utilisateur comme lues"
)
async def mark_all_as_read(
    user_id: str = Path(..., description="ID de l'utilisateur"),
    service: NotificationService = Depends(get_notification_service)
):
    """
    Marque toutes les notifications d'un utilisateur comme lues.
    """
    count = await service.mark_all_as_read(user_id)
    return {"status": "success", "marked_count": count}

@router.delete(
    "/{notification_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Supprimer une notification"
)
async def delete_notification(
    notification_id: str = Path(..., description="ID de la notification"),
    service: NotificationService = Depends(get_notification_service)
):
    """
    Supprime une notification spécifique.
    """
    deleted = await service.delete_notification(notification_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification non trouvée"
        )
    return None

@router.post(
    "/stale-document",
    response_model=NotificationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Créer une notification pour document obsolète"
)
async def notify_stale_document(
    author_id: str = Body(..., embed=True),
    document_id: str = Body(..., embed=True),
    document_title: str = Body(..., embed=True),
    score: float = Body(..., embed=True),
    service: NotificationService = Depends(get_notification_service)
):
    """
    Endpoint spécifique pour créer une notification de document obsolète.
    
    - **author_id**: ID de l'auteur du document
    - **document_id**: ID du document
    - **document_title**: Titre du document
    - **score**: Score d'évaluation
    """
    return await service.create_stale_notification(
        author_id, document_id, document_title, score
    )
