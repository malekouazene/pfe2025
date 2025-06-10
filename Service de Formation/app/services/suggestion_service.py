from typing import List, Dict
from functools import lru_cache
from datetime import timedelta
import logging
from datetime import datetime

from app.db.database import get_collection
from app.db.profile import UserProfileForm
from app.services.ontology_service import OntologyService
from app.services.mistral_service import MistralService
from app.core.config import settings
from app.services.cache_service import cache_service

logger = logging.getLogger(__name__)

# Mapping du niveau vers une valeur numérique pour le tri
level_mapping = {
    "débutant": 1,
    "intermédiaire": 2,
    "avancé": 3
}


class EnhancedSuggestionService:
    def __init__(self):
        self.ontology = OntologyService()
        self.mistral = MistralService() if settings.OPENROUTER_API_KEY else None

    @lru_cache(maxsize=100)
    def get_all_modules(self) -> List[Dict]:
        collection = get_collection("training_modules")
        modules = list(collection.find({}))
        logger.info(f"Récupéré {len(modules)} modules de formation depuis la base de données")
        return modules

    @cache_service.cached(ttl=timedelta(hours=2).seconds)
    def generate_suggestions(self, profile: UserProfileForm) -> Dict:
        logger.info(f"Génération de suggestions pour profil: niveau={profile.current_level}, "
                    f"compétences={profile.existing_skills}, objectifs={profile.learning_goals}")
        
        # Vérifier si le profil est vide et fournir des valeurs par défaut
        has_skills = bool(profile.existing_skills)
        has_goals = bool(profile.learning_goals)
        
        # Si aucune compétence ni objectif n'est fourni, utiliser des valeurs par défaut
        if not has_skills and not has_goals:
            logger.warning("Profil utilisateur sans compétences ni objectifs - utilisation de valeurs par défaut")
            if profile.current_level == "débutant":
                profile.existing_skills = ["Informatique de base"]
                profile.learning_goals = ["Bureautique"]
            elif profile.current_level == "intermédiaire":
                profile.existing_skills = ["Programmation"]
                profile.learning_goals = ["Développement web"]
            else:  # avancé
                profile.existing_skills = ["Développement logiciel"]
                profile.learning_goals = ["Intelligence artificielle"]
        
        # Récupération des modules de base depuis la base de données
        base_modules = self._get_base_suggestions(profile)
        logger.info(f"Trouvé {len(base_modules)} modules de base correspondants")

        # Récupération des insights depuis l'ontologie
        ontology_data = self._get_ontology_insights(profile)

        # Génération des modules de repli si nécessaire
        if not base_modules and ontology_data.get("missing_skills"):
            fallback_modules = self._generate_fallback_suggestions(profile, ontology_data)
            base_modules.extend(fallback_modules)
            logger.info(f"Ajout de {len(fallback_modules)} modules de repli")

        # Récupération des suggestions de Mistral si disponible
        ai_generated_modules = []
        if self.mistral:
            try:
                ai_generated_modules = self.mistral.generate_training_recommendations(
                    profile.existing_skills,
                    profile.learning_goals,
                    profile.current_level.value
                )
                logger.info(f"Ajout de {len(ai_generated_modules)} modules générés par Mistral")
            except Exception as e:
                logger.error(f"Erreur lors de la génération via Mistral: {str(e)}")
        
        # Combinaison de toutes les recommandations
        all_modules = base_modules + ai_generated_modules
        
        # Si aucun module n'a été trouvé, créer des modules génériques
        if not all_modules:
            logger.warning("Aucun module trouvé, génération de modules génériques")
            generic_modules = self._generate_generic_modules(profile)
            all_modules.extend(generic_modules)
        
        # Fusion et tri des suggestions
        result = self._merge_suggestions(profile, all_modules, ontology_data)
        logger.info(f"Suggestions finales: {len(result['suggestions'])} modules")
        
        # Ajout d'un résumé des recommandations via Mistral si disponible
        if self.mistral and (profile.learning_goals or profile.existing_skills):
            try:
                summary_prompt = f"""
En tant qu'expert en formation professionnelle, créez un résumé personnalisé très court (3-4 phrases maximum) pour ce profil:
- Niveau: {profile.current_level.value}
- Compétences: {', '.join(profile.existing_skills) if profile.existing_skills else 'Non spécifiées'}
- Objectifs: {', '.join(profile.learning_goals) if profile.learning_goals else 'Non spécifiés'}

Ce résumé doit expliquer pourquoi ces formations sont recommandées et comment elles correspondent aux objectifs de l'utilisateur.
"""
                summary_result = self.mistral.query(summary_prompt)
                if summary_result.get("success", False):
                    result["ai_summary"] = summary_result.get("response", "")
            except Exception as e:
                logger.error(f"Erreur lors de la génération du résumé: {str(e)}")
        
        return result

    def _get_base_suggestions(self, profile: UserProfileForm) -> List[Dict]:
        modules = self.get_all_modules()

        # Si l'utilisateur n'a pas spécifié de compétences ou d'objectifs,
        # retourner les modules généraux correspondant à son niveau
        if not profile.existing_skills and not profile.learning_goals:
            # Retourner des modules basés sur le niveau uniquement
            level_modules = [
                module for module in modules
                if level_mapping.get(module.get("difficulty_level", "avancé").lower(), 3) <= 
                level_mapping.get(profile.current_level.value.lower(), 3)
            ]
            # Limiter à 5 modules par niveau
            return level_modules[:5]

        user_skills = [s.lower().strip() for s in profile.existing_skills]
        user_goals = [g.lower().strip() for g in profile.learning_goals]

        relevant_modules = []
        for module in modules:
            module_level = module.get("difficulty_level", "avancé").lower()
            if level_mapping.get(module_level, 3) > level_mapping.get(profile.current_level.value.lower(), 3):
                continue

            # Si l'utilisateur a spécifié des compétences, vérifiez la correspondance
            if user_skills:
                module_skills = [s.lower().strip() for s in module.get("required_skills", [])]
                skills_match = any(
                    any(prof_skill in mod_skill or mod_skill in prof_skill
                        for prof_skill in user_skills)
                    for mod_skill in module_skills
                )
            else:
                skills_match = False

            # Si l'utilisateur a spécifié des objectifs, vérifiez la correspondance
            if user_goals:
                module_tags = [t.lower().strip() for t in module.get("tags", [])]
                goals_match = any(
                    any(goal in tag or tag in goal
                        for goal in user_goals)
                    for tag in module_tags
                )
            else:
                goals_match = False

            if goals_match or skills_match:
                module["match_type"] = "goal" if goals_match else "skill"
                relevant_modules.append(module)

        relevant_modules.sort(
            key=lambda x: (x["match_type"] == "goal", x.get("relevance_score", 0)),
            reverse=True
        )

        return relevant_modules[:10]

    def _generate_fallback_suggestions(self, profile: UserProfileForm, ontology_data: Dict) -> List[Dict]:
        fallback_modules = []

        for skill in ontology_data.get("missing_skills", []):
            if isinstance(skill, dict) and "preferredLabel" in skill:
                skill_name = skill["preferredLabel"]
                fallback_modules.append({
                    "title": f"Formation: {skill_name}",
                    "description": f"Module de formation recommandé pour acquérir la compétence '{skill_name}'",
                    "difficulty_level": profile.current_level.value,
                    "required_skills": profile.existing_skills,
                    "tags": profile.learning_goals + [skill_name],
                    "target_roles": [
                        occ.get("title", "Profession")
                        for path in ontology_data.get("career_paths", [])
                        for occ in path.get("occupations", [])
                    ],
                    "is_generated": True,
                    "source": "Ontologie ESCO"
                })

        return fallback_modules

    def _generate_generic_modules(self, profile: UserProfileForm) -> List[Dict]:
        """Génère des modules génériques quand aucune autre suggestion n'est disponible"""
        level = profile.current_level.value
        generic_modules = []
        
        if level == "débutant":
            generic_modules = [
                {
                    "title": "Initiation à l'informatique",
                    "description": "Découvrez les bases de l'informatique et du numérique",
                    "difficulty_level": "débutant",
                    "required_skills": [],
                    "tags": ["Informatique", "Bureautique", "Débutant"],
                    "target_roles": ["Tous métiers"],
                    "is_generated": True,
                    "source": "Suggéré par défaut"
                },
                {
                    "title": "Bases de la bureautique",
                    "description": "Apprenez à utiliser les logiciels bureautiques courants",
                    "difficulty_level": "débutant",
                    "required_skills": ["Informatique de base"],
                    "tags": ["Word", "Excel", "PowerPoint", "Bureautique"],
                    "target_roles": ["Assistant administratif", "Secrétaire"],
                    "is_generated": True,
                    "source": "Suggéré par défaut"
                }
            ]
        elif level == "intermédiaire":
            generic_modules = [
                {
                    "title": "Introduction à la programmation",
                    "description": "Découvrez les concepts de base de la programmation",
                    "difficulty_level": "intermédiaire",
                    "required_skills": ["Informatique"],
                    "tags": ["Programmation", "Développement"],
                    "target_roles": ["Développeur junior", "Analyste"],
                    "is_generated": True,
                    "source": "Suggéré par défaut"
                },
                {
                    "title": "Bases du développement web",
                    "description": "Créez vos premières pages web avec HTML, CSS et JavaScript",
                    "difficulty_level": "intermédiaire",
                    "required_skills": ["Programmation de base"],
                    "tags": ["Web", "HTML", "CSS", "JavaScript"],
                    "target_roles": ["Développeur web", "Intégrateur"],
                    "is_generated": True,
                    "source": "Suggéré par défaut"
                }
            ]
        else:  # avancé
            generic_modules = [
                {
                    "title": "Développement d'applications avancées",
                    "description": "Maîtrisez les frameworks modernes de développement",
                    "difficulty_level": "avancé",
                    "required_skills": ["Développement web", "JavaScript"],
                    "tags": ["React", "Angular", "Vue.js", "Framework"],
                    "target_roles": ["Développeur senior", "Lead développeur"],
                    "is_generated": True,
                    "source": "Suggéré par défaut"
                },
                {
                    "title": "Introduction à l'intelligence artificielle",
                    "description": "Découvrez les concepts fondamentaux de l'IA et du machine learning",
                    "difficulty_level": "avancé",
                    "required_skills": ["Programmation", "Mathématiques"],
                    "tags": ["IA", "Machine Learning", "Data Science"],
                    "target_roles": ["Data Scientist", "ML Engineer"],
                    "is_generated": True,
                    "source": "Suggéré par défaut"
                }
            ]
            
        return generic_modules

    def _get_ontology_insights(self, profile: UserProfileForm) -> Dict:
        try:
            # Si le profil est vide, retourner des données vides
            if not profile.existing_skills and not profile.learning_goals:
                return {
                    "career_paths": [],
                    "missing_skills": [],
                    "related_occupations": []
                }
                
            career_paths = self.ontology.suggest_career_paths(
                profile.existing_skills,
                profile.learning_goals
            )

            missing_skills = []
            user_skills_lower = [s.lower() for s in profile.existing_skills]

            for goal in profile.learning_goals:
                related_skills = self.ontology.get_related_skills(goal)
                for skill in related_skills:
                    if isinstance(skill, dict) and "preferredLabel" in skill:
                        skill_name = skill["preferredLabel"].lower()
                        if not any(user_skill in skill_name or skill_name in user_skill for user_skill in user_skills_lower):
                            missing_skills.append(skill)

            related_occupations = []
            for path in career_paths:
                for occ in path.get("occupations", []):
                    if "title" in occ:
                        related_occupations.append(occ["title"])

            return {
                "career_paths": career_paths,
                "missing_skills": missing_skills[:5],
                "related_occupations": list(set(related_occupations))
            }

        except Exception as e:
            logger.error(f"Erreur lors de la récupération des insights ontologiques: {str(e)}")
            return {
                "career_paths": [],
                "missing_skills": [],
                "related_occupations": []
            }

    def _merge_suggestions(self, profile: UserProfileForm, modules: List[Dict], ontology_data: Dict) -> Dict:
        if not modules:
            # Si aucun module n'est trouvé, générer des modules de repli
            generated_modules = self._generate_fallback_suggestions(profile, ontology_data)
            
            # Si on a toujours pas de modules, utiliser les modules génériques
            if not generated_modules:
                generated_modules = self._generate_generic_modules(profile)
            
            # Si on a Mistral, essayer de générer des recommandations
            if self.mistral:
                try:
                    ai_generated_modules = self.mistral.generate_training_recommendations(
                        profile.existing_skills,
                        profile.learning_goals,
                        profile.current_level.value
                    )
                    generated_modules.extend(ai_generated_modules)
                except Exception as e:
                    logger.error(f"Erreur lors de la génération via Mistral pour fallback: {str(e)}")
            
            return {
                "suggestions": generated_modules,
                "ontology_data": ontology_data,
                "metadata": {"fallback_used": True}
            }

        # Calcul des scores de pertinence pour chaque module
        for module in modules:
            score = 0

            # Points pour les compétences correspondantes
            if profile.existing_skills:
                module_skills = [s.lower() for s in module.get("required_skills", [])]
                for skill in profile.existing_skills:
                    if any(skill.lower() in mod_skill or mod_skill in skill.lower() for mod_skill in module_skills):
                        score += 2

            # Points pour les objectifs correspondants
            if profile.learning_goals:
                module_tags = [t.lower() for t in module.get("tags", [])]
                for goal in profile.learning_goals:
                    if any(goal.lower() in tag or tag in goal.lower() for tag in module_tags):
                        score += 3

            # Points pour les métiers cibles correspondants
            related_occupations = set(ontology_data.get("related_occupations", []))
            module_roles = set(r.lower() for r in module.get("target_roles", []))
            score += len(related_occupations & module_roles)
            
            # Bonus pour les modules générés par Mistral
            if module.get("source") == "Mistral AI":
                score += 1

            module["relevance_score"] = score

        # Tri des modules selon leur pertinence, niveau et source
        sorted_modules = sorted(
            modules,
            key=lambda x: (
                x.get("relevance_score", 0),
                -level_mapping.get(x.get("difficulty_level", "avancé").lower(), 3),
                x.get("source") == "Mistral AI",  # Donne priorité aux modules Mistral à score égal
                not x.get("is_generated", False)
            ),
            reverse=True
        )

        # Limiter à max 15 suggestions
        final_modules = sorted_modules[:15]

        return {
            "suggestions": final_modules,
            "ontology_data": ontology_data,
            "metadata": {"fallback_used": False}
        }

    def _is_module_relevant(self, module: Dict, profile: UserProfileForm) -> bool:
        try:
            level_text = module.get("difficulty_level", "avancé").lower()
            level_ok = level_mapping.get(level_text, 3) <= level_mapping.get(profile.current_level.value.lower(), 3)
            if not level_ok:
                return False

            # Si l'utilisateur n'a pas fourni de compétences ou d'objectifs, 
            # considérer le module comme pertinent s'il correspond au niveau
            if not profile.existing_skills and not profile.learning_goals:
                return True

            module_skills = [s.lower().strip() for s in module.get("required_skills", [])]
            profile_skills = [s.lower().strip() for s in profile.existing_skills]

            skills_match = any(
                any(prof_skill in mod_skill or mod_skill in prof_skill
                    for prof_skill in profile_skills)
                for mod_skill in module_skills
            ) if profile_skills else False

            module_tags = [t.lower().strip() for t in module.get("tags", [])]
            user_goals = [g.lower().strip() for g in profile.learning_goals]

            goals_match = any(
                any(goal in tag or tag in goal
                    for goal in user_goals)
                for tag in module_tags
            ) if user_goals else False

            return skills_match or goals_match or (not profile_skills and not user_goals)

        except Exception as e:
            logger.error(f"Erreur dans _is_module_relevant: {str(e)}")
            return False
        
def save_suggestion_results(self, user_id: str, result_data: Dict):
    """
    Enregistre les résultats des suggestions dans la base de données
    pour un suivi historique et analyse
    """
    try:
        collection = get_collection("user_suggestions")
        
        # Préparer le document à enregistrer
        document = {
            "user_id": user_id,
            "timestamp": datetime.utcnow(),
            **result_data
        }
        
        # Insérer ou mettre à jour les résultats pour cet utilisateur
        collection.update_one(
            {"user_id": user_id},
            {"$set": document},
            upsert=True
        )
        
        logger.info(f"Résultats des suggestions enregistrés pour l'utilisateur {user_id}")
        
    except Exception as e:
        logger.error(f"Erreur lors de l'enregistrement des résultats: {str(e)}")        