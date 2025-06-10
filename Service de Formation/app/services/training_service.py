from typing import List, Optional
from bson import ObjectId
from datetime import datetime

from app.db.database import get_collection

from app.db.training_modules import TrainingModule, TrainingModuleCreate


class TrainingService:
    """
    Service pour la gestion des modules de formation.
    """

    
    @staticmethod
    def add_training_module(module_data: dict) -> TrainingModule:
        """
        Ajoute un module de formation dans la base de données.
        """
        collection = get_collection("training_modules")
        
        # Valider et convertir les données avec Pydantic
        training_data = TrainingModuleCreate(**module_data).dict()
        
        # Ajouter les timestamps
        now = datetime.utcnow()
        training_data.update({
            "created_at": now,
            "updated_at": now
        })

        # Insérer dans MongoDB
        result = collection.insert_one(training_data)
        inserted = collection.find_one({"_id": result.inserted_id})
        
        # Convertir pour le retour
        inserted["_id"] = str(inserted["_id"])
        return TrainingModule(**inserted)

    @staticmethod
    def get_module_tags() -> List[str]:
        """
        Récupère tous les tags uniques pour l'auto-complétion.

        Returns:
            List[str]: Liste des tags uniques.
        """
        collection = get_collection("training_modules")
        return collection.distinct("tags")

    @staticmethod
    def get_module_skills() -> List[str]:
        """
        Récupère toutes les compétences requises uniques.

        Returns:
            List[str]: Liste des compétences requises.
        """
        collection = get_collection("training_modules")
        return collection.distinct("required_skills")

    @staticmethod
    def get_raw_training_modules() -> List[dict]:
        """
        Récupère tous les modules de formation (données brutes).

        Returns:
            List[dict]: Liste des modules avec ID converti en string.
        """
        collection = get_collection("training_modules")
        modules = list(collection.find({}))

        for module in modules:
            module["_id"] = str(module["_id"])

        return modules

    @staticmethod
    def delete_training_module(module_id: str) -> bool:
        """
        Supprime un module de formation par son ID.

        Args:
            module_id (str): L'ID du module à supprimer.

        Returns:
            bool: True si la suppression a réussi, False sinon.
        """
        try:
            collection = get_collection("training_modules")
            result = collection.delete_one({"_id": ObjectId(module_id)})
            return result.deleted_count > 0
        except Exception as e:
            raise ValueError(f"Erreur lors de la suppression: {str(e)}")
