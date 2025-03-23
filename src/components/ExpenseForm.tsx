import React, { useState, useEffect } from 'react';
import { PlusCircle, Save, X } from 'lucide-react';
import { Category, Expense } from '../types';
import { useExpenses } from '../hooks/useExpenses';
import { useTheme } from '../context/ThemeContext';

interface ExpenseFormProps {
  categories: Category[];
  editingExpense: Expense | null;
  setEditingExpense: (expense: Expense | null) => void;
  userId: string;
}

export const ExpenseForm = React.memo(({ 
  categories, 
  editingExpense, 
  setEditingExpense,
  userId 
}: ExpenseFormProps) => {
  const { theme } = useTheme();
  const { addExpense, updateExpense } = useExpenses(userId);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingExpense) {
      setAmount(editingExpense.amount.toString());
      setDescription(editingExpense.description);
      setCategoryId(editingExpense.category_id);
      setDate(editingExpense.date);
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
        console.log('Updating expense:', editingExpense.id, { amount, description, category_id: categoryId, date });
        const result = await updateExpense(editingExpense.id, {
          amount: parseFloat(amount),
          description,
          category_id: categoryId,
          date
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to update expense');
        } else {
          console.log('Update successful!');
        }
      } else {
        // Create new expense
        console.log('Adding new expense:', { user_id: userId, amount, description, category_id: categoryId, date });
        const result = await addExpense({
          user_id: userId,
          amount: parseFloat(amount),
          description,
          category_id: categoryId,
          date
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to add expense');
        } else {
          console.log('Add successful!');
        }
      }

      // Clear form
      resetForm();
    } catch (error: any) {
      console.error('Error saving expense:', error);
      setError(error.message || 'An error occurred while saving the expense');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEdit = () => {
    resetForm();
  };

  return (
    <form onSubmit={handleSubmit} className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} p-6 rounded-lg shadow-md transition-colors duration-200`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          {editingExpense ? 'Edit Expense' : 'Add New Expense'}
        </h2>
        {editingExpense && (
          <button
            type="button"
            onClick={cancelEdit}
            className={`${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <X size={20} />
          </button>
        )}
      </div>
      
      {error && (
        <div className={`mb-4 ${theme === 'dark' ? 'bg-red-900/50 border-red-800' : 'bg-red-50 border-red-200'} text-red-600 dark:text-red-400 px-4 py-3 rounded-md text-sm border`}>
          {error}
        </div>
      )}
      
      <div className="grid gap-4">
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
            } shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200`}
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
            } shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200`}
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
            } shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200`}
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
            } shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200`}
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {editingExpense ? (
            <>
              <Save size={20} />
              {isLoading ? 'Updating...' : 'Update Expense'}
            </>
          ) : (
            <>
              <PlusCircle size={20} />
              {isLoading ? 'Adding...' : 'Add Expense'}
            </>
          )}
        </button>
      </div>
    </form>
  );
});