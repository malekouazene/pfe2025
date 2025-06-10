import logging
import requests
import re
from typing import List, Dict, Optional
from urllib.parse import quote
from datetime import timedelta

from app.core.config import settings
from app.services.cache_service import cache_service

logger = logging.getLogger(__name__)


class OntologyService:
    def __init__(self):
        self.base_url = settings.ESCO_API_URL.rstrip('/')
        self.cache = {}
        self.default_params = {
            "language": "fr",
            "type": "skill",
            "full": "true"
        }

    @cache_service.cached(ttl=timedelta(days=1).seconds)
    def _get_from_esco(self, endpoint: str, params: dict = None) -> Dict:
        """
        Appelle l'API ESCO avec des paramètres fournis.
        """
        try:
            full_url = f"{self.base_url}/{endpoint.lstrip('/')}"
            clean_params = {k: v for k, v in (params or {}).items() if v is not None}
            query_params = {**self.default_params, **clean_params}

            # Logging de l'URL complète
            param_str = "&".join(f"{k}={v}" for k, v in query_params.items())
            logger.info(f"ESCO API REQUEST: {full_url}?{param_str}")

            response = requests.get(full_url, params=query_params, timeout=10)

            logger.info(f"ESCO API RESPONSE STATUS: {response.status_code}")
            if response.status_code != 200:
                logger.error(f"ESCO API ERROR: {response.text}")
            else:
                logger.debug(f"ESCO API SUCCESS: {response.text[:200]}...")

            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"ESCO API RequestException: {str(e)} - URL: {response.url if 'response' in locals() else full_url}")
            return {}
        except Exception as e:
            logger.error(f"ESCO API Unexpected Error: {str(e)}")
            return {}

    @cache_service.cached(ttl=timedelta(days=1).seconds)
    def search_skills(self, query: str, language: str = "fr") -> List[Dict]:
        """
        Recherche des compétences ESCO à partir d'un mot-clé.
        """
        try:
            endpoint = "/search"
            params = {
                "text": query,
                "language": language,
                "type": "skill",
                "facet": "type",
                "limit": 5
            }

            data = self._get_from_esco(endpoint, params)
            results = []

            for item in data.get("_embedded", {}).get("results", []):
                results.append({
                    "uri": item.get("uri", ""),
                    "preferredLabel": item.get("title", query),
                    "description": item.get("description", ""),
                    "skillType": "knowledge" if "knowledge" in item.get("uri", "") else "skill"
                })

            return results
        except Exception as e:
            logger.error(f"search_skills Error: {str(e)}")
            return []

    @cache_service.cached(ttl=timedelta(days=1).seconds)
    def get_related_skills(self, skill: str, language: str = "fr") -> List[Dict]:
        """
        Trouve les compétences liées à une compétence donnée.
        """
        cache_key = f"related_{skill}_{language}"
        if cache_key in self.cache:
            return self.cache[cache_key]

        try:
            search_results = self.search_skills(skill, language)
            if not search_results:
                logger.warning(f"No skills found for query: {skill}")
                self.cache[cache_key] = []
                return []

            related_skills = []
            for result in search_results[:3]:  # Limite de 3 appels
                uri = result.get("uri")
                if not uri:
                    continue

                skill_details = self.get_skill_details(uri)
                if skill_details:
                    related_skills.append({
                        "uri": skill_details.get("uri", uri),
                        "preferredLabel": skill_details.get("preferredLabel", {}).get(language, result.get("preferredLabel", skill)),
                        "description": skill_details.get("description", {}).get(language, result.get("description", "")),
                        "skillType": skill_details.get("skillType", result.get("skillType", "")),
                        "relatedOccupations": skill_details.get("_links", {}).get("relatedOccupations", [])
                    })

            self.cache[cache_key] = related_skills
            return related_skills
        except Exception as e:
            logger.error(f"get_related_skills Error: {str(e)}")
            self.cache[cache_key] = []
            return []

    def get_skill_details(self, uri: str) -> Optional[Dict]:
        """
        Récupère les détails d'une compétence à partir de son URI.
        """
        if not uri:
            return None
        if uri in self.cache:
            return self.cache[uri]

        try:
            data = self._get_from_esco("/resource/skill", {"uri": uri})
            if data:
                self.cache[uri] = data
            return data
        except Exception as e:
            logger.error(f"get_skill_details Error: {str(e)}")
            return None

    def suggest_career_paths(self, current_skills: List[str], desired_skills: List[str], language: str = "fr") -> List[Dict]:
        """
        Suggère des parcours professionnels à partir de compétences possédées et visées.
        """
        if not current_skills and not desired_skills:
            logger.warning("No skills provided to suggest_career_paths")
            return []

        try:
            all_skills = list(set(current_skills + desired_skills))
            paths = []

            for skill in all_skills:
                logger.info(f"Processing skill: {skill}")
                related_skills = self.get_related_skills(skill, language)

                for related in related_skills:
                    path_entry = {
                        "sourceSkill": skill,
                        "targetSkill": related["preferredLabel"],
                        "uri": related["uri"],
                        "occupations": []
                    }

                    for occ in related.get("relatedOccupations", []):
                        occ_href = occ.get("href", "")
                        if not occ_href:
                            continue

                        if occ_href.startswith("http"):
                            match = re.search(r'uri=([^&]+)', occ_href)
                            if not match:
                                continue
                            occupation_uri = match.group(1)
                            occ_details = self._get_from_esco("/resource/occupation", {"uri": occupation_uri})
                        else:
                            occ_details = self._get_from_esco(occ_href)

                        if occ_details:
                            path_entry["occupations"].append({
                                "uri": occ_details.get("uri", ""),
                                "title": occ_details.get("preferredLabel", {}).get(language, "Occupation")
                            })

                    paths.append(path_entry)

            return paths
        except Exception as e:
            logger.error(f"suggest_career_paths Error: {str(e)}")
            return []

    def recommend_training_from_esco(self, user_profile: Dict, language: str = "fr") -> List[Dict]:
        """
        Recommande des formations à partir du profil utilisateur et de l'ontologie ESCO.
        """
        logger.info(f"Recommandation de formation pour le profil: {user_profile}")
        try:
            current_skills = user_profile.get("existing_skills", [])
            learning_goals = user_profile.get("learning_goals", [])
            current_level = user_profile.get("current_level", "débutant").lower()

            if not current_skills and not learning_goals:
                logger.warning("Profil utilisateur vide")
                return []

            career_paths = self.suggest_career_paths(current_skills, learning_goals, language)

            missing_skills = []
            essential_skills = []

            for goal in learning_goals:
                related = self.get_related_skills(goal, language)
                user_skills_lower = [s.lower() for s in current_skills]

                for skill in related:
                    if "preferredLabel" not in skill:
                        continue
                    label = skill["preferredLabel"].lower()
                    if not any(label in s or s in label for s in user_skills_lower):
                        if skill.get("skillType") == "knowledge":
                            essential_skills.append(skill)
                        else:
                            missing_skills.append(skill)

            related_occupations = {
                occ["title"] for path in career_paths for occ in path.get("occupations", []) if "title" in occ
            }

            recommendations = []

            for skill in essential_skills[:3]:
                recommendations.append({
                    "skill": skill.get("preferredLabel"),
                    "description": skill.get("description"),
                    "type": "knowledge",
                    "relatedOccupations": list(related_occupations)
                })

            for skill in missing_skills[:3]:
                recommendations.append({
                    "skill": skill.get("preferredLabel"),
                    "description": skill.get("description"),
                    "type": "skill",
                    "relatedOccupations": list(related_occupations)
                })

            return recommendations

        except Exception as e:
            logger.error(f"recommend_training_from_esco Error: {str(e)}")
            return []