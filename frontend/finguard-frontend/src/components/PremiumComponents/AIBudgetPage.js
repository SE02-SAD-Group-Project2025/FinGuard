import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../../hooks/useSubscription';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  ThumbsUp, 
  ThumbsDown, 
  HelpCircle,
  ShoppingCart,
  Car,
  Utensils,
  Zap,
  RotateCcw,
  CheckCircle,
  XCircle,
  SparklesIcon,
  Crown
} from 'lucide-react';
import Navbar from '../Navbar';
import AnimatedPage from '../AnimatedPage';

const AIBudgetPage = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { isPremium, user } = useSubscription();
  const [timeframe, setTimeframe] = useState('This month');
  const [viewMode, setViewMode] = useState('monthly');
  const [simulatorValues, setSimulatorValues] = useState({
    food: 25000,
    transport: 15000,
    utilities: 8000,
    shopping: 12000
  });
  const [explainModalState, setExplainModalState] = useState({
    isOpen: false,
    categoryId: null
  });
  const [appliedChanges, setAppliedChanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAppliedChanges, setShowAppliedChanges] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [error, setError] = useState('');

  // Fetch real AI data on component mount
  useEffect(() => {
    const fetchAIData = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('finguard-token');
        
        if (!token) {
          throw new Error('Authentication token not found');
        }

        const response = await fetch('http://localhost:5000/api/ai/budget-recommendations', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setAiData(data);
      } catch (err) {
        console.error('Error fetching AI data:', err);
        setError(`Failed to load AI recommendations: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAIData();
  }, []);

  // Convert AI data to component format with fallback
  const userInsights = aiData?.insights?.map((insight, index) => ({
    id: index + 1,
    text: insight.text,
    type: insight.type,
    feedback: null
  })) || [
    {
      id: 1,
      text: "Based on your spending patterns, you're overspending in Food & Dining by 23% compared to the recommended 15% of income.",
      type: 'warning',
      feedback: null
    },
    {
      id: 2,
      text: "Great job! Your transportation costs are 12% below optimal levels, leaving room for other priorities.",
      type: 'success',
      feedback: null
    },
    {
      id: 3,
      text: "Consider setting up automatic savings transfers to reach your financial goals 3 months earlier.",
      type: 'suggestion',
      feedback: null
    }
  ];

  // Create fallback recommendation data if API fails
  const fallbackRecommendations = [
    {
      category: 'Food & Dining',
      currentSpending: 32000,
      suggestedBudget: 25000,
      potentialSavings: 7000,
      status: 'over',
      confidence: 0.89
    },
    {
      category: 'Transportation',
      currentSpending: 18000,
      suggestedBudget: 15000,
      potentialSavings: 3000,
      status: 'over',
      confidence: 0.76
    },
    {
      category: 'Bills & Utilities',
      currentSpending: 8500,
      suggestedBudget: 8000,
      potentialSavings: 500,
      status: 'optimal',
      confidence: 0.92
    },
    {
      category: 'Shopping',
      currentSpending: 15000,
      suggestedBudget: 12000,
      potentialSavings: 3000,
      status: 'over',
      confidence: 0.81
    }
  ];

  const categoryData = (aiData?.recommendations || fallbackRecommendations)?.map((rec, index) => {
    const getIconForCategory = (category) => {
      if (category.includes('Food') || category.includes('Dining')) return Utensils;
      if (category.includes('Transport') || category.includes('Car') || category.includes('Fuel')) return Car;
      if (category.includes('Utilities') || category.includes('Bills')) return Zap;
      if (category.includes('Shopping') || category.includes('Clothing')) return ShoppingCart;
      return ShoppingCart; // Default icon
    };

    const getColorForStatus = (status) => {
      switch (status) {
        case 'over': return 'bg-red-500';
        case 'under': return 'bg-green-500';
        case 'optimal': return 'bg-blue-500';
        default: return 'bg-gray-500';
      }
    };

    return {
      id: (rec.category || 'unknown').toLowerCase().replace(/\s+/g, '-'),
      name: rec.category || 'Unknown Category',
      icon: getIconForCategory(rec.category || ''),
      current: Number(rec.current) || 0,
      suggested: Number(rec.suggested) || 0,
      status: rec.status || 'neutral',
      color: getColorForStatus(rec.status || 'neutral'),
      recommendation: rec.recommendation || ''
    };
  }) || [];

  const budgetHistory = [
    {
      date: '2025-07-10',
      category: 'Food & Dining',
      previous: 30000,
      new: 25000,
      source: 'AI',
      applied: false
    },
    {
      date: '2025-07-08',
      category: 'Shopping',
      previous: 15000,
      new: 12000,
      source: 'Manual',
      applied: true
    }
  ];

  const handleSliderChange = (category, value) => {
    setSimulatorValues(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleApplyBudget = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('finguard-token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const newChanges = categoryData.map(cat => ({
        date: new Date().toISOString().split('T')[0],
        category: cat.name,
        previous: cat.current,
        new: cat.suggested,
        source: 'AI',
        applied: true
      }));

      // Save to backend
      const response = await fetch('http://localhost:5000/api/budgets/apply-ai-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recommendations: newChanges,
          totalSavings: categoryData.reduce((sum, cat) => sum + (cat.current - cat.suggested), 0)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to apply AI recommendations');
      }

      const result = await response.json();
      setAppliedChanges(prev => [...prev, ...newChanges]);
      
      // Note: categoryData is static - in real implementation this would update the user's budget data in the database

      if (window.showToast) {
        window.showToast('AI Budget recommendations applied successfully!', 'success', 3000, [
          { label: 'View Changes', onClick: () => setShowAppliedChanges(true) }
        ]);
      } else {
        alert('AI Budget recommendations applied successfully!');
      }

    } catch (error) {
      console.error('Error applying AI recommendations:', error);
      
      // Fallback to local storage for offline functionality
      const newChanges = categoryData.map(cat => ({
        date: new Date().toISOString().split('T')[0],
        category: cat.name,
        previous: cat.current,
        new: cat.suggested,
        source: 'AI',
        applied: true
      }));
      
      localStorage.setItem('pending-ai-recommendations', JSON.stringify(newChanges));
      
      if (window.showToast) {
        window.showToast('Recommendations saved locally. Will sync when connection is restored.', 'warning');
      } else {
        alert('Recommendations saved locally. Will sync when connection is restored.');
      }
    } finally {
      setLoading(false);
    }
  };

  const totalSavings = aiData?.summary?.totalPotentialSavings || 0;

  const StatusBadge = ({ status }) => {
    const configs = {
      over: { 
        color: isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800', 
        text: 'Overspent' 
      },
      under: { 
        color: isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800', 
        text: 'Under Budget' 
      },
      optimal: { 
        color: isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800', 
        text: 'Optimal' 
      },
      default: {
        color: isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600',
        text: 'Unknown'
      }
    };
    
    // Use default config if status is undefined or not found
    const config = configs[status] || configs.default;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const ExplainModal = ({ isOpen, onClose, categoryId }) => {
    if (!isOpen) return null;

    // Find the category data based on the ID
    const category = categoryData.find(cat => cat.id === categoryId) || categoryData[0];
    const difference = category.current - category.suggested;
    const percentageChange = Math.abs(difference / category.current * 100).toFixed(0);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 max-w-lg w-full mx-4 shadow-xl`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Why this recommendation for {category.name}?</h3>
            <button 
              onClick={onClose} 
              className={`${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
            >
              <XCircle size={24} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className={`${isDarkMode ? 'bg-blue-900 bg-opacity-50' : 'bg-blue-50'} p-4 rounded-lg`}>
              <h4 className={`font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-900'} mb-2`}>AI Analysis</h4>
              <p className={`${isDarkMode ? 'text-blue-200' : 'text-blue-800'} text-sm`}>
                Based on your spending patterns over the last 3 months, your {category.name.toLowerCase()} expenses 
                have {difference > 0 ? 'increased' : 'decreased'} by {percentageChange}%. 
                Our model suggests {difference > 0 ? 'reducing' : 'increasing'} by LKR {Math.abs(difference).toLocaleString()} 
                to align with your savings goals.
              </p>
            </div>
            
            <div className={`${isDarkMode ? 'bg-green-900 bg-opacity-50' : 'bg-green-50'} p-4 rounded-lg`}>
              <h4 className={`font-medium ${isDarkMode ? 'text-green-300' : 'text-green-900'} mb-2`}>Peer Comparison</h4>
              <p className={`${isDarkMode ? 'text-green-200' : 'text-green-800'} text-sm`}>
                Users with similar income levels spend {difference > 0 ? '18% less' : '12% more'} on {category.name.toLowerCase()}. 
                This adjustment brings you closer to optimal spending patterns.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button 
                onClick={() => {
                  handleApplyBudget();
                  onClose();
                }}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply This Change
              </button>
              <button 
                onClick={onClose}
                className={`flex-1 border ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} py-2 px-4 rounded-lg transition-colors`}
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Check premium access
  if (!isPremium()) {
    return (
      <AnimatedPage>
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen`}>
          <Navbar />
          <div className="flex items-center justify-center min-h-96">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-8 max-w-md mx-auto text-center`}>
              <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Premium Feature</h2>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
                AI Budget with smart recommendations is available for Premium users only. Upgrade to access AI-powered budget optimization.
              </p>
              <button
                onClick={() => navigate('/subscription/plans')}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors"
              >
                Upgrade to Premium
              </button>
            </div>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen`}>
        <Navbar/>
        
        {/* Loading State */}
        {loading && !aiData && (
          <div className="flex items-center justify-center min-h-96">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-8 max-w-md mx-auto text-center`}>
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Loading AI Analysis</h2>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Analyzing your spending patterns and generating personalized recommendations...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex items-center justify-center min-h-96">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-8 max-w-md mx-auto text-center`}>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Unable to Load AI Recommendations</h2>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Main Content - Only show when data is loaded */}
        {aiData && !loading && (
        <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-sm`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Hello, {user?.username || 'User'} 👋</h1>
              <div className="flex items-center mt-2">
                <span className={`${isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'} px-3 py-1 rounded-full text-sm font-medium`}>
                  {aiData.summary?.categoriesAnalyzed || 0} Categories • {aiData.summary?.budgetsSet || 0} Budgets Set
                </span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <select 
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className={`border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option>This month</option>
                <option>Last 3 months</option>
                <option>Custom range</option>
              </select>
              
              <div className={`flex ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-1`}>
                <button
                  onClick={() => setViewMode('monthly')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'monthly' 
                      ? isDarkMode ? 'bg-gray-600 text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm' 
                      : isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setViewMode('weekly')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'weekly' 
                      ? isDarkMode ? 'bg-gray-600 text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm'
                      : isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  Weekly
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights Panel */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-sm`}>
          <div className="flex items-center mb-4">
            <Brain className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>AI Budget Insights</h2>
          </div>
          
          <div className="space-y-3">
            {userInsights.map((insight) => (
              <div key={insight.id} className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                <div className="flex items-start justify-between">
                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-800'} flex-1`}>{insight.text}</p>
                  <div className="flex space-x-2 ml-4">
                    <button className="text-green-600 hover:text-green-700 transition-colors">
                      <ThumbsUp size={18} />
                    </button>
                    <button className="text-red-600 hover:text-red-700 transition-colors">
                      <ThumbsDown size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Recommendations */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-sm`} id="category-recommendations">
          <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6`}>Smart Category Recommendations</h2>
          
          {categoryData.length === 0 ? (
            <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Building AI Recommendations</h3>
              <p className="text-sm">
                Your spending patterns are being analyzed. Add more transactions for personalized AI recommendations.
              </p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categoryData.map((category) => {
              const Icon = category.icon;
              const difference = category.current - category.suggested;
              
              return (
                <div 
                  key={category.id} 
                  className={`border ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} rounded-xl p-4 hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg ${category.color} bg-opacity-20`}>
                        <Icon className={`w-5 h-5 ${category.color.replace('bg-', 'text-')}`} />
                      </div>
                      <div className="ml-3">
                        <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{category.name}</h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>LKR {(category.current || 0).toLocaleString()}</p>
                      </div>
                    </div>
                    <StatusBadge status={category.status} />
                  </div>
                  
                  {difference !== 0 && (
                    <div className="mb-3">
                      <div className="flex items-center">
                        {difference > 0 ? (
                          <TrendingDown className="w-4 h-4 text-green-600 mr-1" />
                        ) : (
                          <TrendingUp className="w-4 h-4 text-blue-600 mr-1" />
                        )}
                        <span className={`text-sm font-medium ${difference > 0 ? 'text-green-600' : 'text-blue-600'}`}>
                          {difference > 0 ? 'Reduce' : 'Increase'} by LKR {Math.abs(difference || 0).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        New limit: LKR {(category.suggested || 0).toLocaleString()}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-blue-700 transition-colors">
                      Apply to Budget
                    </button>
                    <button 
                      onClick={() => setExplainModalState({ isOpen: true, categoryId: category.id })}
                      className={`p-2 border ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'} rounded-lg transition-colors`}
                    >
                      <HelpCircle size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>

        {/* What-If Budget Simulator */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-sm`} id="budget-simulator">
          <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6`}>What-If Budget Simulator</h2>
          
          {categoryData.length === 0 ? (
            <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">Budget Simulator Available</h3>
              <p className="text-sm mb-4">
                Create budgets and add transactions to unlock interactive What-If scenarios
              </p>
              <button 
                onClick={() => navigate('/budget')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Set Up Budgets
              </button>
            </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {categoryData.map((category) => (
                <div key={category.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{category.name}</span>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      LKR {simulatorValues[category.id]?.toLocaleString() || category.suggested?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50000"
                    value={simulatorValues[category.id] || category.suggested || 0}
                    onChange={(e) => handleSliderChange(category.id, parseInt(e.target.value))}
                    className={`w-full h-2 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-lg appearance-none cursor-pointer`}
                  />
                </div>
              ))}
            </div>
            
            <div className={`${isDarkMode ? 'bg-blue-900 bg-opacity-50' : 'bg-blue-50'} rounded-lg p-4`}>
              <h3 className={`font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-900'} mb-3`}>Impact Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={`${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}>Total Monthly Budget:</span>
                  <span className={`font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}>
                    LKR {Object.values(simulatorValues).reduce((a, b) => a + b, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}>Projected Savings:</span>
                  <span className="font-medium text-green-600">
                    LKR {Math.max(0, 80000 - Object.values(simulatorValues).reduce((a, b) => a + b, 0)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}>Savings Goal Timeline:</span>
                  <span className={`font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}>8.2 months</span>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>

        {categoryData.length > 0 && (
        <>
        {/* Before vs After Comparison */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-sm`}>
          <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6`}>Before vs. After Budget Comparison</h2>
          
          <div className="space-y-4">
            {categoryData.map((category) => (
              <div key={category.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{category.name}</span>
                  <span className="text-sm text-red-600">
                    {(category.current || 0) - (category.suggested || 0) > 0 ? '↓' : '↑'} LKR {Math.abs((category.current || 0) - (category.suggested || 0)).toLocaleString()}
                  </span>
                </div>
                
                <div className="space-y-1">
                  {/* Before */}
                  <div className="flex items-center">
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} w-16`}>Before</span>
                    <div className={`flex-1 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-full h-2 mr-3`}>
                      <div 
                        className="bg-red-400 h-2 rounded-full"
                        style={{width: `${((category.current || 0) / 35000) * 100}%`}}
                      />
                    </div>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} w-20`}>LKR {(category.current || 0).toLocaleString()}</span>
                  </div>
                  
                  {/* After */}
                  <div className="flex items-center">
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} w-16`}>After</span>
                    <div className={`flex-1 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-full h-2 mr-3`}>
                      <div 
                        className="bg-green-400 h-2 rounded-full"
                        style={{width: `${(category.suggested / 35000) * 100}%`}}
                      />
                    </div>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} w-20`}>LKR {(category.suggested || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </>
        )}

        {/* Budget Decision History */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-sm`}>
          <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6`}>Budget Decision History</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                  <th className={`text-left py-3 px-4 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Date</th>
                  <th className={`text-left py-3 px-4 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Category</th>
                  <th className={`text-left py-3 px-4 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Previous</th>
                  <th className={`text-left py-3 px-4 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>New</th>
                  <th className={`text-left py-3 px-4 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Source</th>
                  <th className={`text-left py-3 px-4 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Action</th>
                </tr>
              </thead>
              <tbody>
                {[...budgetHistory, ...appliedChanges].map((item, index) => (
                  <tr key={index} className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                    <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{item.date}</td>
                    <td className={`py-3 px-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.category}</td>
                    <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>LKR {item.previous.toLocaleString()}</td>
                    <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>LKR {item.new.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.source === 'AI' 
                          ? isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'
                          : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.source}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button className="text-blue-600 hover:text-blue-700 text-sm">
                        <RotateCcw size={16} className="inline mr-1" />
                        Revert
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sticky Apply Bar */}
        <div className={`fixed bottom-0 left-0 right-0 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t p-4 shadow-lg`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Total potential savings: <span className="font-medium text-green-600">LKR {totalSavings.toLocaleString()}</span>
              </span>
            </div>
            
            <div className="flex space-x-3">
              <button className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all">
                <SparklesIcon size={16} className="mr-2" />
                Generate
              </button>
              <button 
                onClick={handleApplyBudget}
                className={`flex items-center px-4 py-2 border ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-lg transition-colors`}
              >
                <Brain size={16} className="mr-2" />
                Apply AI Budget
              </button>
            </div>
          </div>
        </div>
      </div>
        )}

        {/* Explain Modal */}
        <ExplainModal 
          isOpen={explainModalState.isOpen} 
          onClose={() => setExplainModalState({ isOpen: false, categoryId: null })}
          categoryId={explainModalState.categoryId}
        />
      </div>
    </AnimatedPage>
  );
}

export default AIBudgetPage;