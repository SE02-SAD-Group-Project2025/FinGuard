import React, { useState, useEffect } from 'react';
import { ArrowDownIcon } from '@heroicons/react/24/outline';
import ExpenseChart from './ExpenseChart';
import RecentExpenses from './RecentExpenses';
import Navbar from './Navbar';

const ExpensePage = () => {
  const [isExpensePopupOpen, setIsExpensePopupOpen] = useState(false);
  const [expenses, setExpenses] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    amount: '',
    date: '',
    description: '',
  });

  useEffect(() => {
  const fetchExpenses = async () => {
    const token = localStorage.getItem('finguard-token');
    try {
      const res = await fetch('http://localhost:5000/api/transactions?type=expense', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Failed to fetch expenses');
      const data = await res.json();

      // Filter only expenses just in case
      const expenseOnly = data.filter(tx => tx.type === 'expense');

      // Attach icon/color if needed
      const enriched = expenseOnly.map(exp => ({
        ...exp,
        icon: '🧾',
        color: 'bg-red-100'
      }));

      setExpenses(enriched);
    } catch (err) {
      console.error('Error loading expenses:', err.message);
    }
  };

  fetchExpenses();
}, []);

  const openExpensePopup = () => setIsExpensePopupOpen(true);
  const closeExpensePopup = () => {
    setIsExpensePopupOpen(false);
    setFormData({ title: '', category: '', amount: '', date: '', description: '' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('finguard-token');
    if (!token) return;

    const payload = {
      type: 'expense',
      title: formData.title,
      category: formData.category,
      amount: parseFloat(formData.amount),
      date: formData.date,
      description: formData.description,
    };

    try {
      const res = await fetch('http://localhost:5000/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setExpenses((prev) => [...prev, data]);
      closeExpensePopup();
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const handleExpenseEdit = async (id, updated) => {
    const token = localStorage.getItem('finguard-token');
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:5000/api/transactions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updated),
      });

      const data = await res.json();
      setExpenses((prev) => prev.map((e) => (e.id === id ? data : e)));
    } catch (error) {
      console.error('Error updating expense:', error);
    }
  };

  const handleExpenseDelete = async (id) => {
    const token = localStorage.getItem('finguard-token');
    if (!token) return;

    try {
      await fetch(`http://localhost:5000/api/transactions/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Navbar />
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Expense Overview</h1>
      <ExpenseChart expenses={expenses} />

      <button
        onClick={openExpensePopup}
        className="mt-6 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded"
      >
        <ArrowDownIcon className="h-5 w-5 inline-block mr-2" />
        Add Expense
      </button>

      {isExpensePopupOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[500px]">
            <h2 className="text-xl font-semibold mb-4">Add New Expense</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="title"
                placeholder="Title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full border p-2 rounded"
              />
              <input
                type="number"
                name="amount"
                placeholder="Amount"
                value={formData.amount}
                onChange={handleChange}
                required
                className="w-full border p-2 rounded"
              />
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full border p-2 rounded"
              />
              <input
                type="text"
                name="category"
                placeholder="Category"
                value={formData.category}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
              <textarea
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              ></textarea>
              <div className="flex justify-between">
                <button
                  type="submit"
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={closeExpensePopup}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <RecentExpenses
        expenses={expenses}
        onExpenseEdit={handleExpenseEdit}
        onExpenseDelete={handleExpenseDelete}
      />
    </div>
  );
};

export default ExpensePage;
