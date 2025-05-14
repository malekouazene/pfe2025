import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./HomeAdmin.css";

const AddRole = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    gidNumber: ""
  });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/api/admin/add-role",
        formData
      );
      
      setMessage({
        text: response.data.message,
        type: "success"
      });
      
      // Réinitialiser le formulaire
      setFormData({
        name: "",
        description: "",
        gidNumber: ""
      });

    } catch (error) {
      setMessage({
        text: error.response?.data?.message || "Erreur lors de la création du rôle",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="devias-dashboard">
      {/* Sidebar */}
      <div className="devias-sidebar">
        <div className="sidebar-header">
          <h2>Admin Security</h2>
          <p>Gestion Sécurité Système</p>
        </div>
        <nav className="sidebar-nav">
          <Link to="/homeAdmin" className="nav-item">Tableau de Bord</Link>
          <Link to="/admin/manage-users" className="nav-item">Utilisateurs</Link>
          <Link to="/admin/roles" className="nav-item active">Rôles</Link>
          <Link to="/admin/security" className="nav-item">Sécurité</Link>
          <Link to="/admin/training" className="nav-item">Formations</Link>
          <div className="nav-divider"></div>
          <Link to="/admin/settings" className="nav-item">Paramètres</Link>
          <Link to="/logout" className="nav-item">Déconnexion</Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="devias-main">
        <header className="devias-header">
          <h1>Ajouter un Rôle</h1>
          <p className="header-subtitle">Créer un nouveau groupe Posix</p>
        </header>

        <div className="devias-form-container">
          <form onSubmit={handleSubmit} className="devias-form">
            <div className="form-group">
              <label>Nom du rôle (cn)</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="ex: admin, users, etc."
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-input"
                rows="3"
                placeholder="Description du rôle"
              />
            </div>

            <div className="form-group">
              <label>GID Number (optionnel)</label>
              <input
                type="number"
                name="gidNumber"
                value={formData.gidNumber}
                onChange={handleChange}
                className="form-input"
                placeholder="Laisser vide pour auto-générer"
                min="500"
              />
              <p className="form-hint">
                GID doit être unique. Si non spécifié, le prochain disponible sera utilisé.
              </p>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="devias-btn"
                disabled={loading}
              >
                {loading ? "Création en cours..." : "Créer le Rôle"}
              </button>
              <Link to="/admin/roles" className="devias-btn secondary">
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

export default AddRole;