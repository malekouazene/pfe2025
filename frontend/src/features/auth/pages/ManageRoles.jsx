import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./HomeAdmin.css";
import { FaTrashAlt } from "react-icons/fa";

const ManageRoles = () => {
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:5000/api/admin/roles");
        setRoles(response.data);
      } catch (error) {
        console.error("Erreur lors de la récupération des rôles :", error);
      }
    };

    fetchRoles();
  }, []);



  const handleDeleteRole = async (roleName) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le rôle ${roleName} ?`)) {
      return;
    }
  
    try {
      const response = await axios.delete(
        `http://127.0.0.1:5000/api/admin/delete-role/${encodeURIComponent(roleName)}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.status === 200) {
        // Rafraîchir la liste des rôles après suppression
        const refreshResponse = await axios.get("http://127.0.0.1:5000/api/admin/roles");
        setRoles(refreshResponse.data);
        alert(response.data.message);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      const errorMessage = error.response?.data?.message || error.message;
      alert(`Erreur lors de la suppression: ${errorMessage}`);
    }
  };
  

 

  return (
    <div className="devias-dashboard">
      {/* Sidebar */}
      <div className="devias-sidebar">
        <div className="sidebar-header">
        <h2>Administrateur </h2>
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
          <h1>Gestion des Rôles</h1>
          <p className="header-subtitle">Gérer les rôles et permissions du système</p>
        </header>

        <div className="devias-table-container">
          <div className="table-actions">
            <Link to="/admin/add-role" className="devias-btn">
              + Ajouter un rôle
            </Link>
          </div>
          
          <div className="devias-table-wrapper">
            <table className="devias-table">
              <thead>
                <tr>
                  <th>Nom du Rôle</th>
                  <th>ID (GID)</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role, index) => (
                  <tr key={index}>
                    <td>{role.name}</td>
                    <td>{role.gidNumber}</td>
                    <td>{role.description || '-'}</td>
                    <td className="actions-cell">
                    <button
    className="icon-btn danger"
    onClick={() => handleDeleteRole(role.name)}
    title="Supprimer"
  >
    <FaTrashAlt />
  </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageRoles;