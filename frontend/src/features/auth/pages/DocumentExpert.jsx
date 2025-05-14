import React, { useState, useEffect} from 'react';
import { 
  FaFilePdf, FaFileImage, FaFileWord, FaFileAlt, 
  FaDownload, FaEye, FaPlus, FaTrash, FaTimes,
  FaUserCircle, FaClipboardList, FaCommentAlt, 
  FaExclamationTriangle, FaBell, FaCog, FaSearch, FaStar ,FaSignOutAlt , FaBook, FaClipboardCheck ,FaChartBar
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './DocumentViewer.css';
import NotificationDropdown from './NotificationDropdown';
import { AuthContext } from './AuthContext';

import WordViewer from './WordViewer';

const API_BASE_URL = 'http://localhost:8000/api/v1';
const ANALYTICS_API_URL = 'http://localhost:8001';





 
const DocumentExpert = () => {
  const { user } = React.useContext(AuthContext);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');

 
  // État pour l'évaluation
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [userRating, setUserRating] = useState(null);
  const [submitting, setSubmitting] = useState(false); // Nouvel état pour suivre la soumission
  // Nouvel état pour stocker toutes les évaluations des documents
  const [docsRatings, setDocsRatings] = useState({});


// Dans votre composant DocumentExpert, ajoutez cet état :
const [showKnowledgeMenu, setShowKnowledgeMenu] = useState(false);
  









// Fonction pour soumettre le feedback
const submitFeedback = async (e) => {
  e.preventDefault(); 
  // Empêche le rechargement de la page
 

  if (!rating || !user || !selectedDoc) {
    console.error("Données manquantes pour soumettre le feedback");
    alert("Veuillez sélectionner une note avant de soumettre");
    return;
  }

  try {
    setSubmitting(true); // Marquer comme en cours de soumission

    const feedbackData = {
      document_id: selectedDoc.id.toString(),
      user_id: user.uidNumber.toString(),
      rating: rating,
      optional_comment: comment || null,
    };

    const response = await fetch(`${ANALYTICS_API_URL}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedbackData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Erreur lors de l'envoi de l'évaluation");
    }

    const result = await response.json();
    console.log("Feedback submitted:", result);
    
    // Mettre à jour l'état local
    setUserRating(rating);
    setFeedbackStats(prev => ({
      ...prev,
      total: (prev?.total || 0) + 1,
      average: ((prev?.average || 0) * (prev?.total || 0) + rating) / ((prev?.total || 0) + 1),
      distribution: {
        ...prev?.distribution,
        [rating]: (prev?.distribution?.[rating] || 0) + 1
      }
    }));
    
    // Mettre à jour également les ratings dans la liste des documents
    setDocsRatings(prev => ({
      ...prev,
      [selectedDoc.id]: {
        ...prev[selectedDoc.id],
        average: ((prev[selectedDoc.id]?.average || 0) * (prev[selectedDoc.id]?.total || 0) + rating) / 
                 ((prev[selectedDoc.id]?.total || 0) + 1),
        total: (prev[selectedDoc.id]?.total || 0) + 1
      }
    }));
    
    alert('Merci pour votre évaluation!');
    
  } catch (error) {
    console.error('Error submitting feedback:', error);
    alert(`Erreur: ${error.message}`);
  } finally {
    setSubmitting(false); // Réinitialiser l'état de soumission, qu'elle réussisse ou échoue
  }
};

// Réinitialiser les états d'évaluation quand on ferme la fenêtre
const resetRatingStates = () => {
  setRating(0);
  setHover(0);
  setComment('');
  setUserRating(null);
  setFeedbackStats(null);
};

// Charger les statistiques d'évaluation
const loadFeedbackStats = async () => {
  if (!selectedDoc || !user) return;
  
  try {
    // Réinitialiser les états d'évaluation avant de charger de nouvelles données
    resetRatingStates();
    
    const [statsResponse, userResponse] = await Promise.all([
      fetch(`${ANALYTICS_API_URL}/feedback/stats/${selectedDoc.id}`),
      fetch(`${ANALYTICS_API_URL}/feedback/user/${selectedDoc.id}/${user.uidNumber}`)
    ]);
    
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      setFeedbackStats(stats);
    }
    
    if (userResponse.ok) {
      const userRatingData = await userResponse.json();
      if (userRatingData && userRatingData.rating) {
        setUserRating(userRatingData.rating);
        setRating(userRatingData.rating);
        if (userRatingData.comment) {
          setComment(userRatingData.comment);
        }
      } else {
        // Pas d'évaluation existante trouvée, réinitialiser
        setUserRating(null);
        setRating(0);
      }
    } else {
      // En cas d'erreur, considérer qu'il n'y a pas d'évaluation
      setUserRating(null);
      setRating(0);
    }
  } catch (error) {
    console.error('Error loading feedback stats:', error);
    // En cas d'erreur, réinitialiser les états
    setUserRating(null);
    setRating(0);
  }
};

// Fonction pour charger toutes les évaluations des documents
const loadAllDocumentRatings = async () => {
  if (!docs.length) return;
  
  try {
    const promises = docs.map(doc => 
      fetch(`${ANALYTICS_API_URL}/feedback/stats/${doc.id}`)
        .then(res => res.ok ? res.json() : { average: 0, total: 0 })
        .then(stats => ({ id: doc.id, stats }))
        .catch(() => ({ id: doc.id, stats: { average: 0, total: 0 } }))
    );
    
    const results = await Promise.all(promises);
    
    const ratingsMap = {};
    results.forEach(result => {
      ratingsMap[result.id] = result.stats;
    });
    
    setDocsRatings(ratingsMap);
  } catch (error) {
    console.error('Error loading all document ratings:', error);
  }
};

useEffect(() => {
  if (viewerOpen && selectedDoc) {
    loadFeedbackStats();
  } else if (!viewerOpen) {
    // Réinitialiser les états quand on ferme la fenêtre
    resetRatingStates();
  }
}, [viewerOpen, selectedDoc]);

// Charger les évaluations après avoir chargé les documents
useEffect(() => {
  if (docs.length > 0 && !loading) {
    loadAllDocumentRatings();
  }
}, [docs, loading]);

  const recordDocumentAccess = async (doc, actionType) => {
 
    const accessData = {
      document_id: doc.id.toString(), // Assurez-vous que c'est une string
      user_id: user?.uidNumber?.toString() || "unknown",
      access_time: new Date().toISOString(),
      session_duration: 0,
      department: user?.department || "N/A",
      access_source: "web",
      action_type: actionType // "view" ou "download"
    };
  
    try {
      const response = await fetch('http://localhost:8001/analytics/access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(accessData)
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Détails de l'erreur:", errorData);
        throw new Error(`Erreur ${response.status}: ${JSON.stringify(errorData)}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Échec complet de la requête:", error);
      throw error;
    }
  };

  // Fetch documents avec gestion améliorée des URL
  const fetchDocs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/documents`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Assurez-vous que les URL des fichiers sont absolues
      const processedDocs = (data.documents || []).map(doc => {
        // Si l'URL est relative, la convertir en absolue
        if (doc.file_url && !doc.file_url.startsWith('http')) {
          doc.file_url = `${API_BASE_URL}/${doc.file_url.replace(/^\//, '')}`;
        }
        return doc;
      });
      
      setDocs(processedDocs);
    } catch (err) {
      console.error("Erreur lors du chargement des documents:", err);
      // Afficher un message d'erreur à l'utilisateur serait utile ici
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, []);

  // File type helpers
  const getFileType = (fileUrl) => {
    if (!fileUrl) return 'other';
    const extension = fileUrl.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) return 'image';
    if (['doc', 'docx'].includes(extension)) return 'word';
    return 'other';
  };

  const getFileIcon = (fileUrl) => {
    const type = getFileType(fileUrl);
    switch (type) {
      case 'pdf': return <FaFilePdf className="pdf-icon" />;
      case 'image': return <FaFileImage className="image-icon" />;
      case 'word': return <FaFileWord className="word-icon" />;
      default: return <FaFileAlt className="default-icon" />;
    }
  };

  // Composant pour afficher les étoiles
  const StarRating = ({ rating, total }) => {
    const fullStars = Math.round(rating || 0);
    
    return (
      <div className="document-rating">
        {[1, 2, 3, 4, 5].map(star => (
          <FaStar 
            key={star}
            className={star <= fullStars ? "star-filled" : "star-empty"} 
          />
        ))}
        <span className="rating-count">({total || 0})</span>
      </div>
    );
  };

  // Document Viewer Modal amélioré
  // Document Viewer Modal
  const DocumentViewer = () => {
    const [loadError, setLoadError] = useState(false);
  
    const renderFileContent = () => {
      if (!selectedDoc || !selectedDoc.file_url) {
        return <div className="error-message">Aucun fichier disponible</div>;
      }
  
      const type = getFileType(selectedDoc.file_url);
      
      if (type === 'pdf') {
        return (
          <iframe 
            src={selectedDoc.file_url} 
            title={selectedDoc.title}
            width="100%" 
            height="500px"
            onError={() => setLoadError(true)}
          />
        );
      } 
      else if (type === 'image') {
        return (
          <img 
            src={selectedDoc.file_url} 
            alt={selectedDoc.title} 
            onError={() => setLoadError(true)}
            style={{ maxWidth: '100%', maxHeight: '500px' }}
          />
        );
      } 
      else if (type === 'word') {
  return <WordViewer fileUrl={selectedDoc.file_url} title={selectedDoc.title} />;
}
      else {
        return (
          <div className="generic-preview">
            <p>Ce type de fichier ne peut pas être prévisualisé.</p>
            <a 
              href={selectedDoc.file_url} 
              download
              className="download-link"
            >
              <FaDownload /> Télécharger le document
            </a>
          </div>
        );
      }
    };
  
    return (
      <div className="document-viewer-modal">
        <div className="modal-content">
          <div className="modal-header">
            <h3>{selectedDoc?.title}</h3>
            <button onClick={() => setViewerOpen(false)}>
              <FaTimes />
            </button>
          </div>
          
          <div className="document-preview">
            {loadError ? (
              <div className="error-message">
                <FaExclamationTriangle size={30} />
                <p>Impossible de charger le document. Le fichier est peut-être inaccessible.</p>
                <a 
                  href={selectedDoc?.file_url} 
                  download 
                  className="download-link"
                >
                  <FaDownload /> Essayer de télécharger directement
                </a>
              </div>
            ) : (
              renderFileContent()
            )}
          </div>
          
          <div className="document-meta">
            <p><strong>Auteur:</strong> {selectedDoc?.author}</p>
            <p><strong>Date:</strong> {new Date(selectedDoc?.created_at).toLocaleDateString()}</p>
            
            {/* Section d'évaluation */}
            <div className="feedback-section">
              <h4>Évaluez ce document</h4>
              
              {feedbackStats && (
                <div className="feedback-stats">
                  <div className="average-rating">
                    <span>Note moyenne: </span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar 
                        key={star}
                        className={star <= Math.round(feedbackStats.average) ? "star-filled" : "star-empty"}
                      />
                    ))}
                    <span>({feedbackStats.average?.toFixed(1) || '0.0'})</span>
                    <span className="rating-count">{feedbackStats.total} évaluation(s)</span>
                  </div>
                  
                  <div className="rating-distribution">
                    {[5, 4, 3, 2, 1].map((star) => (
                      <div key={star} className="star-distribution">
                        <span>{star} étoiles:</span>
                        <progress 
                          value={feedbackStats.distribution?.[star] || 0} 
                          max={feedbackStats.total || 1}
                        />
                        <span>{feedbackStats.distribution?.[star] || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="star-rating">
                <p>Votre évaluation:</p>
                <div className="stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-btn ${star <= (hover || rating) ? "active" : ""}`}
                      onClick={(e) => {
                        e.preventDefault(); // Double protection
                        userRating === null && setRating(star);
                      }}
                      onMouseEnter={() => userRating === null && setHover(star)}
                      onMouseLeave={() => userRating === null && setHover(0)}
                      disabled={userRating !== null}
                      style={{ cursor: userRating !== null ? 'not-allowed' : 'pointer' }}
                    >
                      <FaStar />
                    </button>
                  ))}
                </div>
                
                {userRating && (
                  <p className="user-rating-message">
                    Vous avez déjà donné {userRating} étoile(s) à ce document.
                  </p>
                )}
                
                <form onSubmit={submitFeedback}>
                  <textarea
                    placeholder="Commentaire optionnel..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows="3"
                    disabled={userRating !== null}
                    style={{ cursor: userRating !== null ? 'not-allowed' : 'text' }}
                  />
                          
                          <button 
  type="submit"
  disabled={userRating !== null || submitting}
  className={`submit-feedback-btn ${submitting ? 'submitting' : ''} ${!rating ? 'no-rating' : ''}`}
  data-rated={userRating !== null ? "true" : "false"}
>
  {userRating 
    ? 'Évaluation envoyée' 
    : submitting 
      ? 'Envoi en cours...' 
      : rating
        ? 'Envoyer l\'évaluation'
        : 'Sélectionnez une note'}
</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  

  // Filtrer les documents basés sur le terme de recherche
  const filteredDocs = docs.filter(doc => 
    doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="modern-profile-container">
       {/* Sidebar */}
       <div className="profile-sidebar">
         <div className="user-avatar-container">
           <div className="user-avatar">
             <FaUserCircle size={80} />
           </div>
           <h2>{user?.username || 'Utilisateur'}</h2>
           {/* Afficher l'ID unique */}
           <p className="user-id">ID: {user?.uidNumber || 'N/A'}</p>
           <p className="user-department">{user?.department || 'Entreprise'}</p>
           
         </div>

        <nav className="profile-nav">
          <Link to="/homeexpert" className="nav-item">
            <FaClipboardList className="nav-icon" />
            <span>Mes Procédures</span>
          </Link>
          <div className="nav-menu-group">
  <button 
    className={`nav-item ${showKnowledgeMenu ? 'active' : ''}`}
    onClick={() => setShowKnowledgeMenu(!showKnowledgeMenu)}
  >
    <FaFileAlt className="nav-icon" />
    <span>Base des Connaissances</span>
  </button>
  
  {showKnowledgeMenu && (
    <div className="nav-submenu">
      <Link to="/documents" className="nav-subitem">
        <FaBook className="nav-subicon" />
        <span>Mes Connaissances</span>
      </Link>
      <Link to="/ajouter-connaissance" className="nav-subitem">
        <FaPlus className="nav-subicon" />
        <span>Ajouter une Connaissance</span>
      </Link>
    </div>
  )}
</div>

<button className="nav-item active">
  <FaClipboardCheck className="nav-icon" />
  <Link to="/validation" className="nav-link">
    <span>Validation</span>
  </Link>
</button>
<button className="nav-item">
  <FaChartBar className="nav-icon" />
  <Link to="/dashboard" className="nav-link">
    <span>Tableaux de bord</span>
  </Link>
</button>
                   
          <button className="nav-item">
            <FaCog className="nav-icon" />
            <span>Paramètres</span>
          </button>

           {/* Nouveau bouton de déconnexion */}
      <button 
        className="nav-item logout-btn"
        onClick={() => {
          // Ajoutez ici votre logique de déconnexion
          localStorage.removeItem('token'); // Exemple
          window.location.href = '/login'; // Redirection
        }}
      >
        <FaSignOutAlt className="nav-icon" />
        <span>Déconnexion</span>
      </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="profile-main-content">
        <header className="content-header">
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Rechercher des documents..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="header-actions">
          
              <NotificationDropdown userId={user?.uidNumber} />
        
            <button className="user-menu">
  <div style={{ position: 'relative' }}>
    <FaUserCircle size={30} />
    <span 
      style={{
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: '10px',
        height: '10px',
        backgroundColor: '#10B981', 
        borderRadius: '50%',
        border: '2px solid white' 
      }}
    />
  </div>
</button>
          </div>
        </header>

        <section className="documents-section">
          <div className="section-header">
            <h2>Gestion des Connaissances</h2>
           
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Chargement des Connaissances...</p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="empty-state">
              <p>{searchTerm ? 'Aucun document trouvé pour votre recherche' : 'Aucun document trouvé'}</p>
            </div>
          ) : (
            <div className="documents-grid">
              {filteredDocs.map((doc) => (
                <div key={doc.id} className="document-card">
                  <div className="card-header">
                    <div className="file-icon">
                      {getFileIcon(doc.file_url)}
                    </div>
                    <span className={`document-status ${doc.status === 'published' ? 'published' : 'draft'}`}>
                      {doc.status === 'published' ? 'Publié' : 'Brouillon'}
                    </span>
                  </div>
                  <div className="card-body">
                    <h3>{doc.title}</h3>
                    <p className="description">{doc.description || 'Aucune description'}</p>
                    
                    {/* Ajout de l'évaluation des documents directement sur la carte */}
                    <div className="card-rating">
                      <StarRating 
                        rating={docsRatings[doc.id]?.average || 0} 
                        total={docsRatings[doc.id]?.total || 0} 
                      />
                    </div>
                  </div>
                  <div className="card-footer">
                    <span className="document-date">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                    
                    <div className="document-actions">
                      <button 
                        className="view-btn"
                        onClick={(e) => {
                          e.preventDefault(); // Empêche le comportement par défaut
                          setSelectedDoc(doc);
                          setViewerOpen(true);
                          // Les états d'évaluation seront réinitialisés dans useEffect
                          recordDocumentAccess(doc, "view");
                        }}
                      >
                        <FaEye /> Voir
                      </button>
                      
                      <a 
                        href={doc.file_url}
                        download
                        className="download-btn"
                        onClick={() => recordDocumentAccess(doc, "download")}
                      >
                        <FaDownload /> Télécharger
                      </a>
                      
                    
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {viewerOpen && <DocumentViewer />}
     
    </div>
  );
};

export default DocumentExpert;