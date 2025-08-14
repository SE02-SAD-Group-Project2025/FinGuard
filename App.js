import React, { useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import IncomePage from './components/IncomePage';
import Home from './components/Home';
import ExpensePage from './components/ExpensePage';
import BudgetPage from './components/BudgetPage';
import ProfilePage from './components/ProfilePage';
import Footer from './components/Footer';
import AdminDashboard from './components/AdminDashboard'; 
import PremiumDashboard from './components/PremiumComponents/PremiumDashboard';
import AdvancedReports from './components/PremiumComponents/AdvanceReports';
import AIBudgetPage from './components/PremiumComponents/AIBudgetPage';
import './App.css';

const App = () => {
  const footerRef = useRef(null);

  
  const scrollToFooter = () => {
    footerRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Router>
      <div>
        <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/income" element={<IncomePage />} />
            <Route path="/expense" element={<ExpensePage />} />
            <Route path="/budget" element={<BudgetPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/premiumDashboard" element={<PremiumDashboard/>}/>
            <Route path="/advancedReports" element={<AdvancedReports/>}/>
            <Route path="/aiBudget" element={<AIBudgetPage/>}/>

          </Routes>
        </main>

        <footer id="footer">
          <Footer />
        </footer>

      </div>
    </Router>
  );
};

export default App;
