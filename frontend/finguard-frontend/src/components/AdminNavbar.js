import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/finguard.jpg';
import profilePic from '../assets/dp.png';

const AdminNavbar = () => {
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

          {/* Profile (right-aligned) */}
          <div className="flex items-center space-x-2">
            <img src={profilePic} alt="Admin Profile" className="h-10 w-10 rounded-full" />
            <span className="text-black text-sm font-medium">Admin</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
