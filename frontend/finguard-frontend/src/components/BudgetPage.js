import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import AnimatedPage from './AnimatedPage';
import { useTheme } from '../contexts/ThemeContext';
import { useSubscription } from '../hooks/useSubscription';
import SpendingPatternAnalysis from './SpendingPatternAnalysis';
import {
  Edit3,
  Lightbulb,
  Target,
  Settings,
  Plus,
  BarChart3,
  Zap,
  XCircle,
  Utensils,
  Car,
  ShoppingCart,
  CheckCircle,
  GamepadIcon,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Mail,
  Bell,
  Brain
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BudgetPage = () => {
  const { isDarkMode } = useTheme();
  const { isPremium, user } = useSubscription();
  const [isBudgetSettingsOpen, setIsBudgetSettingsOpen] = useState(false);
  const [isSavingsModalOpen, setIsSavingsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState([]);
  const [aiLoading, setAiLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // State for backend data
  const [budgets, setBudgets] = useState([]);
  const [budgetSummary, setBudgetSummary] = useState([]);
  const [budgetAlerts, setBudgetAlerts] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState({ income: 0, expenses: 0, balance: 0 });
  
  // Month/Year Selection State - Always default to current date
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  
  // Form state for new budgets
  const [newBudget, setNewBudget] = useState({
    category: '',
    limit_amount: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  const [savingsGoal, setSavingsGoal] = useState({
    name: 'Emergency Fund',
    amount: 50000,
    saved: 15000
  });

  // Use selected month/year for API calls
  const currentMonth = selectedMonth;
  const currentYear = selectedYear;

  // Get token for API calls
  const getToken = () => localStorage.getItem('finguard-token');

  // API call helper
  const apiCall = async (endpoint, options = {}) => {
    const token = getToken();
    if (!token) {
      setError('Please login to continue');
      return null;
    }

    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      setError(`Failed to ${options.method || 'fetch'} data: ${error.message}`);
      return null;
    }
  };

  // ✅ FIXED: Use same categories as ExpensePage.js
  const getPredefinedExpenseCategories = () => {
    return [
      { id: 1, name: 'Food & Dining' },
      { id: 2, name: 'Groceries' },
      { id: 3, name: 'Transportation' },
      { id: 4, name: 'Entertainment' },
      { id: 5, name: 'Utilities' },
      { id: 6, name: 'Shopping' },
      { id: 7, name: 'Healthcare' },
      { id: 8, name: 'Education' },
      { id: 9, name: 'Travel' },
      { id: 10, name: 'Rent' },
      { id: 11, name: 'Insurance' },
      { id: 12, name: 'Phone & Internet' },
      { id: 13, name: 'Fuel' },
      { id: 14, name: 'Clothing' },
      { id: 15, name: 'Personal Care' },
      { id: 16, name: 'Home Maintenance' },
      { id: 17, name: 'Subscriptions' },
      { id: 18, name: 'Other Expenses' }
    ];
  };

  // Available categories for budgets - now matches ExpensePage
  const availableCategories = getPredefinedExpenseCategories().map(cat => cat.name);

  // Fetch all budget-related data
  const fetchBudgetData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Fetch budgets for selected month/year
      const budgetsData = await apiCall(`/api/budgets?month=${currentMonth}&year=${currentYear}`);
      if (budgetsData) {
        const safeBudgets = Array.isArray(budgetsData) ? budgetsData : (budgetsData.budgets || []);
        setBudgets(safeBudgets);
      }

      // Fetch budget summary (spending vs limits)
      const summaryData = await apiCall(`/api/budgets/summary?month=${currentMonth}&year=${currentYear}`);
      if (summaryData) setBudgetSummary(summaryData);

      // Fetch budget alerts
      const alertsData = await apiCall('/api/budgets/alerts');
      if (alertsData) setBudgetAlerts(alertsData);

      // Fetch monthly financial summary
      const monthlyData = await apiCall(`/api/summary?month=${currentMonth}&year=${currentYear}`);
      if (monthlyData) setMonthlySummary(monthlyData);

    } catch (error) {
      console.error('Error fetching budget data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and when month/year changes
  useEffect(() => {
    fetchBudgetData();
    fetchAIInsights();
  }, [selectedMonth, selectedYear]);

  const fetchAIInsights = async () => {
    try {
      setAiLoading(true);
      const token = localStorage.getItem('finguard-token');
      
      if (!token) {
        console.log('No auth token found for AI insights');
        setAiLoading(false);
        return;
      }

      // Fetch AI insights from multiple endpoints
      const [aiInsightsRes, budgetRecommendationsRes] = await Promise.all([
        fetch('http://localhost:5000/api/ai/financial-insights', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/ai/budget-recommendations', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const aiInsightsData = aiInsightsRes.ok ? await aiInsightsRes.json() : null;
      const budgetRecommendationsData = budgetRecommendationsRes.ok ? await budgetRecommendationsRes.json() : null;

      // Debug logging
      console.log('🐛 AI Insights Data:', aiInsightsData);
      console.log('🐛 Budget Recommendations Data:', budgetRecommendationsData);

      // Process and combine insights
      const insights = [];

      // Add spending pattern insights from the actual data structure
      if (aiInsightsData?.spendingPatterns) {
        const patterns = aiInsightsData.spendingPatterns;
        console.log('🐛 Processing spending patterns:', patterns);
        
        // Check if most volatile category exists and has high variance
        if (patterns.mostVolatileCategory && patterns.mostVolatileCategory[1]?.stdDev > 3000) {
          const categoryName = patterns.mostVolatileCategory[0];
          const stats = patterns.mostVolatileCategory[1];
          const variancePercent = Math.round((stats.stdDev / stats.mean) * 100);
          
          console.log('🐛 Adding volatility insight for:', categoryName);
          insights.push({
            type: 'warning',
            text: `Based on your spending patterns, your ${categoryName.toLowerCase()} expenses show high volatility (${variancePercent}% variance). Consider creating a more consistent budget.`,
            category: categoryName,
            impact: 'high',
            feedback: null
          });
        }
        
        // Check top spending category
        if (patterns.topSpendingCategory && patterns.topSpendingCategory[1]?.total > 50000) {
          const categoryName = patterns.topSpendingCategory[0];
          const stats = patterns.topSpendingCategory[1];
          
          console.log('🐛 Adding top spending insight for:', categoryName);
          insights.push({
            type: 'info',
            text: `Your top spending category is ${categoryName} with Rs. ${Math.round(stats.total).toLocaleString()}. This accounts for a significant portion of your expenses.`,
            category: categoryName,
            impact: 'medium',
            feedback: null
          });
        }
      }

      // Add budget recommendations as insights
      if (budgetRecommendationsData?.recommendations && Array.isArray(budgetRecommendationsData.recommendations)) {
        budgetRecommendationsData.recommendations.forEach(rec => {
          if (rec.action || rec.reasoning) {
            const potentialSaving = Math.round(rec.potentialSaving || 0);
            insights.push({
              type: rec.potentialSaving > 10000 ? 'warning' : 'suggestion',
              text: `${rec.action || rec.reasoning}${potentialSaving > 0 ? ` Potential savings: Rs. ${potentialSaving.toLocaleString()}` : ''}`,
              category: rec.category,
              impact: rec.potentialSaving > 10000 ? 'high' : 'medium',
              feedback: null
            });
          }
        });
      }

      // Add behavioral insights from the actual data structure
      if (aiInsightsData?.behavioralInsights) {
        const behavioral = aiInsightsData.behavioralInsights;
        
        // Weekend spending insight
        if (behavioral.weekendSpendingRatio !== undefined) {
          const weekendPercent = Math.round(behavioral.weekendSpendingRatio * 100);
          if (weekendPercent > 30) {
            insights.push({
              type: 'warning',
              text: `${weekendPercent}% of your spending occurs on weekends. Consider planning weekend budgets to better control expenses.`,
              category: 'Spending Behavior',
              impact: 'medium',
              feedback: null
            });
          } else if (weekendPercent < 15) {
            insights.push({
              type: 'success',
              text: `Great discipline! Only ${weekendPercent}% of your spending occurs on weekends. You're maintaining good weekday spending control.`,
              category: 'Spending Behavior',
              impact: 'positive',
              feedback: null
            });
          }
        }
        
        // Average transaction amount insight
        if (behavioral.averageTransactionAmount > 15000) {
          insights.push({
            type: 'info',
            text: `Your average transaction amount is Rs. ${Math.round(behavioral.averageTransactionAmount).toLocaleString()}. Consider breaking down large purchases or setting purchase limits.`,
            category: 'Transaction Behavior',
            impact: 'medium',
            feedback: null
          });
        }
      }

      // Force real data - remove fallback hardcoded insights completely
      // Generate insights from trend analysis if available
      if (aiInsightsData?.trendAnalysis) {
        const trend = aiInsightsData.trendAnalysis;
        if (trend.direction === 'decreasing' && trend.confidence > 80) {
          insights.push({
            type: 'success',
            text: `Excellent trend! Your spending is ${trend.direction} with ${trend.confidence}% confidence. Your financial discipline is improving over time.`,
            category: 'Spending Trend',
            impact: 'positive',
            feedback: null
          });
        } else if (trend.direction === 'increasing' && trend.confidence > 80) {
          insights.push({
            type: 'warning',
            text: `Your spending trend is ${trend.direction} with ${trend.confidence}% confidence. Consider reviewing your recent expenses to maintain control.`,
            category: 'Spending Trend',
            impact: 'high',
            feedback: null
          });
        }
      }

      // Only show fallback if absolutely no data is available
      if (insights.length === 0) {
        insights.push({
          type: 'info',
          text: 'Continue tracking expenses to unlock personalized AI insights based on your spending patterns and financial behavior.',
          category: 'Getting Started',
          impact: 'low',
          feedback: null
        });
      }

      setAiInsights(insights.slice(0, 4)); // Limit to top 4 insights
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      // Fallback insights for error state
      setAiInsights([
        {
          type: 'info',
          text: 'AI insights are temporarily unavailable. Continue tracking your expenses for personalized recommendations.',
          category: 'System',
          impact: 'low',
          feedback: null
        }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  // Clear messages after 3 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Modal controls
  const openBudgetSettings = () => setIsBudgetSettingsOpen(true);
  const closeBudgetSettings = () => {
    setIsBudgetSettingsOpen(false);
    setNewBudget({
      category: '',
      limit_amount: '',
      month: selectedMonth,
      year: selectedYear
    });
  };
  const openSavingsModal = () => setIsSavingsModalOpen(true);
  const closeSavingsModal = () => setIsSavingsModalOpen(false);

  // Handle adding new budget
  const handleAddBudget = async () => {
    if (!newBudget.category || !newBudget.limit_amount) {
      setError('Please fill in all budget fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiCall('/api/budgets', {
        method: 'POST',
        body: JSON.stringify({
          category: newBudget.category,
          limit_amount: parseFloat(newBudget.limit_amount),
          month: newBudget.month,
          year: newBudget.year
        })
      });

      if (response) {
        setSuccess(`Budget for ${newBudget.category} added successfully!`);
        
        // Update challenge progress based on this budget creation
        try {
          const token = localStorage.getItem('finguard-token');
          if (token) {
            await fetch('http://localhost:5000/api/challenges/update-progress', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                transactionType: 'budget',
                amount: parseFloat(newBudget.limit_amount),
                category: newBudget.category,
                date: new Date().toISOString().split('T')[0],
                budgetAction: 'create'
              })
            });
          }
        } catch (error) {
          console.error('Error updating challenge progress:', error);
          // Don't fail the budget creation if challenge update fails
        }
        
        closeBudgetSettings();
        fetchBudgetData(); // Refresh data
      }
    } catch (error) {
      setError('Failed to add budget');
    } finally {
      setLoading(false);
    }
  };

  // Handle updating existing budget
  const handleUpdateBudget = async (budgetId, updatedData) => {
    setLoading(true);
    setError('');

    try {
      const response = await apiCall(`/api/budgets/${budgetId}`, {
        method: 'PUT',
        body: JSON.stringify(updatedData)
      });

      if (response) {
        setSuccess('Budget updated successfully!');
        
        // Update challenge progress based on this budget update
        try {
          const token = localStorage.getItem('finguard-token');
          if (token) {
            await fetch('http://localhost:5000/api/challenges/update-progress', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                transactionType: 'budget',
                amount: parseFloat(updatedData.limit_amount || 0),
                category: updatedData.category || 'General',
                date: new Date().toISOString().split('T')[0],
                budgetAction: 'update'
              })
            });
          }
        } catch (error) {
          console.error('Error updating challenge progress:', error);
          // Don't fail the budget update if challenge update fails
        }
        
        fetchBudgetData(); // Refresh data
      }
    } catch (error) {
      setError('Failed to update budget');
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting budget
  const handleDeleteBudget = async (budgetId) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) return;

    setLoading(true);
    setError('');

    try {
      const response = await apiCall(`/api/budgets/${budgetId}`, {
        method: 'DELETE'
      });

      if (response) {
        setSuccess('Budget deleted successfully!');
        fetchBudgetData(); // Refresh data
      }
    } catch (error) {
      setError('Failed to delete budget');
    } finally {
      setLoading(false);
    }
  };

  // Save savings goal (for now just local state)
  const handleSaveSavingsGoal = () => {
    setSuccess('Savings goal updated successfully!');
    closeSavingsModal();
  };

  // Get category icon - updated to match ExpensePage
  const getCategoryIcon = (categoryName) => {
    const iconMap = {
      'food': '🍽️', 'dining': '🍽️', 'restaurant': '🍽️',
      'groceries': '🛒', 'grocery': '🛒', 'food shopping': '🛒',
      'transportation': '🚗', 'transport': '🚗', 'car': '🚗', 'fuel': '⛽',
      'entertainment': '🎮', 'movies': '🎬', 'games': '🎮',
      'utilities': '⚡', 'electricity': '⚡', 'water': '💧', 'gas': '🔥',
      'shopping': '🛍️', 'clothes': '👕', 'clothing': '👕',
      'healthcare': '🏥', 'medical': '🏥', 'health': '🏥',
      'education': '📚', 'books': '📚', 'course': '🎓',
      'travel': '✈️', 'vacation': '🏖️', 'hotel': '🏨',
      'rent': '🏠', 'housing': '🏠', 'home': '🏠',
      'insurance': '🛡️', 'phone': '📱', 'internet': '📡',
      'personal care': '🧴', 'care': '🧴',
      'maintenance': '🔧', 'repair': '🔧',
      'subscription': '📺', 'membership': '📺'
    };

    const categoryLower = categoryName.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
      if (categoryLower.includes(key)) {
        return icon;
      }
    }
    return '💸'; // Default expense icon
  };

  // Message Alert Component
  const MessageAlert = ({ message, type }) => {
    if (!message) return null;
    
    return (
      <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
        type === 'error' 
          ? 'bg-red-100 text-red-800 border border-red-200' 
          : 'bg-green-100 text-green-800 border border-green-200'
      }`}>
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1">{message}</span>
      </div>
    );
  };

  // Budget Settings Modal
  const BudgetSettingsModal = () => {
    if (!isBudgetSettingsOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-semibold">Budget Management</h3>
              <p className={`mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Add and manage your monthly budget limits</p>
            </div>
            <button 
              onClick={closeBudgetSettings} 
              className={`transition-colors ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <XCircle size={24} />
            </button>
          </div>
          
          {/* Add New Budget Form */}
          <div className="bg-blue-50 hover:bg-blue-50 dark:bg-blue-50 dark:hover:bg-blue-50 p-4 rounded-lg mb-6">
            <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Add New Budget</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={newBudget.category}
                onChange={(e) => setNewBudget({...newBudget, category: e.target.value})}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Category</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>
                    {getCategoryIcon(cat)} {cat}
                  </option>
                ))}
              </select>
              
              {/* ✅ FIXED: Proper focus handling for budget amount input */}
              <input
                type="number"
                placeholder="Budget Limit (LKR)"
                value={newBudget.limit_amount}
                onChange={(e) => setNewBudget({...newBudget, limit_amount: e.target.value})}
                onFocus={(e) => e.target.select()} 
                onClick={(e) => e.target.focus()}
                min="0"
                step="1000"
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                autoComplete="off"
                inputMode="numeric"
              />
              
              <select
                value={newBudget.month}
                onChange={(e) => setNewBudget({...newBudget, month: parseInt(e.target.value)})}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Array.from({length: 12}, (_, i) => (
                  <option key={i+1} value={i+1}>
                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
              
              <button
                onClick={handleAddBudget}
                disabled={loading || !newBudget.category || !newBudget.limit_amount}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
                Add Budget
              </button>
            </div>
            
            {/* Preview of what will be added */}
            {newBudget.category && newBudget.limit_amount && (
              <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border border-blue-200">
                <p className="text-sm text-blue-700">
                  <strong>Preview:</strong> {getCategoryIcon(newBudget.category)} {newBudget.category} - 
                  LKR {parseFloat(newBudget.limit_amount || 0).toLocaleString()} for{' '}
                  {new Date(newBudget.year, newBudget.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>

          {/* Existing Budgets List */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white">Current Budgets ({Array.isArray(budgets) ? budgets.length : 0})</h4>
            
            {(!Array.isArray(budgets) || budgets.length === 0) ? (
              <div className="text-center py-8 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No budgets set for this month</p>
                <p className="text-sm">Add your first budget above</p>
              </div>
            ) : (
              (Array.isArray(budgets) ? budgets : []).map((budget) => (
                <div key={budget?.id || Math.random()} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getCategoryIcon(budget?.category || 'Other')}</span>
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white dark:text-white">{budget?.category || 'Unknown Category'}</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Budget: LKR {parseFloat(budget?.limit_amount || 0).toLocaleString()}
                        </p>
                        {budget.alert_triggered && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
                            <Mail className="w-3 h-3 mr-1" />
                            Alert Sent
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteBudget(budget?.id)}
                        className="text-red-600 hover:text-red-800 text-sm px-3 py-1 rounded hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  // Savings Goal Modal
  const SavingsGoalModal = () => {
    if (!isSavingsModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`rounded-2xl p-6 max-w-lg w-full shadow-xl transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xl font-bold">Savings Goal</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Set and track your savings target</p>
            </div>
            <button onClick={closeSavingsModal} className="text-gray-500 hover:text-gray-700 dark:text-gray-200">
              <XCircle size={22} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-200 block mb-1">Goal Name</label>
              <input
                type="text"
                value={savingsGoal.name}
                onChange={(e) => setSavingsGoal({ ...savingsGoal, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="text-sm text-gray-700 dark:text-gray-200 block mb-1">Target Amount (LKR)</label>
              <input
                type="number"
                value={savingsGoal.amount}
                onChange={(e) => setSavingsGoal({ ...savingsGoal, amount: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring focus:ring-blue-200"
                min="0"
                step="1"
              />
            </div>

            <div>
              <label className="text-sm text-gray-700 dark:text-gray-200 block mb-1">Current Saved (LKR)</label>
              <input
                type="number"
                value={savingsGoal.saved}
                onChange={(e) => setSavingsGoal({ ...savingsGoal, saved: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring focus:ring-blue-200"
                min="0"
                step="1"
              />
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
                <span>Progress</span>
                <span>{Math.min((savingsGoal.saved / savingsGoal.amount) * 100, 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((savingsGoal.saved / savingsGoal.amount) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                LKR {Math.max(savingsGoal.amount - savingsGoal.saved, 0).toLocaleString()} remaining
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={closeSavingsModal}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSavingsGoal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Goal
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AnimatedPage>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Navbar />

        <div className="max-w-6xl mx-auto p-6 space-y-8">
          {/* Global Messages */}
          <MessageAlert message={error} type="error" />
          <MessageAlert message={success} type="success" />

          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className={`text-3xl font-bold text-left mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Budget Management</h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Track spending, set limits, and receive smart alerts</p>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} • 
                Categories: {availableCategories.length} available
              </p>
            </div>
            
            {/* Month/Year Selector */}
            <div className="flex items-center space-x-3">
              <label className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                View Data For:
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className={`px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2024, i).toLocaleDateString('en-US', { month: 'long' })}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className={`px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Monthly Overview */}
          <div className={`p-6 rounded-lg shadow transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Monthly Overview</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={openBudgetSettings}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" /> Manage Budgets
                </button>
                <button 
                  onClick={openSavingsModal}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors flex items-center gap-2"
                >
                  <Target className="w-4 h-4" /> Savings Goal
                </button>
              </div>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-700 font-medium">Total Income</p>
                    <p className="text-2xl font-bold text-green-800">
                      LKR {monthlySummary.income.toLocaleString()}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-700 font-medium">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-800">
                      LKR {monthlySummary.expenses.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-red-600" />
                </div>
              </div>

              <div className={`p-4 rounded-lg ${monthlySummary.balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium ${monthlySummary.balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                      Net Balance
                    </p>
                    <p className={`text-2xl font-bold ${monthlySummary.balance >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                      LKR {monthlySummary.balance.toLocaleString()}
                    </p>
                  </div>
                  <BarChart3 className={`w-8 h-8 ${monthlySummary.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                </div>
              </div>
            </div>

            {/* Savings Goal Display */}
            <div className="bg-blue-50 hover:bg-blue-50 dark:bg-blue-50 dark:hover:bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Target className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900 dark:text-white">{savingsGoal.name}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-blue-700 font-bold text-lg">LKR {savingsGoal.saved.toLocaleString()}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">of LKR {savingsGoal.amount.toLocaleString()}</p>
              </div>
              <div className="w-full bg-blue-200 hover:bg-blue-200 dark:bg-blue-200 dark:hover:bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min((savingsGoal.saved / savingsGoal.amount) * 100, 100)}%` }} 
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {((savingsGoal.saved / savingsGoal.amount) * 100).toFixed(1)}% complete
              </p>
            </div>
          </div>

          {/* Budget vs Spending Breakdown */}
          <div className={`p-6 rounded-lg shadow transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Budget vs Spending</h3>
              <button 
                onClick={fetchBudgetData}
                className={`px-3 py-1 text-sm rounded-lg flex items-center gap-1 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600 dark:text-gray-300">Loading budget data...</p>
              </div>
            ) : budgetSummary.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No budgets set for this month</p>
                <button 
                  onClick={openBudgetSettings}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  Set your first budget
                </button>
              </div>
            ) : (
              budgetSummary.map((item, i) => {
                const percent = item.budget_limit > 0 ? (item.spent / item.budget_limit) * 100 : 0;
                const isOverBudget = item.status === 'Over Budget';
                
                return (
                  <div key={i} className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getCategoryIcon(item.category)}</span>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white">{item.category}</h4>
                          <p className="text-sm text-gray-500">
                            LKR {item.spent.toFixed(2)} / LKR {item.budget_limit.toLocaleString()} 
                            {item.remaining >= 0 ? (
                              <span className="text-green-600"> • LKR {item.remaining.toFixed(2)} remaining</span>
                            ) : (
                              <span className="text-red-600"> • LKR {Math.abs(item.remaining).toFixed(2)} over budget</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOverBudget && (
                          <div className="bg-red-100 p-1 rounded cursor-pointer" title="Over budget - Alert triggered">
                            <Bell className="w-4 h-4 text-red-600" />
                          </div>
                        )}
                        {percent > 80 && !isOverBudget && (
                          <div className="bg-yellow-100 p-1 rounded cursor-pointer" title="Close to budget limit">
                            <Lightbulb className="w-4 h-4 text-yellow-600" />
                          </div>
                        )}
                        <span className={`text-sm font-medium px-2 py-1 rounded ${
                          isOverBudget ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              isOverBudget ? 'bg-red-500' : percent <= 70 ? 'bg-green-500' : 'bg-orange-500'
                            }`}
                            style={{ width: `${Math.min(percent, 100)}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{percent.toFixed(0)}%</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Active Alerts */}
          {budgetAlerts.length > 0 && (
            <div className={`rounded-xl shadow-sm p-6 transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
            } border`}>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                Active Budget Alerts ({budgetAlerts.length})
              </h3>

              {budgetAlerts.map((alert) => (
                <div key={alert.id} className="bg-red-100 border-l-4 border-red-400 p-3 text-sm text-red-800 rounded mb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">🚨 Budget Alert: {alert.category}</p>
                      <p className="text-xs text-red-600 mt-1">
                        Alert triggered for {new Date(alert.created_at || Date.now()).toLocaleDateString()} • 
                        Email notification sent
                      </p>
                    </div>
                    <Mail className="w-4 h-4 text-red-600" />
                  </div>
                </div>
              ))}

              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-3">Email Notification Settings</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-3">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="text-sm text-gray-700 dark:text-gray-200">Send email when budget exceeded</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="text-sm text-gray-700 dark:text-gray-200">Send email at 80% of budget</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm text-gray-700 dark:text-gray-200">Weekly budget summaries</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* AI Budget Insights */}
          <div className={`rounded-xl shadow-sm p-6 transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
          } border`}>
            <div className="flex items-center mb-4">
              <Zap className={`w-6 h-6 mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>AI Budget Insights</h3>
            </div>

            {aiLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-4`}>
                    <div className={`h-4 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded mb-2`}></div>
                    <div className={`h-3 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded w-3/4`}></div>
                  </div>
                ))}
              </div>
            ) : aiInsights.length === 0 ? (
              <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <Brain className="w-8 h-8" />
                </div>
                <p className="text-lg font-medium mb-2">AI Learning Your Patterns</p>
                <p className="text-sm">Continue adding transactions to unlock personalized insights and recommendations.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {aiInsights.map((insight, index) => (
                  <div key={index} className={`${
                    insight.type === 'warning' ? (isDarkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200') :
                    insight.type === 'success' ? (isDarkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200') :
                    insight.type === 'suggestion' ? (isDarkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200') :
                    (isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200')
                  } rounded-lg p-4 border`}>
                    <div className="flex items-start justify-between">
                      <p className={`flex-1 text-sm ${
                        insight.type === 'warning' ? (isDarkMode ? 'text-red-300' : 'text-red-800') :
                        insight.type === 'success' ? (isDarkMode ? 'text-green-300' : 'text-green-800') :
                        insight.type === 'suggestion' ? (isDarkMode ? 'text-blue-300' : 'text-blue-800') :
                        (isDarkMode ? 'text-gray-300' : 'text-gray-700')
                      }`}>
                        {insight.text}
                      </p>
                      <div className="flex items-center space-x-2 ml-4">
                        <button className="text-green-600 hover:text-green-700 transition-colors p-1">
                          <CheckCircle size={16} />
                        </button>
                        <button className="text-red-600 hover:text-red-700 transition-colors p-1">
                          <XCircle size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* General Notifications */}
          <div className={`rounded-xl shadow-sm p-6 transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
          } border`}>
            <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Smart Category Recommendations</h3>

            {/* Dynamic insights based on data */}
            {budgetSummary.some(item => item.status === 'Over Budget') && (
              <div className="bg-red-100 border-l-4 border-red-400 p-3 text-sm text-red-800 rounded mb-3">
                💡 You have exceeded budgets in {budgetSummary.filter(item => item.status === 'Over Budget').length} categories this month
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Consider reviewing your spending in these areas</p>
              </div>
            )}

            {monthlySummary.balance < 0 && (
              <div className="bg-orange-100 border-l-4 border-orange-400 p-3 text-sm text-orange-800 rounded mb-3">
                ⚠️ Your expenses exceed your income by LKR {Math.abs(monthlySummary.balance).toLocaleString()} this month
                <p className="text-xs text-gray-500 mt-1">Consider reducing expenses or increasing income</p>
              </div>
            )}

            {budgetSummary.some(item => item.status === 'Within Budget') && (
              <div className="bg-green-100 border-l-4 border-green-400 p-3 text-sm text-green-800 rounded mb-3">
                ✅ Great job! You're staying within budget in {budgetSummary.filter(item => item.status === 'Within Budget').length} categories
                <p className="text-xs text-gray-500 mt-1">Keep up the good spending habits</p>
              </div>
            )}

            {budgets.length === 0 && (
              <div className="bg-blue-100 hover:bg-blue-100 dark:bg-blue-100 dark:hover:bg-blue-100 border-l-4 border-blue-400 p-3 text-sm text-blue-800 rounded mb-3">
                💡 Set up budgets to track your spending and receive alerts when you're close to limits
                <p className="text-xs text-gray-500 mt-1">
                  <button 
                    onClick={openBudgetSettings}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Create your first budget
                  </button>
                </p>
              </div>
            )}

            {/* AI Recommendations Button */}
            <div className="mt-4 text-center">
              <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-2 mx-auto">
                <Zap className="w-5 h-5" /> 
                Get AI-Powered Recommendations
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Analyze your spending patterns and get personalized advice
              </p>
            </div>
          </div>

          {/* Historical Trends */}
          <div className={`p-6 rounded-lg shadow transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Spending Trends</h3>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Track your spending patterns over time</p>
            
            <SpendingAnalyticsChart budgetData={budgetSummary} isDarkMode={isDarkMode} />
          </div>

          {/* Quick Actions */}
          <div className={`p-6 rounded-lg shadow transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={openBudgetSettings}
                className={`p-4 border rounded-lg hover:shadow-md transition-shadow text-left ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <Settings className="w-8 h-8 text-blue-600 mb-2" />
                <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Manage Budgets</h4>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Add, edit, or delete budget categories</p>
              </button>
              
              <button 
                onClick={() => window.location.href = '/expense'}
                className={`p-4 border rounded-lg hover:shadow-md transition-shadow text-left ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <Plus className="w-8 h-8 text-green-600 mb-2" />
                <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Add Expense</h4>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Record a new expense transaction</p>
              </button>
              
              <button 
                onClick={fetchBudgetData}
                className={`p-4 border rounded-lg hover:shadow-md transition-shadow text-left ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <RefreshCw className="w-8 h-8 text-purple-600 mb-2" />
                <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Refresh Data</h4>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Update budget and spending information</p>
              </button>
            </div>
          </div>
        </div>

        {/* AI Budget Insights - Admin and Premium Users Only */}
        {isPremium() && (
          <>
            {/* AI Budget Insights Section */}
            <div className={`mt-8 p-6 rounded-xl shadow-sm transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="flex items-center mb-6">
                <Brain className={`w-6 h-6 mr-3 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <div>
                  <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    AI Budget Insights
                  </h2>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    AI-powered budget recommendations and variance analysis
                  </p>
                </div>
              </div>

              {/* AI Budget Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Budget Variance Alert */}
                {budgetSummary.filter(b => (b.spent / b.budget_limit) > 0.8).length > 0 && (
                  <div className={`p-4 rounded-lg border-l-4 border-yellow-500 ${
                    isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'
                  }`}>
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                      <div>
                        <h4 className={`font-semibold ${isDarkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>
                          Budget Alert
                        </h4>
                        <p className={`text-sm ${isDarkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
                          {budgetSummary.filter(b => (b.spent / b.budget_limit) > 0.8).length} categories are above 80% of budget
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Optimization Suggestion */}
                <div className={`p-4 rounded-lg border-l-4 border-blue-500 ${
                  isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'
                }`}>
                  <div className="flex items-start">
                    <Lightbulb className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                    <div>
                      <h4 className={`font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                        Smart Suggestion
                      </h4>
                      <p className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                        Consider increasing your {budgetSummary.length > 0 ? budgetSummary[0]?.category : 'Food'} budget by 10% based on spending patterns
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Budget Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Budget Efficiency
                      </p>
                      <p className={`text-xl font-bold text-green-600`}>
                        {budgetSummary.length > 0 ? 
                          Math.round((budgetSummary.reduce((sum, b) => sum + b.spent, 0) / 
                          budgetSummary.reduce((sum, b) => sum + b.budget_limit, 0)) * 100) : 0}%
                      </p>
                    </div>
                    <Target className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Categories Tracked
                      </p>
                      <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {budgets.length}
                      </p>
                    </div>
                    <BarChart3 className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Avg Monthly Spend
                      </p>
                      <p className={`text-xl font-bold text-purple-600`}>
                        Rs. {budgetSummary.length > 0 ? 
                          Math.round(budgetSummary.reduce((sum, b) => sum + b.spent, 0)).toLocaleString() : 0}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* AI Spending Pattern Analysis */}
            <div className="mt-8">
              <SpendingPatternAnalysis />
            </div>
          </>
        )}

        {/* Modals */}
        <BudgetSettingsModal />
        <SavingsGoalModal />
      </div>
    </AnimatedPage>
  );
};

// Spending Analytics Chart Component
const SpendingAnalyticsChart = ({ budgetData, isDarkMode }) => {
  const [timeframe, setTimeframe] = useState('monthly');
  const [analyticsData, setAnalyticsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateAnalyticsData();
  }, [budgetData, timeframe]);

  const generateAnalyticsData = () => {
    setLoading(true);
    
    // Generate spending trends data based on budget data
    const currentDate = new Date();
    const months = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        spending: budgetData.reduce((total, category) => {
          // Simulate spending variance (70-120% of budget)
          const variance = 0.7 + (Math.random() * 0.5);
          return total + (category.current_spent * variance);
        }, 0),
        budget: budgetData.reduce((total, category) => total + category.budget_limit, 0),
      });
    }
    
    setAnalyticsData(months);
    setLoading(false);
  };


  if (loading) {
    return (
      <div className="animate-pulse">
        <div className={`h-6 rounded w-1/3 mb-4 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}></div>
        <div className={`h-48 rounded-lg ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}></div>
      </div>
    );
  }

  const chartData = {
    labels: analyticsData.map(d => d.month),
    datasets: [
      {
        label: 'Budget',
        data: analyticsData.map(d => d.budget),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: 'Actual Spending',
        data: analyticsData.map(d => d.spending),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: isDarkMode ? '#9ca3af' : '#6b7280',
        },
      },
      tooltip: {
        backgroundColor: isDarkMode ? '#374151' : '#ffffff',
        titleColor: isDarkMode ? '#ffffff' : '#000000',
        bodyColor: isDarkMode ? '#ffffff' : '#000000',
        borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: Rs.${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: isDarkMode ? 'rgba(156, 163, 175, 0.2)' : '#e5e7eb',
          drawBorder: false,
        },
        ticks: {
          color: isDarkMode ? '#9ca3af' : '#6b7280',
        }
      },
      y: {
        grid: {
          color: isDarkMode ? 'rgba(156, 163, 175, 0.2)' : '#e5e7eb',
          drawBorder: false,
        },
        ticks: {
          color: isDarkMode ? '#9ca3af' : '#6b7280',
          callback: function(value) {
            return `Rs.${value.toLocaleString()}`;
          }
        }
      }
    }
  };

  return (
    <div>
      <div className="h-48 mb-4">
        <Bar data={chartData} options={chartOptions} />
      </div>
      
      {/* Time Period Selector */}
      <div className="flex gap-2 text-sm mb-4">
        {[
          { key: 'monthly', label: 'Monthly' },
          { key: 'quarterly', label: 'Quarterly' },
          { key: 'yearly', label: 'Yearly' }
        ].map((period) => (
          <button
            key={period.key}
            onClick={() => setTimeframe(period.key)}
            className={`px-3 py-1 rounded transition-colors ${
              timeframe === period.key
                ? 'bg-blue-600 text-white'
                : isDarkMode
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Avg Monthly Spending</div>
          <div className="text-xl font-bold text-blue-600">
            Rs.{Math.round(analyticsData.reduce((sum, d) => sum + d.spending, 0) / analyticsData.length).toLocaleString()}
          </div>
        </div>
        
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Budget Utilization</div>
          <div className="text-xl font-bold text-green-600">
            {Math.round((analyticsData.reduce((sum, d) => sum + d.spending, 0) / analyticsData.reduce((sum, d) => sum + d.budget, 0)) * 100)}%
          </div>
        </div>
        
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Categories Tracked</div>
          <div className="text-xl font-bold text-purple-600">
            {budgetData.length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetPage;