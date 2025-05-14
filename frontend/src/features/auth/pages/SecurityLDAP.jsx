import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./HomeAdmin.css";

const SecurityLDAP = () => {
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  // Appliquer le dark mode
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      document.documentElement.setAttribute('data-theme', 'light');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className="devias-dashboard">
      {/* Sidebar identique */}
      <div className="devias-sidebar">
        <div className="sidebar-header">
          <h2>Administrateur Sécurité</h2>
          <p>Gestion Système</p>
        </div>
        <nav className="sidebar-nav">
          <Link to="/homeAdmin" className="nav-item">Tableau de Bord</Link>
          <Link to="/admin/manage-users" className="nav-item">Utilisateurs</Link>
          <Link to="/admin/roles" className="nav-item">Rôles</Link>
          <Link to="/admin/security" className="nav-item active">Sécurité</Link>
          <Link to="/admin/training" className="nav-item">Formations</Link>
          <div className="nav-divider"></div>
          <button 
            onClick={toggleDarkMode} 
            className="nav-item mode-toggle"
          >
            {darkMode ? '☀️ Mode Clair' : '🌙 Mode Sombre'}
          </button>
          <Link to="/admin/settings" className="nav-item">Paramètres</Link>
          <Link to="/logout" className="nav-item">Déconnexion</Link>
        </nav>
      </div>

      {/* Contenu principal adapté */}
      <div className="devias-main">
        <header className="devias-header">
          <h1>Configuration LDAP</h1>
          <p className="header-subtitle">Gestion de l'authentification centralisée</p>
        </header>

        {/* Statistiques LDAP */}
        <div className="devias-stats">
          <div className="stat-card security">
            <div className="stat-icon">🔗</div>
            <div className="stat-title">CONNEXION LDAP</div>
            <div className="stat-value">Active</div>
            <div className="stat-change positive">
              <span>↑ Dernière sync: 5 min</span>
            </div>
          </div>

          <div className="stat-card security">
            <div className="stat-icon">👥</div>
            <div className="stat-title">UTILISATEURS SYNC</div>
            <div className="stat-value">4</div>
            <div className="progress-container">
              <div className="progress-bar" style={{ width: '100%' }}></div>
            </div>
          </div>

          <div className="stat-card security">
            <div className="stat-icon">🔄</div>
            <div className="stat-title">FREQUENCE</div>
            <div className="stat-value">24h</div>
            <div className="stat-change">
              <span>Prochaine sync: 18:30</span>
            </div>
          </div>

          <div className="stat-card security">
            <div className="stat-icon">⏱️</div>
            <div className="stat-title">TEMPS MOYEN</div>
            <div className="stat-value">1.2s</div>
            <div className="stat-change positive">
              <span>Performance stable</span>
            </div>
          </div>
        </div>

        {/* Configuration LDAP */}
        <div className="devias-chart security">
          <div className="chart-header">
            <h2>Paramètres LDAP</h2>
          
          </div>
          
          <div className="ldap-config">
            <div className="ldap-config-item">
              <label>Serveur LDAP</label>
              <div className="ldap-config-value">ldap://127.0.0.1</div>
            </div>
            <div className="ldap-config-item">
              <label>Port</label>
              <div className="ldap-config-value">389</div>
            </div>
            <div className="ldap-config-item">
              <label>Base DN</label>
              <div className="ldap-config-value">dc=mobilis,dc=dz</div>
            </div>
            <div className="ldap-config-item">
              <label>Utilisateur de service</label>
              <div className="ldap-config-value">cn=admin,dc=mobilis,dc=dz</div>
            </div>
          </div>
        </div>

        {/* Documentation LDAP */}
        <div className="devias-management">
          <div className="management-card security">
            <div className="card-icon">📚</div>
            <h3>Documentation LDAP</h3>
            <p className="card-description">
              Fonctionnement de l'intégration LDAP avec votre système
            </p>
            <div className="card-actions">
              <button className="devias-btn">
                Voir la documentation
              </button>
            </div>
            
            <div className="ldap-doc-content">
              <h4>Workflow d'authentification :</h4>
              <ol className="ldap-steps">
                <li>L'utilisateur saisit ses identifiants</li>
                <li>Le système interroge le serveur LDAP</li>
                <li>Vérification des credentials</li>
                <li>Récupération des groupes et permissions</li>
                <li>Création de la session locale</li>
              </ol>
              
              <h4>Avantages :</h4>
              <ul className="ldap-benefits">
                <li>Authentification centralisée</li>
                <li>Gestion des permissions unifiée</li>
                <li>Synchronisation automatique des comptes</li>
                <li>Audit complet des accès</li>
              </ul>
            </div>
          </div>

          <div className="management-card security">
            <div className="card-icon">⚙️</div>
            <h3>Configuration avancée</h3>
            <p className="card-description">
              Options techniques pour l'intégration LDAP
            </p>
            <div className="card-actions">
              <button className="devias-btn">
                Modifier la config
              </button>
              <button className="devias-btn secondary">
                Exporter la config
              </button>
            </div>
            
            <div className="advanced-config">
              <div className="config-section">
                <label>Filtre de recherche</label>
                <code>(objectClass=user)</code>
              </div>
              <div className="config-section">
                <label>Attributs mappés</label>
                <pre>{`{
  "username": "sAMAccountName",
  "email": "mail",
  "name": "displayName"
}`}</pre>
              </div>
            </div>
          </div>

          <div className="management-card security">
            <div className="card-icon">📊</div>
            <h3>Statistiques</h3>
            <p className="card-description">
              Performances et utilisation du service LDAP
            </p>
            <div className="card-actions">
              <button className="devias-btn">
                Actualiser
              </button>
            </div>
            
            <div className="ldap-stats">
              <div className="stat-row">
                <span>Requêtes aujourd'hui</span>
                <span>1,248</span>
              </div>
              <div className="stat-row">
                <span>Temps moyen</span>
                <span>1.2s</span>
              </div>
              <div className="stat-row">
                <span>Dernière erreur</span>
                <span>Il y a 3 jours</span>
              </div>
              <div className="stat-row">
                <span>Utilisateurs actifs</span>
                <span>187</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityLDAP;