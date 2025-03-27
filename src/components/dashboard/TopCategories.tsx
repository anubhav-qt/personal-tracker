import React from 'react';
import { BarChart2 } from 'lucide-react';

interface CategoryData {
  name: string;
  amount: number;
  color: string;
}

interface TopCategoriesProps {
  topCategories: CategoryData[];
  totalSpent: number;
  formatCurrency: (amount: number) => string;
  theme: 'light' | 'dark';
}

export function TopCategories({ 
  topCategories, 
  totalSpent,
  formatCurrency,
  theme
}: TopCategoriesProps) {
  if (topCategories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <BarChart2 className="mb-2 text-lime-700 dark:text-gray-500 opacity-50" size={32} />
        <p className="text-sm text-zinc-600 dark:text-gray-400">
          No category data available yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {topCategories.map((category, index) => (
        <div key={index} className="p-4 rounded-xl bg-white/80 dark:bg-gray-700 shadow-sm backdrop-blur-sm">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: category.color }}
              ></div>
              <span className="font-medium text-zinc-800 dark:text-white">{category.name}</span>
            </div>
            <span className="font-semibold text-zinc-800 dark:text-white">{formatCurrency(category.amount)}</span>
          </div>
          <div className="relative pt-1">
            <div className="overflow-hidden h-1.5 text-xs flex rounded-full bg-zinc-100 dark:bg-gray-600">
              <div
                style={{ 
                  width: `${(category.amount / totalSpent) * 100}%`,
                  backgroundColor: category.color + (theme === 'dark' ? '90' : '70')
                }}
                className="shadow-none flex flex-col text-center whitespace-nowrap justify-center transition-all duration-500"
              ></div>
            </div>
            <div className="text-right mt-1">
              <span className="text-xs font-medium text-zinc-500 dark:text-gray-400">
                {((category.amount / totalSpent) * 100).toFixed(0)}% of total
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
