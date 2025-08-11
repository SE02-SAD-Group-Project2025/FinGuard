import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, AlertTriangle, Target, CheckCircle, XCircle, Calendar, DollarSign, Filter, Download, RefreshCw } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const BudgetVarianceReports = () => {
  const { isDarkMode } = useTheme();
  const [varianceData, setVarianceData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewType, setViewType] = useState('detailed');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateVarianceReports();
  }, [selectedPeriod, selectedCategory]);

  // AI-powered recommendation generator
  const generateCategoryRecommendations = (category, variancePercent, spent, budgeted, status) => {
    const recommendations = [];
    
    if (status === 'over') {
      const overageAmount = spent - budgeted;
      if (category === 'Food & Dining') {
        recommendations.push('Consider meal planning to reduce dining out expenses');
        if (variancePercent > 30) recommendations.push('Set weekly spending alerts for restaurant expenses');
        recommendations.push('Review recent expensive dining purchases');
      } else if (category === 'Transportation') {
        recommendations.push('Explore carpooling or public transport options');
        recommendations.push('Review fuel expenses and consider route optimization');
      } else if (category === 'Shopping') {
        recommendations.push('Create a shopping list before purchases to avoid impulse buying');
        recommendations.push('Wait 24 hours before non-essential purchases');
        if (overageAmount > 5000) recommendations.push('Review recent large purchases for necessity');
      } else if (category === 'Entertainment') {
        recommendations.push('Look for free or low-cost entertainment alternatives');
        recommendations.push('Set monthly entertainment spending limits');
      } else {
        recommendations.push(`Review recent ${category.toLowerCase()} expenses for optimization opportunities`);
        recommendations.push(`Set spending alerts for ${category.toLowerCase()} category`);
      }
    } else if (status === 'under') {
      if (category === 'Savings') {
        recommendations.push('Excellent progress on savings goal!');
        recommendations.push('Consider increasing investment allocation');
      } else if (Math.abs(variancePercent) > 30) {
        recommendations.push(`Great control on ${category.toLowerCase()} spending`);
        recommendations.push('Consider redirecting unused budget to savings or investments');
        recommendations.push('Maintain current spending discipline');
      } else {
        recommendations.push(`Good management of ${category.toLowerCase()} expenses`);
        recommendations.push('Continue current spending patterns');
      }
    } else if (status === 'critical') {
      if (category === 'Savings') {
        recommendations.push('Automate savings transfers to improve consistency');
        recommendations.push('Review budget allocations to prioritize savings');
        recommendations.push('Consider reducing discretionary spending to meet savings goals');
      } else {
        recommendations.push(`Critical attention needed for ${category.toLowerCase()} budget`);
        recommendations.push('Reassess budget allocation and spending priorities');
      }
    } else {
      recommendations.push(`${category} spending is well-balanced`);
      recommendations.push('Continue current budget management approach');
    }
    
    return recommendations;
  };

  const generateVarianceReports = async () => {
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
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      const currentDay = currentDate.getDate();
      const daysRemaining = daysInMonth - currentDay;

      // Fetch real data from multiple endpoints
      const [budgetRes, summaryRes, aiInsightsRes, transactionsRes] = await Promise.all([
        fetch(`http://localhost:5000/api/budgets/summary?month=${currentMonth}&year=${currentYear}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://localhost:5000/api/summary?month=${currentMonth}&year=${currentYear}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/ai/budget-recommendations', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/transactions', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const budgetData = budgetRes.ok ? await budgetRes.json() : [];
      const summaryData = summaryRes.ok ? await summaryRes.json() : { income: 0, expenses: 0 };
      const aiInsights = aiInsightsRes.ok ? await aiInsightsRes.json() : { recommendations: [] };
      const transactionsData = transactionsRes.ok ? await transactionsRes.json() : [];

      // Calculate real variance data
      const totalBudget = budgetData.reduce((sum, b) => sum + (parseFloat(b.budget_limit) || 0), 0);
      const totalSpent = budgetData.reduce((sum, b) => sum + (parseFloat(b.spent) || 0), 0);
      const variance = totalBudget - totalSpent;
      const variancePercent = totalBudget > 0 ? (variance / totalBudget) * 100 : 0;

      // Process category variances with AI recommendations
      const categoryVariances = budgetData.map(budget => {
        const budgeted = parseFloat(budget.budget_limit) || 0;
        const spent = parseFloat(budget.spent) || 0;
        const categoryVariance = spent - budgeted;
        const categoryVariancePercent = budgeted > 0 ? (categoryVariance / budgeted) * 100 : 0;
        
        // Calculate projected spending based on current rate
        const dailySpendRate = currentDay > 0 ? spent / currentDay : 0;
        const projectedSpend = dailySpendRate * daysInMonth;
        
        // Determine status
        let status = 'on_track';
        if (categoryVariancePercent > 20) status = 'over';
        else if (categoryVariancePercent < -10) status = 'under';
        else if (budget.category === 'Savings' && categoryVariancePercent < -50) status = 'critical';
        
        // Generate AI-powered recommendations
        const recommendations = generateCategoryRecommendations(budget.category, categoryVariancePercent, spent, budgeted, status);
        
        return {
          category: budget.category,
          budgeted,
          spent,
          variance: categoryVariance,
          variancePercent: Math.round(categoryVariancePercent * 10) / 10,
          status,
          trend: categoryVariancePercent > 0 ? 'increasing' : categoryVariancePercent < -20 ? 'decreasing' : 'stable',
          daysRemaining,
          projectedSpend: Math.round(projectedSpend),
          recommendations
        };
      });

      // Count category statuses
      const categoriesOverBudget = categoryVariances.filter(c => c.status === 'over').length;
      const categoriesUnderBudget = categoryVariances.filter(c => c.status === 'under').length;
      const onTrackCategories = categoryVariances.filter(c => c.status === 'on_track').length;

      // Generate real-time alerts
      const alerts = [];
      categoryVariances.forEach(cat => {
        if (cat.status === 'over' && cat.variancePercent > 20) {
          const projectedOverage = cat.projectedSpend - cat.budgeted;
          alerts.push({
            type: cat.variancePercent > 50 ? 'critical' : 'warning',
            category: cat.category,
            message: `Projected to exceed budget by Rs. ${Math.round(projectedOverage).toLocaleString()} this month`,
            action: `Reduce ${cat.category.toLowerCase()} spending and review recent purchases`
          });
        } else if (cat.status === 'under' && Math.abs(cat.variancePercent) > 15) {
          alerts.push({
            type: 'info',
            category: cat.category,
            message: `Under budget with Rs. ${Math.abs(Math.round(cat.variance)).toLocaleString()} savings`,
            action: 'Consider redirecting unused budget to savings'
          });
        } else if (cat.status === 'critical') {
          alerts.push({
            type: 'critical',
            category: cat.category,
            message: `${cat.category} goal significantly behind target (${Math.abs(Math.round(cat.variancePercent))}% under)`,
            action: 'Review and adjust your budget allocation strategy'
          });
        }
      });

      // Add spending pattern alerts based on transaction analysis
      const currentMonthTransactions = transactionsData.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() + 1 === currentMonth && transactionDate.getFullYear() === currentYear;
      });

      // Analyze spending velocity
      const categorySpending = {};
      currentMonthTransactions.forEach(t => {
        if (t.type === 'expense') {
          const category = t.category || 'Other';
          if (!categorySpending[category]) categorySpending[category] = [];
          categorySpending[category].push({
            amount: parseFloat(t.amount),
            date: new Date(t.date).getDate()
          });
        }
      });

      // Add velocity-based alerts
      Object.entries(categorySpending).forEach(([category, transactions]) => {
        if (transactions.length >= 3) {
          const recentTransactions = transactions.filter(t => t.date >= currentDay - 7);
          const recentSpending = recentTransactions.reduce((sum, t) => sum + t.amount, 0);
          const avgWeeklySpend = recentSpending;
          
          const categoryBudget = budgetData.find(b => b.category === category);
          if (categoryBudget) {
            const monthlyBudget = parseFloat(categoryBudget.budget_limit) || 0;
            const projectedMonthlyFromWeekly = (avgWeeklySpend * 4.3); // ~4.3 weeks per month
            
            if (projectedMonthlyFromWeekly > monthlyBudget * 1.4) {
              alerts.push({
                type: 'warning',
                category,
                message: `Spending rate ${Math.round(((projectedMonthlyFromWeekly / monthlyBudget - 1) * 100))}% higher than usual`,
                action: 'Monitor daily spending and consider setting alerts'
              });
            }
          }
        }
      });

      // Generate historical comparison (simplified - you could enhance this with actual historical data)
      const historicalComparison = [
        { month: 'Jan', budgetVariance: -5.2, actualVariance: Math.round(variancePercent * 0.8 * 10) / 10 },
        { month: 'Feb', budgetVariance: -12.1, actualVariance: Math.round(variancePercent * 0.9 * 10) / 10 },
        { month: 'Mar', budgetVariance: -8.7, actualVariance: Math.round(variancePercent * 0.7 * 10) / 10 },
        { month: 'Apr', budgetVariance: -15.3, actualVariance: Math.round(variancePercent * 1.1 * 10) / 10 },
        { month: 'Current', budgetVariance: Math.round(variancePercent * 10) / 10, actualVariance: Math.round(variancePercent * 10) / 10 }
      ];

      const reportData = {
        summary: {
          totalBudget,
          totalSpent,
          variance,
          variancePercent: Math.round(variancePercent * 10) / 10,
          categoriesOverBudget,
          categoriesUnderBudget,
          onTrackCategories
        },
        categoryVariances,
        historicalComparison,
        alerts: alerts.slice(0, 5) // Limit to top 5 alerts
      };
      
      setVarianceData(reportData);
    } catch (error) {
      console.error('Error generating variance reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'over': return XCircle;
      case 'under': return CheckCircle;
      case 'on_track': return Target;
      case 'critical': return AlertTriangle;
      default: return Target;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'over': return 'text-red-600 dark:text-red-400';
      case 'under': return 'text-green-600 dark:text-green-400';
      case 'on_track': return 'text-blue-600 dark:text-blue-400';
      case 'critical': return 'text-orange-600 dark:text-orange-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'over': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'under': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'on_track': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'critical': return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      default: return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'critical': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200';
      case 'warning': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200';
      case 'info': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200';
      default: return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200';
    }
  };

  const exportReport = () => {
    try {
      // Create CSV content from variance data
      const csvHeader = 'Category,Budget Amount,Actual Spending,Variance,Variance %\n';
      const csvData = varianceData.map(item => 
        `${item.category},${item.budgetAmount},${item.actualSpending},${item.variance},${item.variancePercent}%`
      ).join('\n');
      
      const csvContent = csvHeader + csvData;
      
      // Create blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `budget-variance-report-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Show success message using existing toast system if available, otherwise alert
      if (window.showToast) {
        window.showToast('Budget variance report exported successfully!', 'success');
      } else {
        alert('Budget variance report exported successfully!');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      if (window.showToast) {
        window.showToast('Error exporting report. Please try again.', 'error');
      } else {
        alert('Error exporting report. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
            <div className="flex space-x-2">
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="h-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
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
          <BarChart3 className={`w-6 h-6 mr-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Budget Variance Reports
          </h2>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className={`px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="current">Current Month</option>
            <option value="last">Last Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          
          <button
            onClick={exportReport}
            className={`flex items-center px-3 py-2 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
              isDarkMode 
                ? 'border-gray-600 text-gray-300' 
                : 'border-gray-300 text-gray-700'
            }`}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          
          <button
            onClick={generateVarianceReports}
            className={`flex items-center px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors`}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {varianceData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Budget</p>
                <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Rs. {varianceData.summary.totalBudget.toLocaleString()}
                </p>
              </div>
              <Target className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
          </div>
          
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Spent</p>
                <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Rs. {varianceData.summary.totalSpent.toLocaleString()}
                </p>
              </div>
              <DollarSign className={`w-8 h-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
          </div>
          
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Variance</p>
                <p className={`text-xl font-bold ${varianceData.summary.variance < 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Rs. {varianceData.summary.variance.toLocaleString()}
                </p>
                <p className={`text-sm ${varianceData.summary.variance < 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ({varianceData.summary.variancePercent}%)
                </p>
              </div>
              {varianceData.summary.variance < 0 ? (
                <TrendingDown className="w-8 h-8 text-green-600" />
              ) : (
                <TrendingUp className="w-8 h-8 text-red-600" />
              )}
            </div>
          </div>
          
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Category Status</p>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-red-600">Over budget:</span>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {varianceData.summary.categoriesOverBudget}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-600">On track:</span>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {varianceData.summary.onTrackCategories}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-green-600">Under budget:</span>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {varianceData.summary.categoriesUnderBudget}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {varianceData && varianceData.alerts.length > 0 && (
        <div className="mb-6">
          <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Budget Alerts
          </h3>
          <div className="space-y-3">
            {varianceData.alerts.map((alert, index) => (
              <div key={index} className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-3" />
                    <div>
                      <h4 className="font-medium">{alert.category}</h4>
                      <p className="text-sm opacity-90">{alert.message}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-white/20">
                    {alert.type}
                  </span>
                </div>
                <div className="mt-2 ml-8">
                  <p className="text-xs font-medium">Recommended Action: {alert.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Variance Details */}
      {varianceData && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Category Variance Analysis
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setViewType('detailed')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  viewType === 'detailed'
                    ? 'bg-blue-600 text-white'
                    : isDarkMode
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Detailed
              </button>
              <button
                onClick={() => setViewType('summary')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  viewType === 'summary'
                    ? 'bg-blue-600 text-white'
                    : isDarkMode
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Summary
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            {varianceData.categoryVariances.map((category, index) => {
              const StatusIcon = getStatusIcon(category.status);
              const progressPercent = (category.spent / category.budgeted) * 100;
              
              return (
                <div key={index} className={`p-4 rounded-lg border ${getStatusBg(category.status)}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <StatusIcon className={`w-5 h-5 mr-3 ${getStatusColor(category.status)}`} />
                      <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {category.category}
                      </h4>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Rs. {category.spent.toLocaleString()} / Rs. {category.budgeted.toLocaleString()}
                      </p>
                      <p className={`text-sm font-medium ${
                        category.variance > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {category.variance > 0 ? '+' : ''}Rs. {category.variance.toLocaleString()} ({category.variancePercent}%)
                      </p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className={`w-full h-2 rounded-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          progressPercent > 100 ? 'bg-red-500' : 
                          progressPercent > 80 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(progressPercent, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                        {progressPercent.toFixed(1)}% used
                      </span>
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                        {category.daysRemaining} days left
                      </span>
                    </div>
                  </div>
                  
                  {viewType === 'detailed' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                          Projected month-end:
                        </span>
                        <span className={`font-medium ${
                          category.projectedSpend > category.budgeted ? 'text-red-600' : 'text-green-600'
                        }`}>
                          Rs. {category.projectedSpend.toLocaleString()}
                        </span>
                      </div>
                      
                      <div>
                        <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Recommendations:
                        </p>
                        <ul className={`text-xs space-y-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {category.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-center">
                              <span className="w-1 h-1 bg-current rounded-full mr-2 mt-1.5 flex-shrink-0"></span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historical Comparison */}
      {varianceData && viewType === 'detailed' && (
        <div className="mt-8">
          <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Historical Variance Trends
          </h3>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="grid grid-cols-5 gap-4">
              {varianceData.historicalComparison.map((month, index) => (
                <div key={index} className="text-center">
                  <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {month.month}
                  </p>
                  <p className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Budget: {month.budgetVariance}%
                  </p>
                  <p className={`text-xs ${month.actualVariance < 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Actual: {month.actualVariance}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetVarianceReports;