// Dashboard.js (Backend connected + Improved Design + Liabilities Fix)
import React, { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import Navbar from './Navbar';
import Cards from './Cards';
import Buttons from './Buttons';
import RecentTransactions from './RecentTransactions';
import AnimatedPage from './AnimatedPage';
import FinancialHealthScore from './FinancialHealthScore';
import QuickExpenseButton from './QuickExpenseButton';
import { useTheme } from '../contexts/ThemeContext';

ChartJS.register(ArcElement, Tooltip, Legend);

// ✨ Theme-aware chart options
const getChartOptions = (isDarkMode) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false, // Hide default legend for cleaner look
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          const label = context.label || '';
          const value = context.raw || 0;
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = Math.round((value / total) * 100);
          return `${label}: ${percentage}% (Rs. ${value.toLocaleString()})`;
        }
      },
      backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
      titleColor: isDarkMode ? '#fff' : '#000',
      bodyColor: isDarkMode ? '#fff' : '#000',
      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      borderWidth: 1,
    }
  },
  animation: {
    animateRotate: true,
    animateScale: true,
  },
});

const Dashboard = () => {
  // 🎨 Theme context
  const { isDarkMode } = useTheme();
  
  // 🔄 Keep all original backend state management
  const [expenseChartData, setExpenseChartData] = useState(null);
  const [incomeChartData, setIncomeChartData] = useState(null);
  const [summary, setSummary] = useState({ income: 0, expenses: 0, balance: 0 });
  const [transactions, setTransactions] = useState([]);
  const [liabilitiesSummary, setLiabilitiesSummary] = useState({ total_current_balance: 0 });
  const [loading, setLoading] = useState(true);

  // 📅 Month/Year Selection State - Always default to current date
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());

  const token = localStorage.getItem('finguard-token');

  // 🔄 Keep all original backend data fetching logic + Add liabilities
  useEffect(() => {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch summary
        const summaryResponse = await fetch(`http://localhost:5000/api/summary?month=${selectedMonth}&year=${selectedYear}`, { headers });
        const summaryData = await summaryResponse.json();
        setSummary({
          income: summaryData.income || 0,
          expenses: summaryData.expenses || 0,
          balance: summaryData.balance || 0,
        });

        // Fetch transactions
        const transactionsResponse = await fetch(`http://localhost:5000/api/transactions?month=${selectedMonth}&year=${selectedYear}`, { headers });
        const transactionsData = await transactionsResponse.json();
        console.log("Fetched transactions:", transactionsData);
        // Handle new API response format
        const transactions = transactionsData.transactions || transactionsData;
        setTransactions(transactions);
        
        // ✅ FIXED: Fetch Liabilities Summary
        try {
          const liabilitiesResponse = await fetch(`http://localhost:5000/api/liabilities/summary`, { headers });
          if (liabilitiesResponse.ok) {
            const liabilitiesData = await liabilitiesResponse.json();
            setLiabilitiesSummary(liabilitiesData.summary || { total_current_balance: 0 });
            console.log("✅ Liabilities summary fetched:", liabilitiesData.summary);
          } else {
            console.log("⚠️ Liabilities endpoint not available, using default values");
            setLiabilitiesSummary({ total_current_balance: 0 });
          }
        } catch (liabErr) {
          console.log("⚠️ Error fetching liabilities, using default values:", liabErr);
          setLiabilitiesSummary({ total_current_balance: 0 });
        }

        // ✨ Enhanced chart data processing with better colors
        const incomeGroups = transactions
          .filter(tx => tx.type === 'income')
          .reduce((acc, tx) => {
            acc[tx.category] = (acc[tx.category] || 0) + parseFloat(tx.amount);
            return acc;
          }, {});

        // 🎨 Improved income chart colors
        setIncomeChartData({
          labels: Object.keys(incomeGroups),
          datasets: [{
            data: Object.values(incomeGroups),
            backgroundColor: [
              '#10b981', // Emerald
              '#059669', // Emerald dark
              '#34d399', // Emerald light
              '#6ee7b7', // Emerald lighter
              '#a7f3d0', // Emerald lightest
            ],
            hoverOffset: 10,
            borderWidth: 0,
          }],
        });

        const expenseGroups = transactions
          .filter(tx => tx.type === 'expense')
          .reduce((acc, tx) => {
            acc[tx.category] = (acc[tx.category] || 0) + parseFloat(tx.amount);
            return acc;
          }, {});

        // 🎨 Improved expense chart colors
        setExpenseChartData({
          labels: Object.keys(expenseGroups),
          datasets: [{
            data: Object.values(expenseGroups),
            backgroundColor: [
              '#ef4444', // Red
              '#f97316', // Orange
              '#eab308', // Yellow
              '#84cc16', // Lime
              '#06b6d4', // Cyan
              '#8b5cf6', // Violet
              '#ec4899', // Pink
            ],
            hoverOffset: 10,
            borderWidth: 0,
          }],
        });

      } catch (err) {
        console.error('Data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, selectedMonth, selectedYear]);

  // 📊 Loading state component
  const ChartSkeleton = () => (
    <div className="animate-pulse">
      <div className={`w-full h-64 rounded-full mx-auto ${
        isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
      }`}></div>
      <div className="mt-4 space-y-2">
        <div className={`h-4 rounded w-3/4 mx-auto ${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
        }`}></div>
        <div className={`h-4 rounded w-1/2 mx-auto ${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
        }`}></div>
      </div>
    </div>
  );

  return (
    <AnimatedPage>
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-screen transition-colors ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <Navbar />
        
        {/* 🎯 Keep original welcome message but make it dynamic */}
        <h1 className={`text-3xl font-bold ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>Welcome back!</h1>
        
        {/* 🔄 Pass liabilities summary to Cards component */}
        <Cards summary={summary} liabilitiesSummary={liabilitiesSummary} />
        <Buttons />

        {/* ✨ Improved section title with Month/Year Selector */}
        <div className="mt-8 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="text-center lg:text-left">
              <h2 className={`text-3xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Your Income And Expense Summary</h2>
              <p className={`mt-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            
            {/* 📅 Month/Year Selector */}
            <div className="flex items-center space-x-3 mt-4 lg:mt-0">
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
        </div>

        {/* ✨ Improved chart layout with better styling */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 📊 Expense Chart - Enhanced Design */}
          <div className={`p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-100'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>Expense Categories</h3>
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            </div>
            
            <div className="w-full" style={{ height: '300px' }}>
              {loading ? (
                <ChartSkeleton />
              ) : expenseChartData && expenseChartData.labels.length > 0 ? (
                <Pie data={expenseChartData} options={getChartOptions(isDarkMode)} />
              ) : (
                <div className={`flex flex-col items-center justify-center h-full ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <span className="text-2xl">📊</span>
                  </div>
                  <p className="text-center">No expense data available</p>
                  <p className={`text-sm mt-1 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>Start adding expenses to see your spending breakdown</p>
                </div>
              )}
            </div>

            {/* 🏷️ Legend for expenses */}
            {expenseChartData && expenseChartData.labels.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {expenseChartData.labels.map((label, index) => (
                  <div key={label} className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: expenseChartData.datasets[0].backgroundColor[index] }}
                    ></div>
                    <span className={`text-sm truncate ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 📊 Income Chart - Enhanced Design */}
          <div className={`p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-100'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>Income Sources</h3>
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            </div>
            
            <div className="w-full" style={{ height: '300px' }}>
              {loading ? (
                <ChartSkeleton />
              ) : incomeChartData && incomeChartData.labels.length > 0 ? (
                <Pie data={incomeChartData} options={getChartOptions(isDarkMode)} />
              ) : (
                <div className={`flex flex-col items-center justify-center h-full ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <span className="text-2xl">💰</span>
                  </div>
                  <p className="text-center">No income data available</p>
                  <p className={`text-sm mt-1 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>Add income sources to see your earnings breakdown</p>
                </div>
              )}
            </div>

            {/* 🏷️ Legend for income */}
            {incomeChartData && incomeChartData.labels.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {incomeChartData.labels.map((label, index) => (
                  <div key={label} className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: incomeChartData.datasets[0].backgroundColor[index] }}
                    ></div>
                    <span className={`text-sm truncate ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 📊 Financial Health Score Dashboard */}
        <div className="mt-12">
          <FinancialHealthScore />
        </div>

        {/* 📝 Keep original RecentTransactions component */}
        <RecentTransactions 
          transactions={Array.isArray(transactions) ? transactions.slice(0, 5) : []} 
        />
        
        {/* Quick Expense Entry Button */}
        <QuickExpenseButton />
      </div>
    </AnimatedPage>
  );
};

export default Dashboard;