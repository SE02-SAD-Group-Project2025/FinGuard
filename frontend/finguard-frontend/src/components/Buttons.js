import React from 'react';
import { useNavigate } from 'react-router-dom';

const Buttons = () => {
  const navigate = useNavigate();

  const handleAddIncome = () => {
    navigate('/income');
  };

  const handleAddExpense = () => {
    navigate('/expense');
  };

  const handleManageLiabilities = () => {
    navigate('/liabilities');
  };

  return (
    <div className="bg-white py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          {/* Add Income Button */}
          <button
            onClick={handleAddIncome}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="hidden sm:inline">Add Income</span>
          </button>

          {/* Add Expense Button */}
          <button
            onClick={handleAddExpense}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span className="hidden sm:inline">Add Expense</span>
          </button>

          {/* Manage Liabilities Button - NEW */}
          <button
            onClick={handleManageLiabilities}
            className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="hidden sm:inline">Manage Liabilities</span>
          </button>
        </div>
        
        {/* Mobile Labels */}
        <div className="flex sm:hidden justify-center gap-4 mt-2 text-sm text-gray-600">
          <span className="flex-1 text-center">Add Income</span>
          <span className="flex-1 text-center">Add Expense</span>
          <span className="flex-1 text-center">Liabilities</span>
        </div>
      </div>
    </div>
  );
};

export default Buttons;