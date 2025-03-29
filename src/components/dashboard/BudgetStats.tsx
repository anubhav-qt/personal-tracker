import React, { useState, useMemo } from 'react';
import { ArrowDown, ArrowUp, DollarSign, Activity, CreditCard, Calendar, TrendingUp, BarChart, AlertTriangle, CheckCircle } from 'lucide-react';
import { UserSettings } from '../../types';
import ThemeToggleCard from '../ThemeToggleCard';
import { subDays, subMonths, isAfter, format } from 'date-fns';

interface BudgetStatsProps {
  totalSpent: number;
  budgetRemaining: number;
  monthOverMonthChange: number;
  isIncreased: boolean;
  monthlyBudget: number;
  userSettings: UserSettings;
  formatCurrency: (amount: number) => string;
  theme: 'light' | 'dark';
  onToggleTheme?: () => void;
  expenses?: any[]; // Add expenses prop
}

export function BudgetStats({ 
  totalSpent, 
  budgetRemaining, 
  monthlyBudget,
  formatCurrency,
  theme,
  onToggleTheme,
  expenses = []
}: BudgetStatsProps) {
  // Calculate percentage of budget used
  const budgetUsedPercentage = (totalSpent / monthlyBudget) * 100;
  
  // Independent time range toggle for budget stats
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('month');
  
  // Filter expenses based on selected time range
  const filteredExpenses = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];
    
    const today = new Date();
    const startDate = timeRange === 'week' 
      ? subDays(today, 7)
      : subMonths(today, 1);
    
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return isAfter(expenseDate, startDate);
    });
  }, [expenses, timeRange]);
  
  // Calculate top category from filtered expenses
  const topCategory = useMemo(() => {
    if (filteredExpenses.length === 0) {
      return { name: 'None', amount: 0, percentage: 0 };
    }
    
    const categoryMap = new Map<string, { amount: number, color: string }>();
    
    filteredExpenses.forEach(expense => {
      const categoryName = expense.category?.name || 'Uncategorized';
      const categoryColor = expense.category?.color || '#cccccc';
      
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, { amount: 0, color: categoryColor });
      }
      
      const current = categoryMap.get(categoryName)!;
      categoryMap.set(categoryName, { 
        amount: current.amount + expense.amount,
        color: current.color
      });
    });
    
    // Find category with maximum amount
    let maxAmount = 0;
    let maxCategory = { name: 'None', color: '#cccccc' };
    
    categoryMap.forEach((value, key) => {
      if (value.amount > maxAmount) {
        maxAmount = value.amount;
        maxCategory = { name: key, color: value.color };
      }
    });
    
    // Calculate total spent for this period
    const periodTotal = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const percentage = periodTotal > 0 ? (maxAmount / periodTotal) * 100 : 0;
    
    return {
      name: maxCategory.name,
      amount: maxAmount,
      percentage: percentage,
      color: maxCategory.color
    };
  }, [filteredExpenses]);
  
  // Count transactions
  const transactionsCount = useMemo(() => {
    return filteredExpenses.length;
  }, [filteredExpenses]);
  
  // Return the actual transaction count for the period instead of calculating a weekly average
  const transactionsPerPeriod = useMemo(() => {
    return transactionsCount; // Show the actual transaction count for the selected period
  }, [transactionsCount]);
  
  // Calculate total spent for the selected period
  const periodTotalSpent = useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [filteredExpenses]);
  
  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Grid layout for all controls - reorganized */}
      <div className="grid grid-cols-2 grid-rows-2 gap-x-4 gap-y-6 h-[618px] w-[618px]">
        {/* Row 2: Top Category (previously Daily Spending) and Transaction Analytics */}
        <div className="grid grid-rows-2 gap-3 h-full">
            {/* Top Category - Vertical Rectangle (previously Daily Spending) */}
            <div className={`rounded-[30px] p-4 ${theme === 'dark' ? 'bg-[#26242e]' : 'bg-white border border-gray-100'} p-3 flex flex-col`}>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-medium text-zinc-500 dark:text-gray-400">Top Category</h4>
                <div className={`p-1 rounded-full ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                  <BarChart size={12} className={`${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`} />
                </div>
              </div>
              
              <div className="flex-1 flex flex-col justify-center items-center">
                {topCategory.amount > 0 ? (
                  <>
                    <div className="text-2xl font-bold text-zinc-800 dark:text-white text-center">
                      {topCategory.name}
                    </div>
                    <div className="flex items-center space-x-1 mt-1">
                      <div 
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: topCategory.color }}
                      ></div>
                      <p className="text-xs text-zinc-500 dark:text-gray-400">
                        {formatCurrency(topCategory.amount)} ({Math.round(topCategory.percentage)}%)
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-zinc-500 dark:text-gray-400 text-sm">
                    No expenses in this period
                  </div>
                )}
              </div>
            </div>
            
            {/* Transaction Analytics - now using actual data */}
            <div className={`rounded-[30px] p-4 ${theme === 'dark' ? 'bg-[#26242e]' : 'bg-white border border-gray-100'} p-3 flex flex-col`}>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-medium text-zinc-500 dark:text-gray-400">Transaction Analytics</h4>
                <div className={`p-1 rounded-full ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                  <BarChart size={12} className={`${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`} />
                </div>
              </div>
              
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex justify-center items-center">
                  <div className="text-3xl font-bold text-zinc-800 dark:text-white text-center">
                    {transactionsCount} {/* Using direct transactionsCount */}
                  </div>
                </div>
                <div className="text-xs text-center mt-2 text-zinc-500 dark:text-gray-400">
                  {timeRange === 'week' ? 'transactions this week' : 'transactions this month'}
                </div>
              </div>
            </div>
          </div>

        {/* Theme Toggle - Second column of first row */}
        <div className="flex items-center justify-center rounded-[40px] overflow-hidden">
          {onToggleTheme && <ThemeToggleCard 
            theme={theme} 
            onToggleTheme={onToggleTheme} 
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />}
        </div>

        {/* Row 1: Budget Status and Theme Toggle */}
        <div className={`rounded-[40px] p-6 ${theme === 'dark' ? 'bg-[#26242e]' : 'bg-white'} shadow-sm p-4 flex flex-col justify-between`}>
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="text-xs font-medium text-zinc-500 dark:text-gray-400">Budget Status</h4>
              <p className="text-lg font-bold text-zinc-800 dark:text-white mt-1">
                {budgetUsedPercentage > 90 ? 'Critical' : 
                 budgetUsedPercentage > 75 ? 'Warning' : 
                 'Good'}
              </p>
            </div>
            <div className={`p-1.5 rounded-full ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
              <Activity size={14} className={`${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`} />
            </div>
          </div>
          
          {/* Display status icon in larger size */}
          <div className="flex justify-center py-2 mb-2">
            {budgetUsedPercentage > 90 ? (
              <AlertTriangle size={32} className="text-red-500 dark:text-red-400" />
            ) : budgetUsedPercentage > 75 ? (
              <AlertTriangle size={32} className="text-yellow-500 dark:text-yellow-400" />
            ) : (
              <CheckCircle size={32} className="text-green-500 dark:text-green-400" />
            )}
          </div>
          
          <div className="mt-auto mb-2">
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-2">
              <div 
                className={`h-2 rounded-full ${
                  budgetRemaining >= 0 
                    ? budgetUsedPercentage > 80 
                      ? 'bg-yellow-400 dark:bg-yellow-500' 
                      : 'bg-gradient-to-r from-[#8983f7] to-[#a3dafb]' 
                    : 'bg-red-500 dark:bg-red-400'
                }`}
                style={{ width: `${Math.min(100, budgetUsedPercentage)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-zinc-500 dark:text-gray-400">
              <span>{formatCurrency(totalSpent)}</span>
              <span>{Math.round(budgetUsedPercentage)}%</span>
              <span>{formatCurrency(monthlyBudget)}</span>
            </div>
          </div>
          
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-500 dark:text-gray-400">Remaining</span>
              <span className={`text-sm font-semibold ${
                budgetRemaining >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(budgetRemaining)}
              </span>
            </div>
          </div>
        </div>

        {/* Row 3: Total Spent (enhanced) and Daily Spending (previously Avg. Transaction) */}
        <div className="grid grid-cols-2 gap-3 h-full">
            {/* Total Spent Card - Enhanced with sparkline */}
            <div className={`rounded-[30px] p-4 ${theme === 'dark' ? 'bg-[#26242e]' : 'bg-white border border-gray-100'} p-3 flex flex-col justify-between`}>
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-xs font-medium text-zinc-500 dark:text-gray-400">
                  Total Spent ({timeRange})
                </h4>
                <div className={`p-1.5 rounded-full ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                  <DollarSign size={12} className={`${theme === 'dark' ? 'text-blue-300' : 'text-purple-600'}`} />
                </div>
              </div>
              
              <div className="flex-1 flex flex-col justify-center">
                <div className="text-lg font-semibold text-zinc-800 dark:text-white mb-2 text-center">
                  {formatCurrency(periodTotalSpent)}
                </div>
                
                {/* Sparkline graph */}
                <div className="relative h-8 mt-1 px-1">
                  <svg className="w-full h-full">
                    <path 
                      d="M0,20 Q5,18 10,15 T20,13 T30,8 T40,10 T50,7 T60,9 T70,5"
                      fill="none" 
                      stroke={theme === 'dark' ? '#60a5fa' : '#3b82f6'} 
                      strokeWidth="1.5"
                    />
                    <circle cx="70" cy="5" r="2" fill={theme === 'dark' ? '#93c5fd' : '#2563eb'} />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Daily Spending */}
            <div className={`rounded-[30px] p-4 ${theme === 'dark' ? 'bg-[#26242e]' : 'bg-white border border-gray-100'} p-3 flex flex-col justify-between`}>
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-xs font-medium text-zinc-500 dark:text-gray-400">Daily Spending</h4>
                <div className={`p-1.5 rounded-full ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                  <Calendar size={12} className={`${theme === 'dark' ? 'text-blue-300' : 'text-purple-600'}`} />
                </div>
              </div>
              
              <div className="flex-1 flex flex-col justify-center items-center">
                <div className="text-3xl font-bold text-center text-zinc-800 dark:text-white">
                  {formatCurrency(periodTotalSpent / (timeRange === 'week' ? 7 : 30))}
                </div>
                <div className="text-xs font-medium mt-1 text-zinc-500 dark:text-gray-400">
                  avg per day
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
