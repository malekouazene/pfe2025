import React, { useEffect, useState } from 'react';
import axios from 'axios';

const EvaluationDashboard = () => {
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const response = await axios.get('http://localhost:5000/evaluate');
        const enriched = response.data.map(doc => ({
          ...doc,
          summary: generateSummary(doc)
        }));
        setDocuments(enriched);
      } catch (err) {
        console.error("Erreur lors du chargement des données", err);
      }
    };

    loadDocuments();
  }, []);

  const generateSummary = (doc) => {
    const messages = [];
    if (doc.score >= 70) messages.push("⚠️ Document à réviser");
    if (doc.score >= 90) messages.push("🔥 Très obsolète, intervention urgente requise");
    if (doc.status === 'À réviser') messages.push("Présence probable de contenu déprécié");
    return messages.join(" | ");
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Tableau d'Évaluation</h1>
      <table border="1" cellPadding="10" cellSpacing="0">
        <thead>
          <tr>
            <th>ID</th>
            <th>Score</th>
            <th>Status</th>
            <th>Résumé IA</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.doc_id} style={{ backgroundColor: doc.score >= 70 ? '#ffe6e6' : '#e6ffe6' }}>
              <td>{doc.doc_id}</td>
              <td>{doc.score}%</td>
              <td style={{ color: doc.score >= 70 ? 'red' : 'green' }}>{doc.status}</td>
              <td>{doc.summary}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EvaluationDashboard;
