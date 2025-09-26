import React from 'react';

export const Alert = ({ children, className = "", ...props }) => (
  <div 
    className={`p-4 rounded-lg border bg-gray-50 ${className}`} 
    {...props}
  >
    {children}
  </div>
);

export const AlertDescription = ({ children, className = "", ...props }) => (
  <div 
    className={`text-sm text-gray-700 ${className}`} 
    {...props}
  >
    {children}
  </div>
);