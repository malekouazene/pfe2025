import React, { useContext } from 'react';
import { FaUserCircle, FaClipboardList, FaCommentAlt, FaExclamationTriangle, FaCog, FaSignOutAlt, FaChalkboardTeacher } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { AuthContext } from './AuthContext';

const Sidebar = ({ setShowChatbot }) => {
  const { user } = useContext(AuthContext);

  const handleLogout = () => {
    // Déconnexion de l'utilisateur
    localStorage.removeItem('token');
    window.location.href = '/login'; // Redirection
  };

  return (
    <div className="profile-sidebar">
      <div className="user-avatar-container">
        <div className="user-avatar">
          <FaUserCircle size={80} />
        </div>
        <h2>{user?.username || 'Utilisateur'}</h2>
        <p className="user-id">ID: {user?.uidNumber || 'N/A'}</p>
        <p className="user-department">{user?.department || 'Entreprise'}</p>
      </div>

      <nav className="profile-nav">
        <button className="nav-item">
          <FaClipboardList className="nav-icon" />
          <Link to="/meprocudures"><span>Base de Connaissances</span></Link>
        </button>
        <button className="nav-item">
          <FaCommentAlt className="nav-icon" />
          <span>Feedback</span>
        </button>
        <button className="nav-item" onClick={() => setShowChatbot(true)}>
          <FaExclamationTriangle className="nav-icon" />
          <span>Besoin d'aide</span>
        </button>
        <button className="nav-item">
          <FaChalkboardTeacher className="nav-icon" />
          <Link to="/formation"><span>Formation</span></Link>
        </button>
        <button className="nav-item">
          <FaCog className="nav-icon" />
          <span>Paramètres</span>
        </button>
        <button className="nav-item logout-btn" onClick={handleLogout}>
          <FaSignOutAlt className="nav-icon" />
          <span>Déconnexion</span>
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;
