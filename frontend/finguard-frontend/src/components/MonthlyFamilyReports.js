import React, { useState, useEffect } from 'react';
import { Pie, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  Award,
  AlertTriangle,
  CheckCircle,
  PieChart,
  BarChart3,
  ArrowUpDown,
  Filter,
  Share
} from 'lucide-react';

ChartJS.register(
  ArcElement, BarElement, LineElement, CategoryScale, LinearScale, 
  PointElement, Tooltip, Legend, Title
);

const MonthlyFamilyReports = () => {
  const [reportData, setReportData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().split('T')[0].slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [comparisonPeriod, setComparisonPeriod] = useState('previous-month');

  useEffect(() => {
    loadFamilyReport();
  }, [selectedMonth, comparisonPeriod]);

  const loadFamilyReport = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem('finguard-token');
      const [year, month] = selectedMonth.split('-');
      
      // Fetch family financial summary
      const response = await fetch(`http://localhost:5000/api/family/financial-summary?month=${month}&year=${year}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Transform API data to match component structure
        const familyOverview = {
          totalIncome: data.summary.totalIncome,
          totalExpenses: data.summary.totalExpenses,
          totalSavings: data.summary.totalSavings,
          savingsRate: data.summary.totalIncome > 0 ? ((data.summary.totalSavings / data.summary.totalIncome) * 100).toFixed(1) : 0,
          budgetUtilization: data.summary.totalBudget > 0 ? ((data.summary.totalExpenses / data.summary.totalBudget) * 100).toFixed(1) : 0,
          memberCount: data.members.length
        };

        const memberBreakdown = data.members.map(member => ({
          id: member.userId,
          name: member.username,
          role: member.role,
          income: member.monthlyIncome,
          expenses: member.monthlyExpenses,
          budget: member.monthlyBudget,
          budgetUtilization: member.budgetUtilization,
          savingsContribution: member.monthlyBalance,
          topCategories: [] // This would need additional API calls to get category breakdown
        }));

        setReportData({
          month: selectedMonth,
          familyOverview,
          memberBreakdown,
          categoryBreakdown: {}, // Would need additional API call to get category breakdown
          savingsGoals: [], // Would need additional API call to get savings goals
          insights: [] // Would need additional API call to get AI insights
        });
      } else {
        // If API fails, show empty state instead of mock data
        setReportData({
          month: selectedMonth,
          familyOverview: {
            totalIncome: 0,
            totalExpenses: 0,
            totalSavings: 0,
            savingsRate: 0,
            budgetUtilization: 0,
            memberCount: 0
          },
          memberBreakdown: [],
          categoryBreakdown: {},
          savingsGoals: [],
          insights: []
        });
      }
    } catch (error) {
      console.error('Error loading family report:', error);
      setReportData({
        month: selectedMonth,
        familyOverview: {
          totalIncome: 0,
          totalExpenses: 0,
          totalSavings: 0,
          savingsRate: 0,
          budgetUtilization: 0,
          memberCount: 0
        },
        memberBreakdown: [],
        categoryBreakdown: {},
        savingsGoals: [],
        insights: []
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    // Would implement PDF generation
    alert('PDF generation would be implemented here');
  };

  const shareReport = () => {
    // Would implement sharing functionality
    alert('Report sharing would be implemented here');
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.label}: Rs.${context.raw.toLocaleString()}`;
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!reportData) return null;

  const categoryChart = {
    labels: Object.keys(reportData?.categoryBreakdown || {}),
    datasets: [{
      data: Object.values(reportData?.categoryBreakdown || {}).map(cat => cat?.amount || 0),
      backgroundColor: [
        '#ef4444', '#f97316', '#eab308', '#84cc16',
        '#06b6d4', '#8b5cf6', '#ec4899', '#64748b'
      ],
      borderWidth: 0,
      hoverOffset: 10
    }]
  };

  const memberComparisonChart = {
    labels: reportData?.memberBreakdown?.map(m => m.name?.split(' ')[0]) || [],
    datasets: [
      {
        label: 'Income',
        data: reportData?.memberBreakdown?.map(m => m.income) || [],
        backgroundColor: '#10b981',
        borderColor: '#059669',
        borderWidth: 1
      },
      {
        label: 'Expenses', 
        data: reportData?.memberBreakdown?.map(m => m.expenses) || [],
        backgroundColor: '#ef4444',
        borderColor: '#dc2626',
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <FileText className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Monthly Family Report</h2>
              <p className="text-gray-600">Comprehensive financial analysis and insights</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
            <button
              onClick={generatePDF}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </button>
            <button
              onClick={shareReport}
              className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
            >
              <Share className="w-4 h-4 mr-2" />
              Share
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'overview', label: 'Overview', icon: PieChart },
            { id: 'members', label: 'Members', icon: Users },
            { id: 'categories', label: 'Categories', icon: BarChart3 },
            { id: 'performance', label: 'Performance', icon: Target }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Income</p>
                  <p className="text-2xl font-bold text-green-600">
                    Rs.{reportData.familyOverview.totalIncome.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
              {reportData.comparisonData && (
                <div className="mt-2 flex items-center">
                  <span className="text-sm text-green-600">
                    +{reportData.comparisonData.incomeChange}% from last month
                  </span>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">
                    Rs.{reportData.familyOverview.totalExpenses.toLocaleString()}
                  </p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-500" />
              </div>
              {reportData.comparisonData && (
                <div className="mt-2 flex items-center">
                  <span className="text-sm text-red-600">
                    +{reportData.comparisonData.expenseChange}% from last month
                  </span>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Net Savings</p>
                  <p className="text-2xl font-bold text-blue-600">
                    Rs.{reportData.familyOverview.totalSavings.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-500" />
              </div>
              <div className="mt-2 flex items-center">
                {reportData.comparisonData && (
                  <span className={`text-sm ${reportData.comparisonData.savingsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {reportData.comparisonData.savingsChange >= 0 ? '+' : ''}{reportData.comparisonData.savingsChange}% from last month
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Savings Rate</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {reportData.familyOverview.savingsRate}%
                  </p>
                </div>
                <Target className="w-8 h-8 text-purple-500" />
              </div>
              <div className="mt-2 flex items-center">
                <span className="text-sm text-gray-600">
                  Budget adherence: {reportData.comparisonData?.budgetAdherence || 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Key Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {reportData.insights?.map((insight, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    insight.impact === 'positive' 
                      ? 'border-green-500 bg-green-50' 
                      : insight.impact === 'negative'
                      ? 'border-red-500 bg-red-50'
                      : 'border-blue-500 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start">
                    {insight.impact === 'positive' ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                    ) : insight.impact === 'negative' ? (
                      <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
                    ) : (
                      <Award className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                    )}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">{insight.title}</h4>
                      <p className="text-sm text-gray-700">{insight.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Goals Progress */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Family Goals Progress</h3>
            <div className="space-y-4">
              {reportData.goalsProgress?.map((goal, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{goal.name}</h4>
                      <span className="text-sm font-medium text-gray-600">
                        {goal.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mt-1">
                      <span>Rs.{goal.current.toLocaleString()}</span>
                      <span>Rs.{goal.target.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Member Comparison</h3>
            <div style={{ height: '400px' }}>
              <Bar data={memberComparisonChart} options={chartOptions} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reportData?.memberBreakdown?.map(member => (
              <div key={member.id} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-gray-900">{member.name}</h4>
                  <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {member.role}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Income</p>
                    <p className="font-semibold text-green-600">Rs.{member.income.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Expenses</p>
                    <p className="font-semibold text-red-600">Rs.{member.expenses.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Budget</p>
                    <p className="font-semibold text-blue-600">Rs.{member.budget.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Utilization</p>
                    <p className={`font-semibold ${
                      member.budgetUtilization > 100 ? 'text-red-600' :
                      member.budgetUtilization > 90 ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {member.budgetUtilization}%
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Top Categories</p>
                  <div className="space-y-2">
                    {member.topCategories.slice(0, 3).map((cat, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{cat.category}</span>
                        <span className={`font-medium ${
                          cat.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          Rs.{cat.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Expense Breakdown</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div style={{ height: '350px' }}>
                <Pie data={categoryChart} options={chartOptions} />
              </div>
              <div className="space-y-3">
                {Object.entries(reportData?.categoryBreakdown || {}).map(([category, data]) => (
                  <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div
                        className="w-4 h-4 rounded-full mr-3"
                        style={{ backgroundColor: categoryChart.datasets[0].backgroundColor[Object.keys(reportData?.categoryBreakdown || {}).indexOf(category)] }}
                      ></div>
                      <span className="font-medium text-gray-900">{category}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        Rs.{data.amount.toLocaleString()}
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="text-gray-600 mr-2">{data.percentage}%</span>
                        {data.trend === 'up' ? (
                          <TrendingUp className="w-3 h-3 text-red-500" />
                        ) : data.trend === 'down' ? (
                          <TrendingDown className="w-3 h-3 text-green-500" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{reportData.budgetPerformance?.onTrack || 0}</p>
              <p className="text-sm text-gray-600">On Track</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-600">{reportData.budgetPerformance?.overBudget || 0}</p>
              <p className="text-sm text-gray-600">Over Budget</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <TrendingDown className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{reportData.budgetPerformance?.underBudget || 0}</p>
              <p className="text-sm text-gray-600">Under Budget</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <Award className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-600 capitalize">
                {reportData.budgetPerformance?.overallPerformance || 'N/A'}
              </p>
              <p className="text-sm text-gray-600">Overall</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
                Areas for Improvement
              </h4>
              <div className="space-y-3">
                {reportData.budgetPerformance?.improvementAreas?.map((area, index) => (
                  <div key={index} className="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                    <p className="font-medium text-gray-900">{area}</p>
                    <p className="text-sm text-gray-600">Consider reducing spending in this category</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                Excellent Performance
              </h4>
              <div className="space-y-3">
                {reportData.budgetPerformance?.excellentAreas?.map((area, index) => (
                  <div key={index} className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                    <p className="font-medium text-gray-900">{area}</p>
                    <p className="text-sm text-gray-600">Keep up the great work in this area!</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyFamilyReports;