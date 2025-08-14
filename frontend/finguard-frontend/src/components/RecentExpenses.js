import React, { useState } from 'react';
import { Edit2, Save, X, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const RecentExpenses = ({ expenses, onExpenseUpdate, onExpenseEdit, onExpenseDelete }) => {
  const { isDarkMode } = useTheme();
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showCount, setShowCount] = useState(6); // Show 6 items initially
  const [isExpanded, setIsExpanded] = useState(false);

  const handleEditClick = (expense) => {
    setEditingId(expense.id);
    setEditForm({
      title: expense.title,
      amount: expense.amount,
      date: expense.date,
      description: expense.description || ''
    });
  };

  const handleSaveClick = (expenseId) => {
    if (!editForm.title || !editForm.amount || !editForm.date) {
      alert('Please fill in all required fields (title, amount, date)');
      return;
    }

    onExpenseEdit?.(expenseId, editForm);
    setEditingId(null);
    setEditForm({});
  };

  const handleCancelClick = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleDeleteClick = (expenseId, expenseTitle) => {
    if (window.confirm(`Are you sure you want to delete "${expenseTitle}"?`)) {
      onExpenseDelete?.(expenseId);
    }
  };

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const formatDateForInput = (dateString) => {
    try {
      return new Date(dateString).toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const formatDateForDisplay = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatAmount = (amount) => {
    const value = typeof amount === 'number' ? amount : parseFloat(amount || 0);
    return value.toLocaleString('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const totalExpense = expenses.reduce((total, exp) => total + Number(exp.amount || 0), 0);

  if (!expenses?.length) {
    return (
      <div className={`p-4 rounded-lg shadow-lg transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <h2 className={`text-xl font-bold mb-4 ${
          isDarkMode ? 'text-white' : 'text-gray-800'
        }`}>Recent Expenses</h2>
        <p className={`${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>No expenses recorded yet. Add your first expense to get started!</p>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg shadow-lg transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-800' : 'bg-white'
    }`}>
      <h2 className={`text-xl font-bold mb-6 ${
        isDarkMode ? 'text-white' : 'text-gray-800'
      }`}>Recent Expenses</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl">
        {expenses.slice(0, isExpanded ? expenses.length : showCount).map((expense) => (
          <div key={expense.id} className={`rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <div className={`w-12 h-12 ${expense.color || 'bg-gray-100'} rounded-lg flex items-center justify-center text-xl`}>
                  {expense.icon || '💸'}
                </div>

                <div className="flex-1">
                  {editingId === expense.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editForm.title || ''}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className={`w-full px-2 py-1 border rounded text-sm font-medium focus:ring-red-500 focus:border-red-500 ${
                          isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
                        }`}
                        placeholder="Expense title"
                      />
                      <input
                        type="number"
                        value={editForm.amount || ''}
                        onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                        className={`w-full px-2 py-1 border rounded text-sm focus:ring-red-500 focus:border-red-500 ${
                          isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
                        }`}
                        placeholder="Amount"
                        min="0"
                        step="0.01"
                      />
                      <input
                        type="date"
                        value={formatDateForInput(editForm.date) || ''}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        className={`w-full px-2 py-1 border rounded text-sm focus:ring-red-500 focus:border-red-500 ${
                          isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-600'
                        }`}
                      />
                      <textarea
                        value={editForm.description || ''}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        className={`w-full px-2 py-1 border rounded text-sm focus:ring-red-500 focus:border-red-500 ${
                          isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-600'
                        }`}
                        placeholder="Description (optional)"
                        rows="2"
                      />
                    </div>
                  ) : (
                    <div>
                      <h3 className={`font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-800'
                      }`}>{expense.title}</h3>
                      <p className={`text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>{formatDateForDisplay(expense.date)}</p>
                      {expense.description && (
                        <p className={`text-xs mt-1 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>{expense.description}</p>
                      )}
                      {expense.category && (
                        <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                          isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {expense.category}
                        </span>
                      )}
                      
                      {/* Budget Transfer Information */}
                      {expense.is_overflow && expense.transfer_from_category && (
                        <div className={`mt-2 p-2 rounded-md border-l-4 ${
                          isDarkMode 
                            ? 'bg-orange-900/20 border-orange-500 text-orange-300' 
                            : 'bg-orange-50 border-orange-400 text-orange-800'
                        }`}>
                          <div className="flex items-center space-x-1">
                            <span className="text-xs">🔄</span>
                            <span className="text-xs font-medium">Budget Transfer:</span>
                          </div>
                          <p className="text-xs mt-1">
                            LKR {expense.overflow_amount ? parseFloat(expense.overflow_amount).toFixed(2) : '0.00'} 
                            {' '}transferred from <strong>{expense.transfer_from_category}</strong>
                          </p>
                          <p className={`text-xs ${
                            isDarkMode ? 'text-orange-400' : 'text-orange-600'
                          }`}>
                            Budget exceeded - automatically rebalanced
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {editingId === expense.id ? (
                  <>
                    <button
                      onClick={() => handleSaveClick(expense.id)}
                      className="p-1.5 text-green-600 hover:bg-green-100 rounded"
                      title="Save"
                    >
                      <Save size={16} />
                    </button>
                    <button
                      onClick={handleCancelClick}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                      title="Cancel"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEditClick(expense)}
                      className="p-1.5 text-orange-600 hover:bg-orange-100 rounded"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(expense.id, expense.title)}
                      className="p-1.5 text-red-600 hover:bg-red-100 rounded"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
                <div className="text-right ml-4">
                  <span className="text-red-600 font-medium">
                    - {formatAmount(editingId === expense.id ? editForm.amount : expense.amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show More/Less Button */}
      {expenses.length > showCount && (
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
                Show More ({expenses.length - showCount} more)
              </>
            )}
          </button>
        </div>
      )}

      {/* Total Summary */}
      <div className={`mt-6 p-4 rounded-lg shadow-sm border transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex justify-between items-center">
          <h3 className={`text-lg font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>Total Expenses</h3>
          <span className="text-xl font-bold text-red-600">
            - {formatAmount(totalExpense)}
          </span>
        </div>
        <p className={`text-sm mt-1 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {expenses.length} expense{expenses.length !== 1 ? 's' : ''} recorded
        </p>
      </div>
    </div>
  );
};

export default RecentExpenses;
