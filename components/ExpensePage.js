import React, { useState } from 'react';
import { ArrowDownIcon } from '@heroicons/react/24/outline';
import ExpenseChart from './ExpenseChart';
import Navbar from './Navbar';
import RecentExpenses from './RecentExpenses';
import { XCircle } from 'lucide-react';

const ExpensePage = () => {
  const [isExpensePopupOpen, setIsExpensePopupOpen] = useState(false);
  const [expenses, setExpenses] = useState([
    // Initial sample data
    {
      id: 1,
      title: 'Groceries',
      type: 'Food',
      category: 'Essentials',
      amount: 1500,
      date: '20th Jun 2025',
      description: 'Weekly grocery shopping',
      icon: '🛒',
      color: 'bg-blue-100'
    },
    {
      id: 2,
      title: 'Electricity Bill',
      type: 'Utilities',
      category: 'Bills',
      amount: 600,
      date: '18th Jun 2025',
      description: 'Monthly electricity bill',
      icon: '💡',
      color: 'bg-yellow-100'
    }
  ]);
  
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    category: '',
    amount: '',
    date: '',
    description: '',
  });

  const openExpensePopup = () => setIsExpensePopupOpen(true);
  const closeExpensePopup = () => {
    setIsExpensePopupOpen(false);
    // Reset form when closing
    setFormData({ title: '', type: '', category: '', amount: '', date: '', description: '' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Generate a simple ID for new expenses
  const generateId = () => {
    return expenses.length > 0 ? Math.max(...expenses.map(e => e.id)) + 1 : 1;
  };

  // Get appropriate icon based on category/type
  const getExpenseIcon = (category, type) => {
    const iconMapping = {
      'food': '🛒',
      'groceries': '🛒',
      'utilities': '💡',
      'bills': '💡',
      'transport': '⛽',
      'fuel': '⛽',
      'entertainment': '🍽️',
      'dining': '🍽️',
      'phone': '📱',
      'communication': '📱',
      'rent': '🏠',
      'housing': '🏠',
      'default': '💸'
    };
    
    const key = (category || type || '').toLowerCase();
    return iconMapping[key] || iconMapping['default'];
  };

  // Get appropriate color based on category/type
  const getExpenseColor = (category, type) => {
    const colorMapping = {
      'food': 'bg-blue-100',
      'groceries': 'bg-blue-100',
      'utilities': 'bg-yellow-100',
      'bills': 'bg-yellow-100',
      'transport': 'bg-red-100',
      'fuel': 'bg-red-100',
      'entertainment': 'bg-purple-100',
      'dining': 'bg-purple-100',
      'phone': 'bg-indigo-100',
      'communication': 'bg-indigo-100',
      'rent': 'bg-green-100',
      'housing': 'bg-green-100',
      'default': 'bg-gray-100'
    };
    
    const key = (category || type || '').toLowerCase();
    return colorMapping[key] || colorMapping['default'];
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newExpense = {
      id: generateId(),
      title: formData.title || formData.type, // Use title if provided, otherwise use type
      type: formData.type,
      category: formData.category,
      amount: parseFloat(formData.amount),
      date: new Date(formData.date).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      description: formData.description,
      icon: getExpenseIcon(formData.category, formData.type),
      color: getExpenseColor(formData.category, formData.type),
    };
    
    setExpenses([newExpense, ...expenses]);
    closeExpensePopup();
  };

  // Function to handle expense updates from RecentExpenses component
  const handleExpenseUpdate = (updatedExpenses) => {
    setExpenses(updatedExpenses);
  };

  // Function to handle individual expense edit
  const handleExpenseEdit = (expenseId, updatedExpense) => {
    setExpenses(prevExpenses => 
      prevExpenses.map(expense => 
        expense.id === expenseId 
          ? { ...expense, ...updatedExpense }
          : expense
      )
    );
  };

  // Function to handle expense deletion
  const handleExpenseDelete = (expenseId) => {
    setExpenses(prevExpenses => 
      prevExpenses.filter(expense => expense.id !== expenseId)
    );
  };

  return (
    <div className="ymax-w-7xl mx-auto px-4 sm:px-6 lg:px-8 p-8">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 text-left mb-6">Expense Overview</h1>
        <p className="text-sm text-gray-600">Track your spending trends over time and gain insights into where your money goes.</p>
        <br/>
        
        <div className="relative">
          <button
            onClick={openExpensePopup}
            className="absolute top-0 right-0 flex items-center justify-center w-40 h-12 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 mb-4 mr-4 mt-3"
          >
            <ArrowDownIcon className="h-6 w-6 mr-2" />
            Add Expense
          </button>
          <ExpenseChart expenses={expenses} />
        </div>

       {/* Add/Edit Expense Popup */}
        {isExpensePopupOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-[600px] h-[600px] overflow-y-auto">
              <div className="flex justify-between items-center border-b pb-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Add Expense</h2>
                <button 
                  onClick={closeExpensePopup} 
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  <XCircle size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expense Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                    placeholder="Enter expense title"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expense Type</label>
                    <input
                      type="text"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                      placeholder="Enter expense type"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                      required
                    >
                      <option value="">Select category</option>
                      <option value="Food">Food & Groceries</option>
                      <option value="Utilities">Utilities & Bills</option>
                      <option value="Transport">Transport & Fuel</option>
                      <option value="Entertainment">Entertainment & Dining</option>
                      <option value="Communication">Phone & Internet</option>
                      <option value="Housing">Rent & Housing</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Shopping">Shopping</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount (LKR)</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                    placeholder="Enter description (optional)"
                    rows="3"
                  ></textarea>
                </div>
                
                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={closeExpensePopup}
                    className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-red-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-600 transition-colors"
                  >
                    Add Expense
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Recent Expenses Section */}
        <div className="mt-6 sm:mt-10 lg:mt-16">
          <RecentExpenses 
            expenses={expenses}
            onExpenseUpdate={handleExpenseUpdate}
            onExpenseEdit={handleExpenseEdit}
            onExpenseDelete={handleExpenseDelete}
          />
        </div>
      </div>
    </div>
  );
};

export default ExpensePage;