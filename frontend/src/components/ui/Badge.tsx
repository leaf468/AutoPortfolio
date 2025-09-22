import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'outline';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = ''
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
    primary: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
    secondary: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    outline: 'border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300'
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all hover:scale-105 ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;