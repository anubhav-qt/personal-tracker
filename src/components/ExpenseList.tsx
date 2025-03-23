import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Trash2, Edit2, RefreshCw } from 'lucide-react';
import { Expense } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useExpenses } from '../hooks/useExpenses';

interface ExpenseListProps {
  userId: string;
  onEditExpense: (expense: Expense) => void;
  filterFn?: (expenses: Expense[]) => Expense[]; // Add this new prop
}

export const ExpenseList = React.memo(({ userId, onEditExpense, filterFn }: ExpenseListProps) => {
  const { theme, formatCurrency } = useTheme();
  const { 
    expenses: fetchedExpenses, 
    deleteExpense, 
    fetchExpenses, 
    isLoading,
    lastRefreshTime 
  } = useExpenses(userId);
  
  const [localExpenses, setLocalExpenses] = useState<Expense[]>([]);
  
  // Update localExpenses whenever fetchedExpenses changes
  useEffect(() => {
    console.log('ExpenseList: Setting local expenses from fetchedExpenses', fetchedExpenses.length);
    // Apply filter if provided, otherwise use all expenses
    const filteredExpenses = filterFn ? filterFn(fetchedExpenses) : fetchedExpenses;
    setLocalExpenses(filteredExpenses);
  }, [fetchedExpenses, filterFn]);

  const handleDelete = async (id: string) => {
    console.log('Deleting expense:', id);
    await deleteExpense(id);
  };

  const handleRefresh = () => {
    console.log('Manual refresh requested');
    fetchExpenses();
  };

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md overflow-hidden transition-colors duration-200 flex flex-col w-full h-full`}>
      <div className={`p-4 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} border-b flex items-center justify-between transition-colors duration-200`}>
        <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Recent Expenses</h2>
        <div className="flex items-center gap-2">
          <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {localExpenses.length} entries
          </span>
          <button 
            onClick={handleRefresh} 
            className={`p-1 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            disabled={isLoading}
          >
            <RefreshCw size={16} className={`${isLoading ? 'animate-spin' : ''} ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>
        </div>
      </div>
      
      <div className="overflow-y-auto flex-grow scrollbar-thin" style={{ maxHeight: "calc(100% - 57px)" }}>
        {isLoading && localExpenses.length === 0 ? (
          <div className={`flex justify-center items-center py-10 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            <RefreshCw size={24} className="animate-spin mr-2" />
            Loading expenses...
          </div>
        ) : localExpenses.length > 0 ? (
          <table className={`min-w-full divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'} transition-colors duration-200`}>
            <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} transition-colors duration-200 sticky top-0 z-10`}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider transition-colors duration-200`}>Date</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider transition-colors duration-200`}>Description</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider transition-colors duration-200`}>Category</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider transition-colors duration-200`}>Amount</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider transition-colors duration-200`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`${theme === 'dark' ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'} divide-y transition-colors duration-200`}>
              {localExpenses.map((expense) => (
                <tr key={expense.id} className={`${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors duration-200`}>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} transition-colors duration-200`}>
                    {format(new Date(expense.date), 'MMM d, yyyy')}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'} transition-colors duration-200`}>
                    {expense.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: (theme === 'dark' ? expense.category.color + '30' : expense.category.color + '20'), 
                        color: expense.category.color 
                      }}
                    >
                      {expense.category.name}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'} transition-colors duration-200`}>
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} transition-colors duration-200`}>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onEditExpense(expense)}
                        className={`${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-900'} transition-colors duration-200`}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className={`${theme === 'dark' ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-900'} transition-colors duration-200`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={`flex justify-center items-center py-10 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-200`}>
            No expenses found. Add one to get started!
          </div>
        )}
        
        {isLoading && localExpenses.length > 0 && (
          <div className={`py-2 px-4 text-center ${theme === 'dark' ? 'text-gray-400 bg-gray-800' : 'text-gray-500 bg-gray-50'}`}>
            <RefreshCw size={16} className="inline-block animate-spin mr-2" />
            Updating...
          </div>
        )}
      </div>
    </div>
  );
});