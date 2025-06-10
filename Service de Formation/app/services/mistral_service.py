import os
import json
import logging
import re
from typing import Dict, List, Optional, Any
from datetime import timedelta

import requests
from app.core.config import settings
from app.services.cache_service import cache_service

logger = logging.getLogger(__name__)

class MistralService:
    def __init__(self):
        self.api_url = "https://openrouter.ai/api/v1/chat/completions"
        self.enabled = bool(settings.OPENROUTER_API_KEY)

        if not self.enabled:
            logger.warning("La clé API OpenRouter n'est pas configurée dans .env")

        self.headers = {
            "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
            "HTTP-Referer": f"http://localhost:{settings.API_PORT}",
            "Content-Type": "application/json",
            "X-Title": "Service de Formation IA"
        }

    # NOUVELLE MÉTHODE pour le chat conversationnel
    def chat_query(self, prompt: str, max_tokens: int = 500) -> Dict[str, Any]:
        """
        Méthode spéciale pour les conversations normales (sans format JSON forcé)
        """
        if not self.enabled:
            return {
                "success": False,
                "error": "Service Mistral non disponible - clé API manquante"
            }

        try:
            logger.info(f"Chat query à Mistral: {prompt[:50]}...")
            
            # Messages pour conversation normale
            messages = [
                {
                    "role": "system", 
                    "content": (
                        "Vous êtes un assistant virtuel spécialisé en formation professionnelle. "
                        "Répondez de manière naturelle et conversationnelle. "
                        "Soyez utile, précis et engageant. "
                        "Ne répondez PAS en format JSON sauf si explicitement demandé."
                    )
                },
                {"role": "user", "content": prompt}
            ]
            
            payload = {
                "model": "mistralai/mistral-7b-instruct",
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": 0.7,  # Plus créatif pour la conversation
            }
            
            # IMPORTANT: Pas de response_format pour les conversations normales
            
            response = requests.post(
                self.api_url,
                headers=self.headers,
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            
            logger.info(f"Réponse chat reçue: {len(content)} caractères")
            
            return {
                "success": True,
                "response": content,
                "source": "Mistral Chat"
            }

        except requests.exceptions.RequestException as e:
            logger.error(f"Erreur de connexion chat Mistral: {str(e)}")
            return {
                "success": False,
                "error": "Erreur de connexion",
                "details": str(e)
            }
        except Exception as e:
            logger.error(f"Erreur inattendue chat Mistral: {str(e)}")
            return {
                "success": False,
                "error": "Erreur inattendue",
                "details": str(e)
            }    

    def query(self, prompt: str, max_tokens: int = 1000, force_json: bool = True) -> Dict[str, Any]:
        """
        Envoie une requête à l'API Mistral via OpenRouter avec gestion améliorée des erreurs
        """
        if not self.enabled:
            return {
                "success": False,
                "error": "Service Mistral non disponible - clé API manquante"
            }

        try:
            logger.info(f"Envoi de requête à Mistral: {prompt[:50]}...")
            
            # Préparer les messages avec un prompt plus strict pour le JSON
            messages = [
                {
                    "role": "system", 
                    "content": (
                        "Vous êtes un expert technique en formation professionnelle. "
                        "IMPORTANT: Vous devez TOUJOURS répondre avec un JSON valide et rien d'autre. "
                        "Ne jamais inclure de texte avant ou après le JSON. "
                        "Utilisez uniquement des guillemets doubles pour les chaînes. "
                        "Assurez-vous que le JSON est bien formé et valide."
                    )
                },
                {"role": "user", "content": prompt}
            ]
            
            payload = {
                "model": "mistralai/mistral-7b-instruct",
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": 0.3,  # Réduire la température pour plus de cohérence
            }
            
            # Ajouter response_format seulement si force_json est True
            if force_json:
                payload["response_format"] = {"type": "json_object"}
            
            response = requests.post(
                self.api_url,
                headers=self.headers,
                json=payload,
                timeout=45
            )
            response.raise_for_status()
            result = response.json()
            content = result["choices"][0]["message"]["content"]
         

             
            
            logger.info(f"Réponse de Mistral reçue: {len(content)} caractères")
            logger.debug(f"Contenu de la réponse: {content[:200]}...")

            return {
                "success": True,
                "response": content,
                "source": "Mistral via OpenRouter"
            }

        except requests.exceptions.RequestException as e:
            logger.error(f"Erreur de connexion à l'API Mistral: {str(e)}")
            return {
                "success": False,
                "error": "Erreur de connexion",
                "details": str(e)
            }
        except Exception as e:
            logger.error(f"Erreur inattendue avec l'API Mistral: {str(e)}")
            return {
                "success": False,
                "error": "Erreur inattendue",
                "details": str(e)
            }

    @cache_service.cached(ttl=timedelta(hours=12).seconds)
    def generate_training_recommendations(
        self,
        existing_skills: List[str],
        learning_goals: List[str],
        current_level: str
    ) -> List[Dict[str, Any]]:
        """
        Génère des recommandations de formation avec une gestion robuste des réponses JSON
        """
        if not self.enabled:
            logger.warning("Tentative d'utiliser Mistral sans clé API configurée")
            return self._get_fallback_recommendations(current_level)

        # Simplifier et structurer le prompt
        prompt = f"""
Créez des recommandations de formation pour ce profil:

PROFIL:
- Niveau: {current_level}
- Compétences: {', '.join(existing_skills[:5]) if existing_skills else 'Aucune'}
- Objectifs: {', '.join(learning_goals[:3]) if learning_goals else 'Non spécifiés'}

Répondez avec ce JSON exact (sans texte supplémentaire):

{{
  "recommandations": [
    {{
      "titre": "Formation en [domaine]",
      "description": "Description courte et claire",
      "niveau": "{current_level}",
      "competences_requises": ["compétence1", "compétence2"],
      "tags": ["tag1", "tag2"],
      "metiers_cibles": ["métier1", "métier2"],
      "justification": "Explication de la recommandation"
    }}
  ]
}}

Générez 3 recommandations maximum.
"""
        
        # Tentative principale avec JSON forcé
        result = self.query(prompt, max_tokens=1200, force_json=True)

        if not result.get("success", False):
            logger.error(f"Échec de génération des recommandations: {result.get('error')}")
            return self._get_fallback_recommendations(current_level)

        response_text = result.get("response", "")
        json_data = self._parse_json_response(response_text)

        if not json_data:
            logger.warning("Échec du parsing JSON, tentative sans format forcé")
            # Tentative de secours sans format JSON forcé
            result_fallback = self.query(prompt, max_tokens=1200, force_json=False)
            if result_fallback.get("success"):
                json_data = self._parse_json_response(result_fallback.get("response", ""))
            
            if not json_data:
                logger.error("Impossible d'extraire le JSON après toutes les tentatives")
                return self._get_fallback_recommendations(current_level)

        try:
            recommendations = json_data.get("recommandations", [])
            if not isinstance(recommendations, list):
                logger.error("Format de recommandations invalide")
                return self._get_fallback_recommendations(current_level)

            normalized = []
            for rec in recommendations[:5]:  # Limiter à 5 recommandations max
                if not isinstance(rec, dict):
                    continue

                normalized.append({
                    "title": str(rec.get("titre", "Module de formation")).strip(),
                    "description": str(rec.get("description", "")).strip(),
                    "difficulty_level": str(rec.get("niveau", current_level)).strip(),
                    "required_skills": self._ensure_list(rec.get("competences_requises", [])),
                    "tags": self._ensure_list(rec.get("tags", [])),
                    "target_roles": self._ensure_list(rec.get("metiers_cibles", [])),
                    "justification": str(rec.get("justification", "")).strip(),
                    "is_generated": True,
                    "source": "Mistral AI"
                })

            logger.info(f"Généré {len(normalized)} recommandations via Mistral")
            return normalized if normalized else self._get_fallback_recommendations(current_level)

        except Exception as e:
            logger.error(f"Erreur de traitement des recommandations: {str(e)}")
            return self._get_fallback_recommendations(current_level)

    def _parse_json_response(self, text: str) -> Optional[Dict[str, Any]]:
        """
        Parse une réponse textuelle avec des méthodes de récupération améliorées
        """
        if not text or not text.strip():
            return None
            
        logger.debug(f"Tentative d'analyse de la réponse JSON: {text[:200]}...")

        # Nettoyer le texte d'abord
        cleaned_text = self._clean_response_text(text)

        # Méthode 1: Essayez de parser directement le texte nettoyé
        try:
            data = json.loads(cleaned_text)
            logger.info("JSON parsé directement avec succès")
            return data
        except json.JSONDecodeError as e:
            logger.debug(f"Échec du parsing direct: {str(e)}")

        # Méthode 2: Extraire les blocs JSON potentiels
        json_blocks = self._find_json_blocks(cleaned_text)
        for i, block in enumerate(json_blocks):
            try:
                data = json.loads(block)
                logger.info(f"JSON extrait du bloc {i+1} avec succès")
                return data
            except json.JSONDecodeError:
                continue

        # Méthode 3: Correction automatique des erreurs courantes
        try:
            corrected = self._fix_json(cleaned_text)
            data = json.loads(corrected)
            logger.info("JSON corrigé avec succès")
            return data
        except json.JSONDecodeError as e:
            logger.error(f"Échec de correction JSON: {str(e)}")

        logger.error("Aucun JSON valide trouvé après toutes les tentatives")
        return None

    def _clean_response_text(self, text: str) -> str:
        """
        Nettoie le texte de réponse avant le parsing JSON
        """
        # Supprimer les balises markdown et autres artefacts
        text = re.sub(r'```json\s*', '', text)
        text = re.sub(r'```\s*$', '', text)
        text = re.sub(r'^[^{]*({.*})[^}]*$', r'\1', text, flags=re.DOTALL)
        
        # Supprimer les espaces et retours à la ligne en début/fin
        text = text.strip()
        
        return text

    def _find_json_blocks(self, text: str) -> List[str]:
        """
        Trouve les blocs JSON potentiels dans un texte avec une meilleure logique
        """
        blocks = []
        brace_count = 0
        start_index = -1

        for i, char in enumerate(text):
            if char == '{':
                if brace_count == 0:
                    start_index = i
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0 and start_index != -1:
                    blocks.append(text[start_index:i+1])
                    start_index = -1

        # Trier par longueur décroissante
        blocks.sort(key=len, reverse=True)
        return blocks

    def _fix_json(self, json_str: str) -> str:
        """
        Tente de corriger les JSON malformés avec des règles améliorées
        """
        # Corriger les guillemets simples en guillemets doubles
        json_str = re.sub(r"'([^']*)':", r'"\1":', json_str)
        json_str = re.sub(r":\s*'([^']*)'", r': "\1"', json_str)
        
        # Corriger les clés sans guillemets
        json_str = re.sub(r'([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)', r'\1"\2"\3', json_str)
        
        # Supprimer les virgules en trop
        json_str = re.sub(r',\s*([}\]])', r'\1', json_str)
        
        # Corriger les guillemets non échappés dans les valeurs
        json_str = re.sub(r':\s*"([^"]*)"([^",}\]]*)"', r': "\1\2"', json_str)
        
        return json_str

    def _ensure_list(self, item: Any) -> List[str]:
        """
        Garantit que l'élément est une liste de chaînes
        """
        if item is None:
            return []
        if isinstance(item, list):
            return [str(x).strip() for x in item if str(x).strip()]
        if isinstance(item, str):
            return [item.strip()] if item.strip() else []
        return [str(item).strip()] if str(item).strip() else []

    def _get_fallback_recommendations(self, current_level: str) -> List[Dict[str, Any]]:
        """
        Retourne des recommandations de fallback en cas d'échec de l'IA
        """
        fallback_recommendations = [
            {
                "title": "Formation Générale en Développement Professionnel", 
                "description": "Une formation complète pour développer vos compétences professionnelles générales.",
                "difficulty_level": current_level,
                "required_skills": ["Motivation", "Capacité d'apprentissage"],
                "tags": ["professionnel", "généraliste"],
                "target_roles": ["Tous secteurs"],
                "justification": "Recommandation générale adaptée à votre niveau.",
                "is_generated": False,
                "source": "Fallback"
            }
        ]
        
        logger.info("Utilisation des recommandations de fallback")
        return fallback_recommendations

    def generate_recommendations_from_esco(
        self,
        esco_data: Dict[str, Any],
        current_level: str = "intermédiaire"
    ) -> List[Dict[str, Any]]:
        """
        Génère des recommandations basées sur les données ESCO avec gestion d'erreur améliorée
        """
        if not self.enabled:
            return self._get_fallback_recommendations(current_level)

        missing_skills = esco_data.get("missing_skills", [])
        occupations = esco_data.get("related_occupations", [])
        career_paths = esco_data.get("career_paths", [])

        skills_text = ', '.join([skill.get('preferredLabel', '') for skill in missing_skills[:3]])
        occupations_text = ', '.join(occupations[:3]) if occupations else 'Non spécifiés'

        prompt = f"""
Créez des recommandations de formation basées sur ces données ESCO:

DONNÉES:
- Compétences à acquérir: {skills_text}
- Métiers liés: {occupations_text}
- Niveau utilisateur: {current_level}

Répondez avec ce JSON exact:

{{
  "recommandations": [
    {{
      "titre": "Formation spécialisée",
      "description": "Description détaillée",
      "niveau": "{current_level}",
      "competences_ciblees": ["compétence1", "compétence2"],
      "metiers_concernees": ["métier1", "métier2"],
      "duree_estimee": "40 heures",
      "type_formation": "mixte",
      "priorite": "haute"
    }}
  ],
  "analyse": "Analyse des recommandations"
}}

Générez 3 recommandations maximum.
"""

        result = self.query(prompt, max_tokens=1500)

        if not result.get("success", False):
            return self._get_fallback_recommendations(current_level)

        response_text = result.get("response", "")
        json_data = self._parse_json_response(response_text)

        if not json_data:
            return self._get_fallback_recommendations(current_level)

        try:
            recommendations = json_data.get("recommandations", [])
            analysis = json_data.get("analyse", "")
            
            normalized = []
            for rec in recommendations:
                if not isinstance(rec, dict):
                    continue
                    
                normalized.append({
                    "title": str(rec.get("titre", "Formation recommandée")).strip(),
                    "description": str(rec.get("description", "")).strip(),
                    "difficulty_level": str(rec.get("niveau", current_level)).strip(),
                    "target_skills": self._ensure_list(rec.get("competences_ciblees", [])),
                    "target_roles": self._ensure_list(rec.get("metiers_concernees", [])),
                    "duration": str(rec.get("duree_estimee", "Non spécifiée")).strip(),
                    "training_type": str(rec.get("type_formation", "mixte")).strip(),
                    "priority": str(rec.get("priorite", "moyenne")).strip(),
                    "analysis": analysis,
                    "is_generated": True,
                    "source": "Mistral AI + ESCO"
                })
            
            return normalized if normalized else self._get_fallback_recommendations(current_level)

        except Exception as e:
            logger.error(f"Erreur dans generate_recommendations_from_esco: {str(e)}")
            return self._get_fallback_recommendations(current_level)