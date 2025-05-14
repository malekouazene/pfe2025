import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Navbar, Nav, Container } from 'react-bootstrap';

const Navigation = () => {
  return (
    <Navbar bg="primary" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">
          Système d'évaluation d'obsolescence
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={NavLink} to="/" end>
              Accueil
            </Nav.Link>
            <Nav.Link as={NavLink} to="/documents">
              Documents
            </Nav.Link>
            <Nav.Link as={NavLink} to="/alerts">
              Alertes
            </Nav.Link>
            <Nav.Link as={NavLink} to="/settings">
              Paramètres
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;