import React, { useState, useEffect } from 'react';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
} from 'chart.js';
import Navbar from './Navbar';
import AnimatedPage from './AnimatedPage';
import { useTheme } from '../contexts/ThemeContext';
import { 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  BarChart3, 
  Download,
  Calendar,
  Filter,
  DollarSign,
  Target,
  Activity,
  Award
} from 'lucide-react';
import axios from 'axios';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
);

const AdvancedReports = () => {
  const { isDarkMode } = useTheme();
  const [activeReport, setActiveReport] = useState('financial-overview');
  const [timeframe, setTimeframe] = useState('current_year');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const getToken = () => localStorage.getItem('finguard-token');

  const reportTypes = [
    { id: 'financial-overview', name: 'Financial Overview', icon: DollarSign },
    { id: 'category-spending', name: 'Category Analysis', icon: PieChart },
    { id: 'budget-vs-actual', name: 'Budget vs Actual', icon: Target },
    { id: 'spending-trends', name: 'Spending Trends', icon: TrendingUp },
    { id: 'budget-efficiency', name: 'Budget Efficiency', icon: Award }
  ];

  const timeframeOptions = [
    { value: 'current_year', label: 'Current Year' },
    { value: 'last_year', label: 'Last Year' },
    { value: 'last_6_months', label: 'Last 6 Months' },
    { value: 'last_3_months', label: 'Last 3 Months' }
  ];

  const fetchReportData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = getToken();
      if (!token) {
        setError('Authentication required');
        return;
      }

      let endpoint = '';
      let params = {};

      switch (activeReport) {
        case 'financial-overview':
          endpoint = '/api/analytics/financial-overview';
          params = { timeframe };
          break;
        case 'category-spending':
          endpoint = '/api/analytics/category-spending';
          params = { timeframe, year: selectedYear };
          if (selectedCategory) params.category = selectedCategory;
          break;
        case 'budget-vs-actual':
          endpoint = '/api/analytics/budget-vs-actual';
          params = { year: selectedYear };
          break;
        case 'spending-trends':
          endpoint = '/api/analytics/spending-trends';
          params = { months: timeframe === 'last_6_months' ? 6 : 12 };
          break;
        case 'budget-efficiency':
          endpoint = '/api/analytics/budget-efficiency';
          params = { year: selectedYear };
          break;
        default:
          endpoint = '/api/analytics/financial-overview';
      }

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      setData(response.data);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError(err.response?.data?.error || 'Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [activeReport, timeframe, selectedYear, selectedCategory]);

  const generateChartColors = (count) => {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
    ];
    return colors.slice(0, count);
  };

  const renderFinancialOverview = () => {
    if (!data) return null;

    // Safe data extraction with fallbacks
    const summary = data.summary || { totalIncome: 0, totalExpenses: 0, netSavings: 0, savingsRate: 0 };
    const currentBudget = data.currentBudget || { totalBudget: 0, totalSpent: 0, remaining: 0, efficiency: 0 };
    const insights = data.insights || { primaryIncomeSource: 'Unknown', spendingPattern: 'Unknown', financialHealth: 'Unknown' };

    const overviewData = {
      labels: ['Income', 'Expenses', 'Savings'],
      datasets: [{
        data: [summary.totalIncome, summary.totalExpenses, summary.netSavings],
        backgroundColor: ['#10B981', '#EF4444', '#3B82F6'],
        borderColor: ['#059669', '#DC2626', '#2563EB'],
        borderWidth: 2
      }]
    };

    const savingsData = {
      labels: ['Saved', 'Spent'],
      datasets: [{
        data: [summary.netSavings, summary.totalExpenses],
        backgroundColor: ['#10B981', '#EF4444'],
        borderWidth: 0
      }]
    };

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Income</p>
                <p className="text-2xl font-bold text-green-500">LKR {summary.totalIncome.toFixed(2)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Expenses</p>
                <p className="text-2xl font-bold text-red-500">LKR {summary.totalExpenses.toFixed(2)}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Net Savings</p>
                <p className={`text-2xl font-bold ${summary.netSavings >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                  LKR {summary.netSavings.toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Savings Rate</p>
                <p className="text-2xl font-bold text-purple-500">{summary.savingsRate.toFixed(1)}%</p>
              </div>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <h3 className="text-lg font-semibold mb-4">Income vs Expenses vs Savings</h3>
            <Bar 
              data={overviewData}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: isDarkMode ? '#374151' : '#E5E7EB' },
                    ticks: { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
                  },
                  x: {
                    grid: { color: isDarkMode ? '#374151' : '#E5E7EB' },
                    ticks: { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
                  }
                }
              }}
            />
          </div>

          <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <h3 className="text-lg font-semibold mb-4">Savings Distribution</h3>
            <Doughnut 
              data={savingsData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Insights */}
        <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <h3 className="text-lg font-semibold mb-4">Financial Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Income Pattern</p>
              <p className="font-semibold">{insights.primaryIncomeSource}</p>
            </div>
            <div className="text-center">
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Spending Pattern</p>
              <p className="font-semibold">{insights.spendingPattern}</p>
            </div>
            <div className="text-center">
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Financial Health</p>
              <p className={`font-semibold ${
                insights.financialHealth === 'Excellent' ? 'text-green-500' :
                insights.financialHealth === 'Good' ? 'text-blue-500' :
                insights.financialHealth === 'Fair' ? 'text-yellow-500' : 'text-red-500'
              }`}>{insights.financialHealth}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCategorySpending = () => {
    if (!data || !data.categoryBreakdown) return null;

    const categories = Object.keys(data.categoryBreakdown);
    const amounts = categories.map(cat => data.categoryBreakdown[cat].total);
    
    const chartData = {
      labels: categories,
      datasets: [{
        data: amounts,
        backgroundColor: generateChartColors(categories.length),
        borderWidth: 2,
        borderColor: isDarkMode ? '#374151' : '#ffffff'
      }]
    };

    const barData = {
      labels: categories,
      datasets: [{
        label: 'Amount Spent',
        data: amounts,
        backgroundColor: generateChartColors(categories.length)[0] + '80',
        borderColor: generateChartColors(categories.length)[0],
        borderWidth: 2
      }]
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <h3 className="text-lg font-semibold mb-4">Spending by Category</h3>
            <Doughnut 
              data={chartData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
                  }
                }
              }}
            />
          </div>

          <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <h3 className="text-lg font-semibold mb-4">Category Comparison</h3>
            <Bar 
              data={barData}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: isDarkMode ? '#374151' : '#E5E7EB' },
                    ticks: { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
                  },
                  x: {
                    grid: { color: isDarkMode ? '#374151' : '#E5E7EB' },
                    ticks: { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Category Details */}
        <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <h3 className="text-lg font-semibold mb-4">Category Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <th className="text-left py-2">Category</th>
                  <th className="text-right py-2">Total Spent</th>
                  <th className="text-right py-2">Transactions</th>
                  <th className="text-right py-2">Avg per Transaction</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category, index) => (
                  <tr key={category} className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <td className="py-2 flex items-center">
                      <div 
                        className="w-4 h-4 rounded mr-2" 
                        style={{ backgroundColor: generateChartColors(categories.length)[index] }}
                      ></div>
                      {category}
                    </td>
                    <td className="text-right py-2">LKR {data.categoryBreakdown[category].total.toFixed(2)}</td>
                    <td className="text-right py-2">{data.categoryBreakdown[category].transactions}</td>
                    <td className="text-right py-2">
                      LKR {(data.categoryBreakdown[category].total / data.categoryBreakdown[category].transactions).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderBudgetVsActual = () => {
    if (!data || !data.budgetComparison) return null;

    const categories = data.budgetComparison.map(item => item.category);
    const budgetAmounts = data.budgetComparison.map(item => parseFloat(item.budget_limit));
    const actualAmounts = data.budgetComparison.map(item => parseFloat(item.actual_spent));

    const chartData = {
      labels: categories,
      datasets: [
        {
          label: 'Budget',
          data: budgetAmounts,
          backgroundColor: '#3B82F6',
          borderColor: '#2563EB',
          borderWidth: 2
        },
        {
          label: 'Actual',
          data: actualAmounts,
          backgroundColor: '#EF4444',
          borderColor: '#DC2626',
          borderWidth: 2
        }
      ]
    };

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Budget</p>
            <p className="text-xl font-bold text-blue-500">LKR {data.summary.totalBudget.toFixed(2)}</p>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Spent</p>
            <p className="text-xl font-bold text-red-500">LKR {data.summary.totalSpent.toFixed(2)}</p>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Remaining</p>
            <p className={`text-xl font-bold ${data.summary.remainingBudget >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              LKR {data.summary.remainingBudget.toFixed(2)}
            </p>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Usage</p>
            <p className="text-xl font-bold text-purple-500">{data.summary.overallUsage}%</p>
          </div>
        </div>

        {/* Chart */}
        <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <h3 className="text-lg font-semibold mb-4">Budget vs Actual Spending</h3>
          <Bar 
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top',
                  labels: { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: { color: isDarkMode ? '#374151' : '#E5E7EB' },
                  ticks: { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
                },
                x: {
                  grid: { color: isDarkMode ? '#374151' : '#E5E7EB' },
                  ticks: { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
                }
              }
            }}
          />
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-green-900' : 'bg-green-100'} border border-green-500`}>
            <p className="font-semibold text-green-600">Safe Categories</p>
            <p className="text-2xl font-bold text-green-600">{data.summary.safeCategories}</p>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-yellow-900' : 'bg-yellow-100'} border border-yellow-500`}>
            <p className="font-semibold text-yellow-600">Warning Categories</p>
            <p className="text-2xl font-bold text-yellow-600">{data.summary.warningCategories}</p>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-900' : 'bg-red-100'} border border-red-500`}>
            <p className="font-semibold text-red-600">Over Budget</p>
            <p className="text-2xl font-bold text-red-600">{data.summary.overBudgetCategories}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderSpendingTrends = () => {
    if (!data || !data.growthAnalysis) return null;

    const months = data.growthAnalysis.map(item => item.month);
    const amounts = data.growthAnalysis.map(item => item.total);
    const growth = data.growthAnalysis.map(item => item.growth);

    const trendsData = {
      labels: months,
      datasets: [
        {
          label: 'Monthly Spending',
          data: amounts,
          borderColor: '#3B82F6',
          backgroundColor: '#3B82F680',
          fill: true,
          tension: 0.4
        }
      ]
    };

    const growthData = {
      labels: months,
      datasets: [
        {
          label: 'Month-over-Month Growth (%)',
          data: growth,
          borderColor: '#EF4444',
          backgroundColor: '#EF444480',
          fill: false,
          tension: 0.4
        }
      ]
    };

    return (
      <div className="space-y-6">
        {/* Insights Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Monthly Spending</p>
            <p className="text-xl font-bold text-blue-500">LKR {data.insights.avgMonthlySpending.toFixed(2)}</p>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Highest Month</p>
            <p className="text-xl font-bold text-red-500">{data.insights.highestSpendingMonth}</p>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Lowest Month</p>
            <p className="text-xl font-bold text-green-500">{data.insights.lowestSpendingMonth}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <h3 className="text-lg font-semibold mb-4">Monthly Spending Trend</h3>
            <Line 
              data={trendsData}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: isDarkMode ? '#374151' : '#E5E7EB' },
                    ticks: { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
                  },
                  x: {
                    grid: { color: isDarkMode ? '#374151' : '#E5E7EB' },
                    ticks: { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
                  }
                }
              }}
            />
          </div>

          <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <h3 className="text-lg font-semibold mb-4">Growth Rate Trend</h3>
            <Line 
              data={growthData}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  y: {
                    grid: { color: isDarkMode ? '#374151' : '#E5E7EB' },
                    ticks: { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
                  },
                  x: {
                    grid: { color: isDarkMode ? '#374151' : '#E5E7EB' },
                    ticks: { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderBudgetEfficiency = () => {
    if (!data || !data.budgetDetails) return null;

    const recommendations = data.recommendations || [];

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Overall Efficiency</p>
            <p className="text-xl font-bold text-purple-500">{data.overallMetrics.overallEfficiency}%</p>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Savings</p>
            <p className={`text-xl font-bold ${data.overallMetrics.totalSavings >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              LKR {data.overallMetrics.totalSavings.toFixed(2)}
            </p>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Optimal Categories</p>
            <p className="text-xl font-bold text-blue-500">{data.efficiencyDistribution.optimal}</p>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Over Budget</p>
            <p className="text-xl font-bold text-red-500">{data.efficiencyDistribution.over_budget}</p>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <h3 className="text-lg font-semibold mb-4">AI Recommendations</h3>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border ${
                    rec.type === 'warning' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                    rec.type === 'info' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' :
                    'border-green-500 bg-green-50 dark:bg-green-900/20'
                  }`}
                >
                  <div className="flex items-start">
                    <div className={`w-2 h-2 rounded-full mt-2 mr-3 ${
                      rec.type === 'warning' ? 'bg-red-500' :
                      rec.type === 'info' ? 'bg-blue-500' : 'bg-green-500'
                    }`}></div>
                    <div>
                      <h4 className="font-semibold">{rec.title}</h4>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{rec.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-red-900' : 'bg-red-100'} border border-red-500`}>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchReportData}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }

    switch (activeReport) {
      case 'financial-overview':
        return renderFinancialOverview();
      case 'category-spending':
        return renderCategorySpending();
      case 'budget-vs-actual':
        return renderBudgetVsActual();
      case 'spending-trends':
        return renderSpendingTrends();
      case 'budget-efficiency':
        return renderBudgetEfficiency();
      default:
        return renderFinancialOverview();
    }
  };

  return (
    <AnimatedPage>
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <Navbar />
        
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">📊 Advanced Reports</h1>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Comprehensive financial analytics and insights with real user data
            </p>
          </div>

          {/* Controls */}
          <div className="mb-6 space-y-4">
            {/* Report Type Selection */}
            <div className="flex flex-wrap gap-2">
              {reportTypes.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setActiveReport(type.id)}
                    className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                      activeReport === type.id
                        ? 'bg-blue-500 text-white'
                        : isDarkMode 
                          ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                    } border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {type.name}
                  </button>
                );
              })}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
              >
                {timeframeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {(activeReport === 'budget-vs-actual' || activeReport === 'budget-efficiency') && (
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className={`px-4 py-2 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-200 text-gray-900'
                  }`}
                >
                  {[2024, 2023, 2022, 2021].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              )}

              <button
                onClick={fetchReportData}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Activity className="w-4 h-4 mr-2" />
                Refresh
              </button>

              <button
                className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default AdvancedReports;