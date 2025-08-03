import React from 'react';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Title
);

const UserActivityChart = () => {
  const data = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Total Users',
        data: [80, 120, 150, 180],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'User Interactions',
        data: [50, 75, 110, 130],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#374151',
          font: { size: 14 },
        },
      },
      title: {
        display: true,
        text: 'User Engagement Over Time',
        color: '#111827',
        font: { size: 18 },
        padding: { top: 10, bottom: 30 },
      },
    },
    scales: {
      x: {
        ticks: { color: '#6b7280' },
        grid: { color: '#e5e7eb' },
      },
      y: {
        ticks: { color: '#6b7280' },
        grid: { color: '#e5e7eb' },
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <div className="h-72 w-full">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default UserActivityChart; // ✅ MUST BE DEFAULT EXPORT
