import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import './FormationUser.css';
import Sidebar from './Sidebar';

const FormationUser = ({ onClose }) => {
  const { user } = useContext(AuthContext);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    currentLevel: '',
    existingSkills: [],
    learningGoals: [],
    newSkill: '',
    newGoal: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [ontologyData, setOntologyData] = useState({
    career_paths: [],
    missing_skills: [],
    related_occupations: []
  });
  const [trainings, setTrainings] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedTraining, setSelectedTraining] = useState(null);

  useEffect(() => {
    setIsVisible(true);
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    try {
      const response = await axios.get('http://localhost:8007/api/suggestions/training/trainings/raw');
      setTrainings(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des formations:', error);
      setError('Impossible de charger les formations existantes.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSkill = () => {
    if (formData.newSkill.trim()) {
      setFormData(prev => ({
        ...prev,
        existingSkills: [...prev.existingSkills, prev.newSkill],
        newSkill: ''
      }));
    }
  };

  const handleAddGoal = () => {
    if (formData.newGoal.trim()) {
      setFormData(prev => ({
        ...prev,
        learningGoals: [...prev.learningGoals, prev.newGoal],
        newGoal: ''
      }));
    }
  };

  const handleRemoveSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      existingSkills: prev.existingSkills.filter((_, i) => i !== index)
    }));
  };

  const handleRemoveGoal = (index) => {
    setFormData(prev => ({
      ...prev,
      learningGoals: prev.learningGoals.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    
    // Format des données pour le profil
    const profileData = {
      user_id: String(user?.uidNumber || '1001'), // Utilise 1001 comme fallback pour les tests
      current_level: formData.currentLevel,
      existing_skills: formData.existingSkills.length > 0 ? formData.existingSkills : ["Aucune compétence spécifiée"],
      learning_goals: formData.learningGoals.length > 0 ? formData.learningGoals : ["Aucun objectif spécifié"]
    };

    try {
      // 1. Soumettre le profil
      await axios.post(
        'http://localhost:8007/api/profile/profile/submit', 
        profileData,
        { headers: { 'Content-Type': 'application/json' } }
      );

      setSuccessMessage("Votre profil a été complété avec succès!");

      // 2. Construire l'URL avec query params pour les suggestions
      const userId = encodeURIComponent(profileData.user_id);
      const currentLevel = encodeURIComponent(profileData.current_level);
      
      let existingSkillsParams = '';
      if (profileData.existing_skills && profileData.existing_skills.length > 0) {
        existingSkillsParams = profileData.existing_skills
          .map(skill => `existing_skills=${encodeURIComponent(skill)}`)
          .join('&');
      }
      
      let learningGoalsParams = '';
      if (profileData.learning_goals && profileData.learning_goals.length > 0) {
        learningGoalsParams = profileData.learning_goals
          .map(goal => `learning_goals=${encodeURIComponent(goal)}`)
          .join('&');
      }
      
      // Construire l'URL complète
      let suggestionsUrl = `http://localhost:8007/api/suggestions/training/suggestions?user_id=${userId}&current_level=${currentLevel}`;
      
      if (existingSkillsParams) {
        suggestionsUrl += `&${existingSkillsParams}`;
      }
      
      if (learningGoalsParams) {
        suggestionsUrl += `&${learningGoalsParams}`;
      }
      
      // 3. Récupérer les suggestions via l'API GET
      const suggestionsResponse = await axios.get(suggestionsUrl);
      
      // Traiter les réponses
      if (suggestionsResponse.data && suggestionsResponse.data.suggestions) {
        setSuggestions(suggestionsResponse.data.suggestions.ai_suggestions || []);
        
        if (suggestionsResponse.data.suggestions.ontology_data) {
          setOntologyData(suggestionsResponse.data.suggestions.ontology_data);
        }
      }
      
      setIsVisible(false);
      setTimeout(() => {
        setStep(2);
        setIsVisible(true);
        setIsLoading(false);
      }, 300);
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi des données:', error);
      if (error.response) {
        setError(`Erreur: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else {
        setError('Erreur lors de l\'envoi des données. Veuillez réessayer.');
      }
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setIsVisible(false);
    setTimeout(() => {
      setStep(1);
      setIsVisible(true);
    }, 300);
  };

  const navigateToTrainings = () => {
    setIsVisible(false);
    setTimeout(() => {
      setStep(3);
      setIsVisible(true);
    }, 300);
  };

  const openTrainingDetails = (training) => {
    setSelectedTraining(training);
  };

  const closeTrainingDetails = () => {
    setSelectedTraining(null);
  };

  // Composant pour afficher les compétences manquantes
  const MissingSkills = ({ skills }) => {
    if (!skills || skills.length === 0) return <p className="no-data-message">Aucune compétence manquante identifiée.</p>;
    
    return (
      <div className="missing-skills-section">
        <h4 className="subsection-title">Compétences recommandées</h4>
        <div className="missing-skills-grid">
          {skills.map((skill, index) => (
            <div key={index} className="missing-skill-card">
              <h5 className="skill-name">{skill.preferredLabel}</h5>
              <p className="skill-description">{skill.description?.literal || 'Aucune description disponible'}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Composant pour afficher les parcours de carrière
  const CareerPaths = ({ paths }) => {
    if (!paths || paths.length === 0) return <p className="no-data-message">Aucun parcours de carrière identifié.</p>;

    // Regrouper par compétence source
    const groupedPaths = paths.reduce((acc, path) => {
      if (!acc[path.sourceSkill]) {
        acc[path.sourceSkill] = [];
      }
      acc[path.sourceSkill].push(path);
      return acc;
    }, {});
    
    return (
      <div className="career-paths-section">
        <h4 className="subsection-title">Parcours de compétences</h4>
        
        {Object.entries(groupedPaths).map(([sourceSkill, paths], index) => (
          <div key={index} className="career-path-group">
            <h5 className="source-skill">À partir de: {sourceSkill}</h5>
            <div className="career-paths-list">
              {paths.map((path, idx) => (
                <div key={idx} className="career-path-item">
                  <div className="path-arrow">→</div>
                  <div className="target-skill">{path.targetSkill}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="modern-profile-container">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="profile-main-content">
        <div className="formation-modal">
          <div className={`formation-card ${isVisible ? 'visible' : 'hidden'}`}>
            <div className="formation-header">
              <h2 className="formation-title">Profil de Formation</h2>
              <button className="close-button" onClick={onClose}>
                <svg className="icon" viewBox="0 0 24 24">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </button>
            </div>

            <div className="formation-nav">
              <button 
                className={`nav-tab ${step === 1 ? 'active' : ''}`}
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(() => {
                    setStep(1);
                    setIsVisible(true);
                  }, 300);
                }}
              >
                Profil
              </button>
              <button 
                className={`nav-tab ${step === 2 ? 'active' : ''}`}
                onClick={() => {
                  if (suggestions.length > 0) {
                    setIsVisible(false);
                    setTimeout(() => {
                      setStep(2);
                      setIsVisible(true);
                    }, 300);
                  }
                }}
                disabled={suggestions.length === 0}
              >
                Suggestions
              </button>
              <button 
                className={`nav-tab ${step === 3 ? 'active' : ''}`}
                onClick={navigateToTrainings}
              >
                Catalogue
              </button>
            </div>

            <div className="formation-content">
              {step === 1 && (
                <div className={`form-section ${isVisible ? 'visible' : 'hidden'}`}>
                  <div className="form-group">
                    <label className="form-label">Niveau actuel</label>
                    <select 
                      name="currentLevel" 
                      value={formData.currentLevel}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option value="">Sélectionnez votre niveau</option>
                      <option value="débutant">Débutant</option>
                      <option value="intermédiaire">Intermédiaire</option>
                      <option value="avancé">Avancé</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Compétences existantes</label>
                    <div className="input-group">
                      <input
                        type="text"
                        name="newSkill"
                        value={formData.newSkill}
                        onChange={handleInputChange}
                        placeholder="Ajouter une compétence"
                        className="form-input"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                      />
                      <button onClick={handleAddSkill} className="add-button">Ajouter</button>
                    </div>
                    <div className="tags-container">
                      {formData.existingSkills.map((skill, index) => (
                        <div key={index} className="skill-tag">
                          {skill}
                          <button onClick={() => handleRemoveSkill(index)} className="remove-tag">X</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Objectifs d'apprentissage</label>
                    <div className="input-group">
                      <input
                        type="text"
                        name="newGoal"
                        value={formData.newGoal}
                        onChange={handleInputChange}
                        placeholder="Ajouter un objectif"
                        className="form-input"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddGoal()}
                      />
                      <button onClick={handleAddGoal} className="add-button">Ajouter</button>
                    </div>
                    <div className="tags-container">
                      {formData.learningGoals.map((goal, index) => (
                        <div key={index} className="goal-tag">
                          {goal}
                          <button onClick={() => handleRemoveGoal(index)} className="remove-tag">X</button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {error && <div className="error-message">{error}</div>}
                  {successMessage && <div className="success-message">{successMessage}</div>}

                  <div className="form-actions">
                    <button 
                      onClick={handleSubmit} 
                      className="submit-button"
                      disabled={!formData.currentLevel || isLoading}
                    >
                      {isLoading ? 'Chargement...' : 'Générer des suggestions'}
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className={`form-section ${isVisible ? 'visible' : 'hidden'}`}>
                  <h3 className="section-title">Suggestions de formation personnalisées</h3>
                  
                  {isLoading ? (
                    <div className="loading-container">
                      <div className="loading-spinner"></div>
                      <p>Chargement des suggestions...</p>
                    </div>
                  ) : (
                    <>
                      {/* Section des suggestions basées sur l'IA */}
                      <div className="suggestions-section">
                        <h4 className="subsection-title">Formations recommandées</h4>
                        <div className="suggestions-list">
                          {suggestions.length > 0 ? (
                            suggestions.map((suggestion, index) => (
                              <div key={index} className="suggestion-card">
                                <h4 className="suggestion-title">{suggestion.title}</h4>
                                <p className="suggestion-description">{suggestion.ai_justification}</p>
                              </div>
                            ))
                          ) : (
                            <p className="no-data-message">Aucune suggestion disponible pour le moment.</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Section des compétences manquantes */}
                      <MissingSkills skills={ontologyData.missing_skills} />
                      
                      {/* Section des parcours de carrière */}
                      <CareerPaths paths={ontologyData.career_paths} />
                      
                      <div className="navigation-buttons">
                        <button onClick={handleBack} className="back-button">
                          Modifier mon profil
                        </button>
                        <button onClick={navigateToTrainings} className="view-catalog-button">
                          Voir le catalogue complet
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className={`form-section ${isVisible ? 'visible' : 'hidden'}`}>
                  <h3 className="section-title">Catalogue des formations disponibles</h3>
                  
                  {isLoading ? (
                    <div className="loading-container">
                      <div className="loading-spinner"></div>
                      <p>Chargement des formations...</p>
                    </div>
                  ) : (
                    <div className="trainings-grid">
                      {trainings.length > 0 ? (
                        trainings.map((training) => (
                          <div key={training._id} className="training-card" onClick={() => openTrainingDetails(training)}>
                            <div className="training-card-header">
                              <h4 className="training-title">{training.title}</h4>
                              <span className={`training-level ${training.difficulty_level.toLowerCase()}`}>
                                {training.difficulty_level}
                              </span>
                            </div>
                            <p className="training-description">
                              {training.description.length > 100 
                                ? `${training.description.substring(0, 100)}...` 
                                : training.description}
                            </p>
                            <div className="training-meta">
                              {training.required_skills?.length > 0 && (
                                <div className="training-skills">
                                  <span className="meta-label">Compétences requises:</span>
                                  <div className="skills-tags">
                                    {training.required_skills.slice(0, 3).map((skill, idx) => (
                                      <span key={idx} className="skill-tag">{skill}</span>
                                    ))}
                                    {training.required_skills.length > 3 && (
                                      <span className="skill-tag">+{training.required_skills.length - 3}</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="no-data-message">Aucune formation disponible pour le moment.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Modal de détail de formation */}
          {selectedTraining && (
            <div className="training-detail-modal">
              <div className="training-detail-content">
                <button className="close-detail-button" onClick={closeTrainingDetails}>
                  <svg className="icon" viewBox="0 0 24 24">
                    <path d="M18 6 6 18"></path>
                    <path d="m6 6 12 12"></path>
                  </svg>
                </button>

                <div className="training-detail-header">
                  <h2 className="detail-title">{selectedTraining.title}</h2>
                  <span className={`detail-level ${selectedTraining.difficulty_level.toLowerCase()}`}>
                    {selectedTraining.difficulty_level}
                  </span>
                </div>

                <div className="training-detail-body">
                  <div className="detail-section">
                    <h3 className="section-title">Description</h3>
                    <p className="detail-description">{selectedTraining.description}</p>
                  </div>

                  <div className="detail-columns">
                    <div className="detail-column">
                      <div className="detail-section">
                        <h3 className="section-title">Compétences requises</h3>
                        <div className="skills-container">
                          {selectedTraining.required_skills?.length > 0 ? (
                            selectedTraining.required_skills.map((skill, index) => (
                              <span key={index} className="skill-tag">{skill}</span>
                            ))
                          ) : (
                            <p className="no-data">Aucune compétence spécifiée</p>
                          )}
                        </div>
                      </div>

                      <div className="detail-section">
                        <h3 className="section-title">Objectifs d'apprentissage</h3>
                        <ul className="goals-list">
                          {selectedTraining.learning_goals?.length > 0 ? (
                            selectedTraining.learning_goals.map((goal, index) => (
                              <li key={index} className="goal-item">
                                <svg className="icon" viewBox="0 0 24 24">
                                  <path d="M20 6L9 17l-5-5"></path>
                                </svg>
                                <span>{goal}</span>
                              </li>
                            ))
                          ) : (
                            <p className="no-data">Aucun objectif spécifié</p>
                          )}
                        </ul>
                      </div>
                    </div>

                    <div className="detail-column">
                      <div className="detail-section">
                        <h3 className="section-title">Ressources</h3>
                        <div className="resources-list">
                          {selectedTraining.guides?.length > 0 ? (
                            selectedTraining.guides.map((guide, index) => (
                              <a 
                                key={index} 
                                href={guide.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="resource-link"
                              >
                                <svg className="icon" viewBox="0 0 24 24">
                                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                  <polyline points="15 3 21 3 21 9"></polyline>
                                  <line x1="10" y1="14" x2="21" y2="3"></line>
                                </svg>
                                <span>{guide.title}</span>
                              </a>
                            ))
                          ) : (
                            <p className="no-data">Aucune ressource disponible</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="training-detail-footer">
                  <button className="enroll-button">S'inscrire à cette formation</button>
                  <button className="request-button">Demander plus d'informations</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormationUser;