// RecentTransactions.js (dynamic version)
import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const RecentTransactions = ({ transactions = [] }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`p-6 rounded-lg shadow-lg mt-6 transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-800' : 'bg-white'
    }`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-xl font-semibold ${
          isDarkMode ? 'text-white' : 'text-gray-800'
        }`}>Recent Transactions</h2>
        <Link to="/transactions" className="text-blue-500 hover:text-blue-700 text-sm font-medium">
          See All →
        </Link>
      </div>
      <div className="space-y-4">
        {transactions.length === 0 ? (
          <p className={`text-center ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>No transactions found.</p>
        ) : (
          transactions.map((transaction, index) => {
            const isIncome = transaction.type === 'income';
            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-2xl">{isIncome ? '💰' : '🛒'}</span>
                  <div>
                    <p className={`font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{transaction.category}</p>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>{new Date(transaction.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <p className={`${isIncome ? 'text-green-500' : 'text-red-500'} font-semibold`}>
                    {isIncome ? '+' : '-'}Rs.{parseFloat(transaction.amount).toFixed(2)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RecentTransactions;
