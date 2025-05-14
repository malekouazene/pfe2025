import React from "react";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import WhyUs from "../components/WhyUs";
import Footer from "../components/Footer";
import Features from "../components/Features";
import EmployeeSupport from "../components/EmployeeSupport";
function HomePage() {
  return (
    <div>
     
      <Navbar />
      <Header />
    <main>   <WhyUs />
    </main>
        
        
    
      <Features/>
     <EmployeeSupport/>
      <Footer />
    </div>
  );
}

export default HomePage;
