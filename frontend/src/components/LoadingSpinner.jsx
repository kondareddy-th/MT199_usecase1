import React from 'react';

const LoadingSpinner = ({ size = 'default', color = 'white' }) => {
  const sizeClass = size === 'small' ? 'h-4 w-4' : size === 'large' ? 'h-8 w-8' : 'h-5 w-5';
  const colorClass = color === 'primary' ? 'text-primary-600' : 
                    color === 'secondary' ? 'text-secondary-600' : 
                    color === 'accent' ? 'text-accent-600' : 
                    color === 'gray' ? 'text-gray-600' : 'text-white';
  
  return (
    <svg className={`${sizeClass} ${colorClass} animate-spin`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
};

export default LoadingSpinner;