import React, { useState } from 'react';
import { ArrowUpIcon } from '@heroicons/react/24/outline';
import IncomeGraph from './IncomeGraph';
import RecentIncomeSources from './RecentIncomeSources';
import Navbar from './Navbar';
import { XCircle } from 'lucide-react';

const IncomePage = () => {
  const [isIncomePopupOpen, setIsIncomePopupOpen] = useState(false);
  const [incomes, setIncomes] = useState([
    // Initial sample data
    {
      id: 1,
      source: 'Salary',
      category: 'Primary Income',
      amount: 85000,
      date: '1st Jul 2025',
      description: 'Monthly salary payment',
      icon: '💼',
      color: 'bg-green-100'
    },
    {
      id: 2,
      source: 'Freelance Project',
      category: 'Secondary Income',
      amount: 15000,
      date: '28th Jun 2025',
      description: 'Web development project',
      icon: '💻',
      color: 'bg-blue-100'
    }
  ]);
  
  const [formData, setFormData] = useState({
    source: '',
    category: '',
    amount: '',
    date: '',
    description: '',
  });

  const openIncomePopup = () => setIsIncomePopupOpen(true);
  const closeIncomePopup = () => {
    setIsIncomePopupOpen(false);
    // Reset form when closing
    setFormData({ source: '', category: '', amount: '', date: '', description: '' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Generate a simple ID for new incomes
  const generateId = () => {
    return incomes.length > 0 ? Math.max(...incomes.map(i => i.id)) + 1 : 1;
  };

  // Get appropriate icon based on category/source
  const getIncomeIcon = (category, source) => {
    const iconMapping = {
      'salary': '💼',
      'primary income': '💼',
      'freelance': '💻',
      'secondary income': '💻',
      'business': '🏢',
      'investment': '📈',
      'dividends': '📊',
      'rental': '🏠',
      'bonus': '🎁',
      'commission': '💰',
      'other': '💵',
      'default': '💵'
    };
    
    const key = (category || source || '').toLowerCase();
    return iconMapping[key] || iconMapping['default'];
  };

  // Get appropriate color based on category/source
  const getIncomeColor = (category, source) => {
    const colorMapping = {
      'salary': 'bg-green-100',
      'primary income': 'bg-green-100',
      'freelance': 'bg-blue-100',
      'secondary income': 'bg-blue-100',
      'business': 'bg-purple-100',
      'investment': 'bg-indigo-100',
      'dividends': 'bg-indigo-100',
      'rental': 'bg-yellow-100',
      'bonus': 'bg-pink-100',
      'commission': 'bg-orange-100',
      'other': 'bg-gray-100',
      'default': 'bg-gray-100'
    };
    
    const key = (category || source || '').toLowerCase();
    return colorMapping[key] || colorMapping['default'];
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newIncome = {
      id: generateId(),
      source: formData.source,
      category: formData.category,
      amount: parseFloat(formData.amount),
      date: new Date(formData.date).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      description: formData.description,
      icon: getIncomeIcon(formData.category, formData.source),
      color: getIncomeColor(formData.category, formData.source),
    };
    
    setIncomes([newIncome, ...incomes]);
    closeIncomePopup();
  };

  // Function to handle income updates from RecentIncomeSources component
  const handleIncomeUpdate = (updatedIncomes) => {
    setIncomes(updatedIncomes);
  };

  // Function to handle individual income edit
  const handleIncomeEdit = (incomeId, updatedIncomeData) => {
    setIncomes(prevIncomes => 
      prevIncomes.map(income => 
        income.id === incomeId 
          ? { 
              ...income, 
              ...updatedIncomeData,
              // Update icon and color based on new category/source
              icon: getIncomeIcon(updatedIncomeData.category, updatedIncomeData.source),
              color: getIncomeColor(updatedIncomeData.category, updatedIncomeData.source)
            }
          : income
      )
    );
  };

  // Function to handle income deletion
  const handleIncomeDelete = (incomeId) => {
    setIncomes(prevIncomes => 
      prevIncomes.filter(income => income.id !== incomeId)
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 text-left mb-6">Income Overview</h1>
        <p className="text-sm text-gray-600">Track your earnings over time and analyze your income trends.</p>
        <br/>
        
        <div className="relative">
          <button
            onClick={openIncomePopup}
            className="absolute top-0 right-0 flex items-center justify-center w-40 h-12 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 mb-4 mr-4 mt-3"
          >
            <ArrowUpIcon className="h-6 w-6 mr-2" />
            Add Income
          </button>
          <IncomeGraph incomes={incomes} />
        </div>

        {/* Add/Edit Income Popup */}
        {isIncomePopupOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-[600px] h-[600px] overflow-y-auto">
              <div className="flex justify-between items-center border-b pb-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Add Income</h2>
                <button 
                  onClick={closeIncomePopup} 
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                <XCircle size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Income Source field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Income Source</label>
                  <input
                    type="text"
                    name="source"
                    value={formData.source}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter income source"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    required
                  >
                    <option value="">Select category</option>
                    <option value="Primary Income">Primary Income</option>
                    <option value="Secondary Income">Secondary Income</option>
                    <option value="Business">Business Income</option>
                    <option value="Investment">Investment Income</option>
                    <option value="Rental">Rental Income</option>
                    <option value="Bonus">Bonus/Commission</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount (LKR)</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter amount"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter description (optional)"
                    rows="3"
                  ></textarea>
                </div>
                
                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={closeIncomePopup}
                    className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#F97316] text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-600 transition-colors"
                  >
                    Add Income
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Recent Income Sources Section */}
        <div className="mt-6 sm:mt-10 lg:mt-16">
          <RecentIncomeSources 
            incomes={incomes}
            onIncomeUpdate={handleIncomeUpdate}
            onIncomeEdit={handleIncomeEdit}
            onIncomeDelete={handleIncomeDelete}
          />
        </div>
      </div>
    </div>
  );
};

export default IncomePage;