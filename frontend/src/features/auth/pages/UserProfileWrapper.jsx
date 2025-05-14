import React, { useState, useEffect } from 'react';
import ModernUserProfile from './ModernUserProfile';
import axios from 'axios';

const UserProfileWrapper = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Récupérer le token depuis le stockage local
        const token = localStorage.getItem('token');
        
        // Faire une requête pour obtenir les données utilisateur
        const response = await axios.get('/api/auth/user', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setUser(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des données utilisateur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return <div>Chargement...</div>;
  }

  return <ModernUserProfile user={user} />;
};

export default UserProfileWrapper;