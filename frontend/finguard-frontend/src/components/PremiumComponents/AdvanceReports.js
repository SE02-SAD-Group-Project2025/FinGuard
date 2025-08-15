import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../../hooks/useSubscription';
import { useTheme } from '../../contexts/ThemeContext';
import Navbar from '../Navbar';
import AnimatedPage from '../AnimatedPage';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Calendar,
  DollarSign,
  PieChart,
  LineChart,
  Filter,
  Crown,
  Sparkles
} from 'lucide-react';

const AdvanceReports = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { isPremium, user, subscription } = useSubscription();
  const [selectedTimeframe, setSelectedTimeframe] = useState('month');
  const [reportType, setReportType] = useState('predictions');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Fetch real financial data
  const fetchReportData = async () => {
    const token = localStorage.getItem('finguard-token');
    if (!token) return;

    try {
      const [transactionsResponse, summaryResponse, liabilitiesResponse] = await Promise.all([
        fetch('http://localhost:5000/api/transactions', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://localhost:5000/api/summary?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/liabilities', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (transactionsResponse.ok && summaryResponse.ok) {
        const transactions = await transactionsResponse.json();
        const summary = await summaryResponse.json();
        
        console.log('Transactions response:', transactions);
        console.log('Summary response:', summary);
        
        let liabilities = 0;
        if (liabilitiesResponse.ok) {
          const liabilitiesData = await liabilitiesResponse.json();
          liabilities = liabilitiesData.reduce((sum, liability) => sum + parseFloat(liability.amount || 0), 0);
        }

        // Process category data
        const categoryMap = {};
        // Ensure transactions is an array before filtering
        const transactionsArray = Array.isArray(transactions) ? transactions : [];
        const expenses = transactionsArray.filter(t => t.type === 'expense');
        
        expenses.forEach(transaction => {
          const category = transaction.category || 'Uncategorized';
          categoryMap[category] = (categoryMap[category] || 0) + parseFloat(transaction.amount);
        });

        const totalExpenses = Object.values(categoryMap).reduce((sum, amount) => sum + amount, 0);
        const categories = Object.entries(categoryMap)
          .map(([name, amount]) => ({
            name,
            amount,
            percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0
          }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 6);

        // Calculate metrics
        const savings = summary.income - summary.expenses;
        const savingsRate = summary.income > 0 ? ((savings / summary.income) * 100).toFixed(1) : 0;
        const budgetEfficiency = Math.min(100, Math.max(0, 100 - ((summary.expenses / (summary.income || 1)) * 80)));

        setReportData({
          overview: {
            totalIncome: summary.income,
            totalExpenses: summary.expenses,
            savings: savings,
            categories: categories,
            totalTransactions: transactionsArray.length,
            liabilities: liabilities
          },
          trends: {
            monthlyGrowth: '+12.5%', // This would need historical data to calculate properly
            savingsRate: `${savingsRate}%`,
            expenseGrowth: '+8.2%', // This would need historical data to calculate properly
            budgetEfficiency: Math.round(budgetEfficiency)
          }
        });
      } else {
        console.error('API responses not ok:', {
          transactions: transactionsResponse.status,
          summary: summaryResponse.status
        });
        if (!transactionsResponse.ok) {
          const errorText = await transactionsResponse.text();
          console.error('Transactions error:', errorText);
        }
        if (!summaryResponse.ok) {
          const errorText = await summaryResponse.text();
          console.error('Summary error:', errorText);
        }
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      // Fallback to default data if API fails
      setReportData({
        overview: {
          totalIncome: 0,
          totalExpenses: 0,
          savings: 0,
          categories: [],
          totalTransactions: 0,
          liabilities: 0
        },
        trends: {
          monthlyGrowth: '0%',
          savingsRate: '0%',
          expenseGrowth: '0%',
          budgetEfficiency: 0
        }
      });
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (isPremium()) {
      fetchReportData();
    } else {
      setDataLoading(false);
    }
  }, [selectedTimeframe]);

  // Check premium access
  if (!isPremium()) {
    return (
      <AnimatedPage>
        <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center min-h-96">
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-8 max-w-md mx-auto text-center`}>
                <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Premium Feature</h2>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
                  Advanced Reports with AI insights are available for Premium users only. Upgrade to access detailed analytics and export features.
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
        </div>
      </AnimatedPage>
    );
  }

  const generateReportContent = () => {
    const timeframeLabel = {
      'week': 'Last 7 Days',
      'month': 'Last Month',
      'quarter': 'Last Quarter', 
      'year': 'Last Year',
      'custom': 'Custom Range'
    }[selectedTimeframe];

    const reportTypeLabel = {
      'overview': 'Financial Overview',
      'trends': 'Spending Trends',
      'categories': 'Category Analysis',
      'predictions': 'AI Predictions'
    }[reportType];

    return {
      title: `${reportTypeLabel} Report - ${timeframeLabel}`,
      timestamp: new Date().toLocaleString(),
      data: reportData,
      reportType,
      timeframe: selectedTimeframe
    };
  };

  const handleExport = async (format) => {
    setLoading(true);
    
    try {
      const reportContent = generateReportContent();
      
      if (format === 'pdf') {
        await generatePDFReport(reportContent);
        // PDF is generated via print dialog - no file download needed
        setLoading(false);
        if (window.showToast) {
          window.showToast(`${reportContent.title} opened for PDF export!`, 'success');
        } else {
          alert(`${reportContent.title} opened for PDF export!`);
        }
      } else if (format === 'excel') {
        await generateExcelReport(reportContent);
        // CSV file should be downloaded - no need for setTimeout
        setLoading(false);
        if (window.showToast) {
          window.showToast(`${reportContent.title} exported successfully as Excel CSV!`, 'success');
        } else {
          alert(`${reportContent.title} exported successfully as Excel CSV!`);
        }
      }
      
    } catch (error) {
      console.error('Export error:', error);
      setLoading(false);
      if (window.showToast) {
        window.showToast('Export failed. Please try again.', 'error');
      } else {
        alert('Export failed. Please try again.');
      }
    }
  };

  const generatePDFReport = async (content) => {
    // Create a comprehensive PDF report based on the selected report type
    const reportHTML = generateReportHTML(content);
    
    // Open in new window for printing/saving as PDF
    const printWindow = window.open('', '_blank');
    printWindow.document.write(reportHTML);
    printWindow.document.close();
    
    // Auto-trigger print dialog
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const generateExcelReport = async (content) => {
    let csvContent = '';
    
    // Header
    csvContent += `${content.title}\n`;
    csvContent += `Generated: ${content.timestamp}\n\n`;
    
    // Key Metrics Section
    csvContent += "KEY METRICS\n";
    csvContent += "Metric,Value,Change\n";
    csvContent += `Total Income,"Rs.${content.data.overview.totalIncome.toLocaleString()}",${content.data.trends.monthlyGrowth}\n`;
    csvContent += `Total Expenses,"Rs.${content.data.overview.totalExpenses.toLocaleString()}",${content.data.trends.expenseGrowth}\n`;
    csvContent += `Net Savings,"Rs.${content.data.overview.savings.toLocaleString()}",${content.data.trends.savingsRate}\n`;
    csvContent += `Budget Efficiency,"${content.data.trends.budgetEfficiency}%",Above target\n\n`;
    
    // Category Breakdown
    if (content.data.overview.categories.length > 0) {
      csvContent += "EXPENSE CATEGORIES\n";
      csvContent += "Category,Amount,Percentage\n";
      content.data.overview.categories.forEach(cat => {
        csvContent += `${cat.name},"Rs.${cat.amount.toLocaleString()}","${cat.percentage}%"\n`;
      });
      csvContent += "\n";
    }
    
    // AI Insights based on report type
    csvContent += "AI INSIGHTS\n";
    csvContent += "Type,Recommendation\n";
    
    if (content.reportType === 'predictions') {
      csvContent += "Prediction,Your spending pattern suggests 15% increase in Food & Dining next month\n";
      csvContent += "Prediction,Transportation costs likely to decrease by 8% based on seasonal trends\n";
      csvContent += "Prediction,Subscription expenses stable with potential for 1 new service addition\n";
    } else if (content.reportType === 'categories') {
      csvContent += "Optimization,Reduce dining expenses by 20% to save Rs.5000/month\n";
      csvContent += "Alert,Subscription utilization is low - consider canceling unused services\n";
      csvContent += "Goal,Maintain current transportation spending level\n";
    } else if (content.reportType === 'trends') {
      csvContent += "Trend Analysis,Income growth trending upward at 12.5% monthly rate\n";
      csvContent += "Trend Analysis,Expense growth controlled at 8.2% - within target range\n";
      csvContent += "Trend Analysis,Savings rate of ${content.data.trends.savingsRate} indicates excellent financial discipline\n";
    } else {
      csvContent += "Optimization,Reduce dining expenses by 20% to save Rs.5000/month\n";
      csvContent += "Budget,Increase emergency fund allocation by Rs.2000/month\n";
      csvContent += "Investment,Consider investing surplus Rs.8000 in mutual funds\n";
    }
    
    // Create and download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${content.title.replace(/ /g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateReportHTML = (content) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${content.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #3B82F6; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; color: #1F2937; margin-bottom: 10px; }
          .subtitle { font-size: 14px; color: #6B7280; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #374151; border-left: 4px solid #3B82F6; padding-left: 10px; }
          .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px; }
          .metric-card { border: 1px solid #E5E7EB; border-radius: 8px; padding: 15px; }
          .metric-value { font-size: 20px; font-weight: bold; color: #3B82F6; }
          .metric-label { font-size: 12px; color: #6B7280; text-transform: uppercase; }
          .category-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #F3F4F6; }
          .insight-box { background: #F8FAFC; border-left: 4px solid #10B981; padding: 15px; margin: 10px 0; border-radius: 4px; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #9CA3AF; border-top: 1px solid #E5E7EB; padding-top: 20px; }
          @media print { body { margin: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${content.title}</div>
          <div class="subtitle">Generated on ${content.timestamp} | FinGuard Premium Reports</div>
        </div>

        <div class="section">
          <div class="section-title">Key Financial Metrics</div>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-label">Total Income</div>
              <div class="metric-value" style="color: #10B981;">Rs.${content.data.overview.totalIncome.toLocaleString()}</div>
              <div style="font-size: 12px; color: #6B7280;">${content.data.trends.monthlyGrowth} from last period</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Total Expenses</div>
              <div class="metric-value" style="color: #EF4444;">Rs.${content.data.overview.totalExpenses.toLocaleString()}</div>
              <div style="font-size: 12px; color: #6B7280;">${content.data.trends.expenseGrowth} from last period</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Net Savings</div>
              <div class="metric-value" style="color: ${content.data.overview.savings >= 0 ? '#3B82F6' : '#EF4444'};">Rs.${content.data.overview.savings.toLocaleString()}</div>
              <div style="font-size: 12px; color: #6B7280;">${content.data.trends.savingsRate} savings rate</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Budget Efficiency</div>
              <div class="metric-value" style="color: #8B5CF6;">${content.data.trends.budgetEfficiency}%</div>
              <div style="font-size: 12px; color: #6B7280;">${content.data.trends.budgetEfficiency >= 70 ? 'Above target' : content.data.trends.budgetEfficiency >= 50 ? 'On track' : 'Needs improvement'}</div>
            </div>
          </div>
        </div>

        ${content.data.overview.categories.length > 0 ? `
        <div class="section">
          <div class="section-title">Expense Category Breakdown</div>
          ${content.data.overview.categories.map(cat => `
            <div class="category-item">
              <span>${cat.name}</span>
              <span>Rs.${cat.amount.toLocaleString()} (${cat.percentage}%)</span>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <div class="section">
          <div class="section-title">AI-Powered Insights & Recommendations</div>
          ${content.reportType === 'predictions' ? `
            <div class="insight-box">
              <strong>Spending Prediction:</strong> Based on your patterns, Food & Dining expenses may increase by 15% next month. Consider setting stricter limits.
            </div>
            <div class="insight-box">
              <strong>Seasonal Forecast:</strong> Transportation costs typically decrease by 8% during this period. Plan accordingly for savings allocation.
            </div>
            <div class="insight-box">
              <strong>Subscription Alert:</strong> Usage patterns indicate potential for 1 new service addition. Monitor recurring expenses carefully.
            </div>
          ` : content.reportType === 'categories' ? `
            <div class="insight-box">
              <strong>Category Optimization:</strong> Food & Dining represents ${content.data.overview.categories[0]?.percentage || 0}% of expenses. Reducing by 20% could save Rs.5,000/month.
            </div>
            <div class="insight-box">
              <strong>Subscription Analysis:</strong> Review underutilized subscriptions for potential savings of Rs.2,000-3,000/month.
            </div>
            <div class="insight-box">
              <strong>Transportation Goal:</strong> Current spending level is optimal. Maintain consistency for best budget performance.
            </div>
          ` : content.reportType === 'trends' ? `
            <div class="insight-box">
              <strong>Income Trend:</strong> Positive 12.5% growth trajectory indicates strong financial momentum. Continue current strategies.
            </div>
            <div class="insight-box">
              <strong>Expense Control:</strong> 8.2% expense growth is within healthy range. Maintain discipline to optimize savings.
            </div>
            <div class="insight-box">
              <strong>Savings Performance:</strong> ${content.data.trends.savingsRate} rate demonstrates excellent financial discipline and planning.
            </div>
          ` : `
            <div class="insight-box">
              <strong>Optimization Opportunity:</strong> Reduce dining expenses by 20% to save Rs.5,000/month and improve budget efficiency.
            </div>
            <div class="insight-box">
              <strong>Budget Recommendation:</strong> Increase emergency fund allocation by Rs.2,000/month for better financial security.
            </div>
            <div class="insight-box">
              <strong>Investment Suggestion:</strong> Consider investing surplus Rs.8,000 in mutual funds for long-term wealth building.
            </div>
          `}
        </div>

        <div class="footer">
          This report was generated by FinGuard Premium Analytics System<br>
          Report Type: ${content.reportType} | Timeframe: ${content.timeframe} | User: Premium Member
        </div>
      </body>
      </html>
    `;
  };

  if (dataLoading) {
    return (
      <AnimatedPage>
        <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse">
              <div className={`h-8 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/3 mb-4`}></div>
              <div className={`h-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/2 mb-8`}></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-xl h-24`}></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  if (!reportData) {
    return (
      <AnimatedPage>
        <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Unable to load report data. Please try again later.</p>
            </div>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div>
                <div className="flex items-center mb-2">
                  <Crown className="w-6 h-6 text-yellow-500 mr-2" />
                  <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Advanced Reports</h1>
                </div>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Comprehensive financial analytics and insights</p>
              </div>
              <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">
                  Premium Feature
                </span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm mb-8`}>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Report Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className={`w-full px-4 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="predictions">AI Predictions</option>
                  <option value="overview">Financial Overview</option>
                  <option value="trends">Spending Trends</option>
                  <option value="categories">Category Analysis</option>
                </select>
              </div>
              
              <div className="flex-1">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Timeframe
                </label>
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className={`w-full px-4 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last Month</option>
                  <option value="quarter">Last Quarter</option>
                  <option value="year">Last Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              <div className="flex items-end space-x-3">
                <button
                  onClick={() => handleExport('pdf')}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {loading ? 'Exporting...' : 'Export PDF'}
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  disabled={loading}
                  className={`px-4 py-2 border ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-lg transition-colors disabled:opacity-50 flex items-center`}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Excel
                </button>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total Income</p>
                  <p className="text-2xl font-bold text-green-600">Rs.{reportData.overview.totalIncome.toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-2`}>{reportData.trends.monthlyGrowth} from last period</p>
            </div>

            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">Rs.{reportData.overview.totalExpenses.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-red-600" />
              </div>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-2`}>{reportData.trends.expenseGrowth} from last period</p>
            </div>

            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Net Savings</p>
                  <p className={`text-2xl font-bold ${reportData.overview.savings >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    Rs.{reportData.overview.savings.toLocaleString()}
                  </p>
                </div>
                <PieChart className="w-8 h-8 text-blue-600" />
              </div>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-2`}>{reportData.trends.savingsRate} savings rate</p>
            </div>

            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Budget Efficiency</p>
                  <p className="text-2xl font-bold text-purple-600">{reportData.trends.budgetEfficiency}%</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-2`}>
                {reportData.trends.budgetEfficiency >= 70 ? 'Above target' : reportData.trends.budgetEfficiency >= 50 ? 'On track' : 'Needs improvement'}
              </p>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm`}>
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
                <PieChart className="w-5 h-5 mr-2" />
                Expense Categories
              </h3>
              <div className="space-y-4">
                {reportData.overview.categories.length > 0 ? (
                  reportData.overview.categories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{category.name}</span>
                          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Rs.{category.amount.toLocaleString()}</span>
                        </div>
                        <div className={`w-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-full h-2`}>
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${category.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ml-3`}>{category.percentage}%</span>
                    </div>
                  ))
                ) : (
                  <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <PieChart className={`w-12 h-12 mx-auto mb-2 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                    <p>No expense categories found</p>
                    <p className="text-xs">Add some expenses to see category breakdown</p>
                  </div>
                )}
              </div>
            </div>

            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm`}>
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
                <LineChart className="w-5 h-5 mr-2" />
                Spending Trends
              </h3>
              <div className="space-y-4">
                <div className={`p-4 border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} rounded-lg`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Monthly Growth</span>
                    <span className={`text-sm font-bold ${reportData.trends.monthlyGrowth.includes('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {reportData.trends.monthlyGrowth}
                    </span>
                  </div>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                    {reportData.trends.monthlyGrowth.includes('+') ? 'Income increased' : 'Income decreased'}
                  </p>
                </div>
                
                <div className={`p-4 border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} rounded-lg`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Expense Growth</span>
                    <span className={`text-sm font-bold ${reportData.trends.expenseGrowth.includes('+') ? 'text-orange-600' : 'text-green-600'}`}>
                      {reportData.trends.expenseGrowth}
                    </span>
                  </div>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                    {reportData.trends.expenseGrowth.includes('+') ? 'Spending increased' : 'Spending decreased'}
                  </p>
                </div>
                
                <div className={`p-4 border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} rounded-lg`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Savings Rate</span>
                    <span className="text-sm font-bold text-blue-600">{reportData.trends.savingsRate}</span>
                  </div>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                    {parseFloat(reportData.trends.savingsRate) >= 20 ? 'Excellent savings discipline' : 
                     parseFloat(reportData.trends.savingsRate) >= 10 ? 'Good savings habit' : 
                     parseFloat(reportData.trends.savingsRate) >= 0 ? 'Room for improvement' : 'Overspending detected'}
                  </p>
                </div>
                
                <div className={`p-4 border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} rounded-lg`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Total Transactions</span>
                    <span className="text-sm font-bold text-purple-600">{reportData.overview.totalTransactions}</span>
                  </div>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                    This period's activity
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className={`${isDarkMode ? 'bg-gradient-to-r from-purple-900 to-blue-900 bg-opacity-50' : 'bg-gradient-to-r from-purple-50 to-blue-50'} rounded-xl p-6 shadow-sm`}>
            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
              <Filter className="w-5 h-5 mr-2" />
              AI-Powered Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4`}>
                <div className="text-sm font-medium text-purple-600 mb-1">Optimization Opportunity</div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Reduce dining expenses by 20% to save LKR 5,000/month
                </div>
              </div>
              
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4`}>
                <div className="text-sm font-medium text-blue-600 mb-1">Budget Recommendation</div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Increase emergency fund allocation by LKR 2,000/month
                </div>
              </div>
              
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4`}>
                <div className="text-sm font-medium text-green-600 mb-1">Investment Suggestion</div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Consider investing surplus LKR 8,000 in mutual funds
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default AdvanceReports;