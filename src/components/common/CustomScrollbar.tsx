import React from 'react';

interface CustomScrollbarProps {
  children: React.ReactNode;
  className?: string;
}

export const CustomScrollbar: React.FC<CustomScrollbarProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div 
      className={`
        scrollbar-thin
        scrollbar-track-transparent
        scrollbar-thumb-indigo-500/30
        hover:scrollbar-thumb-indigo-500/50
        dark:scrollbar-thumb-indigo-400/40
        dark:hover:scrollbar-thumb-indigo-400/60
        transition-colors duration-300 ease-in-out
        rounded-2xl
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default CustomScrollbar; 