import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const AdminSummaryCards = ({ userCount = 0, logCount = 0, adminCount = 0, issueCount = 0 }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
      {/* Total Users */}
      <div className={`${isDarkMode ? 'bg-green-900 bg-opacity-50' : 'bg-green-100'} rounded-lg p-5 shadow-sm text-center`}>
        <div className="text-2xl mb-2">👥</div>
        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} font-medium`}>Total Users</p>
        <p className={`text-xl font-bold ${isDarkMode ? 'text-green-300' : 'text-gray-900'}`}>{userCount}</p>
      </div>

      {/* System Logs */}
      <div className={`${isDarkMode ? 'bg-red-900 bg-opacity-50' : 'bg-red-100'} rounded-lg p-5 shadow-sm text-center`}>
        <div className="text-2xl mb-2">📜</div>
        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} font-medium`}>System Logs</p>
        <p className={`text-xl font-bold ${isDarkMode ? 'text-red-300' : 'text-gray-900'}`}>{logCount}</p>
      </div>

      {/* Active Admins */}
      <div className={`${isDarkMode ? 'bg-blue-900 bg-opacity-50' : 'bg-blue-100'} rounded-lg p-5 shadow-sm text-center`}>
        <div className="text-2xl mb-2">🛡️</div>
        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} font-medium`}>Active Admins</p>
        <p className={`text-xl font-bold ${isDarkMode ? 'text-blue-300' : 'text-gray-900'}`}>{adminCount}</p>
      </div>

      {/* Reported Issues */}
      <div className={`${isDarkMode ? 'bg-yellow-900 bg-opacity-50' : 'bg-yellow-100'} rounded-lg p-5 shadow-sm text-center`}>
        <div className="text-2xl mb-2">⚠️</div>
        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} font-medium`}>Reported Issues</p>
        <p className={`text-xl font-bold ${isDarkMode ? 'text-yellow-300' : 'text-gray-900'}`}>{issueCount}</p>
      </div>
    </div>
  );
};

export default AdminSummaryCards;
