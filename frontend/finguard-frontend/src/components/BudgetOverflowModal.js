import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';

const BudgetOverflowModal = ({ overflowData, isOpen, onClose, onTransferComplete }) => {
  const { isDarkMode } = useTheme();
  const [availableBudgets, setAvailableBudgets] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && overflowData) {
      fetchAvailableBudgets();
    }
  }, [isOpen, overflowData]);

  const fetchAvailableBudgets = async () => {
    if (!overflowData) return;
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('finguard-token') || localStorage.getItem('token');
      console.log('🔍 Using token for budget fetch:', token ? 'Token exists' : 'No token');
      
      if (!token) {
        setError('Please login again to continue');
        setLoading(false);
        return;
      }
      
      const response = await axios.get('/api/budget-transfers/available-budgets', {
        params: {
          excludeCategory: overflowData.category
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Available budgets response:', response.data);
      setAvailableBudgets(response.data.availableBudgets || []);
    } catch (err) {
      console.error('❌ Failed to fetch available budgets:', err);
      if (err.response?.status === 403 || err.response?.status === 401) {
        setError('Please refresh and login again to continue');
      } else {
        setError('Failed to load available budget categories');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedCategory || !overflowData) return;

    setTransferring(true);
    setError('');

    try {
      const token = localStorage.getItem('finguard-token') || localStorage.getItem('token');
      const transferData = {
        overflowId: overflowData.overflowId,
        fromCategory: selectedCategory,
        toCategory: overflowData.category,
        transferAmount: overflowData.amount,
        reason: `Budget overflow reallocation from ${selectedCategory} to ${overflowData.category}`
      };

      const response = await axios.post('/api/budget-transfers/transfer', transferData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Success! Close modal and notify parent
      onTransferComplete && onTransferComplete(response.data);
      onClose();
      
      // Success message now handled by FinGuard notification system
      console.log(`✅ Budget transfer completed successfully! LKR ${overflowData.amount.toFixed(2)} transferred from ${selectedCategory} to ${overflowData.category}`);
      
    } catch (err) {
      console.error('❌ Transfer failed:', err);
      setError(err.response?.data?.error || 'Failed to complete budget transfer');
    } finally {
      setTransferring(false);
    }
  };


  if (!isOpen || !overflowData) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className={`relative w-full max-w-md mx-4 rounded-2xl shadow-2xl ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          } overflow-hidden`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-6 text-white">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-3">
                <div className="text-3xl">🚨</div>
                <div>
                  <h2 className="text-xl font-bold">Budget Exceeded!</h2>
                  <p className="text-red-100 text-sm">Transfer Required - Cannot Skip</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Overflow Details */}
            <div className={`rounded-lg p-4 ${
              isDarkMode ? 'bg-red-900/20 border-red-700/30' : 'bg-red-50 border-red-200'
            } border`}>
              <h3 className={`font-semibold mb-3 ${
                isDarkMode ? 'text-red-300' : 'text-red-800'
              }`}>
                Overflow Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Category:</span>
                  <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {overflowData.category}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Budget Limit:</span>
                  <span className={`font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                    LKR {overflowData.budgetLimit?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Amount Spent:</span>
                  <span className={`font-semibold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                    LKR {overflowData.totalSpent?.toFixed(2)}
                  </span>
                </div>
                <hr className={`my-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`} />
                <div className="flex justify-between text-base">
                  <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Exceeded By:
                  </span>
                  <span className={`font-bold text-lg ${
                    isDarkMode ? 'text-red-400' : 'text-red-600'
                  } bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-full`}>
                    LKR {overflowData.amount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Transfer Options */}
            <div>
              <h3 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                💡 Transfer Budget From:
              </h3>
              
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full" />
                  <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Loading available categories...
                  </p>
                </div>
              ) : availableBudgets.length === 0 ? (
                <div className={`text-center py-4 text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  No other categories with available budget found.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableBudgets.map((budget) => (
                    <div
                      key={budget.category}
                      onClick={() => setSelectedCategory(budget.category)}
                      className={`cursor-pointer rounded-lg p-3 border transition-all ${
                        selectedCategory === budget.category
                          ? isDarkMode 
                            ? 'border-blue-500 bg-blue-900/20' 
                            : 'border-blue-500 bg-blue-50'
                          : isDarkMode 
                            ? 'border-gray-600 hover:border-gray-500' 
                            : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className={`font-medium ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {budget.category}
                          </div>
                          <div className={`text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Used: LKR {parseFloat(budget.spent_amount || 0).toFixed(2)} / LKR {parseFloat(budget.limit_amount || 0).toFixed(2)}
                          </div>
                        </div>
                        <div className={`text-right`}>
                          <div className={`font-semibold ${
                            isDarkMode ? 'text-green-400' : 'text-green-600'
                          }`}>
                            LKR {parseFloat(budget.remaining_amount || 0).toFixed(2)}
                          </div>
                          <div className={`text-xs ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            available
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className={`rounded-lg p-3 ${
                isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'
              }`}>
                <div className="flex items-center space-x-2">
                  <span>⚠️</span>
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={onClose}
                disabled={transferring}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                ← Back
              </button>
              <button
                onClick={handleTransfer}
                disabled={!selectedCategory || transferring}
                className={`flex-1 px-4 py-3 rounded-lg font-medium text-white transition-colors ${
                  (!selectedCategory || transferring)
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                } disabled:opacity-50`}
              >
                {transferring ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                    <span>Transferring...</span>
                  </div>
                ) : (
                  `🔄 Transfer LKR ${overflowData.amount.toFixed(2)}`
                )}
              </button>
            </div>

            {/* Info Note */}
            <div className={`text-xs text-center ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              💡 Transferring budget will move the excess amount from the selected category to {overflowData.category}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BudgetOverflowModal;