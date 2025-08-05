import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute'; // ✅ Only import PrivateRoute


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
import AdminDashboard from './components/AdminDashboard';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import TransactionsPage from './components/TransactionsPage';

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

        {/* 🔐 Regular Protected Routes */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/income" element={<PrivateRoute><IncomePage /></PrivateRoute>} />
        <Route path="/expense" element={<PrivateRoute><ExpensePage /></PrivateRoute>} />
        <Route path="/budget" element={<PrivateRoute><BudgetPage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        {/* 🛡️ ADMIN-ONLY Protected Route */}
        <Route path="/admin/AdminDashboard" element={<PrivateRoute requireAdmin={true}><AdminDashboard /></PrivateRoute>} />
        <Route path="/transactions" element={<PrivateRoute><TransactionsPage /></PrivateRoute>} />
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