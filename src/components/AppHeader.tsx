import React from 'react';
import { LogOut, Settings } from 'lucide-react';

interface AppHeaderProps {
  theme: 'light' | 'dark';
  onSettingsClick: () => void;
  onSignOut: () => void;
}

export function AppHeader({ theme, onSettingsClick, onSignOut }: AppHeaderProps) {
  return (
    <nav className={`${theme === 'dark' ? 'bg-gray-800 shadow-gray-700/30' : 'bg-white shadow-sm'} transition-colors duration-200`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <h1 className={`text-xl font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Expense Tracker</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={onSettingsClick}
              className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-zinc-100 hover:bg-zinc-200'} 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200`}
            >
              <Settings size={20} className={`${theme === 'dark' ? 'text-gray-300' : 'text-zinc-700'}`} />
            </button>
            <button
              onClick={onSignOut}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md
              ${theme === 'dark' ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' : 'text-zinc-700 bg-zinc-100 hover:bg-zinc-200'} 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200`}
            >
              <LogOut size={18} className="mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
