import React from 'react';

const badgeVariants = {
  default: "bg-gray-100 text-gray-800 border-gray-200",
  secondary: "bg-gray-100 text-gray-600 border-gray-200",
  destructive: "bg-red-100 text-red-800 border-red-200",
  outline: "bg-transparent border border-gray-300 text-gray-700"
};

export const Badge = ({ children, className = "", variant = "default", ...props }) => {
  const variantClasses = badgeVariants[variant] || badgeVariants.default;
  
  return (
    <span 
      className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${variantClasses} ${className}`} 
      {...props}
    >
      {children}
    </span>
  );
};