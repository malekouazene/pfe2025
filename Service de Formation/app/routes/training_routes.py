# app/routes/training_routes.py
from fastapi import APIRouter, HTTPException, Query, Body
from app.services.suggestion_service import EnhancedSuggestionService
from app.db.profile import UserProfileForm
from app.db.training_modules import TrainingModule
from typing import List, Dict, Any
from app.services.mistral_service import MistralService
from app.services.training_service import TrainingService
from app.db.database import get_collection 


router = APIRouter(prefix="/training", tags=["training"])

@router.get("/trainings/raw", response_model=List[dict])
async def get_raw_trainings():
    """
    Récupère toutes les formations directement depuis MongoDB
    (Format brut sans validation Pydantic)
    """
    try:
        trainings = TrainingService.get_raw_training_modules()
        if not trainings:
            raise HTTPException(
                status_code=404,
                detail="Aucune formation trouvée"
            )
        return trainings
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur serveur: {str(e)}"
        )

@router.get("/suggestions")
async def get_suggestions(
    user_id: str = Query(...),
    current_level: str = Query(...),
    existing_skills: str = Query(""),  # Chaîne séparée par des virgules
    learning_goals: str = Query("")   # Chaîne séparée par des virgules
):
    try:
        # Convertir les chaînes en listes
        skills_list = existing_skills.split(",") if existing_skills else []
        goals_list = learning_goals.split(",") if learning_goals else []
        
        profile = UserProfileForm(
            user_id=user_id,
            current_level=current_level,
            existing_skills=skills_list,
            learning_goals=goals_list
        )
        service = EnhancedSuggestionService()
        suggestions = service.generate_suggestions(profile)

        # Enregistrer les résultats
        result_data = {
            "user_id": user_id,
            "current_level": current_level,
            "existing_skills": skills_list,
            "learning_goals": goals_list,
            "suggestions": suggestions.get("suggestions", []),
            "career_paths": suggestions.get("ontology_data", {}).get("career_paths", []),
            "missing_skills": suggestions.get("ontology_data", {}).get("missing_skills", []),
            "related_occupations": suggestions.get("ontology_data", {}).get("related_occupations", []),
            "ai_summary": suggestions.get("ai_summary")
        }
        
        return {"suggestions": suggestions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.delete("/trainings/{module_id}")
async def delete_training_module(module_id: str):
    """
    Supprime une formation par son ID
    """
    try:
        deleted = TrainingService.delete_training_module(module_id)
        if not deleted:
            raise HTTPException(
                status_code=404,
                detail="Formation non trouvée"
            )
        return {"message": "Formation supprimée avec succès"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur serveur: {str(e)}"
        )    
    
# Ajout de la nouvelle route pour ajouter une formation
@router.post("/admin/training", response_model=Dict[str, Any])
async def add_training_module(training_data: dict = Body(...)):
    """
    Ajoute un nouveau module de formation
    """
    try:
        # Validation des champs requis
        required_fields = ["title", "description", "difficulty_level"]
        for field in required_fields:
            if field not in training_data:
                raise HTTPException(
                    status_code=400,
                    detail=f"Le champ '{field}' est obligatoire"
                )
        
        # Conversion des guides en liste de dictionnaires si nécessaire
        if "guides" in training_data and isinstance(training_data["guides"], list):
            training_data["guides"] = [
                guide if isinstance(guide, dict) else {"title": str(guide), "url": ""}
                for guide in training_data["guides"]
            ]
        
        # Création du module de formation
        new_module = TrainingService.add_training_module(training_data)
        
        # Conversion de l'ID ObjectId en string pour la réponse JSON
        return {
            "message": "Formation ajoutée avec succès", 
            "module_id": str(new_module.id),
            "title": new_module.title
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'ajout de la formation: {str(e)}"
        )
    
# Ajoutez cette nouvelle route à votre routeur existant
@router.post("/ai-suggestions", response_model=List[Dict[str, Any]])
async def get_ai_suggestions(
    existing_skills: List[str] = Body([]),
    learning_goals: List[str] = Body([]),
    current_level: str = Body("intermédiaire")
):
    """
    Obtenir des recommandations de formation générées par AI (Mistral)
    
    - **existing_skills**: Liste des compétences existantes (ex: ["Python", "SQL"])
    - **learning_goals**: Liste des objectifs d'apprentissage (ex: ["Machine Learning"])
    - **current_level**: Niveau actuel (débutant/intermédiaire/avancé)
    """
    try:
        mistral = MistralService()
        recommendations = mistral.generate_training_recommendations(
            existing_skills=existing_skills,
            learning_goals=learning_goals,
            current_level=current_level
        )
        
        if not recommendations:
            raise HTTPException(
                status_code=404,
                detail="Aucune recommandation générée par l'IA"
            )
            
        return recommendations
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la génération des recommandations: {str(e)}"
        )


# Ajoutez cette nouvelle route à la fin du fichier
@router.get("/admin/all-ontology-results", response_model=List[Dict[str, Any]])
async def get_all_ontology_results():
    """
    Récupère tous les résultats d'ontologie pour tous les utilisateurs
    (Pour le tableau de bord admin)
    """
    try:
        # Récupérer la collection où sont stockés les résultats
        collection = get_collection("ontology_results")
        
        # Récupérer tous les documents avec une projection pour ne garder que les champs pertinents
        results = list(collection.find({}, {
            "user_id": 1,
            "current_level": 1,
            "timestamp": 1,
            "existing_skills": 1,
            "learning_goals": 1,
            "career_paths": 1,
            "missing_skills": 1,
            "related_occupations": 1,
            "_id": 0  # Exclure l'ID MongoDB par défaut
        }))
        
        if not results:
            raise HTTPException(
                status_code=404,
                detail="Aucun résultat d'ontologie trouvé"
            )
            
        return results
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur serveur lors de la récupération des résultats: {str(e)}"
        )