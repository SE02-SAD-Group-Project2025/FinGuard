import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Brain, Target, AlertTriangle, DollarSign, Users, RefreshCw } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const PremiumAnalyticsDashboard = () => {
  const { isDarkMode } = useTheme();
  const [analytics, setAnalytics] = useState(null);
  const [insights, setInsights] = useState([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('last_30_days');
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedTimeframe, selectedMetric]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('finguard-token');
      if (!token) {
        console.log('No auth token found');
        setLoading(false);
        return;
      }

      // Get current date info
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      // Fetch real data from multiple endpoints
      const [summaryRes, budgetRes, transactionsRes, healthRes] = await Promise.all([
        fetch(`http://localhost:5000/api/summary?month=${currentMonth}&year=${currentYear}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://localhost:5000/api/budgets/summary?month=${currentMonth}&year=${currentYear}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/transactions', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/summary/financial-health', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const summaryData = summaryRes.ok ? await summaryRes.json() : { income: 0, expenses: 0, balance: 0 };
      const budgetData = budgetRes.ok ? await budgetRes.json() : [];
      const transactionsData = transactionsRes.ok ? await transactionsRes.json() : [];

      // Process analytics data
      const analytics = {
        totalRevenue: summaryData.income || 0,
        totalExpenses: summaryData.expenses || 0,
        netProfit: (summaryData.income || 0) - (summaryData.expenses || 0),
        growthRate: 0, // Calculate based on historical data
        transactionCount: transactionsData.length || 0,
        averageTransaction: transactionsData.length > 0 ? 
          transactionsData.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) / transactionsData.length : 0,
        topCategory: 'General', // Calculate from transactions
        conversionRate: transactionsData.length > 0 ? 
          Math.round((summaryData.income > 0 ? (summaryData.balance / summaryData.income) : 0) * 100) : 0, // Real conversion rate based on savings rate
        customerLTV: 12000, // Customer lifetime value
        monthlyRecurring: summaryData.income * 0.3, // Estimate
        budget: {
          totalBudget: budgetData.reduce((sum, b) => sum + (parseFloat(b.budget_limit) || 0), 0),
          totalSpent: budgetData.reduce((sum, b) => sum + (parseFloat(b.spent) || 0), 0),
          categories: budgetData.map(b => ({
            name: b.category,
            budget: parseFloat(b.budget_limit) || 0,
            spent: parseFloat(b.spent) || 0,
            variance: budgetData.length > 0 ? 
              (((parseFloat(b.spent) || 0) - (parseFloat(b.budget_limit) || 0)) / (parseFloat(b.budget_limit) || 1)) * 100 : 0
          }))
        },
        predictions: {
          nextMonthIncome: summaryData.income || 0,
          nextMonthExpenses: summaryData.expenses || 0,
          projectedSavings: (summaryData.income || 0) - (summaryData.expenses || 0),
          budgetRisk: summaryData.expenses > summaryData.income ? 'high' : 'low',
          confidenceLevel: 70 // Base confidence level
        },
        goals: {
          emergencyFund: { target: 150000, current: summaryData.balance || 0, progress: ((summaryData.balance || 0) / 150000) * 100 },
          savingsGoal: { target: 100000, current: summaryData.balance || 0, progress: ((summaryData.balance || 0) / 100000) * 100 }
        }
      };

      // Generate real insights from data
      const generatedInsights = [];
      
      // Budget variance insights
      budgetData.forEach(budget => {
        const variance = ((parseFloat(budget.spent) || 0) - (parseFloat(budget.budget_limit) || 0)) / (parseFloat(budget.budget_limit) || 1) * 100;
        
        if (variance > 20) {
          generatedInsights.push({
            id: `budget-${budget.category}`,
            type: 'warning',
            category: 'Budget Variance',
            title: `${budget.category} Budget Exceeded`,
            description: `Your ${budget.category.toLowerCase()} expenses are ${Math.round(variance)}% over budget this month.`,
            impact: variance > 50 ? 'high' : 'medium',
            actionRequired: true,
            recommendation: `Consider reducing ${budget.category.toLowerCase()} spending and review recent purchases.`,
            potentialSavings: Math.max(0, (parseFloat(budget.spent) || 0) - (parseFloat(budget.budget_limit) || 0))
          });
        } else if (variance < -10) {
          generatedInsights.push({
            id: `budget-under-${budget.category}`,
            type: 'success',
            category: 'Budget Performance',
            title: `${budget.category} Under Budget`,
            description: `Great job! You're ${Math.abs(Math.round(variance))}% under budget for ${budget.category.toLowerCase()}.`,
            impact: 'positive',
            actionRequired: false,
            recommendation: `Consider redirecting unused ${budget.category.toLowerCase()} budget to savings.`,
            potentialSavings: 0
          });
        }
      });

      // Savings rate insight
      const savingsRate = summaryData.income > 0 ? ((summaryData.balance / summaryData.income) * 100) : 0;
      if (savingsRate > 20) {
        generatedInsights.push({
          id: 'savings-rate',
          type: 'success',
          category: 'Savings Achievement',
          title: 'Excellent Savings Rate',
          description: `Your ${savingsRate.toFixed(1)}% savings rate is above the recommended 20%. Keep up the great work!`,
          impact: 'positive',
          actionRequired: false,
          recommendation: 'Consider investing the excess savings for better returns.',
          potentialSavings: 0
        });
      } else if (savingsRate < 10) {
        generatedInsights.push({
          id: 'low-savings-rate',
          type: 'warning',
          category: 'Savings Concern',
          title: 'Low Savings Rate',
          description: `Your ${savingsRate.toFixed(1)}% savings rate is below the recommended 20%. Consider reducing expenses.`,
          impact: 'high',
          actionRequired: true,
          recommendation: 'Review your expenses and identify areas where you can cut back.',
          potentialSavings: summaryData.income * 0.2 - summaryData.balance
        });
      }

      setAnalytics(analytics);
      setInsights(generatedInsights);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      setInsights([]);
    } finally {
      setLoading(false);
    }
  };

  const timeframes = [
    { value: 'last_7_days', label: 'Last 7 Days' },
    { value: 'last_30_days', label: 'Last 30 Days' },
    { value: 'last_3_months', label: 'Last 3 Months' },
    { value: 'last_6_months', label: 'Last 6 Months' },
    { value: 'last_year', label: 'Last Year' }
  ];

  const metrics = [
    { value: 'all', label: 'All Metrics' },
    { value: 'spending', label: 'Spending Analysis' },
    { value: 'budget', label: 'Budget Performance' },
    { value: 'savings', label: 'Savings & Goals' },
    { value: 'predictions', label: 'Predictive Analytics' }
  ];

  const getInsightColor = (type) => {
    switch (type) {
      case 'success':
        return isDarkMode ? 'bg-green-900/20 border-green-800 text-green-400' : 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return isDarkMode ? 'bg-yellow-900/20 border-yellow-800 text-yellow-400' : 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return isDarkMode ? 'bg-blue-900/20 border-blue-800 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const getImpactIcon = (impact) => {
    switch (impact) {
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      case 'positive':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen p-8 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-8 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Brain className={`w-8 h-8 mr-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <div>
                <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Premium Analytics Dashboard
                </h1>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  AI-powered insights and advanced financial analytics
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className={`px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {timeframes.map(tf => (
                  <option key={tf.value} value={tf.value}>{tf.label}</option>
                ))}
              </select>
              
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className={`px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {metrics.map(metric => (
                  <option key={metric.value} value={metric.value}>{metric.label}</option>
                ))}
              </select>
              
              <button
                onClick={loadAnalyticsData}
                disabled={loading}
                className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700' 
                    : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                } disabled:opacity-50`}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className={`p-6 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Total Revenue
                  </p>
                  <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Rs. {analytics.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className={`p-6 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Total Expenses
                  </p>
                  <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Rs. {analytics.totalExpenses.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-red-500" />
              </div>
            </div>
            
            <div className={`p-6 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Net Profit
                  </p>
                  <p className={`text-2xl font-bold ${analytics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Rs. {analytics.netProfit.toLocaleString()}
                  </p>
                </div>
                <BarChart3 className={`w-8 h-8 ${analytics.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              </div>
            </div>
            
            <div className={`p-6 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Transactions
                  </p>
                  <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {analytics.transactionCount}
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </div>
          </div>
        )}

        {/* AI Insights Section */}
        {insights.length > 0 && (
          <div className={`p-6 rounded-lg shadow-sm mb-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center mb-6">
              <Brain className={`w-6 h-6 mr-3 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                AI-Powered Insights
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.map((insight) => (
                <div key={insight.id} className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center">
                      {getImpactIcon(insight.impact)}
                      <h3 className="font-semibold ml-2">{insight.title}</h3>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${insight.impact === 'high' ? 'bg-red-100 text-red-800' : insight.impact === 'positive' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                      {insight.impact} impact
                    </span>
                  </div>
                  <p className="text-sm mb-2">{insight.description}</p>
                  <p className="text-xs font-medium">💡 {insight.recommendation}</p>
                  {insight.potentialSavings > 0 && (
                    <p className="text-xs font-semibold text-green-600 mt-1">
                      Potential savings: Rs. {insight.potentialSavings.toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Budget Performance */}
        {analytics && analytics.budget && (
          <div className={`p-6 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Budget Performance
            </h2>
            
            <div className="space-y-4">
              {analytics.budget.categories.map((category, index) => (
                <div key={index} className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {category.name}
                    </h3>
                    <div className={`text-sm font-medium ${category.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {category.variance > 0 ? '+' : ''}{category.variance.toFixed(1)}%
                    </div>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Rs. {category.spent.toLocaleString()} / Rs. {category.budget.toLocaleString()}</span>
                    <span>{category.budget > 0 ? ((category.spent / category.budget) * 100).toFixed(1) : 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${category.variance > 0 ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(100, category.budget > 0 ? (category.spent / category.budget) * 100 : 0)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PremiumAnalyticsDashboard;