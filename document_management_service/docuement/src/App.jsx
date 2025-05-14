import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DocumentsPage from './pages/DocumentsPage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DocumentsPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
      </Routes>
    </Router>
  );
}

export default App;