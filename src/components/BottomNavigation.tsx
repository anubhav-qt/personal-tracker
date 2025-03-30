import { useState } from 'react';
import { Home, Sparkles, Plus, Settings, LogOut, X, AlertCircle } from 'lucide-react';

interface BottomNavigationProps {
  activeView: string;
  setActiveView: (view: string) => void;
  theme: 'light' | 'dark';
  onAddExpense: () => void;
  onSignOut: () => void;
  onSettingsClick: () => void;
}

export function BottomNavigation({ 
  activeView, 
  setActiveView, 
  theme, 
  onAddExpense,
  onSignOut,
  onSettingsClick
}: BottomNavigationProps) {
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  // Handle home button click - always go to home view
  const handleHomeClick = () => {
    // Always navigate to home when home button is clicked
    setActiveView('home');
  };

  // Handle insights button click - always go to AI insights view
  const handleInsightsClick = () => {
    // Always navigate to AI insights when insights button is clicked
    setActiveView('ai');
  };

  // Check if we're on the home view
  const isHomeActive = activeView === 'home';
  
  // Check if we're on the AI insights view
  const isAiActive = activeView === 'ai';

  // Check if we're on the settings view
  const isSettingsActive = activeView === 'settings';

  return (
    <>
      <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-full shadow-lg p-1 z-10 transition-colors duration-200`}>
        <div className="flex items-center justify-center space-x-1 relative">
          {/* Home Button with Tooltip */}
          <div className="relative group">
            <button
              onClick={handleHomeClick}
              className={`p-3 rounded-full z-10 ${
                isHomeActive 
                  ? `${theme === 'dark' ? 'bg-gray-700 text-purple-400' : 'bg-purple-500/10 text-purple-600'}`
                  : `text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700`
              } transition-colors duration-200`}
              aria-label="Home"
            >
              <Home size={22} />
            </button>
            <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap ${
              theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-800 shadow-md'
            }`}>
              Home
            </div>
          </div>
          
          {/* AI Insights Button with Tooltip */}
          <div className="relative group">
            <button
              onClick={handleInsightsClick}
              className={`p-3 rounded-full z-10 ${
                isAiActive 
                  ? `${theme === 'dark' ? 'bg-gray-700 text-purple-400' : 'bg-purple-500/10 text-purple-600'}`
                  : `text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700`
              } transition-colors duration-200`}
              aria-label="AI Insights"
            >
              <Sparkles size={22} />
            </button>
            <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap ${
              theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-800 shadow-md'
            }`}>
              AI Insights
            </div>
          </div>
          
          {/* Add Expense Button with Tooltip */}
          <div className="relative group">
            <button
              onClick={onAddExpense}
              className={`p-3 rounded-full z-20 
                ${theme === 'dark' 
                  ? 'bg-gradient-to-r from-[#8983f7] to-[#a3dafb] hover:opacity-90' 
                  : 'bg-gradient-to-r from-purple-500 to-blue-400 hover:opacity-90'
                }
                text-white shadow-md transition-all duration-200`}
              aria-label="Add Expense"
            >
              <Plus size={24} />
            </button>
            <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap ${
              theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-800 shadow-md'
            }`}>
              Add Expense
            </div>
          </div>
          
          {/* Settings Button with Tooltip */}
          <div className="relative group">
            <button
              onClick={onSettingsClick}
              className={`p-3 rounded-full z-10 ${
                isSettingsActive 
                  ? `${theme === 'dark' ? 'bg-gray-700 text-purple-400' : 'bg-purple-500/10 text-purple-600'}`
                  : `text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700`
              } transition-colors duration-200`}
              aria-label="Settings"
            >
              <Settings size={22} />
            </button>
            <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap ${
              theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-800 shadow-md'
            }`}>
              Settings
            </div>
          </div>
          
          {/* Logout Button with Tooltip */}
          <div className="relative group">
            <button
              onClick={() => setShowSignOutModal(true)}
              className={`p-3 rounded-full z-10 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200`}
              aria-label="Sign Out"
            >
              <LogOut size={22} />
            </button>
            <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap ${
              theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-800 shadow-md'
            }`}>
              Sign Out
            </div>
          </div>
        </div>
      </div>
      
      {/* Sign Out Confirmation Modal */}
      {showSignOutModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm transition-opacity"
              aria-hidden="true"
              onClick={() => setShowSignOutModal(false)}
            ></div>
            
            {/* Modal */}
            <div className={`inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${theme === 'dark' ? 'bg-red-900' : 'bg-red-100'} sm:mx-0 sm:h-10 sm:w-10`}>
                    <AlertCircle className={`h-6 w-6 ${theme === 'dark' ? 'text-red-300' : 'text-red-600'}`} aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className={`text-lg leading-6 font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Sign Out
                    </h3>
                    <div className="mt-2">
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                        Are you sure you want to sign out of your account?
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse ${theme === 'dark' ? 'border-t border-gray-700' : 'border-t border-gray-200'}`}>
                <button
                  type="button"
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 ${
                    theme === 'dark' 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  } text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm`}
                  onClick={() => {
                    setShowSignOutModal(false);
                    onSignOut();
                  }}
                >
                  Sign Out
                </button>
                <button
                  type="button"
                  className={`mt-3 w-full inline-flex justify-center rounded-md border ${
                    theme === 'dark' 
                      ? 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  } px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm`}
                  onClick={() => setShowSignOutModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
