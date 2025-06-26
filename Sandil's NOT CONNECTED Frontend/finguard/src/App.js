import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import IncomePage from './components/IncomePage';
import Home from './components/Home';
import './App.css';

const App = () => {
  return (
    <Router>
      <div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/income" element={<IncomePage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;