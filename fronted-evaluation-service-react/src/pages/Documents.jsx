import React, { useState, useEffect } from 'react';
import { Table, Form, InputGroup, Button, Spinner, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_URL } from '../config';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/documents`);
      setDocuments(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des documents', error);
      toast.error('Impossible de charger la liste des documents');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'critical':
        return <Badge bg="danger">Critique</Badge>;
      case 'warning':
        return <Badge bg="warning" text="dark">Avertissement</Badge>;
      default:
        return <Badge bg="success">À jour</Badge>;
    }
  };

  // Filtrer les documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.filename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.obsolescence_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <h1>Documents analysés</h1>
      
      <div className="row mb-3">
        <div className="col-md-8">
          <InputGroup>
          
          <Form.Control
              type="text"
              placeholder="Rechercher par nom de document"
              value={searchTerm}
              onChange={handleSearch}
            />
          </InputGroup>
        </div>

        <div className="col-md-4">
          <Form.Select value={statusFilter} onChange={handleStatusFilter}>
            <option value="all">Tous les statuts</option>
            <option value="critical">Critique</option>
            <option value="warning">Avertissement</option>
            <option value="ok">À jour</option>
          </Form.Select>
        </div>
      </div>

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" role="status" />
          <div>Chargement des documents...</div>
        </div>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Date de dernière modification</th>
              <th>Statut</th>
              <th>Score d'obsolescence</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocuments.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center">
                  Aucun document trouvé.
                </td>
              </tr>
            ) : (
              filteredDocuments.map((doc) => (
                <tr key={doc._id}>
                  <td>{doc.filename}</td>
                  <td>{new Date(doc.last_modified).toLocaleDateString()}</td>
                  <td>{getStatusBadge(doc.obsolescence_status)}</td>
                  <td>{doc.obsolescence_score}%</td>
                  <td>
                    <Link to={`/documents/${doc._id}`} className="btn btn-sm btn-primary">
                      Voir détails
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      )}
    </div>
  );
};

export default Documents;
