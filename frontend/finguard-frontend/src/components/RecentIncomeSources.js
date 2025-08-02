import React, { useState } from 'react';
import { Edit2, Save, X, Trash2 } from 'lucide-react';


const RecentIncomeSources = ({ incomes, onIncomeEdit, onIncomeDelete }) => {
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
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Recent Income Sources</h2>
      {incomes.length === 0 ? (
        <p className="text-gray-600">No income recorded yet. Add your first income to get started!</p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incomes.map((income) => (
              <div
                key={income.id}
                className="border border-gray-200 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start sm:items-center space-x-4">
                  <div className="text-3xl">{income.icon || '💰'}</div>
                  <div>
                    <p className="text-sm text-gray-500">{income.date}</p>
                    <p className="text-md font-medium text-gray-900">{income.description || income.source}</p>
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">{income.category}</span>
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

          {/* Total */}
          <div className="border-t pt-4 mt-4 text-right">
            <h3 className="text-md font-semibold text-gray-700">Total Income</h3>
            <p className="text-green-700 text-lg font-bold">
              + {formatAmount(totalIncome)}
            </p>
            <span className="text-sm text-gray-500">
              {incomes.length} income source{incomes.length > 1 ? 's' : ''} recorded
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentIncomeSources;