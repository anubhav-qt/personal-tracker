import React from 'react';
import { Home, BarChart2, Sparkles, Plus } from 'lucide-react';

interface BottomNavigationProps {
  activeView: string;
  setActiveView: (view: string) => void;
  theme: 'light' | 'dark';
  onAddExpense: () => void;
}

export function BottomNavigation({ activeView, setActiveView, theme, onAddExpense }: BottomNavigationProps) {
  return (
    <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-full shadow-lg p-1 z-10 transition-colors duration-200`}>
      <div className="flex items-center justify-center space-x-1 relative">
        <button
          onClick={() => setActiveView('home')}
          className={`p-3 rounded-full z-10 ${
            activeView === 'home' 
              ? `${theme === 'dark' ? 'bg-gray-700 text-lime-500' : 'bg-lime-500/10 text-lime-600'}`
              : `text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700`
          } transition-colors duration-200`}
        >
          <Home size={22} />
        </button>
        
        <button
          onClick={() => setActiveView('dashboard')}
          className={`p-3 rounded-full z-10 ${
            activeView === 'dashboard' 
              ? `${theme === 'dark' ? 'bg-gray-700 text-lime-500' : 'bg-lime-500/10 text-lime-600'}`
              : `text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700`
          } transition-colors duration-200`}
        >
          <BarChart2 size={22} />
        </button>
        
        {/* Add Expense Button (Center) */}
        <button
          onClick={onAddExpense}
          className={`p-3 rounded-full z-20 
            ${theme === 'dark' ? 'bg-lime-600 hover:bg-lime-700' : 'bg-lime-600 hover:bg-lime-700'}
            text-white shadow-md transition-colors duration-200`}
        >
          <Plus size={24} />
        </button>
        
        <button
          onClick={() => setActiveView('ai')}
          className={`p-3 rounded-full z-10 ${
            activeView === 'ai' 
              ? `${theme === 'dark' ? 'bg-gray-700 text-lime-500' : 'bg-lime-500/10 text-lime-600'}`
              : `text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700`
          } transition-colors duration-200`}
        >
          <Sparkles size={22} />
        </button>
      </div>
    </div>
  );
}
