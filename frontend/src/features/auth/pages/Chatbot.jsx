import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaTimes, FaRobot } from 'react-icons/fa';
import './Chatbot.css'

const Chatbot = ({ onClose }) => {
  const [messages, setMessages] = useState([
    { text: "Bonjour ! Comment puis-je vous aider aujourd'hui ?", sender: 'bot' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Ajouter le message de l'utilisateur
    const userMessage = { text: inputValue, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    try {
      // Utiliser POST au lieu de GET
      const response = await fetch('http://localhost:8007/api/chat/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: inputValue })
      });
      
      const data = await response.json();

      const botMessage = { text: data.response, sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Erreur API:", error);
      const errorMessage = { text: "Désolé, je n'ai pas pu obtenir de réponse. Veuillez réessayer.", sender: 'bot' };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <div className="chatbot-title">
          <FaRobot className="chatbot-icon" />
          <h3>Assistant Virtuel</h3>
        </div>
        <button className="chatbot-close-btn" onClick={onClose}>
          <FaTimes />
        </button>
      </div>
      
      <div className="chatbot-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender}`}>
            {message.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chatbot-input">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Tapez votre message..."
        />
        <button onClick={handleSendMessage}>
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
};

export default Chatbot;