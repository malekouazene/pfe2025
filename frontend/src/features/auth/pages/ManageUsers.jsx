import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FiTrash2, FiSearch, FiPlus, FiX, FiUser, FiMail, FiKey } from "react-icons/fi";
import "./manageusers.css";

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:5000/api/admin/users");
        setUsers(response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);
  const filteredUsers = users.filter(user => {
    const username = user?.username?.toString().toLowerCase() || '';
    const email = user?.email?.toString().toLowerCase() || '';
    const roles = user?.roles?.join(" ").toLowerCase() || '';
    const searchTermLower = searchTerm.toLowerCase();
    
    return (
      username.includes(searchTermLower) ||
      email.includes(searchTermLower) ||
      roles.includes(searchTermLower)
    );
  })

  const handleDelete = async (username) => {
    if (window.confirm(`Delete user ${username}?`)) {
      try {
        await axios.delete(`http://127.0.0.1:5000/api/admin/delete-user/${encodeURIComponent(username)}`);
        setUsers(users.filter(u => u.username !== username));
      } catch (error) {
        console.error("Delete error:", error);
      }
    }
  };

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <div className="admin-sidebar">
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
      <div className="admin-content">
        <header className="content-header">
        <h1>Gestion des Utilisateurs</h1>
        
        </header>

        <div className="content-card">
          <div className="toolbar">
            <div className="search-wrapper">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="    Rechercher utilisateurs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="clear-btn">
                  <FiX />
                </button>
              )}
            </div>
            <Link to="/admin/add-user" className="primary-btn">
              <FiPlus />Ajouter un utilisateur
            </Link>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="table-container">
              {filteredUsers.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th><FiUser />Nom d'utilisateur</th>
                  
                      <th><FiKey />Rôle(s)</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.username}>
                        <td>{user.username}</td>
                       
                        <td>
                          <div className="roles-badge">
                            {user.roles?.join(", ") || 'Aucun rôle'}
                          </div>
                        </td>
                        <td>
                          <button 
                            onClick={() => handleDelete(user.username)}
                            className="icon-btn danger"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                 {searchTerm ? "Aucun résultat trouvé" : "Aucun utilisateur disponible"}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageUsers;