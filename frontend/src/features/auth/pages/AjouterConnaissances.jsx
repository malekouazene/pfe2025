import React, { useState, useRef, useContext } from 'react';

import { motion } from 'framer-motion';
import { AuthContext } from './AuthContext';
import './AjouterConnaissances.css';
import { 
    FaFilePdf, FaFileImage, FaFileWord, FaFileAlt, FaSpinner, FaPlus, FaUpload,
    FaUserCircle, FaClipboardCheck, FaChartBar, FaCommentAlt, FaBell, FaCog,
    FaSearch, FaSignOutAlt, FaBook, FaClipboardList
  } from 'react-icons/fa';
  import { Link } from 'react-router-dom';
const API_BASE_URL = 'http://localhost:8000/api/v1';

const AjouterConnaissances = () => {
  const { user } = useContext(AuthContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const fileInputRef = useRef(null);
  const [showKnowledgeMenu, setShowKnowledgeMenu] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    author: user?.username || '',
    file: null,
    tags: [],
    category: '',
    status: 'published',
    version: 'v1.0',
    change_description: 'Création initiale du document',
    changes: [],
    user_id: user?.uidNumber || ''
  });


const checkTitleExists = async (title) => {
  try {
    console.log("Vérification du titre:", title); // Debug
    const response = await fetch(`${API_BASE_URL}/documents/exists?title=${encodeURIComponent(title)}&user_id=${user?.uidNumber}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log("Réponse du serveur:", response); // Debug
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erreur serveur:", errorData); // Debug
      throw new Error("Erreur lors de la vérification du titre");
    }
    
    const data = await response.json();
    console.log("Données reçues:", data); // Debug
    return data.exists; // Le backend doit retourner {exists: true/false}
  } catch (err) {
    console.error("Erreur de vérification du titre:", err);
    return false;
  }
};



  const [selectedFileName, setSelectedFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) {
      handleFileChange({ target: { files: e.dataTransfer.files } });
    }
  };

  const handleFileChange = (e) => {
    const fileSelected = e.target.files[0];
    setError(null);

    if (fileSelected) {
      if (fileSelected.size > 10 * 1024 * 1024) {
        setError("Fichier trop volumineux (max 10MB)");
        return;
      }
      
      const allowedTypes = [
        'application/pdf', 
        'image/jpeg', 
        'image/png', 
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ];
      
      if (!allowedTypes.includes(fileSelected.type)) {
        setError("Formats acceptés : PDF, JPEG, PNG, Word, Excel, PowerPoint, TXT");
        return;
      }

      setSelectedFileName(fileSelected.name);
      setFormData(prev => ({
        ...prev,
        file: fileSelected
      }));
    }
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setError(null);
  setSuccess(null);
  setIsSubmitting(true);

  if (!formData.file) {
    setError("Veuillez sélectionner un fichier");
    setIsSubmitting(false);
    return;
  }

  if (!formData.title.trim()) {
    setError("Veuillez saisir un titre");
    setIsSubmitting(false);
    return;
  }

  try {
    // Vérification du titre
    console.log("Début de la vérification du titre..."); // Debug
    const titleExists = await checkTitleExists(formData.title);
    console.log("Le titre existe déjà?", titleExists); // Debug

    if (titleExists) {
      throw new Error("Un document avec ce titre existe déjà pour votre compte");
    }

    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('description', formData.description || '');
    formDataToSend.append('author', formData.author);
    formDataToSend.append('file', formData.file);
    formDataToSend.append('tags', JSON.stringify(formData.tags.filter(tag => tag !== '')));
    formDataToSend.append('category', formData.category || '');
    formDataToSend.append('status', formData.status);
    formDataToSend.append('version', formData.version);
    formDataToSend.append('change_description', formData.change_description);
    formDataToSend.append('changes', JSON.stringify(formData.changes));
    formDataToSend.append('user_id', user?.uidNumber);

    try {
      const response = await fetch(`${API_BASE_URL}/documents`, {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Erreur lors de l'enregistrement");
      }

      await response.json(); // Nous n'avons pas besoin du résultat pour l'instant
      setSuccess("Document enregistré avec succès !");
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }

  } catch (err) {
    // This is the outer catch block for handling errors that may happen outside of the inner try block
    setError(err.message);
    setIsSubmitting(false);
  }
};

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      author: user?.username || '',
      file: null,
      tags: [],
      category: '',
      status: 'published',
      version: 'v1.0',
      change_description: 'Création initiale du document',
      changes: [],
      user_id: user?.uidNumber || ''
    });
    setSelectedFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = () => {
    if (!formData.file) return <FaFileAlt />;
    
    const type = formData.file.type;
    if (type === 'application/pdf') return <FaFilePdf />;
    if (type.includes('image/')) return <FaFileImage />;
    if (type.includes('word') || type.includes('document')) return <FaFileWord />;
    
    return <FaFileAlt />;
  };

  return (
   
        <div className="modern-profile-container">
          {/* Sidebar identique à ModernExpertProfile */}
          <div className="profile-sidebar">
            <div className="user-avatar-container">
              <div className="user-avatar">
                <FaUserCircle size={80} />
              </div>
              <h2>{user?.username || 'Expert'}</h2>
              <p className="user-id">ID: {user?.uidNumber || 'N/A'}</p>
              <p className="user-department">Expert en Connaissances</p>
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
                  <span>Connaissances</span>
                </button>
                
                {showKnowledgeMenu && (
                  <div className="nav-submenu">
                    <Link to="/documents" className="nav-subitem">
                      <FaBook className="nav-subicon" />
                      <span>Mes Connaissances</span>
                    </Link>
                    <Link to="/ajouter-connaissance" className="nav-subitem ">
                      <FaPlus className="nav-subicon active" />
                      <span>Ajouter une Connaissance</span>
                    </Link>
                  </div>
                )}
              </div>
              
              <Link to="/validation" className="nav-item">
                <FaClipboardCheck className="nav-icon" />
                <span>Validation</span>
              </Link>
              
              <Link to="/dashboard" className="nav-item">
                <FaChartBar className="nav-icon" />
                <span>Tableaux de bord</span>
              </Link>
              
              <Link to="/annotations" className="nav-item">
                <FaCommentAlt className="nav-icon" />
                <span>Annotations</span>
              </Link>
              
              <button className="nav-item">
                <FaCog className="nav-icon" />
                <span>Paramètres</span>
              </button>
              
              <button 
                className="nav-item logout-btn"
                onClick={() => {
                  localStorage.removeItem('token');
                  window.location.href = '/login';
                }}
              >
                <FaSignOutAlt className="nav-icon" />
                <span>Déconnexion</span>
              </button>
            </nav>
          </div>
    
          {/* Main Content - votre formulaire existant */}
          <div className="profile-main-content">
            {/* Header */}
        
    

    <motion.div 
      className="form-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="form-card"
        whileHover={{ scale: 1.01 }}
      >
        <div className="form-header">
          <h2 className="form-title">
            <FaPlus /> Ajouter une Nouvelle Connaissance
          </h2>
          <p className="form-description">
            Partagez votre expertise ! Ajoutez des documents, guides, procédures ou 
            tout type de connaissance utile à l'équipe. Formats acceptés : PDF, Word, 
            Excel, images, et plus encore.
          </p>
        </div>
        
        {error && (
          <motion.div 
            className="alert error"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p>{error}</p>
          </motion.div>
        )}
        
        {success && (
          <motion.div 
            className="alert success"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p>{success}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
<div className="form-group">
  <label htmlFor="title">Titre*</label>
  <input
    type="text"
    id="title"
    name="title"
    value={formData.title}
    onChange={handleInputChange} // Utilisez handleInputChange au lieu de handleTitleChange
    required
    placeholder="Titre du document"
  />
  {error && error.includes("existe déjà") && (
    <div className="title-error" style={{color: 'red', marginTop: '5px'}}>
      {error}
    </div>
  )}
</div>

            <div className="form-group">
              <label htmlFor="author">Auteur*</label>
              <input
                type="text"
                id="author"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                required
                placeholder="Auteur du document"
              />
            </div>

            <div className="form-group">
              <label htmlFor="version">Version*</label>
              <input
                type="text"
                id="version"
                name="version"
                value={formData.version}
                onChange={handleInputChange}
                required
                placeholder="ex: v1.0"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="status">Statut*</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
              >
                <option value="published">Publié</option>
                <option value="draft">Brouillon</option>
                <option value="in_review">En revue</option>
                <option value="archived">Archivé</option>
              </select>
            </div>

            <div className="form-group span-2">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Description détaillée du document"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Catégorie</label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                placeholder="Catégorie du document"
              />
            </div>

            <div className="form-group">
              <label htmlFor="tags">Mots-clés (séparés par des virgules)</label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags.join(', ')}
                onChange={(e) => {
                  const tagsArray = e.target.value.split(',').map(tag => tag.trim());
                  setFormData(prev => ({
                    ...prev,
                    tags: tagsArray
                  }));
                }}
                placeholder="mot-clé1, mot-clé2, mot-clé3"
              />
            </div>

            <div className="form-group span-2">
              <label htmlFor="change_description">Description des modifications*</label>
              <input
                type="text"
                id="change_description"
                name="change_description"
                value={formData.change_description}
                onChange={handleInputChange}
                required
                placeholder="Décrivez les modifications apportées"
              />
            </div>

            <div className="form-group span-2">
              <label htmlFor="documentFile">Fichier du document*</label>
              <div 
                className={`file-upload ${isDragging ? 'dragging' : ''}`}
                onDragEnter={handleDragEnter}
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="documentFile"
                  name="documentFile"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  required
                />
                <div className="file-upload-ui">
                  <div className="file-icon">
                    {getFileIcon()}
                  </div>
                  <div className="file-info">
                    <p className="file-name">
                      {selectedFileName || 'Aucun fichier sélectionné'}
                    </p>
                    <p className="file-hint">
                      Glissez-déposez un fichier ou <span>parcourir</span>
                    </p>
                    <p className="file-types">
                      PDF, Word, Excel, PPT, JPG, PNG, TXT (max 10MB)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <motion.div 
            className="form-actions"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <button
              type="submit"
              className="submit-btn"
                disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="spinner" />
                  En cours...
                </>
              ) : (
                <>
                  <FaUpload /> Enregistrer le Document
                </>
              )}
            </button>
          </motion.div>
        </form>
      </motion.div>
    </motion.div>

    </div>
    </div>
  );
};

export default AjouterConnaissances;