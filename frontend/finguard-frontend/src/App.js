import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Pages & Components
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import IncomePage from './components/IncomePage';
import ExpensePage from './components/ExpensePage';
import BudgetPage from './components/BudgetPage';
import ProfilePage from './components/ProfilePage';
import Footer from './components/Footer';
import Login from './components/login';
import Register from './components/register';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        {/* Main content area */}
        <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/income" element={<IncomePage />} />
            <Route path="/expense" element={<ExpensePage />} />
            <Route path="/budget" element={<BudgetPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </main>

        {/* Global footer */}
        <footer id="footer">
          <Footer />
        </footer>
      </div>
    </Router>
  );
}

export default App;
