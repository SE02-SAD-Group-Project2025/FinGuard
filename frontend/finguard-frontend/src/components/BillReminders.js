import React, { useState, useEffect } from 'react';
import { Bell, Calendar, Clock, DollarSign, AlertTriangle, CheckCircle, Plus, Edit3, Trash2, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const BillReminders = () => {
  const { isDarkMode } = useTheme();
  const [bills, setBills] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newBill, setNewBill] = useState({
    name: '',
    amount: '',
    dueDate: '',
    frequency: 'monthly',
    category: 'Bills & Utilities',
    reminderDays: 3,
    isRecurring: true,
    description: ''
  });

  const [filter, setFilter] = useState('all'); // all, upcoming, overdue, paid

  useEffect(() => {
    generateBillData();
  }, []);

  const generateBillData = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('finguard-token');
      if (!token) {
        console.log('No auth token found');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/bills', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bills');
      }

      const billsData = await response.json();
      
      // Process the bills data to add calculated fields
      const processedBills = billsData.map(bill => {
        const dueDate = new Date(bill.due_date);
        const today = new Date();
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        
        let status = 'upcoming';
        if (bill.status === 'paid') {
          status = 'paid';
        } else if (daysUntilDue < 0) {
          status = 'overdue';
        } else if (daysUntilDue <= (bill.reminder_days || 3)) {
          status = 'due_soon';
        }

        return {
          id: bill.id,
          name: bill.name,
          amount: parseFloat(bill.amount),
          dueDate: dueDate,
          frequency: bill.frequency,
          category: bill.category,
          reminderDays: bill.reminder_days,
          isRecurring: bill.is_recurring,
          status: status,
          description: bill.description,
          daysUntilDue: daysUntilDue
        };
      });
      
      setBills(processedBills);
    } catch (error) {
      console.error('Error loading bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'overdue': return AlertTriangle;
      case 'due_soon': return Clock;
      case 'upcoming': return Calendar;
      case 'paid': return CheckCircle;
      default: return Bell;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'overdue': return 'text-red-600 dark:text-red-400';
      case 'due_soon': return 'text-yellow-600 dark:text-yellow-400';
      case 'upcoming': return 'text-blue-600 dark:text-blue-400';
      case 'paid': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'overdue': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'due_soon': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'upcoming': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'paid': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      default: return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysText = (days) => {
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `Due in ${days} days`;
  };

  const handleAddBill = async () => {
    try {
      const token = localStorage.getItem('finguard-token');
      if (!token) {
        alert('Please login first');
        return;
      }

      const response = await fetch('http://localhost:5000/api/bills', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newBill.name,
          amount: parseFloat(newBill.amount),
          dueDate: newBill.dueDate,
          frequency: newBill.frequency,
          category: newBill.category,
          reminderDays: parseInt(newBill.reminderDays),
          isRecurring: newBill.isRecurring,
          description: newBill.description
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add bill');
      }

      const newBillData = await response.json();
      
      // Refresh the bills list
      await generateBillData();
      
      // Reset form and close modal
      setNewBill({
        name: '',
        amount: '',
        dueDate: '',
        frequency: 'monthly',
        category: 'Bills & Utilities',
        reminderDays: 3,
        isRecurring: true,
        description: ''
      });
      setShowAddModal(false);

      // Show success message
      alert('Bill reminder added successfully!');
      
    } catch (error) {
      console.error('Error adding bill:', error);
      alert('Failed to add bill: ' + error.message);
    }
  };

  const handleEditBill = (bill) => {
    setEditingBill(bill);
    setNewBill({
      name: bill.name,
      amount: bill.amount.toString(),
      dueDate: bill.dueDate.toISOString().split('T')[0],
      frequency: bill.frequency,
      category: bill.category,
      reminderDays: bill.reminderDays,
      isRecurring: bill.isRecurring,
      description: bill.description
    });
    setShowAddModal(true);
  };

  const handleUpdateBill = async () => {
    try {
      const token = localStorage.getItem('finguard-token');
      if (!token) {
        alert('Please login first');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/bills/${editingBill.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newBill.name,
          amount: parseFloat(newBill.amount),
          dueDate: newBill.dueDate,
          frequency: newBill.frequency,
          category: newBill.category,
          reminderDays: parseInt(newBill.reminderDays),
          isRecurring: newBill.isRecurring,
          description: newBill.description
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update bill');
      }

      // Refresh the bills list
      await generateBillData();
      
      // Reset form and close modal
      setEditingBill(null);
      setNewBill({
        name: '',
        amount: '',
        dueDate: '',
        frequency: 'monthly',
        category: 'Bills & Utilities',
        reminderDays: 3,
        isRecurring: true,
        description: ''
      });
      setShowAddModal(false);

      alert('Bill updated successfully!');
      
    } catch (error) {
      console.error('Error updating bill:', error);
      alert('Failed to update bill: ' + error.message);
    }
  };

  const handleDeleteBill = async (billId) => {
    if (!window.confirm('Are you sure you want to delete this bill reminder?')) {
      return;
    }

    try {
      const token = localStorage.getItem('finguard-token');
      if (!token) {
        alert('Please login first');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/bills/${billId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete bill');
      }

      // Refresh the bills list
      await generateBillData();
      alert('Bill deleted successfully!');
      
    } catch (error) {
      console.error('Error deleting bill:', error);
      alert('Failed to delete bill: ' + error.message);
    }
  };

  const markAsPaid = async (billId) => {
    try {
      const token = localStorage.getItem('finguard-token');
      if (!token) {
        alert('Please login first');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/bills/${billId}/pay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to mark bill as paid');
      }

      // Refresh the bills list
      await generateBillData();
      alert('Bill marked as paid successfully!');
      
    } catch (error) {
      console.error('Error marking bill as paid:', error);
      alert('Failed to mark bill as paid: ' + error.message);
    }
  };

  const filteredBills = bills.filter(bill => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return ['upcoming', 'due_soon'].includes(bill.status);
    if (filter === 'overdue') return bill.status === 'overdue';
    if (filter === 'paid') return bill.status === 'paid';
    return true;
  });

  if (loading) {
    return (
      <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
          </div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Bell className={`w-6 h-6 mr-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <div>
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Bill Due Date Reminders
            </h2>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Never miss a payment again
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Bill
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Bills</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {bills.length}
              </p>
            </div>
            <Bell className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
        </div>
        
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Overdue</p>
              <p className="text-2xl font-bold text-red-600">
                {bills.filter(b => b.status === 'overdue').length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Due Soon</p>
              <p className="text-2xl font-bold text-yellow-600">
                {bills.filter(b => b.status === 'due_soon').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>This Month</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Rs. {bills.reduce((sum, bill) => sum + bill.amount, 0).toLocaleString()}
              </p>
            </div>
            <DollarSign className={`w-8 h-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {[
          { id: 'all', label: 'All Bills', count: bills.length },
          { id: 'upcoming', label: 'Upcoming', count: bills.filter(b => ['upcoming', 'due_soon'].includes(b.status)).length },
          { id: 'overdue', label: 'Overdue', count: bills.filter(b => b.status === 'overdue').length },
          { id: 'paid', label: 'Paid', count: bills.filter(b => b.status === 'paid').length }
        ].map((filterOption) => (
          <button
            key={filterOption.id}
            onClick={() => setFilter(filterOption.id)}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filter === filterOption.id
                ? 'bg-blue-600 text-white'
                : isDarkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {filterOption.label}
            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
              filter === filterOption.id
                ? 'bg-white/20 text-white'
                : isDarkMode
                  ? 'bg-gray-600 text-gray-300'
                  : 'bg-gray-200 text-gray-700'
            }`}>
              {filterOption.count}
            </span>
          </button>
        ))}
      </div>

      {/* Bills List */}
      <div className="space-y-4">
        {filteredBills.map((bill) => {
          const StatusIcon = getStatusIcon(bill.status);
          
          return (
            <div key={bill.id} className={`p-5 rounded-lg border ${getStatusBg(bill.status)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <div className={`p-2 rounded-lg mr-4 ${
                    bill.status === 'overdue' ? 'bg-red-100 dark:bg-red-900/40' :
                    bill.status === 'due_soon' ? 'bg-yellow-100 dark:bg-yellow-900/40' :
                    bill.status === 'paid' ? 'bg-green-100 dark:bg-green-900/40' :
                    'bg-blue-100 dark:bg-blue-900/40'
                  }`}>
                    <StatusIcon className={`w-5 h-5 ${getStatusColor(bill.status)}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {bill.name}
                      </h3>
                      <span className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Rs. {bill.amount.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <span className={`flex items-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(bill.dueDate)}
                        </span>
                        <span className={`flex items-center ${getStatusColor(bill.status)}`}>
                          <Clock className="w-3 h-3 mr-1" />
                          {getDaysText(bill.daysUntilDue)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {bill.frequency}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {bill.status !== 'paid' && (
                          <button
                            onClick={() => markAsPaid(bill.id)}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          >
                            Mark Paid
                          </button>
                        )}
                        <button
                          onClick={() => handleEditBill(bill)}
                          className={`p-1 rounded transition-colors ${
                            isDarkMode 
                              ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBill(bill.id)}
                          className="p-1 rounded text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {bill.description && (
                      <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {bill.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredBills.length === 0 && (
        <div className="text-center py-12">
          <Bell className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
          <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            No Bills Found
          </h3>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {filter === 'all' 
              ? 'Start by adding your first bill reminder.'
              : `No ${filter} bills found.`
            }
          </p>
        </div>
      )}

      {/* Add/Edit Bill Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`p-6 rounded-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {editingBill ? 'Edit Bill' : 'Add New Bill'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingBill(null);
                  setNewBill({
                    name: '', amount: '', dueDate: '', frequency: 'monthly',
                    category: 'Bills & Utilities', reminderDays: 3, isRecurring: true, description: ''
                  });
                }}
                className={`text-gray-400 hover:text-gray-600 ${isDarkMode ? 'hover:text-gray-300' : ''}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Bill Name
                </label>
                <input
                  type="text"
                  value={newBill.name}
                  onChange={(e) => setNewBill({...newBill, name: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="e.g., Electricity Bill"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Amount (Rs.)
                </label>
                <input
                  type="number"
                  value={newBill.amount}
                  onChange={(e) => setNewBill({...newBill, amount: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Due Date
                </label>
                <input
                  type="date"
                  value={newBill.dueDate}
                  onChange={(e) => setNewBill({...newBill, dueDate: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Frequency
                  </label>
                  <select
                    value={newBill.frequency}
                    onChange={(e) => setNewBill({...newBill, frequency: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                    <option value="one-time">One-time</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Remind Days Before
                  </label>
                  <input
                    type="number"
                    value={newBill.reminderDays}
                    onChange={(e) => setNewBill({...newBill, reminderDays: parseInt(e.target.value)})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    min="1"
                    max="30"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Category
                </label>
                <select
                  value={newBill.category}
                  onChange={(e) => setNewBill({...newBill, category: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="Bills & Utilities">Bills & Utilities</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Health & Fitness">Health & Fitness</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description (Optional)
                </label>
                <textarea
                  value={newBill.description}
                  onChange={(e) => setNewBill({...newBill, description: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  rows="3"
                  placeholder="Additional notes about this bill..."
                />
              </div>
            </div>
            
            <div className="flex space-x-3 pt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingBill(null);
                }}
                className={`flex-1 px-4 py-2 border rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={editingBill ? handleUpdateBill : handleAddBill}
                disabled={!newBill.name || !newBill.amount || !newBill.dueDate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {editingBill ? 'Update Bill' : 'Add Bill'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillReminders;