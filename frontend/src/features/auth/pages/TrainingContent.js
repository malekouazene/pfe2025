// src/pages/TrainingContent.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TrainingContent = () => {
  const [contentList, setContentList] = useState([]);
  const [newContent, setNewContent] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    // Récupérer les contenus de formation existants
    const fetchTrainingContent = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/api/admin/training-content');
        setContentList(response.data);
      } catch (err) {
        setError('Erreur lors du chargement des contenus de formation');
      }
    };

    fetchTrainingContent();
  }, []);

  const handleAddContent = async () => {
    try {
      const response = await axios.post('http://127.0.0.1:5000/api/admin/training-content', { content: newContent });
      setContentList([...contentList, response.data]);
      setNewContent('');
    } catch (err) {
      setError('Erreur lors de l\'ajout du contenu de formation');
    }
  };

  const handleDeleteContent = async (contentId) => {
    try {
      await axios.delete(`http://127.0.0.1:5000/api/admin/training-content/${contentId}`);
      setContentList(contentList.filter(content => content.id !== contentId));
    } catch (err) {
      setError('Erreur lors de la suppression du contenu');
    }
  };

  return (
    <div>
      <h2>Gestion des Contenus de Formation</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <ul>
        {contentList.map(content => (
          <li key={content.id}>
            {content.name}
            <button onClick={() => handleDeleteContent(content.id)}>Supprimer</button>
          </li>
        ))}
      </ul>
      <input 
        type="text" 
        value={newContent}
        onChange={(e) => setNewContent(e.target.value)}
        placeholder="Ajouter un nouveau contenu"
      />
      <button onClick={handleAddContent}>Ajouter</button>
    </div>
  );
};

export default TrainingContent;
