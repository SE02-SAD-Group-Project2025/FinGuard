import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import RecentTransactions from './RecentTransactions';
import Cards from './Cards';
import Buttons from './Buttons';
import Navbar from './Navbar';

ChartJS.register(ArcElement, Tooltip, Legend);

// Define chart options with hover-only legends
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false, // Hide default legend
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          const label = context.label || '';
          const value = context.raw || 0;
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = Math.round((value / total) * 100);
          return `${label}: ${percentage}% (${value})`;
        }
      }
    }
  },
};

// Dummy data for the first pie chart (Expense Categories)
const expenseData = {
  labels: ['Food', 'Transport', 'Entertainment', 'Others'],
  datasets: [
    {
      data: [30, 25, 20, 25],
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
      hoverOffset: 10,
      borderWidth: 0,
    },
  ],
};

// Dummy data for the second pie chart (Income Sources)
const incomeData = {
  labels: ['Salary', 'Freelance', 'Investments'],
  datasets: [
    {
      data: [60, 25, 15],
      backgroundColor: ['#003f5c', '#58508d', '#bc5090'],
      hoverOffset: 10,
      borderWidth: 0,
    },
  ],
};

const Dashboard = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <Navbar />
      {/* <h1 className="text-3xl font-bold text-gray-900">Welcome User!</h1> */}
      <Cards />
      <Buttons />
      <h1 className="text-3xl font-bold text-gray-900 text-center mt-6">Your Income And Expense Summary</h1>
      
      {/* Improved chart layout */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Expense Chart */}
        <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Expense Categories</h2>
          <div className="w-full" style={{ height: '300px' }}>
            <Pie data={expenseData} options={chartOptions} />
          </div>
        </div>
        
        {/* Income Chart */}
        <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Income Sources</h2>
          <div className="w-full" style={{ height: '300px' }}>
            <Pie data={incomeData} options={chartOptions} />
          </div>
        </div>
      </div>
      
      <RecentTransactions />
    </div>
  );
};

export default Dashboard;