import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './EmployeeSupport.css';
const EmployeeSupport = () => {
  const [activeTab, setActiveTab] = useState('formation');

  const supportItems = {
    formation: [
      {
        title: "Formation Initiale Complète",
        description: "Programme d'onboarding complet pour maîtriser toutes les fonctionnalités de SmartMobi dès le premier jour.",
        icon: "🎓"
      },
      {
        title: "Modules d'Apprentissage Progressif",
        description: "Parcours modulaires adaptés à chaque rôle dans l'entreprise pour une montée en compétence efficace.",
        icon: "📚"
      },
      {
        title: "Ateliers Pratiques",
        description: "Sessions interactives avec des cas concrets pour appliquer les connaissances dans un environnement sécurisé.",
        icon: "🛠️"
      }
    ],
    soutien: [
      {
        title: "Support Expert Dédié",
        description: "Une équipe de spécialistes disponible pour répondre à toutes vos questions en temps réel.",
        icon: "🦸"
      },
      {
        title: "Base de Connaissances Interactive",
        description: "Accès à des tutoriels, FAQ et guides pas-à-pas constamment mis à jour.",
        icon: "💡"
      },
      {
        title: "Communauté d'Entraide",
        description: "Plateforme collaborative où les employés peuvent partager bonnes pratiques et astuces.",
        icon: "🤝"
      }
    ],
    evaluation: [
      {
        title: "Suivi des Compétences",
        description: "Tableau de bord personnalisé pour visualiser sa progression et ses points à améliorer.",
        icon: "📊"
      },
      {
        title: "Certifications",
        description: "Validation des acquis avec des certifications reconnues par l'entreprise.",
        icon: "🏆"
      },
      {
        title: "Feedback Continu",
        description: "Mécanismes d'évaluation régulière pour adapter le programme aux besoins réels.",
        icon: "🔄"
      }
    ]
  };

  return (
    <div className="support-container">
      <h2 className="section-title">Formation et Soutien pour une Maîtrise Parfaite</h2>
      <p className="section-subtitle">Nous accompagnons nos équipes à chaque étape pour une utilisation optimale de SmartMobi</p>
      
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'formation' ? 'active' : ''}`}
          onClick={() => setActiveTab('formation')}
        >
          Formation
        </button>
        <button 
          className={`tab ${activeTab === 'soutien' ? 'active' : ''}`}
          onClick={() => setActiveTab('soutien')}
        >
          Soutien Continu
        </button>
        <button 
          className={`tab ${activeTab === 'evaluation' ? 'active' : ''}`}
          onClick={() => setActiveTab('evaluation')}
        >
          Évaluation
        </button>
      </div>
      
      <div className="support-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="features-grid"
          >
            {supportItems[activeTab].map((item, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -5, boxShadow: "0 15px 30px rgba(0,0,0,0.1)" }}
                className="feature-card"
              >
                <div className="card-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <motion.div 
                  className="underline"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};




export default EmployeeSupport;