import React, { useState, useEffect } from 'react';
import { Category, Expense } from '../types';
import { useTheme } from '../context/ThemeContext';
import { X, PlusCircle, Save } from 'lucide-react';
import { useExpenses } from '../hooks/useExpenses';

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
  const { addExpense, updateExpense } = useExpenses(userId);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form when editing an expense or reset when not editing
  useEffect(() => {
    if (editingExpense) {
      setAmount(editingExpense.amount.toString());
      setDescription(editingExpense.description);
      setCategoryId(editingExpense.category_id);
      setDate(editingExpense.date);
    } else {
      // Always set today's date when not editing
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [editingExpense]);

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setCategoryId('');
    setDate(new Date().toISOString().split('T')[0]);
    setError(null);
    setEditingExpense(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (editingExpense) {
        // Update existing expense
        const result = await updateExpense(editingExpense.id, {
          amount: parseFloat(amount),
          description,
          category_id: categoryId,
          date
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to update expense');
        }
      } else {
        // Create new expense
        const result = await addExpense({
          user_id: userId,
          amount: parseFloat(amount),
          description,
          category_id: categoryId,
          date
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to add expense');
        }
      }

      // Clear form and close modal
      resetForm();
      onClose();
      
    } catch (error: any) {
      console.error('Error saving expense:', error);
      setError(error.message || 'An error occurred while saving the expense');
    } finally {
      setIsLoading(false);
    }
  };

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
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        ></div>

        {/* Centered Modal Container */}
        <div className="inline-block w-full max-w-lg rounded-2xl text-left overflow-hidden shadow-xl transform transition-all my-8 align-middle">
          <div className={`${theme === 'dark' ? 'bg-[#26242e]' : 'bg-white'} px-6 pt-6 pb-6 sm:p-6 relative`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </h2>
              <button
                onClick={onClose}
                className={`${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-zinc-500 hover:text-zinc-700'}`}
              >
                <X size={20} />
              </button>
            </div>
            
            {error && (
              <div className={`mb-4 ${theme === 'dark' ? 'bg-red-900/50 border-red-800' : 'bg-red-50 border-red-200'} text-red-600 dark:text-red-400 px-4 py-3 rounded-md text-sm border`}>
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`mt-1 block w-full rounded-md ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'border-gray-300 text-gray-900'
                  } shadow-sm focus:border-purple-500 focus:ring-purple-500 transition-colors duration-200`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`mt-1 block w-full rounded-md ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'border-gray-300 text-gray-900'
                  } shadow-sm focus:border-purple-500 focus:ring-purple-500 transition-colors duration-200`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className={`mt-1 block w-full rounded-md ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'border-gray-300 text-gray-900'
                  } shadow-sm focus:border-purple-500 focus:ring-purple-500 transition-colors duration-200`}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`mt-1 block w-full rounded-md ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'border-gray-300 text-gray-900'
                  } shadow-sm focus:border-purple-500 focus:ring-purple-500 transition-colors duration-200`}
                  required
                />
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-2.5 px-4 rounded-xl shadow-sm transition-colors duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {editingExpense ? (
                    <>
                      <Save size={18} />
                      {isLoading ? 'Updating...' : 'Update Expense'}
                    </>
                  ) : (
                    <>
                      <PlusCircle size={18} />
                      {isLoading ? 'Adding...' : 'Add Expense'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
