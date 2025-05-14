import React from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiPhone, FiMapPin, FiTwitter, FiLinkedin, FiFacebook, FiInstagram } from 'react-icons/fi';
import './footer.css';
const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: "Produit",
      links: [
        { name: "Fonctionnalités", url: "#" },
        { name: "Tarifs", url: "#" },
        { name: "Intégrations", url: "#" },
        { name: "Nouveautés", url: "#" }
      ]
    },
    {
      title: "Ressources",
      links: [
        { name: "Documentation", url: "#" },
        { name: "Centre d'aide", url: "#" },
        { name: "Blog", url: "#" },
        { name: "Webinaires", url: "#" }
      ]
    },
    {
      title: "Entreprise",
      links: [
        { name: "À propos", url: "#" },
        { name: "Carrières", url: "#" },
        { name: "Partenaires", url: "#" },
        { name: "Contact", url: "#" }
      ]
    },
    {
      title: "Légal",
      links: [
        { name: "Mentions légales", url: "#" },
        { name: "Confidentialité", url: "#" },
        { name: "CGU", url: "#" },
        { name: "RGPD", url: "#" }
      ]
    }
  ];

  const socialIcons = [
    { icon: <FiTwitter />, url: "#" },
    { icon: <FiLinkedin />, url: "#" },
    { icon: <FiFacebook />, url: "#" },
    { icon: <FiInstagram />, url: "#" }
  ];

  return (
    <footer className="modern-footer">
      <div className="footer-top">
        <div className="footer-brand">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="logo">SmartUpdate</h2>
            <p className="tagline">Révolutionnez votre gestion des connaissances</p>
            
            <div className="newsletter">
              <h4>Abonnez-vous à notre newsletter</h4>
              <div className="newsletter-input">
                <input type="email" placeholder="Votre email" />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  S'abonner
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="footer-links-grid">
          {footerLinks.map((section, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="link-section"
            >
              <h3>{section.title}</h3>
              <ul>
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <motion.a 
                      href={link.url}
                      whileHover={{ x: 5, color: "#3498db" }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {link.name}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="footer-bottom">
        <div className="contact-info">
          <div className="contact-item">
            <FiMail className="contact-icon" />
            <span>contact@SmartUpdate.com</span>
          </div>
          <div className="contact-item">
            <FiPhone className="contact-icon" />
            <span>+213 1 23 45 67 89</span>
          </div>
          <div className="contact-item">
            <FiMapPin className="contact-icon" />
            <span>Algerie</span>
          </div>
        </div>

        <div className="footer-legal">
          <p>© {currentYear}SmartUpdate. Tous droits réservés.</p>
          <div className="social-icons">
            {socialIcons.map((social, index) => (
              <motion.a
                key={index}
                href={social.url}
                whileHover={{ y: -3, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="social-icon"
              >
                {social.icon}
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};


export default Footer;
