import React from 'react';
import { Home, Sparkles, Plus } from 'lucide-react';

interface BottomNavigationProps {
  activeView: string;
  setActiveView: (view: string) => void;
  theme: 'light' | 'dark';
  onAddExpense: () => void;
}

export function BottomNavigation({ activeView, setActiveView, theme, onAddExpense }: BottomNavigationProps) {
  // Determine the current section and corresponding home view
  const getBaseView = () => {
    if (activeView === 'home' || activeView === 'ai') return 'home';
    if (activeView === 'fitness' || activeView === 'fitness-ai') return 'fitness';
    if (activeView === 'academics' || activeView === 'academics-ai') return 'academics';
    return 'home'; // Default
  };

  // Handle home button click - toggle between main view and AI insights
  const handleHomeClick = () => {
    const currentBase = getBaseView();
    
    // If we're on an AI view, go to the main view
    if (activeView === 'ai') {
      setActiveView('home');
    } else if (activeView === 'fitness-ai') {
      setActiveView('fitness');
    } else if (activeView === 'academics-ai') {
      setActiveView('academics');
    } else {
      // Otherwise we're on a main view, do nothing
      return;
    }
  };

  // Handle insights button click
  const handleInsightsClick = () => {
    const currentBase = getBaseView();
    
    // If we're on a main view, go to the corresponding AI view
    if (activeView === 'home') {
      setActiveView('ai');
    } else if (activeView === 'fitness') {
      setActiveView('fitness-ai');
    } else if (activeView === 'academics') {
      setActiveView('academics-ai');
    } else {
      // Otherwise we're on an AI view, do nothing
      return;
    }
  };

  // Check if we're on the home view for the current section
  const isHomeActive = activeView === 'home' || activeView === 'fitness' || activeView === 'academics';
  
  // Check if we're on the AI insights view for the current section
  const isAiActive = activeView === 'ai' || activeView === 'fitness-ai' || activeView === 'academics-ai';

  return (
    <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-full shadow-lg p-1 z-10 transition-colors duration-200`}>
      <div className="flex items-center justify-center space-x-1 relative">
        <button
          onClick={handleHomeClick}
          className={`p-3 rounded-full z-10 ${
            isHomeActive 
              ? `${theme === 'dark' ? 'bg-gray-700 text-purple-400' : 'bg-purple-500/10 text-purple-600'}`
              : `text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700`
          } transition-colors duration-200`}
        >
          <Home size={22} />
        </button>
        
        {/* Add Expense Button (Center) - Updated with gradient */}
        <button
          onClick={onAddExpense}
          className={`p-3 rounded-full z-20 
            ${theme === 'dark' 
              ? 'bg-gradient-to-r from-[#8983f7] to-[#a3dafb] hover:opacity-90' 
              : 'bg-gradient-to-r from-purple-500 to-blue-400 hover:opacity-90'
            }
            text-white shadow-md transition-all duration-200`}
        >
          <Plus size={24} />
        </button>
        
        <button
          onClick={handleInsightsClick}
          className={`p-3 rounded-full z-10 ${
            isAiActive 
              ? `${theme === 'dark' ? 'bg-gray-700 text-purple-400' : 'bg-purple-500/10 text-purple-600'}`
              : `text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700`
          } transition-colors duration-200`}
        >
          <Sparkles size={22} />
        </button>
      </div>
    </div>
  );
}
