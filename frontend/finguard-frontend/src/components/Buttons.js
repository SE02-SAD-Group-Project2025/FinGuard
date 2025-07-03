import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const Buttons = () => {
  const navigate = useNavigate();

  const handleAddIncome = () => {
    navigate('/income');
  };

    const handleAddExpense = () => {
    navigate('/expense');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex justify-center gap-6">
        <button
          onClick={handleAddIncome}
          className="flex items-center justify-center w-48 h-16 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          <ArrowUpIcon className="h-6 w-6 mr-2" />
          Add Income
        </button>
        <button onClick={handleAddExpense} className="flex items-center justify-center w-48 h-16 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400">
          <ArrowDownIcon className="h-6 w-6 mr-2" />
          Add Expense
        </button>
      </div>
    </div>
  );
};

export default Buttons;