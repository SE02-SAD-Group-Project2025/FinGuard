import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';


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
      <div>
        {/* Main content area */}
        <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
         <Routes>
        <Route path="/" element={<Home />} />
         <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 🔐 Protected Routes */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/income" element={<PrivateRoute><IncomePage /></PrivateRoute>} />
        <Route path="/expense" element={<PrivateRoute><ExpensePage /></PrivateRoute>} />
        <Route path="/budget" element={<PrivateRoute><BudgetPage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
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
