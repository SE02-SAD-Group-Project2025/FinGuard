import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute'; // ✅ Only import PrivateRoute
import { SubscriptionProvider } from './hooks/useSubscription';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import ToastProvider from './contexts/ToastContext';
import QuickExpenseButton from './components/QuickExpenseButton';
import sessionManagementService from './services/sessionManagementService';
import useSessionTimeout from './hooks/useSessionTimeout';
import useNetworkStatus from './hooks/useNetworkStatus';
import authStorage from './utils/authStorage';
import tokenRefreshService from './services/tokenRefreshService';
import smartNotificationService from './services/smartNotificationService';
import realTimeService from './services/realTimeService';
import OfflineIndicator from './components/OfflineIndicator';


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
import ReportsPage from './components/ReportsPage';
import LiabilitiesPage from './components/LiabilitiesPage';
import TwoFactorSetup from './components/TwoFactorSetup';
import SubscriptionPlans from './components/SubscriptionPlans';
import SubscriptionManagement from './components/SubscriptionManagement';

// Premium Components
import PremiumDashboard from './components/PremiumComponents/PremiumDashboardOptimized';
import AIBudgetPage from './components/PremiumComponents/AIBudgetPage';
import AdvanceReports from './components/PremiumComponents/AdvanceReports';
import FamilyManagement from './components/PremiumComponents/FamilyManagement';
import AcceptFamilyInvitation from './components/AcceptFamilyInvitation';

// Component to conditionally show Quick Expense Button
const ConditionalQuickExpenseButton = () => {
  const location = useLocation();
  const token = authStorage.getToken();
  
  // Show on authenticated pages, but not on auth pages
  const showButton = token && !['/login', '/register', '/'].includes(location.pathname) && !location.pathname.startsWith('/reset-password');
  
  return showButton ? <QuickExpenseButton /> : null;
};

// Router content component - this needs to be inside Router
const RouterContent = () => {
  const { isDarkMode } = useTheme();
  const { isOnline, connectionType, isSlowConnection } = useNetworkStatus();
  useSessionTimeout(); // Initialize session timeout

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      
      {/* Network Status Indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-red-500 text-white px-4 py-2 text-center text-sm font-medium z-50">
          📵 You are offline. Some features may not work properly.
        </div>
      )}
      
      {isOnline && isSlowConnection && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white px-4 py-2 text-center text-sm font-medium z-50">
          🐌 Slow connection detected ({connectionType}). Loading may be slower than usual.
        </div>
      )}
      
    {/* Main content area */}
    <main className={`flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${
      (!isOnline || isSlowConnection) ? 'pt-16' : ''
    }`}>
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
      <Route path="/reports" element={<PrivateRoute><ReportsPage /></PrivateRoute>} />
      <Route path="/liabilities" element={<PrivateRoute><LiabilitiesPage /></PrivateRoute>} />
      <Route path="/2fa-setup" element={<PrivateRoute><TwoFactorSetup /></PrivateRoute>} />
      
      {/* 💎 Subscription Management Routes */}
      <Route path="/subscription/plans" element={<PrivateRoute><SubscriptionPlans /></PrivateRoute>} />
      <Route path="/subscription/manage" element={<PrivateRoute><SubscriptionManagement /></PrivateRoute>} />

      {/* 🌟 Premium-Only Routes */}
      <Route path="/premium-dashboard" element={<PrivateRoute><PremiumDashboard /></PrivateRoute>} />
      <Route path="/ai-budget" element={<PrivateRoute><AIBudgetPage /></PrivateRoute>} />
      <Route path="/advanced-reports" element={<PrivateRoute><AdvanceReports /></PrivateRoute>} />
      
      {/* 👨‍👩‍👧‍👦 Family-Only Routes */}
      <Route path="/family-dashboard" element={<PrivateRoute><FamilyManagement /></PrivateRoute>} />
      <Route path="/family/accept-invitation/:token" element={<AcceptFamilyInvitation />} />

      {/* 🛡️ ADMIN-ONLY Protected Route */}
      <Route path="/admin/AdminDashboard" element={<PrivateRoute requireAdmin={true}><AdminDashboard /></PrivateRoute>} />
      <Route path="/transactions" element={<PrivateRoute><TransactionsPage /></PrivateRoute>} />
    </Routes>

      </main>

      {/* Quick Expense Button - shows on authenticated pages */}
      <ConditionalQuickExpenseButton />

      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* Global footer */}
      <footer id="footer">
        <Footer />
      </footer>
      </div>
  );
};

// Theme-aware main app component
const AppContent = () => {
  return (
    <SubscriptionProvider>
      <Router>
        <RouterContent />
      </Router>
    </SubscriptionProvider>
  );
};

function App() {
  // Initialize all services on app start
  React.useEffect(() => {
    sessionManagementService.initialize();
    tokenRefreshService.initialize();
    
    // Cleanup function to prevent memory leaks
    return () => {
      tokenRefreshService.destroy();
      sessionManagementService.destroy();
      smartNotificationService.destroy();
      realTimeService.destroy();
    };
  }, []);

  // Cleanup on logout events
  React.useEffect(() => {
    const handleLogout = () => {
      sessionManagementService.destroy();
      smartNotificationService.clearPeriodicChecks();
      realTimeService.clearPeriodicChecks();
    };

    window.addEventListener('finguard-logout', handleLogout);
    window.addEventListener('beforeunload', handleLogout);

    return () => {
      window.removeEventListener('finguard-logout', handleLogout);
      window.removeEventListener('beforeunload', handleLogout);
    };
  }, []);

  return (
    <ThemeProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;