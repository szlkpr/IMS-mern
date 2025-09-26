import React from 'react';

const buttonVariants = {
  default: "bg-blue-600 text-white hover:bg-blue-700 border-blue-600",
  destructive: "bg-red-600 text-white hover:bg-red-700 border-red-600",
  outline: "bg-transparent text-gray-700 hover:bg-gray-50 border-gray-300",
  secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 border-gray-200",
  ghost: "bg-transparent text-gray-700 hover:bg-gray-100 border-transparent",
  link: "bg-transparent text-blue-600 hover:text-blue-800 border-transparent underline"
};

const buttonSizes = {
  default: "px-4 py-2 text-sm",
  sm: "px-3 py-1.5 text-xs",
  lg: "px-6 py-3 text-base",
  icon: "p-2"
};

export const Button = ({ 
  children, 
  className = "", 
  variant = "default", 
  size = "default", 
  disabled = false,
  ...props 
}) => {
  const variantClasses = buttonVariants[variant] || buttonVariants.default;
  const sizeClasses = buttonSizes[size] || buttonSizes.default;
  
  return (
    <button 
      className={`
        inline-flex items-center justify-center font-medium rounded-md border 
        transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:opacity-50 disabled:pointer-events-none
        ${variantClasses} ${sizeClasses} ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};