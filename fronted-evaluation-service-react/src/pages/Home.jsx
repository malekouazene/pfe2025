import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, ListGroup, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_URL } from '../config';

const Home = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);

  useEffect(() => {
    // Charger les alertes récentes
    const fetchRecentAlerts = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/alerts`);
        // Trier par date de création (récentes en premier) et prendre les 5 premières
        const sortedAlerts = response.data
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5);
        setRecentAlerts(sortedAlerts);
      } catch (error) {
        console.error('Erreur lors du chargement des alertes', error);
        toast.error('Impossible de charger les alertes récentes');
      } finally {
        setAlertsLoading(false);
      }
    };

    fetchRecentAlerts();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setResult(response.data);
      toast.success('Document analysé avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'analyse du document', error);
      toast.error(error.response?.data?.error || 'Une erreur est survenue lors de l\'analyse du document');
    } finally {
      setLoading(false);
    }
  };

  const getAlertVariant = (status) => {
    switch (status) {
      case 'critical':
        return 'danger';
      case 'warning':
        return 'warning';
      default:
        return 'success';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'critical':
        return 'Document obsolète';
      case 'warning':
        return 'Document potentiellement obsolète';
      default:
        return 'Document à jour';
    }
  };

  return (
    <div className="row">
      <div className="col-md-8 offset-md-2">
        <Card className="mb-4">
          <Card.Header className="bg-primary text-white">
            <h2 className="mb-0">Analyser un document technique</h2>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Sélectionner un document (PDF, Markdown, TXT)</Form.Label>
                <Form.Control
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.md,.markdown,.txt"
                  required
                />
              </Form.Group>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />{' '}
                    Analyse en cours...
                  </>
                ) : (
                  'Analyser'
                )}
              </Button>
            </Form>

            {result && (
              <div className="mt-4">
                <h3>Résultat de l'analyse</h3>
                <Alert variant={getAlertVariant(result.status)}>
                  <h4>{getStatusText(result.status)}</h4>
                  <p>Score d'obsolescence: {result.score}/100</p>
                  {result.reasons && result.reasons.length > 0 && (
                    <>
                      <strong>Raisons:</strong>
                      <ul>
                        {result.reasons.map((reason, index) => (
                          <li key={index}>{reason}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </Alert>
              </div>
            )}
          </Card.Body>
        </Card>

        <Card>
          <Card.Header className="bg-info text-white">
            <h3 className="mb-0">Alertes récentes</h3>
          </Card.Header>
          <Card.Body>
            {alertsLoading ? (
              <div className="text-center">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </Spinner>
              </div>
            ) : recentAlerts.length === 0 ? (
              <p>Aucune alerte récente.</p>
            ) : (
              <ListGroup>
                {recentAlerts.map((alert) => (
                  <ListGroup.Item
                    key={alert._id}
                    variant={getAlertVariant(alert.status)}
                  >
                    <strong>Document ID:</strong> {alert.document_id}<br />
                    <strong>Score:</strong> {alert.score}<br />
                    <strong>Raisons:</strong> {alert.reasons.join(', ')}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default Home;