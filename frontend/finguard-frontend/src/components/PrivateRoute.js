import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = loading
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('finguard-token');

    // Simulate a short delay (e.g., API call or token check)
    const timer = setTimeout(() => {
      setIsAuthenticated(!!token);
      setChecking(false);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, []);

  if (checking) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        <p className="ml-3 text-gray-600 text-sm">Checking authentication...</p>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
