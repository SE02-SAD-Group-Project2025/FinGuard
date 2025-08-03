import React from 'react';

const AdminSummaryCards = ({ userCount = 0, logCount = 0, adminCount = 0, issueCount = 0 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
      {/* Total Users */}
      <div className="bg-green-100 rounded-lg p-5 shadow-sm text-center">
        <div className="text-2xl mb-2">👥</div>
        <p className="text-gray-700 font-medium">Total Users</p>
        <p className="text-xl font-bold text-gray-900">{userCount}</p>
      </div>

      {/* System Logs */}
      <div className="bg-red-100 rounded-lg p-5 shadow-sm text-center">
        <div className="text-2xl mb-2">📜</div>
        <p className="text-gray-700 font-medium">System Logs</p>
        <p className="text-xl font-bold text-gray-900">{logCount}</p>
      </div>

      {/* Active Admins */}
      <div className="bg-blue-100 rounded-lg p-5 shadow-sm text-center">
        <div className="text-2xl mb-2">🛡️</div>
        <p className="text-gray-700 font-medium">Active Admins</p>
        <p className="text-xl font-bold text-gray-900">{adminCount}</p>
      </div>

      {/* Reported Issues */}
      <div className="bg-yellow-100 rounded-lg p-5 shadow-sm text-center">
        <div className="text-2xl mb-2">⚠️</div>
        <p className="text-gray-700 font-medium">Reported Issues</p>
        <p className="text-xl font-bold text-gray-900">{issueCount}</p>
      </div>
    </div>
  );
};

export default AdminSummaryCards;
