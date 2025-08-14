import React, { useState } from 'react';
import { Edit2, Save, X, Trash2 } from 'lucide-react';

const RecentIncomeSources = ({ incomes, onIncomeUpdate, onIncomeEdit, onIncomeDelete }) => {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const handleEditClick = (income) => {
    setEditingId(income.id);
    setEditForm({
      source: income.source,
      category: income.category,
      amount: income.amount,
      date: income.date,
      description: income.description || '',
    });
  };

  const handleSaveClick = (incomeId) => {
    if (!editForm.source || !editForm.category || !editForm.amount || !editForm.date) {
      alert('Please fill in all required fields (source, category, amount, date)');
      return;
    }

    if (onIncomeEdit) {
      onIncomeEdit(incomeId, editForm);
    }

    setEditingId(null);
    setEditForm({});
  };

  const handleCancelClick = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleDeleteClick = (incomeId, incomeSource) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${incomeSource}"?`);
    if (confirmDelete && onIncomeDelete) {
      onIncomeDelete(incomeId);
    }
  };

  const handleInputChange = (field, value) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatDateForInput = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const formatDateForDisplay = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (!incomes || incomes.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Income Sources</h2>
        <p className="text-gray-600">No income recorded yet. Add your first income to get started!</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Recent Income Sources</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl">
        {incomes.map((income) => (
          <div
            key={income.id}
            className="group bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <div
                  className={`w-12 h-12 ${income.color || 'bg-gray-100'} rounded-lg flex items-center justify-center text-xl`}
                >
                  {income.icon || '💵'}
                </div>

                <div className="flex-1">
                  {editingId === income.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editForm.source || ''}
                        onChange={(e) => handleInputChange('source', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-medium focus:ring-green-500 focus:border-green-500"
                        placeholder="Income source"
                      />
                      <select
                        value={editForm.category || ''}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-green-500 focus:border-green-500"
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
                      <input
                        type="number"
                        value={editForm.amount || ''}
                        onChange={(e) =>
                          handleInputChange('amount', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-green-500 focus:border-green-500"
                        placeholder="Amount"
                        min="0"
                        step="0.01"
                      />
                      <input
                        type="date"
                        value={formatDateForInput(editForm.date) || ''}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-600 focus:ring-green-500 focus:border-green-500"
                      />
                      <textarea
                        value={editForm.description || ''}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-600 focus:ring-green-500 focus:border-green-500"
                        placeholder="Description (optional)"
                        rows="2"
                      />
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-medium text-gray-800">{income.source}</h3>
                      <p className="text-sm text-gray-600">{formatDateForDisplay(income.date)}</p>
                      {income.description && (
                        <p className="text-xs text-gray-500 mt-1">{income.description}</p>
                      )}
                      {income.category && (
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full mt-1">
                          {income.category}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {editingId === income.id ? (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleSaveClick(income.id)}
                      className="p-1.5 text-green-600 hover:bg-green-100 rounded transition-colors"
                      title="Save changes"
                    >
                      <Save size={16} />
                    </button>
                    <button
                      onClick={handleCancelClick}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      title="Cancel editing"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="hidden group-hover:flex items-center space-x-1">
                    <button
                      onClick={() => handleEditClick(income)}
                      className="p-1.5 text-orange-600 hover:bg-orange-100 rounded transition-colors"
                      title="Edit income"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(income.id, income.source)}
                      className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                      title="Delete income"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}

                <div className="text-right ml-4">
                  <span className="text-green-600 font-medium">
                    + LKR {(editingId === income.id ? editForm.amount : income.amount)?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Total Income</h3>
          <span className="text-xl font-bold text-green-600">
            + LKR {incomes.reduce((total, income) => total + (income.amount || 0), 0).toLocaleString()}
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {incomes.length} income source{incomes.length !== 1 ? 's' : ''} recorded
        </p>
      </div>
    </div>
  );
};

export default RecentIncomeSources;
