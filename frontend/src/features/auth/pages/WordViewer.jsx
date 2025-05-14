import React, { useState, useEffect } from 'react';
import * as mammoth from 'mammoth';
import { 
  FaDownload, FaExclamationTriangle, FaSync, 
  FaEye, FaEyeSlash, FaFileWord, FaSpinner 
} from 'react-icons/fa';

const WordViewer = ({ fileUrl, title }) => {
  const [htmlContent, setHtmlContent] = useState('');
  const [rawTextContent, setRawTextContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('formatted');
  const [fallbackMode, setFallbackMode] = useState(null);
  const [googleViewerLoaded, setGoogleViewerLoaded] = useState(false);
  const [conversionStats, setConversionStats] = useState(null);

  useEffect(() => {
    const fetchAndConvertDocument = async () => {
      if (!fileUrl) {
        setError("URL du document non fournie");
        setLoading(false);
        return;
      }

      const startTime = performance.now();
      setLoading(true);
      setError(null);
      setFallbackMode(null);
      setHtmlContent('');
      setRawTextContent('');
      setGoogleViewerLoaded(false);

      try {
        // Fetch the document with appropriate headers and response type
        const response = await fetch(fileUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/octet-stream',
            'Cache-Control': 'no-cache'
          },
          cache: 'no-store'
        });
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        
        // Check if we got a valid buffer
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
          throw new Error("Le fichier téléchargé est vide ou corrompu");
        }
        
        // Try to convert the document
        try {
          // Configuration spécifique pour les fichiers .doc/.docx
          const options = {
            includeEmbeddedStyleMap: true,
            includeDefaultStyleMap: true,
            styleMap: [
              "p[style-name='Heading 1'] => h1:fresh",
              "p[style-name='Heading 2'] => h2:fresh",
              "p[style-name='Heading 3'] => h3:fresh",
              "r[style-name='Strong'] => strong",
              "r[style-name='Emphasis'] => em",
              "p[style-name='Normal'] => p"
            ],
            transformDocument: mammoth.transforms.paragraph(function(paragraph) {
              // Ajout d'une transformation pour traiter correctement les paragraphes vides
              return paragraph;
            })
          };

          // Conversion parallèle pour le texte brut et HTML
          const [textResult, htmlResult] = await Promise.all([
            mammoth.extractRawText({ arrayBuffer }),
            mammoth.convertToHtml({ arrayBuffer }, options)
          ]);
          
          // Vérification des résultats
          if (!textResult || !htmlResult) {
            throw new Error("Échec de la conversion: Résultat vide");
          }
          
          setRawTextContent(textResult.value || "");
          setHtmlContent(htmlResult.value || "");
          
          // Set conversion stats
          const endTime = performance.now();
          setConversionStats({
            timeMs: Math.round(endTime - startTime),
            warnings: [...(textResult.messages || []), ...(htmlResult.messages || [])]
              .filter(msg => msg.type === 'warning')
              .length
          });
          
        } catch (conversionError) {
          console.error('Conversion failed:', conversionError);
          
          // Log détaillé de l'erreur
          if (conversionError.stack) {
            console.error('Stack trace:', conversionError.stack);
          }
          
          // Vérification spécifique pour l'erreur de zip
          if (conversionError.message && conversionError.message.includes("central directory")) {
            // Basculer immédiatement vers Google Viewer pour les erreurs de zip
            throw new Error("Le format du document n'est pas compatible avec la conversion native");
          } else {
            throw new Error("La conversion du document a échoué: " + conversionError.message);
          }
        }
      } catch (error) {
        console.error('Document processing error:', error);
        setError(error.message);
        setFallbackMode('google');
      } finally {
        setLoading(false);
      }
    };

    fetchAndConvertDocument();
  }, [fileUrl]);

  // Google Viewer handlers
  const handleGoogleViewerLoad = () => setGoogleViewerLoaded(true);
  const handleGoogleViewerError = () => setFallbackMode('download-only');

  // Retry native conversion
  const retryNativeConversion = () => {
    setLoading(true);
    setFallbackMode(null);
    setError(null);
    
    // Force re-fetch avec un timestamp pour éviter le cache
    const refreshedUrl = fileUrl.includes('?') 
      ? `${fileUrl}&_t=${Date.now()}` 
      : `${fileUrl}?_t=${Date.now()}`;
      
    // Réinitialiser les états
    setHtmlContent('');
    setRawTextContent('');
    
    // Déclenchement d'un nouveau chargement
    setTimeout(() => {
      window.location.href = `#refresh-document-${Date.now()}`;
      window.location.href = `#document-viewer`;
      window.dispatchEvent(new Event('documentRefresh'));
    }, 100);
  };

  // Toggle view mode
  const toggleViewMode = () => {
    setViewMode(viewMode === 'formatted' ? 'raw' : 'formatted');
  };

  // LOADING STATE
  if (loading) {
    return (
      <div className="word-viewer-container">
        <div className="loading-word">
          <FaSpinner className="spinner" />
          <p>Conversion du document Word en cours...</p>
        </div>
      </div>
    );
  }

  // GOOGLE VIEWER FALLBACK
  if (fallbackMode === 'google') {
    return (
      <div className="word-viewer-container">
        <div className="google-viewer-fallback">
          <div className="google-viewer-header">
            <h4>Prévisualisation avec Google Docs Viewer</h4>
            <div className="viewer-note">
              <FaExclamationTriangle />
              <p>La prévisualisation native a échoué. Affichage avec Google Docs Viewer.</p>
            </div>
          </div>
          
          <div className="google-viewer-content">
            {!googleViewerLoaded && (
              <div className="google-viewer-loading">
                <FaSpinner className="spinner" />
                <p>Chargement du visualiseur Google...</p>
              </div>
            )}
            
            <iframe
              src={`https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`}
              title={`Google Docs Viewer - ${title || 'Document'}`}
              width="100%"
              height="500px"
              frameBorder="0"
              onLoad={handleGoogleViewerLoad}
              onError={handleGoogleViewerError}
            />
            
            <div className="word-actions">
              <button onClick={retryNativeConversion} className="try-google-viewer">
                <FaSync /> Réessayer la conversion native
              </button>
              
              <a href={fileUrl} download className="download-link">
                <FaDownload /> Télécharger l'original
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // DOWNLOAD-ONLY FALLBACK
  if (fallbackMode === 'download-only') {
    return (
      <div className="word-viewer-container">
        <div className="error-word">
          <FaExclamationTriangle size={36} />
          <h3>Impossible d'afficher ce document</h3>
          <p>La prévisualisation n'est pas disponible pour ce fichier.</p>
          
          <div className="error-actions">
            <button onClick={retryNativeConversion} className="try-google-viewer">
              <FaSync /> Réessayer la conversion
            </button>
            
            <a href={fileUrl} download className="download-link">
              <FaDownload /> Télécharger pour ouvrir localement
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ERROR STATE
  if (error) {
    return (
      <div className="word-viewer-container">
        <div className="error-word">
          <FaExclamationTriangle size={36} />
          <p>{error}</p>
          
          <div className="error-actions">
            <button onClick={() => setFallbackMode('google')} className="try-google-viewer">
              <FaEye /> Essayer avec Google Docs Viewer
            </button>
            
            <a href={fileUrl} download className="download-link">
              <FaDownload /> Télécharger l'original
            </a>
          </div>
        </div>
      </div>
    );
  }

  // SUCCESSFUL CONVERSION
  return (
    <div className="word-viewer-container">
      <div className="word-preview">
        <div className="word-header">
          <h3>
            <FaFileWord style={{ marginRight: '8px' }} />
            {title || 'Document Word'}
          </h3>
          
          <button onClick={toggleViewMode} className="view-toggle">
            {viewMode === 'formatted' ? (
              <>
                <FaEyeSlash size={14} /> Texte brut
              </>
            ) : (
              <>
                <FaEye size={14} /> Affichage formaté
              </>
            )}
          </button>
        </div>
        
        <div className="word-content">
          {viewMode === 'formatted' ? (
            <div dangerouslySetInnerHTML={{ __html: htmlContent || '<p>Aucun contenu formaté disponible</p>' }} />
          ) : (
            <div className="raw-text-content">
              {rawTextContent ? 
                rawTextContent.split('\n').map((paragraph, i) => (
                  <p key={i}>{paragraph || '\u00A0'}</p>
                )) :
                <p>Aucun contenu texte disponible</p>
              }
            </div>
          )}
          
          {conversionStats && (
            <div className="conversion-stats">
              <small>Converti en {conversionStats.timeMs}ms • {conversionStats.warnings} avertissement(s)</small>
            </div>
          )}
        </div>
        
        <div className="word-actions">
          <a href={fileUrl} download className="download-link">
            <FaDownload /> Télécharger le document original
          </a>
        </div>
      </div>
    </div>
  );
};

export default WordViewer;