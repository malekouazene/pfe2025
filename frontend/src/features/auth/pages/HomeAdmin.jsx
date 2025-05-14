import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./HomeAdmin.css";

const HomeAdmin = () => {
  // État pour le dark mode
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  // Données de sécurité
  const [securityStats, setSecurityStats] = useState({
    users: 0, // Initialisé à 0, sera mis à jour depuis l'API
    alerts: 0,
    restrictedAccess: 0,
    backups: 7,
    failedLogins: 3,
    activeSessions: 18
  });

  // Alertes récentes
  const [recentActivities, ] = useState([
    { type: 'success', message: 'Nouveau rôle créé : "Administrateur Sécurité"', time: 'Il y a 15 minutes' },
    { type: 'warning', message: 'Tentative de connexion non autorisée détectée', time: 'Il y a 2 heures' },
    { type: 'update', message: 'Mise à jour des règles de sécurité', time: 'Il y a 5 heures' },
    { type: 'alert', message: 'Nouvel utilisateur avec privilèges élevés détecté', time: 'Il y a 8 heures' }
  ]);

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

  // Récupérer le nombre réel d'utilisateurs depuis l'API
  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        // Appel à l'API pour récupérer la liste des utilisateurs
        const response = await fetch('http://localhost:5000/api/admin/users', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Si vous avez une authentification, ajoutez le token ici
            // 'Authorization': `Bearer ${votre_token}`
          }
        });

        if (response.ok) {
          const users = await response.json();
          // Mettre à jour le nombre d'utilisateurs avec la longueur du tableau retourné
          setSecurityStats(prev => ({
            ...prev,
            users: users.length
          }));
        } else {
          console.error('Erreur lors de la récupération des utilisateurs');
        }
      } catch (error) {
        console.error('Erreur réseau:', error);
      }
    };

    // Appeler la fonction au chargement du composant
    fetchUserCount();

    // Simuler la mise à jour des autres stats
    const interval = setInterval(() => {
      setSecurityStats(prev => ({
        ...prev,
        alerts: prev.alerts + (Math.random() > 0.7 ? 1 : 0),
        activeSessions: Math.max(5, prev.activeSessions + Math.floor(Math.random() * 3 - 1))
      }));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const lockSystem = () => {
    alert('Système verrouillé - Seuls les administrateurs peuvent accéder aux fonctionnalités critiques');
    // Ici vous ajouteriez la logique réelle
  };

  return (
    <div className="devias-dashboard">
      {/* Sidebar */}
      <div className="devias-sidebar">
        <div className="sidebar-header">
          <h2>Administrateur Sécurité</h2>
          <p>Gestion Système</p>
        </div>
        <nav className="sidebar-nav">
          <Link to="/homeAdmin" className="nav-item active">Tableau de Bord</Link>
          <Link to="/admin/manage-users" className="nav-item">Utilisateurs</Link>
          <Link to="/admin/roles" className="nav-item">Rôles</Link>
          <Link to="/admin/security" className="nav-item">Sécurité</Link>
          <Link to="/admin/training" className="nav-item">Formations</Link>
          <div className="nav-divider"></div>
          <button 
            onClick={toggleDarkMode} 
            className="nav-item mode-toggle"
          >
            {darkMode ? '☀️ Mode Clair' : '🌙 Mode Sombre'}
          </button>
          <Link to="/admin/settings" className="nav-item">Paramètres</Link>
          <Link to="/login" className="nav-item">Déconnexion</Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="devias-main">
        <header className="devias-header">
          <div className="header-top">
            <div>
              <h1>Tableau de Bord Sécurité</h1>
              <p className="header-subtitle">Gestion des accès et sécurité du système</p>
            </div>
            <div className="header-actions">
              <button 
                onClick={lockSystem}
                className="devias-btn danger small"
              >
                🔒 Verrouiller
              </button>
              <div className="live-indicator">
                <span className="pulse"></span> Surveillance active
              </div>
            </div>
          </div>
        </header>

        {/* Statistiques */}
        <div className="devias-stats">
          <div className="stat-card security">
            <div className="stat-icon">👥</div>
            <div className="stat-title">UTILISATEURS</div>
            <div className="stat-value">{securityStats.users}</div>
            <div className="stat-change positive">
              <span>↑ {securityStats.users > 0 ? Math.round(securityStats.users * 0.08) : 0}%</span> ce mois-ci
            </div>
          </div>

          <div className="stat-card security">
            <div className="stat-icon">🚨</div>
            <div className="stat-title">ALERTES</div>
            <div className="stat-value">{securityStats.alerts}</div>
            <div className="stat-change negative">
              <span>↑ {securityStats.failedLogins}</span> aujourd'hui
            </div>
          </div>

          <div className="stat-card security">
            <div className="stat-icon">⛔</div>
            <div className="stat-title">ACCÈS RESTREINTS</div>
            <div className="stat-value">{securityStats.restrictedAccess}</div>
            <div className="progress-container">
              <div className="progress-bar" style={{ width: '28%' }}></div>
            </div>
          </div>

          <div className="stat-card security">
            <div className="stat-icon">💾</div>
            <div className="stat-title">SAUVEGARDES</div>
            <div className="stat-value">{securityStats.backups}/7</div>
            <div className="stat-change positive">
              <span>Toutes à jour</span>
            </div>
          </div>
        </div>

        {/* Activité Récente */}
        <div className="devias-chart security">
          <div className="chart-header">
            <h2>
              <span className="blinking">•</span> Activité Récente
            </h2>
            <button className="devias-btn small">Voir tout</button>
          </div>
          <div className="activity-list">
            {recentActivities.map((activity, index) => (
              <div key={index} className={`activity-item ${activity.type}`}>
                <div className={`activity-icon ${activity.type}`}>
                  {activity.type === 'success' ? '✓' : 
                   activity.type === 'warning' ? '!' :
                   activity.type === 'alert' ? '🚨' : '↻'}
                </div>
                <div className="activity-content">
                  <p>{activity.message}</p>
                  <span className="activity-time">{activity.time}</span>
                </div>
                <button className="devias-btn small secondary">
                  Détails
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Sections de Gestion */}
        <div className="devias-management">
          <div className="management-card security">
            <div className="card-icon">🔐</div>
            <h3>Contrôle des Accès</h3>
            <p className="card-description">
              Gérer les permissions et politiques d'accès au système
            </p>
            <div className="card-actions">
              <Link to="/admin/access-control" className="devias-btn">
                Configurer
              </Link>
              <Link to="/admin/access-log" className="devias-btn secondary">
                Journal
              </Link>
            </div>
          </div>

          <div className="management-card security">
            <div className="card-icon">🛡️</div>
            <h3>Protection des Données</h3>
            <p className="card-description">
              Chiffrement, sauvegardes et intégrité des données
            </p>
            <div className="card-actions">
              <Link to="/admin/data-protection" className="devias-btn">
                Protéger
              </Link>
              <Link to="/admin/backup" className="devias-btn secondary">
                Sauvegardes
              </Link>
            </div>
          </div>

          <div className="management-card security">
            <div className="card-icon">👁️</div>
            <h3>Surveillance</h3>
            <p className="card-description">
              Surveillance en temps réel et détection des anomalies
            </p>
            <div className="card-actions">
              <Link to="/admin/monitoring" className="devias-btn">
                Surveiller
              </Link>
              <Link to="/admin/audit" className="devias-btn secondary">
                Audit
              </Link>
            </div>
          </div>

       {/* Contenus de Formation */}
       <div className="management-card">
            <div className="card-icon">📚</div>
            <h3>Formations</h3>
            <p className="card-description">Superviser et mettre à jour les contenus de formation accessibles aux utilisateurs</p>
            <div className="card-actions">
              <Link to="/admin/training" className="devias-btn">Gérer</Link>
              <Link to="/admin/training/add" className="devias-btn secondary">Ajouter</Link>
            </div>
          </div>

          {/* Gestion Utilisateurs */}
          <div className="management-card">
            <div className="card-icon">👥</div>
            <h3>Gestion des Utilisateurs</h3>
            <p className="card-description">Ajouter, modifier ou supprimer des utilisateurs et définir leurs rôles et permissions</p>
            <div className="card-actions">
              <Link to="/admin/manage-users" className="devias-btn">Gérer</Link>
              <Link to="/admin/users/add" className="devias-btn secondary">Ajouter</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeAdmin;