import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import DiagnosticPage from './components/DiagnosticPage';
import InsurancePage from './components/InsurancePage';
import Footer from './components/Footer';
import './index.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/diagnostics" element={<DiagnosticPage />} />
          <Route path="/insurance" element={<InsurancePage />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
