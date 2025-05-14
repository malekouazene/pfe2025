import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const AddTrainingForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty_level: 'débutant',
    required_skills: [],
    learning_goals: [],
    newSkill: '',
    newGoal: '',
    guides: [],
    newGuideTitle: '',
    newGuideURL: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  
  // État pour les formations existantes
  const [trainings, setTrainings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('add'); // 'add' ou 'list'

  // Récupération des formations dès le chargement du composant
  useEffect(() => {
    if (activeTab === 'list') {
      fetchTrainings();
    }
  }, [activeTab]);

  // Fonction pour récupérer les formations
  const fetchTrainings = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://localhost:8007/api/suggestions/training/trainings/raw', {
        withCredentials: true
      });
      setTrainings(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des formations:', error);
      showNotification(`Erreur: ${error.response?.data?.message || error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour supprimer une formation
  const deleteTraining = async (trainingId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette formation ?')) {
      try {
        await axios.delete(`http://localhost:8007/api/training/admin/training/${trainingId}`, {
          withCredentials: true
        });
        
        // Mettre à jour la liste après suppression
        setTrainings(trainings.filter(training => training._id !== trainingId));
        showNotification('Formation supprimée avec succès !', 'success');
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        showNotification(`Erreur: ${error.response?.data?.message || error.message}`, 'error');
      }
    }
  };

  // Afficher une notification
  const showNotification = (message, type) => {
    setNotification({
      show: true,
      message,
      type
    });

    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 5000);
  };

  // Styles modernes avec effets glassmorphism et gradients
  const styles = {
    container: {
      maxWidth: '900px',
      margin: '40px auto',
      padding: '40px',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255, 255, 255, 0.18)'
    },
    title: {
      color: 'transparent',
      background: 'linear-gradient(90deg, #4361ee, #3a0ca3)',
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      textAlign: 'center',
      marginBottom: '40px',
      fontSize: '2.2rem',
      fontWeight: '700',
      position: 'relative',
      paddingBottom: '15px'
    },
    titleAfter: {
      content: '""',
      position: 'absolute',
      bottom: '0',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100px',
      height: '4px',
      background: 'linear-gradient(90deg, #4361ee, #3a0ca3)',
      borderRadius: '2px'
    },
    formGroup: {
      marginBottom: '30px'
    },
    label: {
      display: 'block',
      marginBottom: '12px',
      fontWeight: '600',
      color: '#2b2d42',
      fontSize: '1rem',
      letterSpacing: '0.3px'
    },
    input: {
      width: '100%',
      padding: '15px 20px',
      border: '2px solid #edf2f4',
      borderRadius: '10px',
      fontSize: '1rem',
      marginBottom: '15px',
      backgroundColor: '#f8f9fa',
      transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
      boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)'
    },
    inputFocus: {
      borderColor: '#4361ee',
      boxShadow: '0 0 0 4px rgba(67, 97, 238, 0.15)',
      backgroundColor: 'white'
    },
    textarea: {
      minHeight: '150px',
      resize: 'vertical',
      lineHeight: '1.6'
    },
    select: {
      appearance: 'none',
      backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%234361ee%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 15px center',
      backgroundSize: '12px'
    },
    button: {
      padding: '15px 25px',
      border: 'none',
      borderRadius: '10px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
      background: 'linear-gradient(135deg, #4361ee, #3a0ca3)',
      color: 'white',
      boxShadow: '0 4px 15px rgba(67, 97, 238, 0.3)',
      position: 'relative',
      overflow: 'hidden'
    },
    buttonHover: {
      transform: 'translateY(-2px)',
      boxShadow: '0 7px 20px rgba(67, 97, 238, 0.4)'
    },
    buttonActive: {
      transform: 'translateY(0)'
    },
    buttonBefore: {
      content: '""',
      position: 'absolute',
      top: '0',
      left: '-100%',
      width: '100%',
      height: '100%',
      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
      transition: '0.5s'
    },
    submitButton: {
      width: '100%',
      padding: '18px',
      marginTop: '30px',
      fontSize: '1.1rem'
    },
    inputGroup: {
      display: 'flex',
      gap: '15px',
      marginBottom: '15px'
    },
    tagsContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '10px',
      marginTop: '15px'
    },
    skillTag: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '10px 18px',
      borderRadius: '20px',
      fontSize: '0.9rem',
      fontWeight: '500',
      background: 'linear-gradient(135deg, #e0fbfc, #caf0f8)',
      color: '#1b9aaa',
      border: '1px solid #90e0ef',
      boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)'
    },
    goalTag: {
      background: 'linear-gradient(135deg, #e9f5db, #d8f3dc)',
      color: '#2d6a4f',
      border: '1px solid #b7e4c7)'
    },
    tagRemove: {
      marginLeft: '8px',
      background: 'none',
      border: 'none',
      color: 'inherit',
      cursor: 'pointer',
      fontSize: '1.1rem',
      lineHeight: '1',
      opacity: '0.7',
      transition: 'all 0.2s ease'
    },
    list: {
      listStyle: 'none',
      padding: '0',
      margin: '15px 0 0 0'
    },
    guideItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '15px',
      backgroundColor: 'white',
      borderRadius: '10px',
      marginBottom: '10px',
      border: '2px solid #edf2f4',
      transition: 'all 0.3s ease'
    },
    guideLink: {
      color: '#4361ee',
      textDecoration: 'none',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    guideRemove: {
      background: 'none',
      border: 'none',
      color: '#f72585',
      cursor: 'pointer',
      fontSize: '1rem',
      padding: '5px',
      transition: 'all 0.2s ease',
      borderRadius: '50%',
      width: '30px',
      height: '30px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    sectionTitle: {
      fontSize: '1rem',
      fontWeight: '600',
      color: '#6c757d',
      marginBottom: '15px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    notification: {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '15px 25px',
      borderRadius: '8px',
      color: 'white',
      backgroundColor: '#4BB543',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 1000,
      animation: 'slideIn 0.3s ease-out',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    notificationError: {
      backgroundColor: '#FF3333'
    },
    dashboardContainer: {
      display: 'flex',
      minHeight: '100vh'
    },
    sidebar: {
      width: '260px',
      backgroundColor: ' #252733',
      color: '#A4A6B3',
      padding: '30px 0',
      flexShrink: 0
    },
    sidebarHeader: {
      padding: '0 30px 30px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
    },
    sidebarHeaderTitle: {
      color: 'white',
      margin: '0 0 5px 0',
      fontSize: '20px'
    },
    sidebarHeaderSubtitle: {
      margin: 0,
      fontSize: '14px',
      opacity: 0.7
    },
    sidebarNav: {
      padding: '30px 0'
    },
    navItem: {
      display: 'block',
      padding: '15px 30px',
      color: '#A4A6B3',
      textDecoration: 'none',
      fontSize: '15px',
      transition: 'all 0.3s'
    },
    navItemHover: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      color: 'white'
    },
    navItemActive: {
      color: 'white',
      backgroundColor: 'rgba(95, 115, 242, 0.1)',
      borderLeft: '3px solid #5F73F2'
    },
    navDivider: {
      height: '1px',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      margin: '20px 30px'
    },
    mainContent: {
      flex: 1,
      padding: '30px',
      overflowY: 'auto'
    },
    // Nouveaux styles pour la liste des formations
    tabsContainer: {
      display: 'flex',
      marginBottom: '30px',
      borderBottom: '2px solid #edf2f4',
      gap: '10px'
    },
    tab: {
      padding: '12px 24px',
      borderRadius: '8px 8px 0 0',
      cursor: 'pointer',
      fontWeight: '600',
      color: '#6c757d',
      transition: 'all 0.3s ease',
      position: 'relative',
      bottom: '-2px'
    },
    activeTab: {
      color: '#4361ee',
      borderBottom: '3px solid #4361ee',
      backgroundColor: 'rgba(67, 97, 238, 0.05)'
    },
    trainingCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
      border: '1px solid #edf2f4',
      transition: 'all 0.3s ease'
    },
    trainingCardHover: {
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
      transform: 'translateY(-2px)'
    },
    trainingCardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '15px'
    },
    trainingTitle: {
      fontSize: '1.25rem',
      color: '#2b2d42',
      fontWeight: '600',
      margin: '0 0 5px 0'
    },
    difficultyBadge: {
      display: 'inline-block',
      padding: '5px 12px',
      borderRadius: '20px',
      fontSize: '0.8rem',
      fontWeight: '500',
      textTransform: 'capitalize'
    },
    difficultyBadgeBeginner: {
      backgroundColor: '#e9f5db',
      color: '#2d6a4f'
    },
    difficultyBadgeIntermediate: {
      backgroundColor: '#fff3b0',
      color: '#bc6c25'
    },
    difficultyBadgeAdvanced: {
      backgroundColor: '#ffccd5',
      color: '#9d0208'
    },
    trainingDescription: {
      color: '#6c757d',
      fontSize: '0.95rem',
      lineHeight: '1.6',
      marginBottom: '15px'
    },
    trainingMeta: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTop: '1px solid #edf2f4',
      paddingTop: '15px',
      marginTop: '15px'
    },
    trainingMetaInfo: {
      fontSize: '0.9rem',
      color: '#6c757d',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    deleteButton: {
      backgroundColor: '#f72585',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '8px 15px',
      fontSize: '0.9rem',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '5px'
    },
    deleteButtonHover: {
      backgroundColor: '#e5184d',
      boxShadow: '0 4px 12px rgba(247, 37, 133, 0.3)'
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '50px 0',
      fontSize: '1.1rem',
      color: '#6c757d'
    },
    emptyState: {
      textAlign: 'center',
      padding: '50px 0',
      color: '#6c757d'
    },
    emptyStateIcon: {
      fontSize: '3rem',
      marginBottom: '20px',
      opacity: '0.5'
    },
    refreshButton: {
      backgroundColor: '#4361ee',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '10px 20px',
      fontSize: '0.9rem',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      marginTop: '15px'
    },
    refreshButtonHover: {
      backgroundColor: '#3a56e8',
      boxShadow: '0 4px 12px rgba(67, 97, 238, 0.3)'
    }
  };

  // Gestion des états hover
  const [isHovered, setIsHovered] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSkill = () => {
    if (formData.newSkill.trim()) {
      setFormData(prev => ({
        ...prev,
        required_skills: [...prev.required_skills, prev.newSkill],
        newSkill: ''
      }));
    }
  };

  const handleAddGoal = () => {
    if (formData.newGoal.trim()) {
      setFormData(prev => ({
        ...prev,
        learning_goals: [...prev.learning_goals, prev.newGoal],
        newGoal: ''
      }));
    }
  };

  const handleAddGuide = () => {
    if (formData.newGuideTitle.trim() && formData.newGuideURL.trim()) {
      setFormData(prev => ({
        ...prev,
        guides: [...prev.guides, { title: formData.newGuideTitle, url: formData.newGuideURL }],
        newGuideTitle: '',
        newGuideURL: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await axios.post(
        'http://localhost:8007/api/training/admin/training', 
        formData,
        {
          headers: { 
            'Content-Type': 'application/json',
          },
          withCredentials: true
        }
      );

      console.log('Formation ajoutée avec succès:', response.data);

      // Afficher la notification de succès
      showNotification('Formation ajoutée avec succès !', 'success');

      // Réinitialiser le formulaire
      setFormData({
        title: '',
        description: '',
        difficulty_level: 'débutant',
        required_skills: [],
        learning_goals: [],
        newSkill: '',
        newGoal: '',
        guides: [],
        newGuideTitle: '',
        newGuideURL: ''
      });

      // Si l'utilisateur ajoute une nouvelle formation, mettre à jour la liste si elle est visible
      if (activeTab === 'list') {
        fetchTrainings();
      }

    } catch (error) {
      console.error('Erreur complète:', error);
      showNotification(`Erreur: ${error.response?.data?.message || error.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fonction pour afficher le bon badge de difficulté
  const getDifficultyBadgeStyle = (level) => {
    switch(level) {
      case 'débutant':
        return {...styles.difficultyBadge, ...styles.difficultyBadgeBeginner};
      case 'intermédiaire':
        return {...styles.difficultyBadge, ...styles.difficultyBadgeIntermediate};
      case 'avancé':
        return {...styles.difficultyBadge, ...styles.difficultyBadgeAdvanced};
      default:
        return styles.difficultyBadge;
    }
  };

  // Fonction pour limiter la longueur d'un texte
  const truncateText = (text, maxLength) => {
    if (text?.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
  };

  return (
    <div style={styles.dashboardContainer}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.sidebarHeaderTitle}>Administrateur Sécurité</h2>
          <p style={styles.sidebarHeaderSubtitle}>Gestion Système</p>
        </div>
        <nav style={styles.sidebarNav}>
          <Link to="/homeAdmin" style={styles.navItem}>Tableau de Bord</Link>
          <Link to="/admin/manage-users" style={styles.navItem}>Utilisateurs</Link>
          <Link to="/admin/roles" style={styles.navItem}>Rôles</Link>
          <Link to="/admin/security" style={styles.navItem}>Sécurité</Link>
          <Link to="/admin/training" style={{...styles.navItem, ...styles.navItemActive}}>Formations</Link>
          <div style={styles.navDivider}></div>
        
          <Link to="/admin/settings" style={styles.navItem}>Paramètres</Link>
          <Link to="/logout" style={styles.navItem}>Déconnexion</Link>
        </nav>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        <div style={styles.container}>
          {/* Notification */}
          {notification.show && (
            <div style={{
              ...styles.notification,
              ...(notification.type === 'error' && styles.notificationError)
            }}>
              {notification.type === 'success' ? '✅' : '❌'} {notification.message}
            </div>
          )}

          <h2 style={styles.title}>Gestion des Formations
            <span style={styles.titleAfter}></span>
          </h2>
          
          {/* Tabs */}
          <div style={styles.tabsContainer}>
            <div 
              style={{
                ...styles.tab,
                ...(activeTab === 'add' && styles.activeTab)
              }}
              onClick={() => setActiveTab('add')}
            >
              ➕ Ajouter une formation
            </div>
            <div 
              style={{
                ...styles.tab,
                ...(activeTab === 'list' && styles.activeTab)
              }}
              onClick={() => setActiveTab('list')}
            >
              📋 Liste des formations
            </div>
          </div>

          {/* Formulaire d'ajout */}
          {activeTab === 'add' && (
            <form onSubmit={handleSubmit}>
              {/* Titre */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Titre de la formation</label>
                <input 
                  type="text" 
                  name="title" 
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  style={styles.input}
                  onFocus={(e) => e.target.style = {...styles.input, ...styles.inputFocus}}
                  onBlur={(e) => e.target.style = styles.input}
                />
              </div>
              
              {/* Description */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea 
                  name="description" 
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  style={{...styles.input, ...styles.textarea}}
                  onFocus={(e) => e.target.style = {...styles.input, ...styles.textarea, ...styles.inputFocus}}
                  onBlur={(e) => e.target.style = {...styles.input, ...styles.textarea}}
                />
              </div>
              
              {/* Niveau de difficulté */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Niveau de difficulté</label>
                <select 
                  name="difficulty_level" 
                  value={formData.difficulty_level} 
                  onChange={handleInputChange}
                  required
                  style={{...styles.input, ...styles.select}}
                  onFocus={(e) => e.target.style = {...styles.input, ...styles.select, ...styles.inputFocus}}
                  onBlur={(e) => e.target.style = {...styles.input, ...styles.select}}
                >
                  <option value="débutant">Débutant</option>
                  <option value="intermédiaire">Intermédiaire</option>
                  <option value="avancé">Avancé</option>
                </select>
              </div>
              
              {/* Compétences requises */}
              <div style={styles.formGroup}>
                <div style={styles.sectionTitle}>
                  <span>📚</span> Compétences requises
                </div>
                <div style={styles.inputGroup}>
                  <input 
                    type="text" 
                    name="newSkill" 
                    value={formData.newSkill}
                    onChange={handleInputChange}
                    placeholder="Ajouter une compétence"
                    style={{...styles.input, marginBottom: 0}}
                    onFocus={(e) => e.target.style = {...styles.input, marginBottom: 0, ...styles.inputFocus}}
                    onBlur={(e) => e.target.style = {...styles.input, marginBottom: 0}}
                  />
                  <button 
                    type="button" 
                    onClick={handleAddSkill}
                    style={{
                      ...styles.button,
                      ...(isHovered.addSkill && styles.buttonHover)
                    }}
                    onMouseEnter={() => setIsHovered({...isHovered, addSkill: true})}
                    onMouseLeave={() => setIsHovered({...isHovered, addSkill: false})}
                  >
                    + Ajouter
                  </button>
                </div>
                <div style={styles.tagsContainer}>
                  {formData.required_skills.map((skill, index) => (
                    <span key={index} style={styles.skillTag}>
                      {skill}
                      <button 
                        type="button" 
                        style={styles.tagRemove}
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          required_skills: prev.required_skills.filter((_, i) => i !== index)
                        }))}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Objectifs d'apprentissage */}
              <div style={styles.formGroup}>
                <div style={styles.sectionTitle}>
                  <span>🎯</span> Objectifs d'apprentissage
                </div>
                <div style={styles.inputGroup}>
                  <input 
                    type="text" 
                    name="newGoal" 
                    value={formData.newGoal}
                    onChange={handleInputChange}
                    placeholder="Ajouter un objectif"
                    style={{...styles.input, marginBottom: 0}}
                    onFocus={(e) => e.target.style = {...styles.input, marginBottom: 0, ...styles.inputFocus}}
                    onBlur={(e) => e.target.style = {...styles.input, marginBottom: 0}}
                  />
                  <button 
                    type="button" 
                    onClick={handleAddGoal}
                    style={{
                      ...styles.button,
                      ...(isHovered.addGoal && styles.buttonHover)
                    }}
                    onMouseEnter={() => setIsHovered({...isHovered, addGoal: true})}
                    onMouseLeave={() => setIsHovered({...isHovered, addGoal: false})}
                  >
                    + Ajouter
                  </button>
                </div>
                <div style={styles.tagsContainer}>
                  {formData.learning_goals.map((goal, index) => (
                    <span key={index} style={{...styles.skillTag, ...styles.goalTag}}>
                      {goal}
                      <button 
                        type="button" 
                        style={styles.tagRemove}
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          learning_goals: prev.learning_goals.filter((_, i) => i !== index)
                        }))}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Guides associés */}
              <div style={styles.formGroup}>
                <div style={styles.sectionTitle}>
                  <span>📖</span> Guides associés
                </div>
                <div style={{...styles.inputGroup, flexDirection: 'column', gap: '15px'}}>
                  <div style={{display: 'flex', gap: '15px'}}>
                    <input 
                      type="text" 
                      name="newGuideTitle" 
                      value={formData.newGuideTitle}
                      onChange={handleInputChange}
                      placeholder="Titre du guide"
                      style={{...styles.input, marginBottom: 0, flex: 2}}
                      onFocus={(e) => e.target.style = {...styles.input, marginBottom: 0, flex: 2, ...styles.inputFocus}}
                      onBlur={(e) => e.target.style = {...styles.input, marginBottom: 0, flex: 2}}
                    />
                    <input 
                      type="text" 
                      name="newGuideURL" 
                      value={formData.newGuideURL}
                      onChange={handleInputChange}
                      placeholder="URL du guide"
                      style={{...styles.input, marginBottom: 0, flex: 3}}
                      onFocus={(e) => e.target.style = {...styles.input, marginBottom: 0, flex: 3, ...styles.inputFocus}}
                      onBlur={(e) => e.target.style = {...styles.input, marginBottom: 0, flex: 3}}
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={handleAddGuide}
                    style={{
                      ...styles.button,
                      ...(isHovered.addGuide && styles.buttonHover),
                      alignSelf: 'flex-start'
                    }}
                    onMouseEnter={() => setIsHovered({...isHovered, addGuide: true})}
                    onMouseLeave={() => setIsHovered({...isHovered, addGuide: false})}
                  >
                    + Ajouter un guide
                  </button>
                </div>
                <ul style={styles.list}>
                  {formData.guides.map((guide, index) => (
                    <li key={index} style={styles.guideItem}>
                      <a 
                        href={guide.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={styles.guideLink}
                      >
                        <span>🔗</span> {guide.title}
                      </a>
                      <button 
                        type="button" 
                        style={styles.guideRemove}
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          guides: prev.guides.filter((_, i) => i !== index)
                        }))}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Bouton de soumission */}
              <button 
                type="submit" 
                style={{
                  ...styles.button,
                  ...styles.submitButton,
                  ...(isHovered.submit && styles.buttonHover)
                }}
                onMouseEnter={() => setIsHovered({...isHovered, submit: true})}
                onMouseLeave={() => setIsHovered({...isHovered, submit: false})}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Envoi en cours...' : '🚀 Soumettre la formation'}
              </button>
            </form>
          )}

          {/* Liste des formations */}
          {activeTab === 'list' && (
            <div>
              <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '20px'}}>
                <button 
                  onClick={fetchTrainings}
                  style={{
                    ...styles.refreshButton,
                    ...(isHovered.refresh && styles.refreshButtonHover)
                  }}
                  onMouseEnter={() => setIsHovered({...isHovered, refresh: true})}
                  onMouseLeave={() => setIsHovered({...isHovered, refresh: false})}
                >
                  🔄 Rafraîchir
                </button>
              </div>

              {isLoading ? (
                <div style={styles.loadingContainer}>
                  <p>Chargement des formations...</p>
                </div>
              ) : trainings.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyStateIcon}>📚</div>
                  <h3>Aucune formation disponible</h3>
                  <p>Commencez par créer une nouvelle formation.</p>
                </div>
              ) : (
                trainings.map((training, index) => (
                  <div 
                    key={training._id || index} 
                    style={{
                      ...styles.trainingCard,
                      ...(isHovered[`training_${index}`] && styles.trainingCardHover)
                    }}
                    onMouseEnter={() => setIsHovered({...isHovered, [`training_${index}`]: true})}
                    onMouseLeave={() => setIsHovered({...isHovered, [`training_${index}`]: false})}
                  >
                    <div style={styles.trainingCardHeader}>
                      <div>
                        <h3 style={styles.trainingTitle}>{training.title}</h3>
                        <span style={getDifficultyBadgeStyle(training.difficulty_level)}>
                          {training.difficulty_level}
                        </span>
                      </div>
                      <button 
                        onClick={() => deleteTraining(training._id)}
                        style={{
                          ...styles.deleteButton,
                          ...(isHovered[`delete_${index}`] && styles.deleteButtonHover)
                        }}
                        onMouseEnter={() => setIsHovered({...isHovered, [`delete_${index}`]: true})}
                        onMouseLeave={() => setIsHovered({...isHovered, [`delete_${index}`]: false})}
                      >
                        🗑️ Supprimer
                      </button>
                    </div>
                    
                    <p style={styles.trainingDescription}>
                      {truncateText(training.description, 250)}
                    </p>
                    
                    <div style={styles.trainingMeta}>
                      <div style={styles.tagsContainer}>
                        {training.required_skills && training.required_skills.slice(0, 3).map((skill, idx) => (
                          <span key={idx} style={styles.skillTag}>
                            {skill}
                          </span>
                        ))}
                        {training.required_skills && training.required_skills.length > 3 && (
                          <span style={{...styles.skillTag, backgroundColor: '#f8f9fa', color: '#6c757d'}}>
                            +{training.required_skills.length - 3}
                          </span>
                        )}
                      </div>
                      
                      <div style={styles.trainingMetaInfo}>
                        <span>📘 {training.learning_goals ? training.learning_goals.length : 0} objectifs</span>
                        <span>📋 {training.guides ? training.guides.length : 0} guides</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddTrainingForm;