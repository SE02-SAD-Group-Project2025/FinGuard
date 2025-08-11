import React, { useState, useEffect } from 'react';
import { BarChart, PieChart, TrendingUp, Calendar, Filter, Star } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const PremiumCharts = () => {
  const { isDarkMode } = useTheme();
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6months');

  const fetchChartData = async () => {
    const token = localStorage.getItem('finguard-token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:5000/api/transactions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const transactions = await response.json();
        
        // Process data for charts
        const monthlyData = processMonthlyData(transactions);
        const categoryData = processCategoryData(transactions);
        const trendData = processTrendData(transactions);

        setChartData({
          monthly: monthlyData,
          categories: categoryData,
          trends: trendData,
          totalTransactions: transactions.length
        });
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processMonthlyData = (transactions) => {
    const monthlyMap = {};
    const currentDate = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      monthlyMap[key] = { month: monthName, income: 0, expenses: 0 };
    }

    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthlyMap[key]) {
        if (transaction.type === 'income') {
          monthlyMap[key].income += parseFloat(transaction.amount);
        } else {
          monthlyMap[key].expenses += parseFloat(transaction.amount);
        }
      }
    });

    return Object.values(monthlyMap);
  };

  const processCategoryData = (transactions) => {
    const categoryMap = {};
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    
    expenseTransactions.forEach(transaction => {
      const category = transaction.category || 'Uncategorized';
      categoryMap[category] = (categoryMap[category] || 0) + parseFloat(transaction.amount);
    });

    return Object.entries(categoryMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6); // Top 6 categories
  };

  const processTrendData = (transactions) => {
    const last30Days = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return transactionDate >= thirtyDaysAgo;
    });

    return {
      dailyAverage: last30Days.reduce((sum, t) => sum + parseFloat(t.amount), 0) / 30,
      totalTransactions: last30Days.length,
      avgTransactionSize: last30Days.length > 0 ? 
        last30Days.reduce((sum, t) => sum + parseFloat(t.amount), 0) / last30Days.length : 0
    };
  };

  useEffect(() => {
    fetchChartData();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`rounded-xl h-80 animate-pulse ${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
        }`}></div>
        <div className={`rounded-xl h-80 animate-pulse ${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
        }`}></div>
      </div>
    );
  }

  if (!chartData) return null;


  const colors = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#F97316'];
  const maxAmount = Math.max(...chartData.monthly.map(item => Math.max(item.income, item.expenses)));

  return (
    <div className="mt-8 space-y-6">
      {/* Premium Analytics Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Premium Analytics</h2>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className={`border rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="3months">Last 3 months</option>
            <option value="6months">Last 6 months</option>
            <option value="12months">Last 12 months</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Advanced Monthly Comparison */}
        <div className={`rounded-xl shadow-sm p-6 border-l-4 border-purple-500 transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart className="w-5 h-5 text-purple-500" />
              <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Income vs Expenses Trend</h3>
            </div>
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">Premium</span>
          </div>
          <div className="h-64 relative">
            <div className="flex items-end justify-between h-full px-4">
              {chartData.monthly.map((item, index) => {
                const maxHeight = 200;
                const incomeHeight = maxAmount > 0 ? Math.max((item.income / maxAmount) * maxHeight, item.income > 0 ? 8 : 0) : 0;
                const expensesHeight = maxAmount > 0 ? Math.max((item.expenses / maxAmount) * maxHeight, item.expenses > 0 ? 8 : 0) : 0;
                
                return (
                  <div key={index} className="flex flex-col items-center" style={{ minWidth: '60px' }}>
                    <div className="flex justify-center items-end space-x-1 h-full">
                      <div 
                        className="w-6 bg-green-500 rounded-t-sm transition-all duration-500 hover:bg-green-600 cursor-pointer"
                        style={{ 
                          height: `${incomeHeight}px`,
                          minHeight: item.income > 0 ? '8px' : '0px'
                        }}
                        title={`Income: Rs.${item.income.toLocaleString()}`}
                      ></div>
                      <div 
                        className="w-6 bg-red-500 rounded-t-sm transition-all duration-500 hover:bg-red-600 cursor-pointer"
                        style={{ 
                          height: `${expensesHeight}px`,
                          minHeight: item.expenses > 0 ? '8px' : '0px'
                        }}
                        title={`Expenses: Rs.${item.expenses.toLocaleString()}`}
                      ></div>
                    </div>
                    <span className={`text-xs mt-2 text-center ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>{item.month}</span>
                  </div>
                );
              })}
            </div>
            <div className="absolute top-0 right-0 flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Income</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Expenses</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced Category Analysis */}
        <div className={`rounded-xl shadow-sm p-6 border-l-4 border-blue-500 transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-500" />
              <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Top Expense Categories</h3>
            </div>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Premium</span>
          </div>
          <div className="h-64">
            {chartData.categories.length > 0 ? (
              <div className="space-y-3">
                {chartData.categories.map((item, index) => {
                  const total = chartData.categories.reduce((sum, cat) => sum + cat.amount, 0);
                  const percentage = ((item.amount / total) * 100).toFixed(1);
                  
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: colors[index % colors.length] }}
                        ></div>
                        <span className={`text-sm font-medium ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>{item.category}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`w-24 rounded-full h-2 ${
                          isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                        }`}>
                          <div 
                            className="h-2 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${percentage}%`, 
                              backgroundColor: colors[index % colors.length] 
                            }}
                          ></div>
                        </div>
                        <div className="text-right min-w-20">
                          <div className={`text-sm font-bold ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            Rs.{item.amount.toLocaleString()}
                          </div>
                          <div className={`text-xs ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>{percentage}%</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={`flex items-center justify-center h-full ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                No expense data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Premium Insights Panel */}
      <div className={`rounded-xl p-6 border transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-gray-700' 
          : 'bg-gradient-to-r from-purple-50 to-blue-50 border-gray-200'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Advanced Insights</h3>
          <span className="text-xs bg-gradient-to-r from-purple-600 to-blue-600 text-white px-2 py-1 rounded-full">
            Premium Only
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              Rs.{chartData.trends.dailyAverage.toFixed(0)}
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Daily Average Spending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {chartData.trends.totalTransactions}
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Transactions (30 days)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              Rs.{chartData.trends.avgTransactionSize.toFixed(0)}
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Avg Transaction Size</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumCharts