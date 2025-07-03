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

// Utility to get month name from date string
const getMonthLabel = (dateString) => {
  const month = new Date(dateString).getMonth(); // 0-11
  return [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ][month];
};

const IncomeGraph = ({ incomes }) => {
  // Group incomes by month
  const monthlyTotals = {};

  incomes.forEach(income => {
    const monthLabel = getMonthLabel(income.date);
    if (!monthlyTotals[monthLabel]) {
      monthlyTotals[monthLabel] = 0;
    }
    monthlyTotals[monthLabel] += Number(income.amount || 0);
  });

  // Sort months correctly
  const orderedMonths = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const labels = orderedMonths;
  const data = labels.map(month => monthlyTotals[month] || 0);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Total Income',
        data,
        backgroundColor: 'rgba(255, 165, 0, 0.6)',
        borderColor: 'rgba(255, 165, 0, 1)',
        borderWidth: 1,
      },
    ],
  };

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
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default IncomeGraph;
