import React, { useState } from 'react';
import { ArrowUpIcon } from '@heroicons/react/24/outline';
import IncomeGraph from './IncomeGraph';
import RecentIncomeSources from './RecentIncomeSources';

const IncomePage = () => {
  const [isIncomePopupOpen, setIsIncomePopupOpen] = useState(false);

  const openIncomePopup = () => setIsIncomePopupOpen(true);
  const closeIncomePopup = () => setIsIncomePopupOpen(false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 text-left mb-6">Add Income</h1>
      <div className="relative">
        <button
          onClick={openIncomePopup}
          className="absolute top-0 right-0 flex items-center justify-center w-40 h-12 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 mb-4"
        >
          <ArrowUpIcon className="h-6 w-6 mr-2" />
          Add Income
        </button>
        <div className="bg-white p-4 rounded-lg shadow-lg" style={{ width: '100%', height: '300px' }}>
          <IncomeGraph />
        </div>
      </div>
    
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <RecentIncomeSources />
    </div>
    
      {isIncomePopupOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <h2 className="text-lg font-semibold">Add Income</h2>
              <button onClick={closeIncomePopup} className="text-gray-500 hover:text-gray-700">
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Income Source</label>
                  <input
                    type="text"
                    className="mt-1 p-2 w-full border rounded-md"
                    placeholder="Enter income source"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <input
                    type="text"
                    className="mt-1 p-2 w-full border rounded-md"
                    placeholder="Select category"
                  />
                </div>
              </div>
              <div className="text-right">
                <button className="text-blue-500 hover:text-blue-700 text-sm">+ Add New</button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <input
                  type="number"
                  className="mt-1 p-2 w-full border rounded-md"
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  className="mt-1 p-2 w-full border rounded-md"
                  placeholder="Select date"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  className="mt-1 p-2 w-full border rounded-md"
                  placeholder="Enter description"
                  rows="3"
                ></textarea>
              </div>
              <button className="w-full bg-orange-500 text-white p-2 rounded-md hover:bg-orange-600">
                + Add Income
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncomePage;