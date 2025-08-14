import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Dummy data for total income per month
const incomeData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'Total Income',
      data: [8000, 8400, 8800, 9200, 9600, 10000], // Sum of Salary, Freelance, Investments
      backgroundColor: 'rgba(255, 165, 0, 0.6)', // Orange with transparency
      borderColor: 'rgba(255, 165, 0, 1)', // Solid orange border
      borderWidth: 1,
    },
  ],
};

const IncomeGraph = () => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Total Income Over Time',
      },
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Amount (Rs.)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Months',
        },
      },
    },
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg mt-6" style={{ width: '100%', height: '300px' }}>
      <Bar data={incomeData} options={options} />
    </div>
  );
};

export default IncomeGraph;