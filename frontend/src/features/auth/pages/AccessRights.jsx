// src/pages/AccessRights.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AccessRights = () => {
  const [accessRules, setAccessRules] = useState([]);
  const [newRule, setNewRule] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    // Récupérer les règles d'accès existantes
    const fetchAccessRules = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/api/admin/access-rules');
        setAccessRules(response.data);
      } catch (err) {
        setError('Erreur lors du chargement des règles d\'accès');
      }
    };

    fetchAccessRules();
  }, []);

  const handleAddRule = async () => {
    try {
      const response = await axios.post('http://127.0.0.1:5000/api/admin/access-rules', { rule: newRule });
      setAccessRules([...accessRules, response.data]);
      setNewRule('');
    } catch (err) {
      setError('Erreur lors de l\'ajout de la règle');
    }
  };

  const handleDeleteRule = async (ruleId) => {
    try {
      await axios.delete(`http://127.0.0.1:5000/api/admin/access-rules/${ruleId}`);
      setAccessRules(accessRules.filter(rule => rule.id !== ruleId));
    } catch (err) {
      setError('Erreur lors de la suppression de la règle');
    }
  };

  return (
    <div>
      <h2>Gestion des Droits d'Accès</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <ul>
        {accessRules.map(rule => (
          <li key={rule.id}>
            {rule.name}
            <button onClick={() => handleDeleteRule(rule.id)}>Supprimer</button>
          </li>
        ))}
      </ul>
      <input 
        type="text" 
        value={newRule}
        onChange={(e) => setNewRule(e.target.value)}
        placeholder="Ajouter une nouvelle règle"
      />
      <button onClick={handleAddRule}>Ajouter</button>
    </div>
  );
};

export default AccessRights;
