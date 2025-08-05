import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import logo from '../assets/finguard.jpg';
import profilePic from '../assets/dp.png';

const AdminNavbar = () => {
  const navigate = useNavigate();

  // Handle logout functionality
  const handleLogout = () => {
    localStorage.removeItem('finguard-token');
    navigate('/');
  };

  // Generate dynamic profile picture like in main Navbar
  const generateProfilePicture = (username) => {
    if (!username) return { letter: 'A', bgColor: 'bg-purple-500' };
    
    const firstLetter = username.charAt(0).toUpperCase();
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
      'bg-orange-500', 'bg-cyan-500', 'bg-lime-500', 'bg-rose-500'
    ];
    
    // Use username length and first character to pick a consistent color
    const colorIndex = (username.length + username.charCodeAt(0)) % colors.length;
    const bgColor = colors[colorIndex];
    
    return { letter: firstLetter, bgColor };
  };

  // Get user initials for profile picture
  const getUserInitials = (username, email) => {
    if (username && username.length >= 2) {
      return username.substring(0, 2).toUpperCase();
    } else if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'AD';
  };

  // Get user data from token
  const token = localStorage.getItem('finguard-token');
  let username = 'Admin';
  let email = '';
  let role = 'Admin';

  if (token) {
    try {
      const decoded = jwtDecode(token);
      username = decoded.username || 'Admin';
      email = decoded.email || '';
      role = decoded.role || 'Admin';
    } catch (err) {
      console.error('Token decode failed:', err.message);
    }
  }

  const profilePic2 = generateProfilePicture(username);
  const initials = getUserInitials(username, email);

  return (
    <nav className="bg-white shadow-md rounded-b-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo (left-aligned) */}
          <div className="flex items-center">
            <Link to="/admin">
              <img src={logo} alt="FinGuard Logo" className="h-12 w-auto rounded-md" />
            </Link>
          </div>

          {/* Centered Title */}
          <div className="text-center w-full absolute left-0 right-0 flex justify-center pointer-events-none">
            <h1 className="text-xl font-semibold text-gray-800 pointer-events-none">
              Admin Dashboard
            </h1>
          </div>

          {/* Profile Section (right-aligned) */}
          <div className="flex items-center space-x-4">
            {/* User Info */}
            <div className="flex items-center space-x-3">
              {/* Dynamic Profile Picture */}
              <div className={`h-10 w-10 ${profilePic2.bgColor} rounded-full flex items-center justify-center text-white font-bold text-sm relative`}>
                {initials}
                {/* Admin Crown */}
                <span className="absolute -top-1 -right-1 text-xs">
                  👑
                </span>
              </div>
              
              {/* Username and Role */}
              <div className="flex flex-col">
                <span className="text-black text-sm font-medium">{username}</span>
                <span className="text-xs text-purple-600 font-medium">{role}</span>
              </div>
            </div>

            {/* Logout Button */}
            <button 
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>

            {/* Back to Dashboard Link */}
            <Link 
              to="/dashboard"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v0H8v0z" />
              </svg>
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;