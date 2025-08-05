// Dashboard.js (Backend connected + Improved Design)
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

ChartJS.register(ArcElement, Tooltip, Legend);

// ✨ Improved chart options with better styling
const chartOptions = {
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
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
    }
  },
  animation: {
    animateRotate: true,
    animateScale: true,
  },
};

const Dashboard = () => {
  // 🔄 Keep all original backend state management
  const [expenseChartData, setExpenseChartData] = useState(null);
  const [incomeChartData, setIncomeChartData] = useState(null);
  const [summary, setSummary] = useState({ income: 0, expenses: 0, balance: 0 });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('finguard-token');
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();

  // 🔄 Keep all original backend data fetching logic
  useEffect(() => {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch summary
        const summaryResponse = await fetch(`http://localhost:5000/api/summary?month=${month}&year=${year}`, { headers });
        const summaryData = await summaryResponse.json();
        setSummary({
          income: summaryData.income || 0,
          expenses: summaryData.expenses || 0,
          balance: summaryData.balance || 0,
        });

        // Fetch transactions
        const transactionsResponse = await fetch(`http://localhost:5000/api/transactions`, { headers });
        const transactionsData = await transactionsResponse.json();
        console.log("Fetched transactions:", transactionsData);
        setTransactions(transactionsData);

        // ✨ Enhanced chart data processing with better colors
        const incomeGroups = transactionsData
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

        const expenseGroups = transactionsData
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
  }, [token, month, year]);

  // 📊 Loading state component
  const ChartSkeleton = () => (
    <div className="animate-pulse">
      <div className="w-full h-64 bg-gray-200 rounded-full mx-auto"></div>
      <div className="mt-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
      </div>
    </div>
  );

  return (
    <AnimatedPage>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Navbar />
        
        {/* 🎯 Keep original welcome message but make it dynamic */}
        <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
        
        {/* 🔄 Keep original Cards and Buttons components */}
        <Cards summary={summary} />
        <Buttons />

        {/* ✨ Improved section title */}
        <div className="mt-8 mb-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900">Your Income And Expense Summary</h2>
          <p className="text-gray-600 mt-2">
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* ✨ Improved chart layout with better styling */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 📊 Expense Chart - Enhanced Design */}
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Expense Categories</h3>
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            </div>
            
            <div className="w-full" style={{ height: '300px' }}>
              {loading ? (
                <ChartSkeleton />
              ) : expenseChartData && expenseChartData.labels.length > 0 ? (
                <Pie data={expenseChartData} options={chartOptions} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">📊</span>
                  </div>
                  <p className="text-center">No expense data available</p>
                  <p className="text-sm text-gray-400 mt-1">Start adding expenses to see your spending breakdown</p>
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
                    <span className="text-sm text-gray-600 truncate">{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 📊 Income Chart - Enhanced Design */}
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Income Sources</h3>
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            </div>
            
            <div className="w-full" style={{ height: '300px' }}>
              {loading ? (
                <ChartSkeleton />
              ) : incomeChartData && incomeChartData.labels.length > 0 ? (
                <Pie data={incomeChartData} options={chartOptions} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">💰</span>
                  </div>
                  <p className="text-center">No income data available</p>
                  <p className="text-sm text-gray-400 mt-1">Add income sources to see your earnings breakdown</p>
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
                    <span className="text-sm text-gray-600 truncate">{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 📝 Keep original RecentTransactions component */}
        <RecentTransactions 
          transactions={Array.isArray(transactions) ? transactions.slice(0, 5) : []} 
        />
      </div>
    </AnimatedPage>
  );
};

export default Dashboard;