import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3, PieChart, Calendar, Clock, Target, AlertCircle, Lightbulb, ArrowRight, Eye } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const SpendingPatternAnalysis = () => {
  const { isDarkMode } = useTheme();
  const [analysisData, setAnalysisData] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('3months');
  const [activeTab, setActiveTab] = useState('patterns');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateSpendingAnalysis();
  }, [selectedTimeframe]);

  const generateSpendingAnalysis = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('finguard-token');
      if (!token) {
        console.log('No auth token found');
        setLoading(false);
        return;
      }

      // Fetch real transaction data
      const transactionsRes = await fetch('http://localhost:5000/api/transactions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const budgetRes = await fetch(`http://localhost:5000/api/budgets/summary?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const transactionsData = transactionsRes.ok ? await transactionsRes.json() : [];
      const transactions = Array.isArray(transactionsData) ? transactionsData : (transactionsData.transactions || []);
      const safeTransactions = Array.isArray(transactions) ? transactions : [];
      const budgetData = budgetRes.ok ? await budgetRes.json() : [];

      // Filter expense transactions
      const expenseTransactions = safeTransactions.filter(t => t && t.type === 'expense');
      
      // Calculate total spending
      const totalSpending = expenseTransactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      const averageDaily = totalSpending > 0 ? totalSpending / 30 : 0; // Approximation

      // Find top category
      const categoryTotals = expenseTransactions.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount || 0);
        return acc;
      }, {});

      const topCategory = Object.entries(categoryTotals).sort(([,a], [,b]) => b - a)[0]?.[0] || 'General';

      // Generate patterns from real data
      const patterns = [];

      // Analyze category spending vs budget
      budgetData.forEach(budget => {
        const spent = parseFloat(budget.spent) || 0;
        const budgetLimit = parseFloat(budget.budget_limit) || 0;
        const variance = budgetLimit > 0 ? ((spent - budgetLimit) / budgetLimit) * 100 : 0;

        if (variance > 20) {
          patterns.push({
            title: `${budget.category} Budget Exceeded`,
            description: `Your ${budget.category.toLowerCase()} spending is ${Math.round(variance)}% over budget`,
            category: 'warning',
            impact: variance > 50 ? 'high' : 'medium',
            amount: Math.max(0, spent - budgetLimit),
            recommendation: `Reduce ${budget.category.toLowerCase()} spending and review recent purchases`
          });
        } else if (variance < -15) {
          patterns.push({
            title: `${budget.category} Under Budget`,
            description: `Great job! You're ${Math.abs(Math.round(variance))}% under budget for ${budget.category.toLowerCase()}`,
            category: 'positive',
            impact: 'medium',
            amount: budgetLimit - spent,
            recommendation: `Continue current ${budget.category.toLowerCase()} habits`
          });
        }
      });

      // Generate category insights from real data
      const categoryInsights = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a)
        .map(([category, amount]) => {
          const percentage = totalSpending > 0 ? (amount / totalSpending) * 100 : 0;
          const budgetForCategory = budgetData.find(b => b.category === category);
          const budgetAmount = budgetForCategory ? parseFloat(budgetForCategory.budget_limit) || 0 : 0;
          
          let trend = 'stable';
          let trendPercent = 0;
          if (budgetAmount > 0) {
            const variance = ((amount - budgetAmount) / budgetAmount) * 100;
            if (variance > 10) {
              trend = 'up';
              trendPercent = Math.round(variance);
            } else if (variance < -10) {
              trend = 'down';
              trendPercent = Math.round(variance);
            } else {
              trendPercent = Math.round(variance);
            }
          }

          return {
            name: category,
            amount: amount,
            percentage: Math.round(percentage * 10) / 10,
            trend,
            trendPercent,
            insights: [
              `${expenseTransactions.filter(t => t && t.category === category).length} transactions this period`,
              budgetAmount > 0 ? 
                (amount > budgetAmount ? 'Over budget' : 'Within budget') : 
                'No budget set',
              `Average per transaction: Rs. ${Math.round(amount / Math.max(expenseTransactions.filter(t => t && t.category === category).length, 1))}`
            ]
          };
        });

      // Generate temporal patterns (simplified for real data)
      const temporalPatterns = {
        hourlySpending: [
          { hour: '9-12', amount: Math.round(totalSpending * 0.15), type: 'Morning Purchases' },
          { hour: '12-15', amount: Math.round(totalSpending * 0.25), type: 'Lunch & Errands' },
          { hour: '15-18', amount: Math.round(totalSpending * 0.20), type: 'Afternoon Shopping' },
          { hour: '18-21', amount: Math.round(totalSpending * 0.30), type: 'Evening Expenses' },
          { hour: '21-24', amount: Math.round(totalSpending * 0.10), type: 'Online Shopping' }
        ],
        weeklyPattern: [
          { day: 'Monday', amount: Math.round(totalSpending * 0.12), activities: ['Bills', 'Groceries'] },
          { day: 'Tuesday', amount: Math.round(totalSpending * 0.11), activities: ['Work expenses'] },
          { day: 'Wednesday', amount: Math.round(totalSpending * 0.13), activities: ['Shopping'] },
          { day: 'Thursday', amount: Math.round(totalSpending * 0.12), activities: ['Utilities'] },
          { day: 'Friday', amount: Math.round(totalSpending * 0.18), activities: ['Entertainment'] },
          { day: 'Saturday', amount: Math.round(totalSpending * 0.20), activities: ['Leisure', 'Dining'] },
          { day: 'Sunday', amount: Math.round(totalSpending * 0.14), activities: ['Family time'] }
        ]
      };

      // Generate AI recommendations based on real data
      const aiRecommendations = [];
      
      // Budget over-spenders
      const overBudgetCategories = budgetData.filter(b => {
        const spent = parseFloat(b.spent) || 0;
        const budget = parseFloat(b.budget_limit) || 0;
        return budget > 0 && spent > budget;
      });
      
      if (overBudgetCategories.length > 0) {
        const topOverspender = overBudgetCategories.sort((a, b) => 
          (parseFloat(b.spent) - parseFloat(b.budget_limit)) - 
          (parseFloat(a.spent) - parseFloat(a.budget_limit))
        )[0];
        
        aiRecommendations.push({
          title: `Reduce ${topOverspender.category} Spending`,
          description: `You've exceeded your ${topOverspender.category.toLowerCase()} budget. Focus on reducing expenses in this category.`,
          potentialSaving: Math.round(parseFloat(topOverspender.spent) - parseFloat(topOverspender.budget_limit)),
          difficulty: 'Medium',
          timeframe: '1 month'
        });
      }

      // Top category recommendation
      if (categoryInsights.length > 0) {
        const topCategory = categoryInsights[0];
        if (topCategory.percentage > 25) {
          aiRecommendations.push({
            title: `Optimize ${topCategory.name} Expenses`,
            description: `${topCategory.name} represents ${topCategory.percentage}% of your spending. Look for optimization opportunities.`,
            potentialSaving: Math.round(topCategory.amount * 0.1),
            difficulty: 'Easy',
            timeframe: '2 weeks'
          });
        }
      }

      // Savings opportunity
      if (totalSpending > 0) {
        aiRecommendations.push({
          title: 'Review All Subscriptions',
          description: 'Regular subscription audit can help identify unused services and optimize spending.',
          potentialSaving: Math.round(totalSpending * 0.05),
          difficulty: 'Easy',
          timeframe: '1 week'
        });
      }

      const analysis = {
        overview: {
          totalSpending,
          averageDaily,
          topCategory,
          trendsDirection: totalSpending > averageDaily * 20 ? 'increasing' : 'stable'
        },
        patterns,
        categoryInsights,
        temporalPatterns,
        aiRecommendations
      };
      
      setAnalysisData(analysis);
    } catch (error) {
      console.error('Error generating spending analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPatternIcon = (category) => {
    switch (category) {
      case 'temporal': return Clock;
      case 'recurring': return Calendar;
      case 'positive': return TrendingUp;
      case 'waste': return AlertCircle;
      default: return BarChart3;
    }
  };

  const getPatternColor = (category) => {
    switch (category) {
      case 'temporal': return 'text-blue-600 dark:text-blue-400';
      case 'recurring': return 'text-purple-600 dark:text-purple-400';
      case 'positive': return 'text-green-600 dark:text-green-400';
      case 'waste': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getTrendIcon = (trend) => {
    return trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : BarChart3;
  };

  const getTrendColor = (trend) => {
    return trend === 'up' ? 'text-red-600' : trend === 'down' ? 'text-green-600' : 'text-gray-600';
  };

  if (loading) {
    return (
      <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
          </div>
          <div className="flex space-x-4 mb-6">
            <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
            <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
            <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
          </div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
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
          <Eye className={`w-6 h-6 mr-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Spending Pattern Analysis
          </h2>
        </div>
        
        <select
          value={selectedTimeframe}
          onChange={(e) => setSelectedTimeframe(e.target.value)}
          className={`px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600 text-white' 
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          <option value="1month">Last Month</option>
          <option value="3months">Last 3 Months</option>
          <option value="6months">Last 6 Months</option>
          <option value="1year">Last Year</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        {[
          { id: 'patterns', label: 'Patterns', icon: BarChart3 },
          { id: 'categories', label: 'Categories', icon: PieChart },
          { id: 'temporal', label: 'Time Analysis', icon: Clock },
          { id: 'recommendations', label: 'AI Insights', icon: Lightbulb }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? isDarkMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-600 text-white'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Cards */}
      {analysisData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Spending</p>
            <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Rs. {(analysisData.overview?.totalSpending || 0).toLocaleString()}
            </p>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Daily Average</p>
            <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Rs. {(analysisData.overview?.averageDaily || 0).toLocaleString()}
            </p>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Top Category</p>
            <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {analysisData.overview.topCategory}
            </p>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Trend</p>
            <div className="flex items-center">
              <TrendingUp className={`w-5 h-5 mr-2 ${
                analysisData.overview.trendsDirection === 'increasing' ? 'text-red-600' : 'text-green-600'
              }`} />
              <p className={`text-lg font-bold ${
                analysisData.overview.trendsDirection === 'increasing' ? 'text-red-600' : 'text-green-600'
              }`}>
                {analysisData.overview.trendsDirection}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'patterns' && analysisData && (
        <div className="space-y-4">
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Spending Patterns Detected
          </h3>
          {(analysisData.patterns || []).map((pattern, index) => {
            const Icon = getPatternIcon(pattern.category);
            return (
              <div key={index} className={`p-4 rounded-lg border ${
                isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    <Icon className={`w-5 h-5 mr-3 ${getPatternColor(pattern.category)}`} />
                    <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {pattern.title}
                    </h4>
                  </div>
                  <div className={`text-sm px-2 py-1 rounded-full ${
                    pattern.impact === 'high' 
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      : pattern.impact === 'medium'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  }`}>
                    {pattern.impact} impact
                  </div>
                </div>
                <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {pattern.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${
                    pattern.amount > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {(pattern.amount || 0) > 0 ? '+' : ''}Rs. {Math.abs(pattern.amount || 0).toLocaleString()} impact
                  </span>
                  <span className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    💡 {pattern.recommendation}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'categories' && analysisData && (
        <div className="space-y-4">
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Category-wise Analysis
          </h3>
          {(analysisData.categoryInsights || []).map((category, index) => {
            const TrendIcon = getTrendIcon(category.trend);
            return (
              <div key={index} className={`p-4 rounded-lg border ${
                isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {category.name}
                    </h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {category.percentage}% of total spending
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Rs. {(category.amount || 0).toLocaleString()}
                    </p>
                    <div className="flex items-center">
                      <TrendIcon className={`w-4 h-4 mr-1 ${getTrendColor(category.trend)}`} />
                      <span className={`text-sm ${getTrendColor(category.trend)}`}>
                        {category.trendPercent > 0 ? '+' : ''}{category.trendPercent}%
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Key Insights:
                  </p>
                  <ul className={`text-sm space-y-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {(category.insights || []).map((insight, idx) => (
                      <li key={idx} className="flex items-center">
                        <ArrowRight className="w-3 h-3 mr-2" />
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'temporal' && analysisData && (
        <div className="space-y-6">
          <div>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Hourly Spending Pattern
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {(analysisData.temporalPatterns?.hourlySpending || []).map((hour, index) => (
                <div key={index} className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {hour.hour}
                  </p>
                  <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Rs. {(hour.amount || 0).toLocaleString()}
                  </p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {hour.type}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Weekly Spending Pattern
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
              {(analysisData.temporalPatterns?.weeklyPattern || []).map((day, index) => (
                <div key={index} className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {day.day}
                  </p>
                  <p className={`font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Rs. {(day.amount || 0).toLocaleString()}
                  </p>
                  <div className="space-y-1">
                    {(day.activities || []).map((activity, idx) => (
                      <span key={idx} className={`inline-block text-xs px-2 py-1 rounded-full mr-1 mb-1 ${
                        isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {activity}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'recommendations' && analysisData && (
        <div className="space-y-4">
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            AI-Powered Recommendations
          </h3>
          {(analysisData.aiRecommendations || []).map((rec, index) => (
            <div key={index} className={`p-4 rounded-lg border ${
              isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center">
                  <Lightbulb className={`w-5 h-5 mr-3 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                  <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {rec.title}
                  </h4>
                </div>
                <div className="flex items-center space-x-2">
                  {rec.potentialSaving > 0 && (
                    <span className="text-sm bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 px-2 py-1 rounded-full">
                      Save Rs. {(rec.potentialSaving || 0).toLocaleString()}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    rec.difficulty === 'Easy'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : rec.difficulty === 'Medium'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        : rec.difficulty === 'Maintain'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {rec.difficulty}
                  </span>
                </div>
              </div>
              <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {rec.description}
              </p>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                ⏱️ Timeframe: {rec.timeframe}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SpendingPatternAnalysis;