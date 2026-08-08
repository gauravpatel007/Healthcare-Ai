import React from 'react';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = ({ theme, toggleTheme }) => {
  return (
    <button 
      onClick={toggleTheme} 
      aria-label="Toggle Dark Mode"
      className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center overflow-hidden"
    >
      <div className={`transition-transform duration-500 ease-in-out ${theme === 'dark' ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'} absolute`}>
        <Moon className="w-5 h-5 text-gray-800 dark:text-gray-200" fill="currentColor" />
      </div>
      <div className={`transition-transform duration-500 ease-in-out ${theme === 'light' ? '-rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'} absolute`}>
        <Sun className="w-5 h-5 text-yellow-500" fill="currentColor" />
      </div>
      {/* Invisible placeholder to maintain layout size */}
      <div className="w-5 h-5 opacity-0 pointer-events-none"></div>
    </button>
  );
};

export default ThemeToggle;
