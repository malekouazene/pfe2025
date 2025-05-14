import React from 'react';
import { FiRefreshCw, FiUsers, FiTrendingUp } from 'react-icons/fi';
import './WhyUs.css'; // Fichier CSS à créer

const WhyUs = () => {
  return (
    <section className="why-us-modern">
      <div className="modern-container">
        <h2 className="modern-title">Pourquoi Choisir Smart
        Update ?</h2>
        <p className="modern-subtitle">
          Découvrez pourquoi SmartMobi est la solution idéale pour centraliser et diffuser les connaissances au sein de Mobilis Algérie.
        </p>
        
        <div className="modern-cards-container">
          <div className="modern-card">
            <div className="modern-icon-container">
              <FiRefreshCw className="modern-icon" />
            </div>
            <h3 className="modern-card-title">Mise à jour Continue</h3>
            <p className="modern-card-text">
              Assurez-vous que les connaissances diffusées sont toujours à jour, permettant une réactivité accrue de vos équipes.
            </p>
          </div>

          <div className="modern-card">
            <div className="modern-icon-container">
              <FiUsers className="modern-icon" />
            </div>
            <h3 className="modern-card-title">Uniformité des Réponses</h3>
            <p className="modern-card-text">
              Garantissez que toutes les équipes fournissent des réponses uniformes, quelle que soit la plateforme utilisée par le client.
            </p>
          </div>

          <div className="modern-card">
            <div className="modern-icon-container">
              <FiTrendingUp className="modern-icon" />
            </div>
            <h3 className="modern-card-title">Productivité Améliorée</h3>
            <p className="modern-card-text">
              Réduisez les erreurs, les demandes répétées et les délais de traitement grâce à une gestion simplifiée et centralisée des connaissances.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyUs;