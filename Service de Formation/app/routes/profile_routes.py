# app/routes/profile_routes.py
from fastapi import APIRouter, HTTPException
from app.db.profile import UserProfileForm
from app.services.suggestion_service import  EnhancedSuggestionService
from app.db.database import get_collection

router = APIRouter(prefix="/profile", tags=["user_profile"])

@router.post("/submit")
async def submit_profile(profile: UserProfileForm):
    try:
        # Sauvegarde du profil
        profile_data = profile.dict()
        get_collection("user_profiles").update_one(
            {"user_id": profile.user_id},
            {"$set": profile_data},
            upsert=True
        )
        
        # Génération des suggestions
        service = EnhancedSuggestionService()
        suggestions = service.generate_suggestions(profile)
        return {"status": "success", "suggestions": suggestions}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/suggestions/{user_id}")
async def get_suggestions(user_id: str):
    profile = get_collection("user_profiles").find_one({"user_id": user_id})
    if not profile:
        raise HTTPException(status_code=404, detail="Profil non trouvé")
    service = EnhancedSuggestionService()
    return service.generate_suggestions(UserProfileForm(**profile))