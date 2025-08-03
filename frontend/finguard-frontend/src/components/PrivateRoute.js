import React from 'react';
import { Navigate } from 'react-router-dom';

// Decode JWT token to get user information
const getTokenPayload = () => {
  const token = localStorage.getItem('finguard-token');
  if (!token) return null;
  
  try {
    // Decode JWT payload (middle part of token)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

const PrivateRoute = ({ children, requireAdmin = false }) => {
  const tokenPayload = getTokenPayload();
  
  // Check if user is logged in
  if (!tokenPayload) {
    console.log('No valid token found, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  // Check token expiration
  const currentTime = Date.now() / 1000;
  if (tokenPayload.exp < currentTime) {
    console.log('Token expired, redirecting to login');
    localStorage.removeItem('finguard-token');
    return <Navigate to="/login" replace />;
  }
  
  // If admin access is required, check user role
  if (requireAdmin) {
    console.log('Admin access required. User role:', tokenPayload.role);
    
    if (tokenPayload.role !== 'Admin') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              Administrator privileges are required to access this page.
            </p>
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-600">
                <strong>Current User:</strong> {tokenPayload.username || tokenPayload.email}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Current Role:</strong> {tokenPayload.role || 'User'}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Required Role:</strong> Admin
              </p>
            </div>
            <div className="space-y-3">
              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </button>
              <button 
                onClick={() => {
                  localStorage.removeItem('finguard-token');
                  window.location.href = '/login';
                }}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
              >
                Logout & Login as Admin
              </button>
            </div>
          </div>
        </div>
      );
    }
  }
  
  console.log('Access granted for user:', tokenPayload.username || tokenPayload.email);
  return children;
};

export default PrivateRoute;