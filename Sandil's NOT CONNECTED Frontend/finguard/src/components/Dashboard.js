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

// Define chart options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
    },
  },
};

// Dummy data for the first pie chart (Expense Categories)
const expenseData = {
  labels: ['Food', 'Transport', 'Entertainment', 'Others'],
  datasets: [
    {
      data: [30, 25, 20, 25],
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
      hoverOffset: 4,
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
      hoverOffset: 4,
    },
  ],
};

const Dashboard = () => {
  return (
    
    
    
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <Navbar />
      <h1 className="text-3xl font-bold text-gray-900">Welcome User!</h1>
      <Cards />
      <Buttons />
      <h1 className="text-3xl font-bold text-gray-900 text-center mt-6">Your Income And Expense Summary</h1>
      <div className="flex justify-center mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="bg-white p-6 rounded-lg shadow-lg" style={{ width: '400px', height: '400px' }}>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Expense Categories</h2>
            <Pie data={expenseData} options={chartOptions} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg" style={{ width: '400px', height: '400px' }}>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Income Sources</h2>
            <Pie data={incomeData} options={chartOptions} />
          </div>
        </div>
      </div>
      <RecentTransactions />
      
    </div>
  );
};

export default Dashboard;