import React, { useState,useContext  } from "react";
import { FaEnvelope, FaEye, FaEyeSlash, FaArrowRight } from "react-icons/fa";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import './LoginPage.css';
import { AuthContext } from './AuthContext';

const LoginPage = () => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Map LDAP group names to application roles
 
  // Mapping des rôles LDAP vers les pages de l'application
  const roleMapping = {
    'admin': '/homeAdmin',
    'user': '/homeuser',
    'expert': '/homeexpert',
  };

  const handleLogin = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: email, // Using email as username for LDAP
          password: password,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccessMessage("Connexion réussie !");
        
        // Store user role in local storage for persistent authentication
        localStorage.setItem('userRole', data.role);

        localStorage.setItem('userData', JSON.stringify({
          username: data.user.username,
          uidNumber: data.user.uidNumber,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          role: data.user.role
        }));
        
          // Stocker le token ET les données utilisateur
          localStorage.setItem('token', data.token); // Si vous avez un token
          login(data.user); // Stocke les données utilisateur dans le contexte
        // Get the redirect path based on LDAP group name
        const redirectPath = roleMapping[data.user.role.toLowerCase()] || '/home';
        
        console.log(`User authenticated with role: ${data.role}, redirecting to: ${redirectPath}`);
        
        // Redirect after short delay
        setTimeout(() => {
          navigate(redirectPath);
        }, 1000);
      } else {
        setErrorMessage(data.message || "Identifiants incorrects");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("Erreur de connexion au serveur");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modern-login-container">
      <div className="login-background"></div>
      
      <motion.div 
        className="modern-login-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="login-header">
          <h1>Bienvenue sur <span>Smart
          Update</span></h1>
          <p>Connectez-vous pour accéder à votre espace</p>
        </div>

        {errorMessage && (
          <motion.div 
            className="error-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {errorMessage}
          </motion.div>
        )}

        {successMessage && (
          <motion.div 
            className="success-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {successMessage}
          </motion.div>
        )}

        <div className="input-field">
          <label>Email</label>
          <div className="input-container">
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              placeholder="exemple@.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="input-field">
          <label>Mot de passe</label>
          <div className="input-container">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Votre mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="toggle-password"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <div className="forgot-password">
          <Link to="/forgot-password">Mot de passe oublié ?</Link>
        </div>

        <motion.button
          onClick={handleLogin}
          className="login-button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="loading-spinner"></span>
          ) : (
            <>
              Connexion <FaArrowRight className="arrow-icon" />
            </>
          )}
        </motion.button>

        

      
      </motion.div>
    </div>
  );
};

export default LoginPage;

