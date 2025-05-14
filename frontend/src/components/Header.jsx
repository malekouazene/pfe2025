import React, { useState } from "react";
import { motion } from "framer-motion";
import { FiSearch, FiArrowRight } from "react-icons/fi";
import "./Header.css";

const Header = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="modern-header">
      {/* Image de fond conservée */}
      <div className="header-bg"></div>
      
      <div className="header-content">
        <motion.h1 
          className="header-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Bienvenue sur <span className="text-highlight">Smart
          Update</span>
        </motion.h1>
        
        <motion.p 
          className="header-description"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Optimisez la gestion des connaissances internes et améliorez l'efficacité des équipes opérationnelles
        </motion.p>

        <motion.div 
          className="search-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div className="search-bar">
            <FiSearch className="search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher dans la base de connaissances..."
              className="search-input"
            />
            <motion.button 
              className="search-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Explorer <FiArrowRight className="arrow-icon" />
            </motion.button>
          </div>
          <div className="quick-searches">
            <span>Suggestions : </span>
            <button>FAQ</button>
            <button>Documentation</button>
            <button>Tutoriels</button>
          </div>
        </motion.div>
      </div>
    </header>
  );
};

export default Header;