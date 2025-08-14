import React, { useState } from 'react';
import { Edit2, Save, X, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';


const RecentIncomeSources = ({ incomes, onIncomeEdit, onIncomeDelete }) => {
 const { isDarkMode } = useTheme();
 const [showCount, setShowCount] = useState(6); // Show 6 items initially
 const [isExpanded, setIsExpanded] = useState(false);
 const formatAmount = (amount) => {
  const value = Number(amount);
  if (isNaN(value)) return 'Rs. 0.00';
  return value.toLocaleString('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};


 const totalIncome = incomes.reduce((sum, income) => sum + Number(income.amount || 0), 0);


  return (
    <div className={`p-6 rounded-lg shadow-md transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-800' : 'bg-white'
    }`}>
      <h2 className={`text-xl font-semibold mb-4 ${
        isDarkMode ? 'text-white' : 'text-gray-900'
      }`}>Recent Income Sources</h2>
      {incomes.length === 0 ? (
        <p className={`${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>No income recorded yet. Add your first income to get started!</p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incomes.slice(0, isExpanded ? incomes.length : showCount).map((income) => (
              <div
                key={income.id}
                className={`border p-4 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between transition-colors duration-300 ${
                  isDarkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start sm:items-center space-x-4">
                  <div className="text-3xl">{income.icon || '💰'}</div>
                  <div>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>{income.date}</p>
                    <p className={`text-md font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{income.description || income.source}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                    }`}>{income.category}</span>
                  </div>
                </div>

                <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                  <button
                    onClick={() => onIncomeEdit(income.id, income)}
                    className="text-orange-500 hover:text-orange-700"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => onIncomeDelete(income.id)}
                    className="text-red-500 hover:text-red-700"
                    title="Delete"
                  >
                    🗑️
                  </button>
                 <p className="text-green-600 font-semibold">
  + {formatAmount(income.amount)}
</p>


                </div>
              </div>
            ))}
          </div>

          {/* Show More/Less Button */}
          {incomes.length > showCount && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`flex items-center justify-center mx-auto px-4 py-2 rounded-lg border transition-colors duration-200 ${
                  isDarkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Show More ({incomes.length - showCount} more)
                  </>
                )}
              </button>
            </div>
          )}

          {/* Total */}
          <div className={`border-t pt-4 mt-4 text-right ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <h3 className={`text-md font-semibold ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>Total Income</h3>
            <p className="text-green-700 text-lg font-bold">
              + {formatAmount(totalIncome)}
            </p>
            <span className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {incomes.length} income source{incomes.length > 1 ? 's' : ''} recorded
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentIncomeSources;