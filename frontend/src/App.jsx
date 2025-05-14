import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"; // ✅ Import du Router
import Navbar from "./components/Navbar";
import Header from "./components/Header";
import Footer from "./components/Footer"; // Correction de la casse
import "bootstrap/dist/css/bootstrap.min.css";
import LoginPage from "./features/auth/pages/LoginPage";
import WhyUs from "./components/WhyUs";
import HomePage from "./pages/HomePage";
import HomeAdmin from "./features/auth/pages/HomeAdmin";

import HomeExpert from "./features/auth/pages/homeExpert";
import ManageUsers from "./features/auth/pages/ManageUsers";
import AddUser from "./features/auth/pages/AddUser";
import ManageRoles from "./features/auth/pages/ManageRoles";
import AddRole from "./features/auth/pages/AddRole";
import SecurityLDAP from "./features/auth/pages/SecurityLDAP";
import HomeUser from "./features/auth/pages/HomeUser";
import Documentusers from "./features/auth/pages/Docuementusers";

import { AuthProvider } from './features/auth/pages/AuthContext';

import DocumentExpert from "./features/auth/pages/DocumentExpert";
import AjouterConnaissances from "./features/auth/pages/ajouterConnaissances";
import FormationUser from "./features/auth/pages/FormationUser";
import AddTrainingForm from "./features/auth/pages/AddTrainingForm";
function App() {
  return (
    <AuthProvider>
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} /> {/* ✅ Route pour la HomePage */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/homeAdmin" element={<HomeAdmin/>} />
        <Route path="/homeexpert" element={<HomeExpert/>} />
    
        <Route path="/admin/manage-users" element={<ManageUsers />} />
        <Route path="/admin/add-user" element={<AddUser />} />
        <Route path="/admin/roles" element={<ManageRoles/>} />
        <Route path="/admin/add-role" element={<AddRole/>} />
        <Route path="/admin/security" element={<SecurityLDAP/>} />
        <Route path="/homeuser" element={<HomeUser/>} />
        <Route path="/meprocudures" element={<Documentusers/>} />

        <Route path="/documents" element={<DocumentExpert/>}/>
        <Route path="/ajouter-connaissance" element={<AjouterConnaissances/>}/>
        <Route path="/formation" element={<FormationUser/>}/>
        <Route path="/admin/training" element={<AddTrainingForm/>}/>
  
      </Routes>
    </Router>
    </AuthProvider>
  );

}


export default App;
