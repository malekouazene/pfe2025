

import React, { useEffect, useState } from 'react';
import { fetchEvaluations } from '../services/api';

const EvaluationTable = () => {
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchEvaluations();
      setDocuments(data);
    };
    loadData();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Résultat de l'Évaluation</h2>
      <table border="1" cellPadding="8" cellSpacing="0">
        <thead>
          <tr>
            <th>ID</th>
            <th>Score</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.doc_id}>
              <td>{doc.doc_id}</td>
              <td>{doc.score}%</td>
              <td style={{ color: doc.score >= 70 ? 'red' : 'green' }}>
                {doc.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EvaluationTable;
