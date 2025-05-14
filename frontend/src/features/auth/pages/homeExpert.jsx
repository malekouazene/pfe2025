import React, { useContext ,useState } from 'react';
import { 
  FaUserCircle, 
  FaClipboardCheck, 
  FaChartBar, 
  FaCommentAlt, 
  FaFileAlt,
  FaBell, 
  FaCog,
  FaSearch,
  FaFileUpload,
  FaSignOutAlt, FaBook ,
 
  FaFilePdf, FaFileImage, FaFileWord, 
  FaDownload, FaEye, FaPlus, FaTrash, FaTimes,
   FaClipboardList, 
  FaExclamationTriangle,    FaStar 
  


} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { AuthContext } from "./AuthContext";
import NotificationDropdown from './NotificationDropdown';


const ModernExpertProfile = () => {
  const { user } = useContext(AuthContext);
  console.log("User from context:", user);
  // Dans votre composant DocumentExpert, ajoutez cet état :
  const [showKnowledgeMenu, setShowKnowledgeMenu] = useState(false);

  if (!user) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="modern-profile-container">
      {/* Sidebar */}
      <div className="profile-sidebar">
        <div className="user-avatar-container">
          <div className="user-avatar">
            <FaUserCircle size={80} />
          </div>
          <h2>{user?.username || 'Expert'}</h2>
          <p className="user-id">ID: {user?.uidNumber || 'N/A'}</p>
          <p className="user-department">Expert en Connaissances</p>
          <div className="user-status">
           
          
          </div>
        </div>

        <nav className="profile-nav">
                  <Link to="/homeexpert" className="nav-item">
                    <FaClipboardList className="nav-icon" />
                    <span>Mes Procédures</span>
                  </Link>
                  <div className="nav-menu-group">
          <button 
            className={`nav-item ${showKnowledgeMenu ? 'active' : ''}`}
            onClick={() => setShowKnowledgeMenu(!showKnowledgeMenu)}
           
          >
             
            <FaFileAlt className="nav-icon" />
            <span> Base de Connaissances</span>
          </button>
          
          {showKnowledgeMenu && (
            <div className="nav-submenu">
              <Link to="/documents" className="nav-subitem">
                <FaBook className="nav-subicon" />
                <span>Mes Connaissances</span>
              </Link>
              <Link to="/ajouter-connaissance" className="nav-subitem">
                <FaPlus className="nav-subicon" />
                <span>Ajouter une Connaissance</span>
              </Link>
            </div>
          )}
        </div>
        
        
        <button className="nav-item active">
          <FaClipboardCheck className="nav-icon" />
          <Link to="/validation" className="nav-link">
            <span>Validation  </span>
          </Link>
        </button>
        <button className="nav-item">
          <FaChartBar className="nav-icon" />
          <Link to="/dashboard" className="nav-link">
            <span>Tableaux de bord</span>
          </Link>
        </button>
                            
                  <button className="nav-item">
                    <FaCog className="nav-icon" />
                    <span>Paramètres</span>
                  </button>
        
                   {/* Nouveau bouton de déconnexion */}
              <button 
                className="nav-item logout-btn"
                onClick={() => {
                  // Ajoutez ici votre logique de déconnexion
                  localStorage.removeItem('token'); // Exemple
                  window.location.href = '/login'; // Redirection
                }}
              >
                <FaSignOutAlt className="nav-icon" />
                <span>Déconnexion</span>
              </button>
                </nav>
      </div>

      {/* Main Content */}
      <div className="profile-main-content">
        {/* Header */}
        <header className="content-header">
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input type="text" placeholder="Rechercher des procédures..." />
          </div>
          <div className="header-actions">
          <NotificationDropdown userId={user?.username} />
       
            <button className="user-menu">
              <div style={{ position: 'relative' }}>
                <FaUserCircle size={30} />
                <span className="online-status"></span>
              </div>
            </button>
          </div>
        </header>

        {/* Dashboard Widgets */}
        <div className="dashboard-widgets">
          <div className="widget quick-actions">
            <h3>Actions Rapides</h3>
            <div className="action-buttons">
              <button className="action-btn">
                <FaFileUpload size={18} />
                <span>Valider mise a jour </span>
              </button>
              <button className="action-btn">
                <FaChartBar size={18} />
                <span>Analyser données</span>
              </button>
              <button className="action-btn">
                <FaFileAlt size={18} />
                <span>Créer Connaissance</span>
              </button>
            </div>
          </div>

          <div className="widget tasks-progress">
            <h3>Activité Récente</h3>
            <div className="progress-container">
              <div className="progress-bar" style={{ width: '75%' }}></div>
              <span>15/20 validations ce mois</span>
            </div>
            <ul className="task-list">
              <li className="task-item completed">
                <span>• Procédure #1234 validée</span>
              </li>
              <li className="task-item completed">
                <span>• Document "Sécurité" créé</span>
              </li>
              <li className="task-item completed">
                <span>• Analyse des tendances</span>
              </li>
              <li className="task-item">
                <span>• Revue des commentaires</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Procedures Section */}
        <section className="procedures-section">
          <div className="section-header">
            <h2>Procédures à Valider</h2>
            <div className="section-filters">
              <select>
                <option>Toutes</option>
                <option>En attente</option>
                <option>Prioritaires</option>
                <option>Retournées</option>
              </select>
            </div>
          </div>

          <div className="procedures-grid">
            {/* Procedure Card 1 */}
            <div className="procedure-card">
              <div className="card-header">
                <span className="procedure-id">PROC-2023-045</span>
                <span className="procedure-status pending">En attente</span>
              </div>
              <h3 className="procedure-title">Mise à jour procédure RH</h3>
              <p className="procedure-desc">Nouveaux processus de recrutement pour le département</p>
              <div className="card-footer">
                <span className="procedure-date">Soumis il y a 2 jours</span>
                <button className="feedback-btn">
                  <FaCommentAlt size={14} />
                  <span>Évaluer</span>
                </button>
              </div>
            </div>

            {/* Procedure Card 2 */}
            <div className="procedure-card">
              <div className="card-header">
                <span className="procedure-id">PROC-2023-046</span>
                <span className="procedure-status priority">Prioritaire</span>
              </div>
              <h3 className="procedure-title">Protocole sécurité informatique</h3>
              <p className="procedure-desc">Mise à jour des règles de sécurité après incident</p>
              <div className="card-footer">
                <span className="procedure-date">Soumis aujourd'hui</span>
                <button className="report-btn">
                  <FaCommentAlt size={14} />
                  <span>Valider</span>
                </button>
              </div>
            </div>

            {/* Procedure Card 3 */}
            <div className="procedure-card">
              <div className="card-header">
                <span className="procedure-id">PROC-2023-044</span>
                <span className="procedure-status returned">Retournée</span>
              </div>
              <h3 className="procedure-title">Processus achats internationaux</h3>
              <p className="procedure-desc">Nouveaux fournisseurs en Asie - documentation requise</p>
              <div className="card-footer">
                <span className="procedure-date">Revue nécessaire</span>
                <button className="feedback-btn">
                  <FaCommentAlt size={14} />
                  <span>Revoir</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ModernExpertProfile;

// CSS Styles (les mêmes que pour l'utilisateur, avec quelques ajouts)
const modernProfileStyles = `
.modern-profile-container {
  display: flex;
  min-height: 100vh;
  font-family: 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background-color: #f5f7fa;
}

.profile-sidebar {
  width: 280px;
  background: linear-gradient(135deg, #4a6fa5 0%, #3a5a80 100%);
  color: white;
  padding: 30px 20px;
  box-shadow: 2px 0 10px rgba(0,0,0,0.1);
}

.user-avatar-container {
  text-align: center;
  margin-bottom: 40px;
}

.user-avatar {
  margin: 0 auto 15px;
  color: rgba(255,255,255,0.9);
}

.user-avatar-container h2 {
  margin: 10px 0 5px;
  font-size: 20px;
}

.user-department {
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 15px;
}

.user-status {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  gap: 8px;
}

.status-indicator {
  width: 10px;
  height: 10px;
  background-color: #2ecc71;
  border-radius: 50%;
  display: inline-block;
}

.profile-nav {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 15px;
  background: transparent;
  border: none;
  color: white;
  text-align: left;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-item:hover {
  background: rgba(255,255,255,0.1);
}

.nav-item.active {
  background: rgba(255,255,255,0.2);
  font-weight: 500;
}

.nav-icon {
  font-size: 16px;
  opacity: 0.9;
}

.profile-main-content {
  flex: 1;
  padding: 30px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.search-bar {
  position: relative;
  width: 400px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #7f8c8d;
}

.search-bar input {
  width: 100%;
  padding: 10px 15px 10px 40px;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 14px;
  transition: all 0.2s;
}

.search-bar input:focus {
  outline: none;
  border-color: #4a6fa5;
  box-shadow: 0 0 0 2px rgba(74, 111, 165, 0.2);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.notification-btn {
  position: relative;
  background: none;
  border: none;
  color: #4a6fa5;
  cursor: pointer;
}

.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #e74c3c;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
}

.user-menu {
  background: none;
  border: none;
  color: #4a6fa5;
  cursor: pointer;
}

.online-status {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  background-color: #10B981;
  border-radius: 50%;
  border: 2px solid white;
}

.dashboard-widgets {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.widget {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.widget h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #2c3e50;
  font-size: 16px;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  background-color: #f0f4f8;
  border: none;
  border-radius: 6px;
  color: #4a6fa5;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background-color: #e0e8f0;
}

.progress-container {
  margin-bottom: 20px;
}

.progress-bar {
  height: 8px;
  background: linear-gradient(90deg, #4a6fa5 0%, #6ba3eb 100%);
  border-radius: 4px;
  margin-bottom: 5px;
}

.progress-container span {
  font-size: 12px;
  color: #7f8c8d;
}

.task-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.task-item {
  padding: 8px 0;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.task-item.completed {
  color: #7f8c8d;
  text-decoration: line-through;
}

.task-item.completed span::before {
  content: '✓';
  color: #2ecc71;
  margin-right: 8px;
}

.task-item:not(.completed) span::before {
  content: '•';
  color: #4a6fa5;
  margin-right: 8px;
}

.procedures-section {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
}

.section-filters select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.procedures-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.procedure-card {
  border: 1px solid #eaeaea;
  border-radius: 8px;
  padding: 15px;
  transition: all 0.2s;
}

.procedure-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.procedure-id {
  font-size: 12px;
  color: #7f8c8d;
}

.procedure-status {
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.procedure-status.pending {
  background-color: #e3f2fd;
  color: #1565c0;
}

.procedure-status.priority {
  background-color: #ffebee;
  color: #c62828;
}

.procedure-status.returned {
  background-color: #fff8e1;
  color: #e65100;
}

.procedure-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #2c3e50;
}

.procedure-desc {
  margin: 0 0 15px 0;
  font-size: 14px;
  color: #7f8c8d;
  line-height: 1.4;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.procedure-date {
  font-size: 12px;
  color: #7f8c8d;
}

.feedback-btn, .report-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.feedback-btn {
  background-color: #e3f2fd;
  color: #1976d2;
}

.feedback-btn:hover {
  background-color: #bbdefb;
}

.report-btn {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.report-btn:hover {
  background-color: #c8e6c9;
}

/* Style pour le bouton de déconnexion */
.logout-btn {
  margin-top: auto;
  color: #ef4444;
}

.logout-btn:hover {
  background-color: rgba(239, 68, 68, 0.1) !important;
}

.logout-btn .nav-icon {
  color: inherit;
}
`;

// Add styles to document
const styleElement = document.createElement('style');
styleElement.innerHTML = modernProfileStyles;
document.head.appendChild(styleElement);