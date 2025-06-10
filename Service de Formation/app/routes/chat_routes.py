# app/routes/chat_routes.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.mistral_service import MistralService

class QuestionRequest(BaseModel):
    question: str
    force_json: bool = False  # Ajoutez ce champ avec une valeur par défaut

router = APIRouter()
mistral_service = MistralService()

@router.post("/query")
async def query_endpoint(request: QuestionRequest):
    # Utilisez chat_query() pour les conversations normales et query() seulement si force_json=True
    if request.force_json:
        result = mistral_service.query(request.question, force_json=True)
    else:
        result = mistral_service.chat_query(request.question)
    
    if not result["success"]:
        raise HTTPException(
            status_code=500,
            detail={
                "error": result.get("error"),
                "details": result.get("details")
            }
        )
    
    return {
        "question": request.question,
        "response": result["response"],
        "source": result.get("source", "unknown")
    }