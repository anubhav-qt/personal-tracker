import React, { useEffect } from 'react';
import { X, RefreshCw, Lightbulb } from 'lucide-react';

interface SmartMoneyTipsModalProps {
  tips: string;
  isLoading: boolean;
  onRefresh: () => void;
  onClose: () => void;
  theme: 'light' | 'dark';
}

export function SmartMoneyTipsModal({
  tips,
  isLoading,
  onRefresh,
  onClose,
  theme
}: SmartMoneyTipsModalProps) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        ></div>

        {/* Modal Container */}
        <div className="inline-block align-bottom rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} px-4 pt-5 pb-4 sm:p-6 sm:pb-4 relative`}>
            <button
              onClick={onClose}
              className={`absolute top-4 right-4 ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              <X size={24} />
            </button>
            
            <div className="sm:flex sm:items-start mb-4">
              <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${
                theme === 'dark' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-600'
              } sm:mx-0 sm:h-10 sm:w-10`}>
                <Lightbulb size={20} />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className={`text-lg leading-6 font-medium ${theme === 'dark' ? 'text-white' : 'text-zinc-800'}`}>
                  Smart Money Tips
                </h3>
                <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-zinc-500'}`}>
                  Personalized financial advice based on your spending habits.
                </p>
              </div>
            </div>
            
            <div className={`mt-4 p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-zinc-50'} min-h-[150px] relative`}>
              {isLoading ? (
                <div className="flex justify-center items-center h-full absolute inset-0">
                  <div className="flex flex-col items-center">
                    <RefreshCw size={24} className="animate-spin mb-2 text-blue-500" />
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-zinc-500'}`}>
                      Generating personalized tips...
                    </p>
                  </div>
                </div>
              ) : (
                <div className={`prose ${theme === 'dark' ? 'prose-invert' : 'prose-zinc'} max-w-none`}>
                  <div dangerouslySetInnerHTML={{ __html: tips.replace(/\n/g, '<br />') }} />
                </div>
              )}
            </div>

            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className={`inline-flex justify-center w-full sm:ml-3 sm:w-auto sm:text-sm px-4 py-2 rounded-md ${
                  theme === 'dark' 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                } font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50`}
              >
                {isLoading ? (
                  <RefreshCw size={16} className="animate-spin mr-2" />
                ) : (
                  <RefreshCw size={16} className="mr-2" />
                )}
                Refresh Tips
              </button>
              <button
                onClick={onClose}
                className={`mt-3 sm:mt-0 inline-flex justify-center w-full sm:ml-3 sm:w-auto sm:text-sm px-4 py-2 rounded-md ${
                  theme === 'dark' 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-white hover:bg-gray-50 text-gray-700'
                } font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
