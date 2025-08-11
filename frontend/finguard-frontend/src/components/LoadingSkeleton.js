// Loading skeleton components for better UX during data fetching
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

// Base skeleton component
export const SkeletonBase = ({ className = '', width, height, rounded = true }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div
      className={`
        animate-pulse 
        ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}
        ${rounded ? 'rounded' : ''}
        ${className}
      `}
      style={{ width, height }}
      role="status"
      aria-label="Loading content..."
    />
  );
};

// Text line skeleton
export const SkeletonText = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonBase
          key={index}
          height="1rem"
          width={index === lines - 1 ? '75%' : '100%'}
          className="h-4"
        />
      ))}
    </div>
  );
};

// Card skeleton
export const SkeletonCard = ({ className = '' }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`
      p-6 rounded-lg shadow 
      ${isDarkMode ? 'bg-gray-800' : 'bg-white'} 
      ${className}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <SkeletonBase height="1.5rem" width="40%" />
        <SkeletonBase height="1.5rem" width="20%" />
      </div>
      
      {/* Content */}
      <div className="space-y-3">
        <SkeletonText lines={2} />
        <div className="flex justify-between items-center pt-2">
          <SkeletonBase height="2rem" width="30%" />
          <SkeletonBase height="1rem" width="25%" />
        </div>
      </div>
    </div>
  );
};

// Table skeleton
export const SkeletonTable = ({ rows = 5, cols = 4, className = '' }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`
      rounded-lg shadow overflow-hidden
      ${isDarkMode ? 'bg-gray-800' : 'bg-white'}
      ${className}
    `}>
      {/* Table Header */}
      <div className={`
        px-6 py-3 border-b
        ${isDarkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}
      `}>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: cols }).map((_, index) => (
            <SkeletonBase key={index} height="1rem" width="80%" />
          ))}
        </div>
      </div>
      
      {/* Table Body */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="grid grid-cols-4 gap-4 items-center">
              {Array.from({ length: cols }).map((_, colIndex) => (
                <SkeletonBase 
                  key={colIndex} 
                  height="1rem" 
                  width={colIndex === 0 ? '90%' : '70%'} 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Chart skeleton
export const SkeletonChart = ({ type = 'line', className = '' }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`
      p-6 rounded-lg shadow
      ${isDarkMode ? 'bg-gray-800' : 'bg-white'}
      ${className}
    `}>
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-6">
        <SkeletonBase height="1.5rem" width="40%" />
        <div className="flex space-x-2">
          <SkeletonBase height="2rem" width="4rem" rounded className="rounded-full" />
          <SkeletonBase height="2rem" width="4rem" rounded className="rounded-full" />
        </div>
      </div>
      
      {/* Chart Area */}
      <div className="relative h-64 flex items-end justify-center space-x-2">
        {type === 'bar' ? (
          // Bar chart skeleton
          <>
            {Array.from({ length: 7 }).map((_, index) => (
              <SkeletonBase
                key={index}
                width="2rem"
                height={`${Math.random() * 60 + 20}%`}
                className="flex-shrink-0"
              />
            ))}
          </>
        ) : type === 'pie' ? (
          // Pie chart skeleton
          <SkeletonBase
            width="12rem"
            height="12rem"
            className="rounded-full"
          />
        ) : (
          // Line chart skeleton
          <div className="w-full h-full relative">
            <svg className="w-full h-full" viewBox="0 0 400 200">
              <defs>
                <linearGradient id="skeleton-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" className="animate-pulse" stopColor="#e5e7eb" />
                  <stop offset="50%" className="animate-pulse" stopColor="#f3f4f6" />
                  <stop offset="100%" className="animate-pulse" stopColor="#e5e7eb" />
                </linearGradient>
              </defs>
              <path
                d="M 0 150 Q 100 100 200 120 T 400 80"
                stroke="url(#skeleton-gradient)"
                strokeWidth="3"
                fill="none"
                className="animate-pulse"
              />
              <path
                d="M 0 180 Q 100 140 200 160 T 400 120"
                stroke="url(#skeleton-gradient)"
                strokeWidth="3"
                fill="none"
                className="animate-pulse"
                style={{ animationDelay: '0.5s' }}
              />
            </svg>
          </div>
        )}
      </div>
      
      {/* Chart Legend */}
      <div className="flex justify-center space-x-6 mt-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-center space-x-2">
            <SkeletonBase width="0.75rem" height="0.75rem" className="rounded-full" />
            <SkeletonBase width="4rem" height="1rem" />
          </div>
        ))}
      </div>
    </div>
  );
};

// Stats card skeleton
export const SkeletonStatsCard = ({ className = '' }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`
      p-6 rounded-lg shadow
      ${isDarkMode ? 'bg-gray-800' : 'bg-white'}
      ${className}
    `}>
      <div className="flex items-center">
        <div className="flex-1">
          <SkeletonBase height="1rem" width="70%" className="mb-2" />
          <SkeletonBase height="2rem" width="50%" />
        </div>
        <div className="flex-shrink-0 ml-4">
          <SkeletonBase width="3rem" height="3rem" className="rounded-full" />
        </div>
      </div>
      
      <div className="mt-4 flex items-center">
        <SkeletonBase height="0.75rem" width="30%" />
        <div className="ml-2 flex items-center">
          <SkeletonBase width="1rem" height="1rem" />
          <SkeletonBase width="3rem" height="0.75rem" className="ml-1" />
        </div>
      </div>
    </div>
  );
};

// Form skeleton
export const SkeletonForm = ({ fields = 4, className = '' }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`
      p-6 rounded-lg shadow
      ${isDarkMode ? 'bg-gray-800' : 'bg-white'}
      ${className}
    `}>
      {/* Form Header */}
      <SkeletonBase height="1.5rem" width="40%" className="mb-6" />
      
      {/* Form Fields */}
      <div className="space-y-4">
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index}>
            <SkeletonBase height="1rem" width="25%" className="mb-2" />
            <SkeletonBase height="2.5rem" width="100%" className="rounded-md" />
          </div>
        ))}
      </div>
      
      {/* Form Actions */}
      <div className="flex justify-end space-x-3 mt-6">
        <SkeletonBase height="2.5rem" width="5rem" className="rounded-md" />
        <SkeletonBase height="2.5rem" width="6rem" className="rounded-md" />
      </div>
    </div>
  );
};

// Page skeleton for full page loading
export const SkeletonPage = () => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <SkeletonBase height="2.5rem" width="40%" className="mb-2" />
          <SkeletonBase height="1.25rem" width="60%" />
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonStatsCard key={index} />
          ))}
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <div className="lg:col-span-2">
            <SkeletonChart type="line" />
          </div>
          
          {/* Side Panel */}
          <div className="space-y-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
        
        {/* Table Section */}
        <div className="mt-8">
          <SkeletonBase height="1.5rem" width="30%" className="mb-4" />
          <SkeletonTable rows={6} cols={5} />
        </div>
      </div>
    </div>
  );
};

// Custom hook for loading states
export const useLoadingSkeleton = (isLoading, Component, SkeletonComponent, props = {}) => {
  return isLoading ? <SkeletonComponent {...props} /> : <Component {...props} />;
};

export default {
  SkeletonBase,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonChart,
  SkeletonStatsCard,
  SkeletonForm,
  SkeletonPage,
  useLoadingSkeleton
};