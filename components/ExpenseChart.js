import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LinearScale, // Using LinearScale for both axes
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Dummy data for Linear Scale Line Chart
const expenseData = {
  labels: [1, 2, 3, 4, 5, 6], // Numerical values representing days or indices
  datasets: [
    {
      label: 'Expenses (Rs.)',
      data: [300, 250, 400, 350, 450, 500], // Corresponding expense values
      fill: false,
      borderColor: 'rgb(255, 99, 132)',
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
      tension: 0.1,
      pointRadius: 5,
      pointHoverRadius: 7,
    },
  ],
};

const expenseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' },
    title: { display: true, text: 'Expense Trends (Linear Scale)' },
  },
  scales: {
    x: {
      type: 'linear',
      position: 'bottom',
      title: { display: true, text: 'Day' },
      min: 1,
      max: 6,
    },
    y: {
      type: 'linear',
      beginAtZero: true,
      title: { display: true, text: 'Amount (Rs.)' },
    },
  },
};

const ExpenseChart = () => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-lg" style={{ width: '100%', height: '300px' }}>
      <Line data={expenseData} options={expenseOptions} />
    </div>
  );
};

export default ExpenseChart;