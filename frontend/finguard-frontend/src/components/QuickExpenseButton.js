import React, { useState, useEffect } from 'react';
import { Plus, X, DollarSign, CreditCard, TrendingDown, Brain, Lightbulb } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import smartCategorization from '../services/smartCategorizationService';
import { useToast } from '../contexts/ToastContext';

const QuickExpenseButton = () => {
  const location = useLocation();
  const { success, error } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const expenseCategories = [
    'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
    'Bills & Utilities', 'Healthcare', 'Education', 'Travel', 'Other'
  ];

  const incomeCategories = [
    'Salary', 'Freelance', 'Investment', 'Business', 'Gift', 'Other'
  ];

  // Get smart suggestions when description changes
  useEffect(() => {
    if (formData.description && formData.description.length > 3 && formData.type === 'expense') {
      const categorySuggestions = smartCategorization.getCategorySuggestions(formData.description);
      setSuggestions(categorySuggestions);
      setShowSuggestions(categorySuggestions.length > 0 && !formData.category);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [formData.description, formData.category, formData.type]);

  const applySuggestion = (suggestion) => {
    setFormData({ ...formData, category: suggestion.category });
    setShowSuggestions(false);
  };

  const dismissSuggestions = () => {
    setShowSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('finguard-token');
    
    try {
      const response = await fetch(`http://localhost:5000/api/transactions/${formData.type}s`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          category: formData.category,
          description: formData.description,
          date: formData.date
        })
      });

      if (response.ok) {
        // Save learning pattern for expenses
        if (formData.type === 'expense') {
          smartCategorization.saveUserPattern(formData.description, formData.category);
        }

        // Reset form
        setFormData({
          type: 'expense',
          amount: '',
          category: '',
          description: '',
          date: new Date().toISOString().split('T')[0]
        });
        setSuggestions([]);
        setShowSuggestions(false);
        setIsModalOpen(false);
        setIsOpen(false);
        
        // Show success message
        success(`${formData.type.charAt(0).toUpperCase() + formData.type.slice(1)} added successfully!`);
        
        // Trigger page refresh for updated data
        window.dispatchEvent(new Event('transaction-added'));

        // Trigger family expense event for real-time tracking
        if (formData.type === 'expense') {
          window.dispatchEvent(new CustomEvent('family-expense-added', {
            detail: {
              userId: 'current-user', // This would be replaced with actual user ID
              amount: parseFloat(formData.amount),
              category: formData.category,
              memberName: 'You', // This would be replaced with actual user name
              description: formData.description
            }
          }));
        }
      } else {
        throw new Error('Failed to add transaction');
      }
    } catch (err) {
      console.error('Error adding transaction:', err);
      error('Failed to add transaction. Please try again.');
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className={`fixed right-8 z-50 ${
        location.pathname === '/premium-dashboard' ? 'bottom-20' : 'bottom-8'
      }`}>
        <div className={`transition-all duration-300 ${isOpen ? 'transform translate-y-0 opacity-100' : 'transform translate-y-2 opacity-0 pointer-events-none'}`}>
          <div className="flex flex-col space-y-3 mb-3">
            {/* Expense Button */}
            <button
              onClick={() => {
                setFormData({...formData, type: 'expense'});
                setIsModalOpen(true);
              }}
              className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg transition-colors flex items-center justify-center group"
              title="Add Expense"
            >
              <TrendingDown className="w-5 h-5" />
            </button>
            
            {/* Income Button */}
            <button
              onClick={() => {
                setFormData({...formData, type: 'income'});
                setIsModalOpen(true);
              }}
              className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full shadow-lg transition-colors flex items-center justify-center"
              title="Add Income"
            >
              <DollarSign className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main FAB */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 ${
            isOpen ? 'rotate-45' : 'rotate-0'
          }`}
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Plus className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Quick Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                {formData.type === 'expense' ? (
                  <TrendingDown className="w-5 h-5 text-red-500 mr-2" />
                ) : (
                  <DollarSign className="w-5 h-5 text-green-500 mr-2" />
                )}
                Quick {formData.type === 'expense' ? 'Expense' : 'Income'}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setIsOpen(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (Rs.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  required
                  autoFocus
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    suggestions.some(s => s.category === formData.category) 
                      ? 'border-blue-300 bg-blue-50' 
                      : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Select category</option>
                  {(formData.type === 'expense' ? expenseCategories : incomeCategories).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {suggestions.some(s => s.category === formData.category) && (
                  <p className="mt-1 text-xs text-blue-600 flex items-center">
                    <Brain className="w-3 h-3 mr-1" />
                    AI Suggestion Applied
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="What was this for?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />

                {/* Smart Category Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <div className="p-2 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-gray-600">
                          <Brain className="w-3 h-3 mr-1 text-blue-500" />
                          Smart Suggestions
                        </div>
                        <button
                          type="button"
                          onClick={dismissSuggestions}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="p-1">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => applySuggestion(suggestion)}
                          className="w-full flex items-center justify-between p-2 hover:bg-blue-50 rounded transition-colors"
                        >
                          <span className="text-sm font-medium text-gray-900">
                            {suggestion.category}
                          </span>
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-500">
                              {Math.round(suggestion.confidence)}%
                            </span>
                            <Lightbulb className="w-3 h-3 text-yellow-500" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setIsOpen(false);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                    formData.type === 'expense' 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  Add {formData.type === 'expense' ? 'Expense' : 'Income'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default QuickExpenseButton;