// Dashboard.js (with backend data + animated page)
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
import AnimatedPage from './AnimatedPage'; // ✅ imported

ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
  const [expenseChartData, setExpenseChartData] = useState(null);
  const [incomeChartData, setIncomeChartData] = useState(null);
  const [summary, setSummary] = useState({ income: 0, expenses: 0, balance: 0 });
  const [transactions, setTransactions] = useState([]);

  const token = localStorage.getItem('finguard-token');
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();

  useEffect(() => {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    // Fetch summary
    fetch(`http://localhost:5000/api/summary?month=${month}&year=${year}`, { headers })
      .then(res => res.json())
      .then(data => {
        setSummary({
          income: data.income || 0,
          expenses: data.expenses || 0,
          balance: data.balance || 0,
        });
      })
      .catch(err => console.error('Summary fetch error:', err));

    // Fetch transactions
fetch(`http://localhost:5000/api/transactions`, { headers })
  .then(res => res.json())
  .then(data => {
    console.log("Fetched transactions:", data); // ✅ for debugging
    setTransactions(data); // ✅ Restore original

    const incomeGroups = data
      .filter(tx => tx.type === 'income')
      .reduce((acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + parseFloat(tx.amount);
        return acc;
      }, {});
    setIncomeChartData({
      labels: Object.keys(incomeGroups),
      datasets: [{
        data: Object.values(incomeGroups),
        backgroundColor: ['#003f5c', '#58508d', '#bc5090', '#ffa600'],
        hoverOffset: 4,
      }],
    });

    const expenseGroups = data
      .filter(tx => tx.type === 'expense')
      .reduce((acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + parseFloat(tx.amount);
        return acc;
      }, {});
    setExpenseChartData({
      labels: Object.keys(expenseGroups),
      datasets: [{
        data: Object.values(expenseGroups),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
        hoverOffset: 4,
      }],
    });
  })
  .catch(err => console.error('Transactions fetch error:', err));

}, [token, month, year]);

  return (
    <AnimatedPage>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Navbar />
        <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
        <Cards summary={summary} />
        <Buttons />

        <h1 className="text-3xl font-bold text-gray-900 text-center mt-6">Your Income And Expense Summary</h1>

        <div className="flex justify-center mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-lg" style={{ width: '400px', height: '400px' }}>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Expense Categories</h2>
              {expenseChartData && expenseChartData.labels.length > 0 ? (
                <Pie data={expenseChartData} />
              ) : (
                <p className="text-center text-gray-500">No expense data available</p>
              )}
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg" style={{ width: '400px', height: '400px' }}>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Income Sources</h2>
              {incomeChartData && incomeChartData.labels.length > 0 ? (
                <Pie data={incomeChartData} />
              ) : (
                <p className="text-center text-gray-500">No income data available</p>
              )}
            </div>
          </div>
        </div>

       <RecentTransactions transactions={Array.isArray(transactions) ? transactions.slice(0, 5) : []} />

      </div>
    </AnimatedPage>
  );
};

export default Dashboard;

