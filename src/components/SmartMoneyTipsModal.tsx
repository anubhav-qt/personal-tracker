import React, { useEffect } from 'react';
import { SmartMoneyTips } from './SmartMoneyTips';
import { X, Sparkles, RefreshCw } from 'lucide-react';

interface SmartMoneyTipsModalProps {
  tips: string;
  isLoading: boolean;
  onRefresh: () => void;
  onClose: () => void;
  theme: string;
}

export const SmartMoneyTipsModal = ({
  tips,
  isLoading,
  onRefresh,
  onClose,
  theme
}: SmartMoneyTipsModalProps) => {
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
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        ></div>

        {/* Modal Container */}
        <div className="inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} px-4 pt-5 pb-6 sm:p-6 relative`}>
            <button
              onClick={onClose}
              className={`absolute top-4 right-4 ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <X size={24} />
            </button>
            
            <div className="mb-4 flex items-center">
              <Sparkles size={22} className="text-purple-500 mr-2" />
              <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Smart Money Tips
              </h3>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw size={24} className="animate-spin text-purple-500" />
                </div>
              ) : (
                <SmartMoneyTips tips={tips} theme={theme} />
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button 
                onClick={onRefresh}
                disabled={isLoading}
                className={`flex items-center px-4 py-2 rounded-md ${
                  theme === 'dark' 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                } transition-colors duration-200`}
              >
                {isLoading ? <RefreshCw size={16} className="animate-spin mr-2" /> : <RefreshCw size={16} className="mr-2" />}
                Refresh Tips
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
