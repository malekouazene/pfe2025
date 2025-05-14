import React, { useState, useEffect, useRef } from 'react';
import { FaFilePdf, FaFileImage, FaFileWord, FaFileAlt, FaDownload, FaEye, FaPlus } from 'react-icons/fa';
import './DocumentViewer.css';

const API_BASE_URL = 'http://localhost:8000/api/v1'; // Assurez-vous que cette URL correspond à votre backend

const DocumentManager = () => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const fileInputRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    author: '',
    file: null,
    tags: [],
    category: '',
    status: 'draft', // Default status
    content_type: 'application/pdf', // Default content type
  });

  // File name display state
  const [selectedFileName, setSelectedFileName] = useState('');

  // Fetch documents from API
  const fetchDocs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/documents?limit=50&skip=0`);
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Fetched documents:", data);

      // Vérifie si la clé 'documents' existe et contient un tableau
      if (Array.isArray(data.documents)) {
        setDocs(data.documents);
      } else {
        console.error("Expected an array of documents, but got:", data);
        setDocs([]);
      }
    } catch (err) {
      console.error("Error loading documents:", err);
      setDocs([]);
    } finally {
      setLoading(false);
    }
  };

  // Delete document
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      fetchDocs();
    } catch (err) {
      console.error("Error deleting document:", err);
      alert("Failed to delete document. Please try again.");
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const fileSelected = e.target.files[0];
    
    if (fileSelected) {
      setSelectedFileName(fileSelected.name);
      setFormData(prev => ({
        ...prev,
        file: fileSelected
      }));
      console.log("File selected:", fileSelected.name);
    } else {
      setSelectedFileName('');
      setFormData(prev => ({
        ...prev,
        file: null
      }));
      console.log("No file selected");
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      author: '',
      file: null,
      tags: [],
      category: '',
      status: 'draft',
      content_type: 'application/pdf',
    });
    setSelectedFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit new document
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submit triggered, form data:", formData);

    const fileSelected = formData.file || fileInputRef.current?.files?.[0];
    if (!fileSelected) {
      alert("Please select a file");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('description', formData.description || '');
    formDataToSend.append('author', formData.author);
    formDataToSend.append('file', fileSelected);
    formDataToSend.append('tags', JSON.stringify(formData.tags)); // JSON stringify les tags
    formDataToSend.append('category', formData.category || '');
    formDataToSend.append('status', formData.status || 'draft');
    formDataToSend.append('content_type', formData.content_type || 'application/pdf');
   
    sendFormData(formDataToSend);
  };

  const sendFormData = async (formDataToSend) => {
    console.log("Sending data to server...");
    try {
      const response = await fetch(`${API_BASE_URL}/documents`, {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Document created:", result);
        fetchDocs();
        setShowAddForm(false);
        resetForm();
      } else {
        const errorData = await response.json();
        if (response.status === 409) {
          alert(`Error saving document: Conflict - ${errorData.detail}`);
        } else {
          alert(`Error saving document: ${errorData.detail || response.statusText}`);
        }
      }
    } catch (err) {
      console.error("Network error creating document:", err);
      alert(`Error saving document: ${err.message}`);
    }
  };
  
  // File type helpers
  const getFileType = (fileUrl) => {
    if (!fileUrl) return 'unknown';
    const extension = fileUrl.split('.').pop().toLowerCase();
    if (extension === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) return 'image';
    if (['doc', 'docx'].includes(extension)) return 'word';
    return 'other';
  };

  const getFileIcon = (fileUrl) => {
    const type = getFileType(fileUrl);
    switch (type) {
      case 'pdf': return <FaFilePdf size={30} color="#e74c3c" />;
      case 'image': return <FaFileImage size={30} color="#3498db" />;
      case 'word': return <FaFileWord size={30} color="#2980b9" />; 
      default: return <FaFileAlt size={30} color="#95a5a6" />;
    }
  };

  const getFileUrl = (fileUrl) => {
    if (!fileUrl) return "";
    return `http://localhost:8000/files/${fileUrl.split('/').pop()}`;
  };

  // Modal handlers
  const openViewer = (doc) => {
    setSelectedDoc(doc);
    setViewerOpen(true);
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setSelectedDoc(null);
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  // Document Viewer Modal
  const DocumentViewerModal = () => {
    if (!selectedDoc) return null;

    const fileUrl = getFileUrl(selectedDoc.file_url);
    const fileType = getFileType(selectedDoc.file_url);

    return (
      <div className="document-modal-backdrop">
        <div className="document-modal">
          <div className="document-modal-header">
            <h3>{selectedDoc.title}</h3>
            <button onClick={closeViewer}>×</button>
          </div>

          <div className="document-modal-content">
            {fileType === 'pdf' && (
              <iframe 
                src={fileUrl} 
                width="100%" 
                height="500px" 
                title={selectedDoc.title}
              />
            )}

            {fileType === 'image' && (
              <img 
                src={fileUrl} 
                alt={selectedDoc.title} 
                style={{ maxWidth: '100%', maxHeight: '500px' }} 
              />
            )}

            {(fileType === 'word' || fileType === 'other') && (
              <div className="download-prompt">
                <p>This file type cannot be displayed directly.</p>
                <a 
                  href={fileUrl} 
                  download={selectedDoc.title}
                  className="download-button"
                >
                  <FaDownload /> Download file
                </a>
              </div>
            )}
          </div>

          <div className="document-modal-footer">
            <p>Author: {selectedDoc.author} | Version: {selectedDoc.version || '1.0'}</p>
            {selectedDoc.description && <p>{selectedDoc.description}</p>}
          </div>
        </div>
      </div>
    );
  };

  // Add Document Form
  const AddDocumentForm = () => {
    if (!showAddForm) return null;

    return (
      <div className="add-document-form">
        <h3>Add New Document</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title:</label>
            <input 
              type="text" 
              id="title"
              name="title" 
              value={formData.title} 
              onChange={handleInputChange} 
              required 
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description:</label>
            <textarea 
              id="description"
              name="description" 
              value={formData.description} 
              onChange={handleInputChange} 
            />
          </div>

          <div className="form-group">
            <label htmlFor="author">Author:</label>
            <input 
              type="text" 
              id="author"
              name="author" 
              value={formData.author} 
              onChange={handleInputChange} 
              required 
            />
          </div>

          <div className="form-group">
            <label htmlFor="status">Status:</label>
            <select 
              name="status" 
              id="status" 
              value={formData.status} 
              onChange={handleInputChange}
            >
              <option value="draft">Draft</option>
              <option value="in_review">In Review</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="category">Category:</label>
            <input 
              type="text" 
              id="category"
              name="category" 
              value={formData.category} 
              onChange={handleInputChange} 
            />
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags:</label>
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
            />
          </div>

          <div className="form-group">
            <label htmlFor="documentFile">Document File:</label>
            <div className="file-input-container">
              <input 
                type="file" 
                id="documentFile"
                name="documentFile"
                ref={fileInputRef}
                onChange={handleFileChange} 
                style={{ display: 'none' }} 
              />
              <label htmlFor="documentFile" className="custom-file-input">
                Choose a file
              </label>
              <span className="file-name">{selectedFileName || 'No file selected'}</span>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit">Submit</button>
            <button 
              type="button" 
              onClick={() => {
                setShowAddForm(false);
                resetForm();
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <div className="document-manager">
      <div className="header">
        <h2>Document Management</h2>
        <button 
          className="add-document-btn"
          onClick={() => setShowAddForm(true)}
        >
          <FaPlus /> Add Document
        </button>
      </div>

      <AddDocumentForm />

      {loading ? (
        <div className="loading">Loading documents...</div>
      ) : docs.length === 0 ? (
        <p className="no-docs">No documents found</p>
      ) : (
        <div className="document-grid">
          {docs.map((doc) => (
            <div key={doc.id} className="document-card">
              <div className="document-icon">
                {getFileIcon(doc.file_url)}
              </div>
              <div className="document-info">
                <h3>{doc.title}</h3>
                <p>Author: {doc.author}</p>
                <p>Version: {doc.version || '1.0'}</p>
                <p>Date: {new Date(doc.created_at).toLocaleDateString()}</p>
              </div>
              <div className="document-actions">
                <button 
                  className="view-btn"
                  onClick={() => openViewer(doc)}
                >
                  <FaEye /> View
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => handleDelete(doc.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewerOpen && <DocumentViewerModal />}
    </div>
  );
};

export default DocumentManager;


