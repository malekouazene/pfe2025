import React ,{ useContext ,useState} from 'react';
import { 
  FaUserCircle, 
  FaClipboardList, 
  FaCommentAlt, 
  FaExclamationTriangle, 
  FaBell, 
  FaCog,
  FaSearch,
  FaChartLine,
  FaFileDownload,FaSignOutAlt ,FaChalkboardTeacher
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import ReportModal from './ReportModal';
import { AuthContext } from "./AuthContext";
import Chatbot from './Chatbot'; 
import FormationUser from './FormationUser';
const ModernUserProfile = ( ) => {


  const { user } = useContext(AuthContext);
  
  const [showChatbot, setShowChatbot] = useState(false);


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
          <h2>{user?.username || 'Utilisateur'}</h2>
                 {/* Afficher l'ID unique */}
                 <p className="user-id">ID: {user?.uidNumber || 'N/A'}</p>
          <p className="user-department">{user?.department || 'Entreprise'}</p>
        
           
        </div>

        <nav className="profile-nav">
          <button className="nav-item active">
            <FaClipboardList className="nav-icon" />
          <Link to="/meprocudures"> <span>Base de Connaissances</span></Link> 
          </button>
          <button className="nav-item">
            <FaCommentAlt className="nav-icon" />
            <span>Feedback</span>
          </button>
          <button  className="nav-item" 
           onClick={() => setShowChatbot(true)}>
 

 
  <FaExclamationTriangle className="nav-icon" />
  <span>Besoin d'aide</span>
</button>
       <button 
  className="nav-item"

>
  <FaChalkboardTeacher className="nav-icon" />
<Link to="/formation"> <span>Formation</span></Link> 
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
            <button className="notification-btn">
              <FaBell size={20} />
              <span className="notification-badge">2</span>
            </button>
                      <button className="user-menu">
             <div style={{ position: 'relative' }}>
               <FaUserCircle size={30} />
               <span 
                 style={{
                   position: 'absolute',
                   bottom: 0,
                   right: 0,
                   width: '10px',
                   height: '10px',
                   backgroundColor: '#10B981', 
                   borderRadius: '50%',
                   border: '2px solid white' 
                 }}
               />
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
                <FaFileDownload size={18} />
                <span>Consulter les Connaissances</span>
              </button>
              <button className="action-btn">
                <FaCommentAlt size={18} />
                <span>Soumettre feedback</span>
              </button>
              <button className="action-btn">
                <FaExclamationTriangle size={18} />
                <span>Signaler problème</span>
              </button>
            </div>
          </div>

          <div className="widget tasks-progress">
            <h3>Avancement des Tâches</h3>
            <div className="progress-container">
              <div className="progress-bar" style={{ width: '60%' }}></div>
              <span>3/5 complétés</span>
            </div>
            <ul className="task-list">
              <li className="task-item completed">
                <span>• Photo conflit tarif</span>
              </li>
              <li className="task-item completed">
                <span>• Demande de sortie</span>
              </li>
              <li className="task-item completed">
                <span>• Documentation procédure</span>
              </li>
              <li className="task-item">
                <span>• Rapport mensuel</span>
              </li>
           
            </ul>
          </div>
        </div>

        {/* Procedures Section */}
        <section className="procedures-section">
          <div className="section-header">
            <h2>Mes Procédures</h2>
            <div className="section-filters">
              <select>
                <option>Toutes</option>
                <option>En cours</option>
                <option>Complétées</option>
                <option>Signalées</option>
              </select>
            </div>
          </div>

            {/* Chatbot Modal */}
      {showChatbot && (
        <div className="chatbot-modal">
          <Chatbot onClose={() => setShowChatbot(false)} /> {/* Fermer le chatbot */}
        </div>
      )}

 

          <div className="procedures-grid">
            {/* Procedure Card 1 */}
            <div className="procedure-card">
              <div className="card-header">
                <span className="procedure-id">PROC-2023-001</span>
                <span className="procedure-status completed">Complétée</span>
              </div>
              <h3 className="procedure-title">Conflit de tarif photographique</h3>
              <p className="procedure-desc">Documentation du conflit avec le nouveau tarif départemental</p>
              <div className="card-footer">
                <span className="procedure-date">15 Juillet 2023</span>
                <button className="feedback-btn">
                  <FaCommentAlt size={14} />
                  <span>Feedback</span>
                </button>
              </div>
            </div>

            {/* Procedure Card 2 */}
            <div className="procedure-card">
              <div className="card-header">
                <span className="procedure-id">PROC-2023-002</span>
                <span className="procedure-status in-progress">En cours</span>
              </div>
              <h3 className="procedure-title">Demande de sortie professionnelle</h3>
              <p className="procedure-desc">Autorisation pour participation au salon média international</p>
              <div className="card-footer">
                <span className="procedure-date">28 Février 2023</span>
                <button className="report-btn">
                  <FaExclamationTriangle size={14} />
                  <span>Signaler</span>
                </button>
              </div>
            </div>

            {/* Procedure Card 3 */}
            <div className="procedure-card">
              <div className="card-header">
                <span className="procedure-id">PROC-2023-003</span>
                <span className="procedure-status pending">En attente</span>
              </div>
              <h3 className="procedure-title">Documentation départementale</h3>
              <p className="procedure-desc">Mise à jour des procédures internes du département</p>
              <div className="card-footer">
                <span className="procedure-date">10 Mars 2023</span>
                <button className="feedback-btn">
                  <FaCommentAlt size={14} />
                  <span>Feedback</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ModernUserProfile;

// CSS Styles
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

.procedure-status.completed {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.procedure-status.in-progress {
  background-color: #fff3e0;
  color: #e65100;
}

.procedure-status.pending {
  background-color: #e3f2fd;
  color: #1565c0;
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
  background-color: #ffebee;
  color: #c62828;
}

.report-btn:hover {
  background-color: #ffcdd2;
}



/* Style pour le bouton de déconnexion */
.logout-btn {
  margin-top: auto; /* Place le bouton en bas */
  color: #ef4444; /* Rouge pour indiquer une action critique */
}

.logout-btn:hover {
  background-color: rgba(239, 68, 68, 0.1) !important;
}

.logout-btn .nav-icon {
  color: inherit; /* Hérite la couleur rouge */
}
`;

// Add styles to document
const styleElement = document.createElement('style');
styleElement.innerHTML = modernProfileStyles;
document.head.appendChild(styleElement);
