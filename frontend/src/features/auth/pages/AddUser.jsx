import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./HomeAdmin.css";

const AddUser = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "user"
  });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/api/admin/add-user", 
        formData
      );
      
      setMessage({
        text: response.data.message,
        type: "success"
      });
      
      // Réinitialiser le formulaire après succès
      setFormData({
        username: "",
        password: "",
        firstName: "",
        lastName: "",
        role: "user"
      });
      
    } catch (error) {
      setMessage({
        text: error.response?.data?.message || "Erreur lors de l'ajout de l'utilisateur",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="devias-dashboard">
      {/* Sidebar identique */}
      <div className="devias-sidebar">
        <div className="sidebar-header">
          <h2>Admin Security</h2>
          <p>Gestion Sécurité Système</p>
        </div>
        <nav className="sidebar-nav">
          <Link to="/homeAdmin" className="nav-item">Tableau de Bord</Link>
          <Link to="/admin/manage-users" className="nav-item">Utilisateurs</Link>
          <Link to="/admin/add-user" className="nav-item active">Ajouter Utilisateur</Link>
          <Link to="/admin/roles" className="nav-item">Rôles</Link>
          <Link to="/admin/security" className="nav-item">Sécurité</Link>
          <div className="nav-divider"></div>
          <Link to="/admin/settings" className="nav-item">Paramètres</Link>
          <Link to="/logout" className="nav-item">Déconnexion</Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="devias-main">
        <header className="devias-header">
          <h1>Ajouter un Utilisateur</h1>
          <p className="header-subtitle">Créer un nouveau compte utilisateur avec les permissions appropriées</p>
        </header>

        <div className="devias-form-container">
          <form onSubmit={handleSubmit} className="devias-form">
            <div className="form-group">
              <label>Nom d'utilisateur</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Mot de passe</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Prénom</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Nom</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Rôle</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="form-select"
              >
                <option value="user">Utilisateur</option>
                <option value="admin">Administrateur</option>
                <option value="expert">Expert</option>
              </select>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="devias-btn"
                disabled={loading}
              >
                {loading ? "En cours..." : "Créer l'utilisateur"}
              </button>
              <Link to="/admin/manage-users" className="devias-btn secondary">
                Annuler
              </Link>
            </div>

            {message.text && (
              <div className={`message ${message.type}`}>
                {message.text}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddUser;