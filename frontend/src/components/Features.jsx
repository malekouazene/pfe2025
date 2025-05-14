import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Features.css';
const Features = () => {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      title: "Création et mise à jour",
      description: "Un système flexible permettant de créer, mettre à jour et valider rapidement des informations stratégiques.",
      icon: "🔄"
    },
    {
      title: "Centralisation et diffusion",
      description: "Diffusion automatique des connaissances pertinentes aux équipes, réduisant les risques d'erreurs et améliorant la réactivité.",
      icon: "📡"
    },
    {
      title: "Accès multi-canaux",
      description: "Accédez à la base de connaissances sur différents supports, qu'il s'agisse des agents call center, des conseillers en agence ou des responsables produits.",
      icon: "📱"
    },
    {
      title: "Automatisation du cycle de vie",
      description: "Un processus automatisé pour valider et diffuser les connaissances, garantissant la mise à jour continue.",
      icon: "⚙️"
    }
  ];

  const nextFeature = () => {
    setActiveFeature((prev) => (prev + 1) % features.length);
  };

  const prevFeature = () => {
    setActiveFeature((prev) => (prev - 1 + features.length) % features.length);
  };

  return (
    <div className="features-container">
      <h2 className="section-title">Découvrez comment notre solution révolutionne la gestion des connaissances</h2>
      
      <div className="features-carousel">
        <button className="nav-button" onClick={prevFeature}>&larr;</button>
        
        <div className="feature-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFeature}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="feature-card"
            >
              <div className="feature-icon">{features[activeFeature].icon}</div>
              <h3>{features[activeFeature].title}</h3>
              <p>{features[activeFeature].description}</p>
            </motion.div>
          </AnimatePresence>
        </div>
        
        <button className="nav-button" onClick={nextFeature}>&rarr;</button>
      </div>
      
      <div className="feature-dots">
        {features.map((_, index) => (
          <button
            key={index}
            className={`dot ${index === activeFeature ? 'active' : ''}`}
            onClick={() => setActiveFeature(index)}
          />
        ))}
      </div>
    </div>
  );
};



export default Features;