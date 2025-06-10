#app/main

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from fastapi import Body
from app import crud, models
from app import schemas
from app.database import get_database
from bson import ObjectId

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.post("/discussions/", response_model=schemas.Discussion)
async def create_new_discussion(
    request_data: dict = Body(...)
):
    try:
        # Validation des données requises
        if not request_data.get("user_id"):
            raise HTTPException(status_code=400, detail="user_id est requis")
        if not request_data.get("discussion"):
            raise HTTPException(status_code=400, detail="discussion est requis")
        
        # Extraction des données
        discussion_data = request_data.get("discussion", {})
        user_id = str(request_data.get("user_id"))
        document_id = str(request_data.get("document_id")) if request_data.get("document_id") else None
        expert_id = str(request_data.get("expert_id")) if request_data.get("expert_id") else None
        
        # Création de la discussion
        discussion = await crud.create_discussion(
            discussion=schemas.DiscussionCreate(**discussion_data),
            user_id=user_id,
            document_id=document_id,
            expert_id=expert_id  # Passage de l'expert_id
        )
        
        return {
            "id": str(discussion.id),
            "_id": {"$oid": str(discussion.id)},
            **discussion.dict(exclude={"id"})
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")
@app.get("/discussions/user/{user_id}", response_model=List[schemas.Discussion])
async def read_user_discussions(user_id: str):
    return await crud.get_user_discussions(user_id=user_id)

@app.get("/discussions/expert/{expert_id}", response_model=List[schemas.Discussion])
async def read_expert_discussions(expert_id: str):
    return await crud.get_expert_discussions(expert_id=expert_id)

@app.get("/discussions/document/{document_id}", response_model=List[schemas.Discussion])
async def read_document_discussions(document_id: str):
    try:
        # Vérifier que l'ID est valide
        if not document_id or document_id == "undefined":
            raise HTTPException(status_code=400, detail="Document ID invalide")
            
        return await crud.get_document_discussions(document_id=document_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/discussions/{discussion_id}", response_model=schemas.Discussion)
async def read_discussion(discussion_id: str):
    db_discussion = await crud.get_discussion(discussion_id=discussion_id)
    if db_discussion is None:
        raise HTTPException(status_code=404, detail="Discussion not found")
    return db_discussion

@app.post("/discussions/{discussion_id}/messages", response_model=schemas.Message)
async def create_new_message(
    discussion_id: str,
    request_data: dict = Body(...)
):
    try:
        # Vérifier que la discussion existe
        db_discussion = await crud.get_discussion(discussion_id=discussion_id)
        if db_discussion is None:
            raise HTTPException(status_code=404, detail="Discussion not found")
        
        # Extraire les données du message
        message_data = request_data.get("message", {})
        sender_id = str(request_data.get("sender_id"))
        sender_type = request_data.get("sender_type", "user")
        
        return await crud.create_message(
            message=schemas.MessageCreate(**message_data),
            discussion_id=discussion_id,
            sender_id=sender_id,
            sender_type=sender_type
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

@app.get("/discussions/{discussion_id}/messages", response_model=List[schemas.Message])
async def read_discussion_messages(discussion_id: str):
    return await crud.get_discussion_messages(discussion_id=discussion_id)

@app.put("/discussions/{discussion_id}/assign", response_model=schemas.Discussion)
async def assign_expert(discussion_id: str, expert_id: str):
    return await crud.assign_expert_to_discussion(discussion_id=discussion_id, expert_id=expert_id)

@app.put("/discussions/{discussion_id}/close", response_model=schemas.Discussion)
async def close_discussion(discussion_id: str):
    return await crud.close_discussion(discussion_id=discussion_id)

@app.get("/discussions/expert/{expert_id}/unread")
async def get_unread_discussions_count(expert_id: str):
    try:
        # Implémentez la logique pour compter les discussions/messages non lus
        count = await crud.count_unread_expert_messages(expert_id=expert_id)
        return {"count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/discussions/{discussion_id}/mark-as-read")
async def mark_discussion_as_read(discussion_id: str):
    try:
        # Implémentez la logique pour marquer les messages comme lus
        await crud.mark_messages_as_read(discussion_id=discussion_id)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))    