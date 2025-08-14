import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit2, Save, X, Trash2 } from 'lucide-react';

const RecentTransactions = () => {
  const [transactions, setTransactions] = useState([
    {
      icon: '🛒',
      description: 'Shopping',
      date: '17th Feb 2025',
      amount: '-$430',
      color: 'text-red-500',
    },
    {
      icon: '✈️',
      description: 'Travel',
      date: '13th Feb 2025',
      amount: '-$670',
      color: 'text-red-500',
    },
    {
      icon: '💰',
      description: 'Salary',
      date: '12th Feb 2025',
      amount: '+$1200',
      color: 'text-green-500',
    },
    {
      icon: '💡',
      description: 'Electricity Bill',
      date: '11th Feb 2025',
      amount: '-$200',
      color: 'text-red-500',
    },
    {
      icon: '🏦',
      description: 'Loan Repayment',
      date: '10th Feb 2025',
      amount: '-$600',
      color: 'text-red-500',
    },
  ]);

  const [editingIndex, setEditingIndex] = useState(null);
  const [editedData, setEditedData] = useState({ description: '', amount: '' });

  const handleEdit = (index) => {
    setEditingIndex(index);
    setEditedData({
      description: transactions[index].description,
      amount: transactions[index].amount,
    });
  };

  const handleSave = (index) => {
    const updated = [...transactions];
    updated[index].description = editedData.description;
    updated[index].amount = editedData.amount;
    updated[index].color = editedData.amount.startsWith('+') ? 'text-green-500' : 'text-red-500';
    setTransactions(updated);
    setEditingIndex(null);
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setEditedData({ description: '', amount: '' });
  };

  const handleDelete = (index) => {
    const confirm = window.confirm('Are you sure you want to delete this transaction?');
    if (confirm) {
      const updated = transactions.filter((_, i) => i !== index);
      setTransactions(updated);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Recent Transactions</h2>
        <Link to="/transactions" className="text-blue-500 hover:text-blue-700 text-sm font-medium">
          See All →
        </Link>
      </div>
      <div className="space-y-4">
        {transactions.map((transaction, index) => (
          <div key={index} className="group flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-2xl">{transaction.icon}</span>
              <div>
                {editingIndex === index ? (
                  <>
                    <input
                      type="text"
                      value={editedData.description}
                      onChange={(e) =>
                        setEditedData({ ...editedData, description: e.target.value })
                      }
                      className="text-gray-900 font-medium border p-1 rounded w-full mb-1"
                    />
                    <input
                      type="text"
                      value={editedData.amount}
                      onChange={(e) => setEditedData({ ...editedData, amount: e.target.value })}
                      className="text-sm text-gray-500 border p-1 rounded w-full"
                    />
                  </>
                ) : (
                  <>
                    <p className="text-gray-900 font-medium">{transaction.description}</p>
                    <p className="text-gray-500 text-sm">{transaction.date}</p>
                  </>
                )}
              </div>
            </div>

            {editingIndex === index ? (
              <div className="flex items-center space-x-4">
                <button
                  title="Save"
                  onClick={() => handleSave(index)}
                  className="text-green-600 hover:text-green-800"
                >
                  <Save size={16} />
                </button>
                <button
                  title="Cancel"
                  onClick={handleCancel}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <p className={`${transaction.color} font-semibold`}>{transaction.amount}</p>
                <div className="hidden group-hover:flex items-center space-x-2">
                  <button
                    title="Edit"
                    onClick={() => handleEdit(index)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    title="Delete"
                    onClick={() => handleDelete(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentTransactions;
