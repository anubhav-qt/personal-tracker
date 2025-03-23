import React from 'react';
import { ExpenseForm } from './ExpenseForm';
import { Category, Expense } from '../types';
import { useTheme } from '../context/ThemeContext';
import { X } from 'lucide-react';

interface ExpenseFormModalProps {
  categories: Category[];
  editingExpense: Expense | null;
  setEditingExpense: (expense: Expense | null) => void;
  userId: string;
  onClose: () => void;
}

export const ExpenseFormModal = ({ 
  categories, 
  editingExpense, 
  setEditingExpense,
  userId,
  onClose
}: ExpenseFormModalProps) => {
  const { theme } = useTheme();

  // Close on Escape key press
  React.useEffect(() => {
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
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} px-4 pt-5 pb-4 sm:p-6 sm:pb-4 relative`}>
            <button
              onClick={onClose}
              className={`absolute top-4 right-4 ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <X size={24} />
            </button>
            
            <div className="mt-4">
              <ExpenseForm
                categories={categories}
                editingExpense={editingExpense}
                setEditingExpense={setEditingExpense}
                userId={userId}
                onSuccess={onClose}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
