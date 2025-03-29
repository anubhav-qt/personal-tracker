import React from 'react';
import { format } from 'date-fns';
import { ArrowDown } from 'lucide-react';
import { Expense } from '../../types';

interface RecentActivityProps {
  recentActivity: Expense[];
  formatCurrency: (amount: number) => string;
  onEditExpense: (expense: Expense) => void;
  theme: 'light' | 'dark';
}

export function RecentActivity({ 
  recentActivity, 
  formatCurrency, 
  onEditExpense,
  theme
}: RecentActivityProps) {
  if (recentActivity.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <ArrowDown className="mb-2 text-gray-400 opacity-50" size={32} />
        <p className="text-sm text-zinc-600 dark:text-gray-400">
          No recent activity. Add an expense to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recentActivity.map((expense, index) => {
        const categoryColor = expense.category ? expense.category.color : '#cccccc';
        
        return (
          <div 
            key={expense.id || index} 
            className={`flex items-center justify-between p-3 rounded-[30px] ${
              theme === 'dark' ? 'bg-gray-700/50' : 'bg-white/80 border border-gray-100'
            } shadow-sm backdrop-blur-sm cursor-pointer hover:shadow-md transition-all duration-200`}
            onClick={() => onEditExpense(expense)}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-1.5 rounded-full ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-100'} shadow-sm`}>
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: categoryColor }}
                ></div>
              </div>
              <div>
                <p className="font-medium text-zinc-800 dark:text-white text-sm">{expense.description}</p>
                <p className="text-xs text-zinc-500 dark:text-gray-400">
                  {format(new Date(expense.date), 'MMM d, yyyy')} · {expense.category?.name || 'Uncategorized'}
                </p>
              </div>
            </div>
            <span className="font-medium text-zinc-800 dark:text-white text-sm">{formatCurrency(expense.amount)}</span>
          </div>
        );
      })}
    </div>
  );
}
