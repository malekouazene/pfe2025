const API_URL = 'http://localhost:8000';

export const fetchDocuments = async () => {
  const response = await fetch(`${API_URL}/documents`);
  return await response.json();
};

export const uploadDocument = async (formData) => {
  const response = await fetch(`${API_URL}/documents`, {
    method: 'POST',
    body: formData,
  });
  return await response.json();
};

export const deleteDocument = async (id) => {
  const response = await fetch(`${API_URL}/documents/${id}`, {
    method: 'DELETE',
  });
  return await response.json();
};
// Dans documentApi.js
export const getFileUrl = (filePath) => {
    // Ajoutez un / entre files et le nom du fichier
    return `http://localhost:8000/files/${filePath}`;
  };