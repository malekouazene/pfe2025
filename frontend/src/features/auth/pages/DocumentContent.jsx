import React, { useState, useEffect } from 'react';
import { 
  FaDownload, 
  FaExclamationTriangle, 
  FaFileAlt 
} from 'react-icons/fa';
import mammoth from 'mammoth';
import './DocumentContent.css';

const DocumentContent = ({ fileUrl, title, fileType }) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadFileContent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const url = `${fileUrl}${fileUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        switch(fileType) {
          case 'pdf':
            setContent(
              <iframe 
                src={url}
                title={title}
                width="100%" 
                height="500px"
                frameBorder="0"
              />
            );
            break;
            
          case 'image':
            setContent(
              <img 
                src={url}
                alt={title}
                style={{ maxWidth: '100%', maxHeight: '500px' }}
              />
            );
            break;
            
          case 'word':
            try {
              const arrayBuffer = await response.arrayBuffer();
              const result = await mammoth.extractRawText({ arrayBuffer });
              setContent(
                <div className="word-content">
                  {result.value.split('\n').map((paragraph, index) => (
                    paragraph.trim() ? <p key={index}>{paragraph}</p> : <br key={index} />
                  ))}
                </div>
              );
            } catch (e) {
              console.error("Error converting Word document:", e);
              throw new Error("Impossible de convertir le document Word");
            }
            break;
            
          default:
            setContent(
              <div className="unsupported-file">
                <FaFileAlt size={48} />
                <p>Type de fichier non supporté en prévisualisation</p>
              </div>
            );
        }
      } catch (err) {
        console.error("Erreur de chargement du document:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadFileContent();
  }, [fileUrl, fileType, title]);

  if (loading) {
    return (
      <div className="document-loading">
        <div className="spinner"></div>
        <p>Chargement du document...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="document-error">
        <FaExclamationTriangle className="error-icon" />
        <h4>Prévisualisation non disponible</h4>
        <p>{error}</p>
        <a 
          href={fileUrl}
          download
          className="download-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaDownload /> Télécharger le document
        </a>
      </div>
    );
  }

  return (
    <div className="document-content-container">
      {content}
      <div className="document-actions">
        <a 
          href={fileUrl}
          download
          className="download-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaDownload /> Télécharger le document original
        </a>
      </div>
    </div>
  );
};

export default DocumentContent;