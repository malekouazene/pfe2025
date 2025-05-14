import React, { useState } from 'react';
import { FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios';

const ReportModal = ({ isOpen, onClose, documentId, userId }) => {
  const [formData, setFormData] = useState({
    problem_type: 'error',
    severity: 'medium',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!documentId) {
      setError("ID du document manquant");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/tickets', {
        document_id: documentId,
        user_id: userId,
        problem_type: formData.problem_type,
        severity: formData.severity,
        description: formData.description
      });
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({
          problem_type: 'error',
          severity: 'medium',
          description: ''
        });
      }, 2000);
    } catch (err) {
      console.error("Erreur lors de l'envoi du ticket:", err);
      setError(
        err.response?.data?.detail || 
        "Une erreur est survenue lors de l'envoi du signalement"
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="report-modal-overlay">
      <div className="report-modal">
        <div className="report-modal-header">
          <h3>
            <FaExclamationTriangle className="report-icon" />
            Signaler un problème
          </h3>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        {success ? (
          <div className="success-message">
            <p>Signalement envoyé avec succès</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="problem_type">Type de problème</label>
              <select 
                id="problem_type" 
                name="problem_type"
                value={formData.problem_type}
                onChange={handleInputChange}
                required
              >
                <option value="error">Erreur</option>
                <option value="outdated">Contenu obsolète</option>
                <option value="misleading">Information trompeuse</option>
                <option value="other">Autre</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="severity">Sévérité</label>
              <select 
                id="severity" 
                name="severity"
                value={formData.severity}
                onChange={handleInputChange}
                required
              >
                <option value="low">Faible</option>
                <option value="medium">Moyenne</option>
                <option value="high">Élevée</option>
                <option value="critical">Critique</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea 
                id="description" 
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Décrivez le problème rencontré..."
                rows={4}
              ></textarea>
            </div>
            
            {error && (
              <div className="error-message">
                <p>{error}</p>
              </div>
            )}
            
            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-button"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button 
                type="submit" 
                className="submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Envoi en cours...' : 'Envoyer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportModal;