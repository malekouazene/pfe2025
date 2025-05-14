import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import './Navbar.css';
const Navbar = () => {
  const [scrolling, setScrolling] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolling(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: "Accueil", path: "#" },
    { label: "Communauté", path: "#" },
    { label: "Ressources", path: "#" },
    { label: "FAQ", path: "#" },
    { label: "Contact", path: "#" }
  ];

  return (
    <nav className={`navbar-modern ${scrolling ? "scrolled" : ""}`}>
      <div className="navbar-container">
        {/* Logo avec animation */}
        <motion.a 
          className="navbar-brand"
          href="#"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="logo-gradient">Smart</span>
          <span className="logo-solid">Update</span>
        </motion.a>

        {/* Menu desktop */}
        <ul className="nav-links">
          {navItems.map((item, index) => (
            <li 
              key={index}
              onMouseEnter={() => setHoveredItem(index)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <a href={item.path}>
                {item.label}
                {hoveredItem === index && (
                  <motion.span 
                    className="underline"
                    layoutId="underline"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  />
                )}
              </a>
            </li>
          ))}
        </ul>

        {/* Boutons */}
        <div className="auth-buttons">
          <motion.button
            className="signup-btn"
            onClick={() => navigate("/login")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Se connecter
          </motion.button>
          
        </div>

        {/* Menu mobile */}
        <button 
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>

        {/* Menu mobile overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              className="mobile-menu"
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", damping: 25 }}
            >
              <ul>
                {navItems.map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <a href={item.path} onClick={() => setMobileMenuOpen(false)}>
                      {item.label}
                    </a>
                  </motion.li>
                ))}
                <div className="mobile-auth-buttons">
                  <button onClick={() => navigate("/login")}>Se connecter</button>
                  <button onClick={() => navigate("/signup")}>S'inscrire</button>
                </div>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;