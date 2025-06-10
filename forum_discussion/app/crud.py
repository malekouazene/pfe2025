#app/crud.py
from app.database import get_database
from app.models import Discussion, Message, PyObjectId,DiscussionCreate,MessageCreate
from bson import ObjectId
from typing import List, Optional
from datetime import datetime
from fastapi import HTTPException

db = get_database()

async def create_discussion(
    discussion: DiscussionCreate, 
    user_id: str, 
    document_id: Optional[str] = None,
    expert_id: Optional[str] = None  # Nouveau paramètre pour l'expert auteur du document
):
    """
    Crée une nouvelle discussion avec l'ID de l'expert auteur du document
    """
    discussion_dict = discussion.dict()
    discussion_dict.update({
        "user_id": user_id,  # ID de l'utilisateur qui crée la discussion
        "expert_id": expert_id,  # ID de l'expert auteur du document
        "document_id": document_id,
        "created_at": datetime.utcnow(),
        "status": "open",
        "messages": []
    })
    
    try:
        result = await db.discussions.insert_one(discussion_dict)
        if result.inserted_id:
            created_discussion = await db.discussions.find_one({"_id": result.inserted_id})
            return Discussion(**created_discussion)
        raise HTTPException(status_code=400, detail="Failed to create discussion")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    
async def get_discussion(discussion_id: str):
    """
    Récupère une discussion par son ID avec tous ses messages
    Args:
        discussion_id: ID de la discussion
    Returns:
        Discussion ou None si non trouvée
    """
    if not ObjectId.is_valid(discussion_id):
        return None
    
    try:
        discussion = await db.discussions.find_one({"_id": ObjectId(discussion_id)})
        if discussion:
            # Récupère les messages associés
            messages = await db.messages.find({"discussion_id": ObjectId(discussion_id)}).sort("sent_at", 1).to_list(None)
            discussion["messages"] = messages
            return Discussion(**discussion)
        return None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def get_user_discussions(user_id: str):
    """
    Récupère toutes les discussions d'un utilisateur
    Args:
        user_id: ID de l'utilisateur
    Returns:
        Liste des discussions
    """
    try:
        discussions = await db.discussions.find({"user_id": user_id}).sort("created_at", -1).to_list(None)
        return [Discussion(**discussion) for discussion in discussions]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def get_expert_discussions(expert_id: str):
    """
    Récupère toutes les discussions où l'expert est concerné:
    - Soit comme auteur du document (expert_id)
    - Soit comme expert assigné (dans le futur si vous ajoutez cette fonctionnalité)
    """
    try:
        discussions = await db.discussions.find({
            "$or": [
                {"expert_id": expert_id},  # Discussions sur ses documents
                {"assigned_expert_id": expert_id}  # Si vous ajoutez cette fonctionnalité plus tard
            ]
        }).sort("created_at", -1).to_list(None)
        return [Discussion(**discussion) for discussion in discussions]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def create_message(message: MessageCreate, discussion_id: str, sender_id: str, sender_type: str):
    """
    Crée un nouveau message dans une discussion
    Args:
        message: Contenu du message
        discussion_id: ID de la discussion
        sender_id: ID de l'expéditeur
        sender_type: Type d'expéditeur ('user' ou 'expert')
    Returns:
        Message créé
    """
    if not ObjectId.is_valid(discussion_id):
        raise HTTPException(status_code=400, detail="Invalid discussion ID")
    
    # Vérifie que la discussion existe
    discussion = await db.discussions.find_one({"_id": ObjectId(discussion_id)})
    if not discussion:
        raise HTTPException(status_code=404, detail="Discussion not found")
    
    message_dict = message.dict()
    message_dict.update({
        "discussion_id": ObjectId(discussion_id),
        "sender_id": sender_id,
        "sender_type": sender_type,
        "sent_at": datetime.utcnow(),
        "read": False
    })
    
    try:
        # Crée le message
        result = await db.messages.insert_one(message_dict)
        if result.inserted_id:
            # Met à jour la date de dernière activité de la discussion
            await db.discussions.update_one(
                {"_id": ObjectId(discussion_id)},
                {"$set": {"last_activity": datetime.utcnow()}}
            )
            
            created_message = await db.messages.find_one({"_id": result.inserted_id})
            return Message(**created_message)
        raise HTTPException(status_code=400, detail="Failed to create message")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def get_discussion_messages(discussion_id: str):
    """
    Récupère tous les messages d'une discussion
    Args:
        discussion_id: ID de la discussion
    Returns:
        Liste des messages
    """
    if not ObjectId.is_valid(discussion_id):
        return []
    
    try:
        messages = await db.messages.find({"discussion_id": ObjectId(discussion_id)}).sort("sent_at", 1).to_list(None)
        return [Message(**message) for message in messages]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def assign_expert_to_discussion(discussion_id: str, expert_id: str):
    """
    Assign un expert à une discussion
    Args:
        discussion_id: ID de la discussion
        expert_id: ID de l'expert
    Returns:
        Discussion mise à jour
    """
    if not ObjectId.is_valid(discussion_id):
        raise HTTPException(status_code=400, detail="Invalid discussion ID")
    
    try:
        result = await db.discussions.update_one(
            {"_id": ObjectId(discussion_id)},
            {"$set": {
                "expert_id": expert_id,
                "last_activity": datetime.utcnow()
            }}
        )
        if result.modified_count:
            return await get_discussion(discussion_id)
        raise HTTPException(status_code=404, detail="Discussion not found or no changes made")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def close_discussion(discussion_id: str):
    """
    Ferme une discussion
    Args:
        discussion_id: ID de la discussion
    Returns:
        Discussion mise à jour
    """
    if not ObjectId.is_valid(discussion_id):
        raise HTTPException(status_code=400, detail="Invalid discussion ID")
    
    try:
        result = await db.discussions.update_one(
            {"_id": ObjectId(discussion_id)},
            {"$set": {
                "status": "closed",
                "closed_at": datetime.utcnow()
            }}
        )
        if result.modified_count:
            return await get_discussion(discussion_id)
        raise HTTPException(status_code=404, detail="Discussion not found or no changes made")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def get_document_discussions(document_id: str):
    """
    Récupère toutes les discussions liées à un document
    Args:
        document_id: ID du document
    Returns:
        Liste des discussions
    """
    try:
        discussions = await db.discussions.find({"document_id": document_id}).sort("created_at", -1).to_list(None)
        return [Discussion(**discussion) for discussion in discussions]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def mark_messages_as_read(discussion_id: str, user_id: str):
    """
    Marque tous les messages non lus comme lus pour un utilisateur
    Args:
        discussion_id: ID de la discussion
        user_id: ID de l'utilisateur
    """
    if not ObjectId.is_valid(discussion_id):
        return
    
    try:
        await db.messages.update_many(
            {
                "discussion_id": ObjectId(discussion_id),
                "sender_id": {"$ne": user_id},
                "read": False
            },
            {"$set": {"read": True}}
        )
    except Exception as e:
        print(f"Error marking messages as read: {str(e)}")

async def get_unread_count(user_id: str):
    """
    Récupère le nombre de messages non lus pour un utilisateur
    Args:
        user_id: ID de l'utilisateur
    Returns:
        Nombre de messages non lus
    """
    try:
        # Trouve les discussions de l'utilisateur
        discussions = await db.discussions.find({"user_id": user_id}).to_list(None)
        discussion_ids = [discussion["_id"] for discussion in discussions]
        
        # Compte les messages non lus
        count = await db.messages.count_documents({
            "discussion_id": {"$in": discussion_ids},
            "sender_id": {"$ne": user_id},
            "read": False
        })
        
        return count
    except Exception as e:
        print(f"Error getting unread count: {str(e)}")
        return 0



async def count_unread_expert_messages(expert_id: str):
    """
    Compte les messages non lus pour un expert dans les discussions:
    - Discussions où il est expert_id (auteur du document)
    - Messages envoyés par les utilisateurs (sender_type="user")
    """
    try:
        # Trouve les discussions où l'expert est concerné
        discussions = await db.discussions.find({
            "expert_id": expert_id
        }).to_list(None)
        
        discussion_ids = [discussion["_id"] for discussion in discussions]
        
        # Compte les messages non lus des utilisateurs dans ces discussions
        count = await db.messages.count_documents({
            "discussion_id": {"$in": discussion_ids},
            "sender_type": "user",
            "read": False
        })
        return count
    except Exception as e:
        print(f"Error counting unread expert messages: {str(e)}")
        return 0    

async def mark_messages_as_read(discussion_id: str):
    """
    Marque tous les messages d'une discussion comme lus
    Args:
        discussion_id: ID de la discussion
    """
    if not ObjectId.is_valid(discussion_id):
        return
    
    try:
        # Marque tous les messages de la discussion comme lus
        await db.messages.update_many(
            {"discussion_id": ObjectId(discussion_id)},
            {"$set": {"read": True}}
        )
    except Exception as e:
        print(f"Error marking messages as read: {str(e)}")

# Alternative version if you want to mark only user messages as read for expert
async def mark_user_messages_as_read(discussion_id: str):
    """
    Marque tous les messages des utilisateurs d'une discussion comme lus
    Args:
        discussion_id: ID de la discussion
    """
    if not ObjectId.is_valid(discussion_id):
        return
    
    try:
        await db.messages.update_many(
            {
                "discussion_id": ObjectId(discussion_id),
                "sender_type": "user",
                "read": False
            },
            {"$set": {"read": True}}
        )
    except Exception as e:
        print(f"Error marking user messages as read: {str(e)}")