# app/routes/admin_routes.py
from fastapi import APIRouter, Depends, HTTPException
from app.services.result_service import OntologyResultService
from typing import List, Dict

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/ontology-results", response_model=List[Dict])
async def get_ontology_results(
    limit: int = 100,
    result_service: OntologyResultService = Depends()
):
    """Endpoint pour récupérer tous les résultats d'ontologie (sans sécurité)"""
    try:
        return await result_service.get_all_results(limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")