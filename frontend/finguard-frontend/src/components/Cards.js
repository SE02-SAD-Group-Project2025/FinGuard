import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const Cards = ({ summary, liabilitiesSummary }) => {
  const { isDarkMode } = useTheme();
  const cardData = [
    {
      icon: '💰',
      title: 'Current Balance',
      amount: `Rs.${summary.balance?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}`,
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
    },
    {
      icon: '📉',
      title: 'Liabilities',
      amount: `Rs.${liabilitiesSummary?.total_current_balance?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}`,
      bgColor: 'bg-red-100',
      textColor: 'text-red-700',
    },
    {
      icon: '💸',
      title: "Month's Income",
      amount: `Rs.${summary.income?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}`,
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700',
    },
    {
      icon: '🛒',
      title: "Month's Expense",
      amount: `Rs.${summary.expenses?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}`,
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-700',
    },
  ];

  return (
    <div className={`py-4 transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cardData.map((card, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg shadow-md text-center transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800 border border-gray-700' 
                  : `${card.bgColor}`
              }`}
            >
              <div className={`text-2xl mb-2 ${
                isDarkMode 
                  ? 'text-gray-300' 
                  : card.textColor
              }`}>{card.icon}</div>
              <h3 className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>{card.title}</h3>
              <p className={`text-lg font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{card.amount}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Cards;