import React from 'react';
import { ArrowDown, ArrowUp, DollarSign, Activity, CreditCard, Calendar, TrendingUp, BarChart } from 'lucide-react';
import { UserSettings } from '../../types';
import ThemeToggleCard from '../ThemeToggleCard';

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
}

export function BudgetStats({ 
  totalSpent, 
  budgetRemaining, 
  monthlyBudget,
  formatCurrency,
  theme,
  onToggleTheme
}: BudgetStatsProps) {
  // Calculate percentage of budget used
  const budgetUsedPercentage = Math.min((totalSpent / monthlyBudget) * 100, 100);
  
  // Data to show transactions trend (simulate with fake data for now)
  const transactionDays = [15, 18, 10, 25, 20, 30, 22];
  const avgTransactionsPerWeek = Math.round(transactionDays.reduce((sum, val) => sum + val, 0) / transactionDays.length);
  
  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Grid layout for all controls - reorganized */}
      <div className="grid grid-cols-2 grid-rows-3 gap-x-4 gap-y-6 h-full">
        {/* Row 2: Daily Spending and Transaction Analytics (renamed from Monthly Overview) */}
        <div className="grid grid-rows-2 gap-3 h-full">
            {/* Daily Spending - Vertical Rectangle */}
            <div className={`rounded-[30px] p-4 ${theme === 'dark' ? 'bg-[#26242e]' : 'bg-white border border-gray-100'} p-3 flex flex-col`}>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-medium text-zinc-500 dark:text-gray-400">Daily Spending</h4>
                <div className={`p-1 rounded-full ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                  <Calendar size={12} className={`${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`} />
                </div>
              </div>
              
              <div className="flex-1 flex flex-col justify-center items-center">
                <div className="text-2xl font-bold text-zinc-800 dark:text-white">
                  {formatCurrency(totalSpent / 30)}
                </div>
                <p className="text-xs text-zinc-500 dark:text-gray-400 mt-1">
                  avg per day
                </p>
              </div>
            </div>
            
            {/* Transaction Analytics - Updated from Monthly Overview */}
            <div className={`rounded-[30px] p-4 ${theme === 'dark' ? 'bg-[#26242e]' : 'bg-white border border-gray-100'} p-3 flex flex-col`}>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-medium text-zinc-500 dark:text-gray-400">Transaction Analytics</h4>
                <div className={`p-1 rounded-full ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                  <BarChart size={12} className={`${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`} />
                </div>
              </div>
              
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex justify-center items-center mb-2">
                  <div className="text-2xl font-bold text-zinc-800 dark:text-white">
                    {avgTransactionsPerWeek}
                  </div>
                  <div className="text-xs ml-1 text-zinc-500 dark:text-gray-400">
                    transactions<br/>per week
                  </div>
                </div>
                
                {/* Mini chart */}
                <div className="flex items-end justify-between h-8 px-1">
                  {transactionDays.map((day, i) => (
                    <div 
                      key={i} 
                      className={`w-1.5 ${theme === 'dark' ? 'bg-purple-500/70' : 'bg-purple-400/70'} rounded-t-sm`}
                      style={{ height: `${(day/30) * 100}%` }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        {/* Theme Toggle - Second column of first row */}
        <div className="flex items-center justify-center rounded-[40px] overflow-hidden">
          {onToggleTheme && <ThemeToggleCard theme={theme} onToggleTheme={onToggleTheme} />}
        </div>

        {/* Row 1: Budget Status and Theme Toggle */}
        <div className={`rounded-[40px] p-6 ${theme === 'dark' ? 'bg-[#26242e]' : 'bg-white'} shadow-sm p-4 flex flex-col justify-between`}>
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="text-xs font-medium text-zinc-500 dark:text-gray-400">Budget Status</h4>
              <p className="text-lg font-bold text-zinc-800 dark:text-white mt-1">
                {budgetUsedPercentage > 90 ? '⚠️ Critical' : 
                 budgetUsedPercentage > 75 ? '⚠️ Warning' : 
                 '✅ Good'}
              </p>
            </div>
            <div className={`p-1.5 rounded-full ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
              <Activity size={14} className={`${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`} />
            </div>
          </div>
          
          <div className="mb-2">
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-2">
              <div 
                className={`h-2 rounded-full ${
                  budgetRemaining >= 0 
                    ? budgetUsedPercentage > 80 
                      ? 'bg-yellow-400 dark:bg-yellow-500' 
                      : 'bg-green-500 dark:bg-green-400' 
                    : 'bg-red-500 dark:bg-red-400'
                }`}
                style={{ width: `${budgetUsedPercentage}%` }}
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

        {/* Row 3: Total Spent (enhanced) and Transaction Insights (replacing Efficiency) */}
        <div className="grid grid-cols-2 gap-3 h-full">
            {/* Total Spent Card - Enhanced with sparkline */}
            <div className={`rounded-[30px] p-4 ${theme === 'dark' ? 'bg-[#26242e]' : 'bg-white border border-gray-100'} p-3 flex flex-col justify-between`}>
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-xs font-medium text-zinc-500 dark:text-gray-400">Total Spent</h4>
                <div className={`p-1.5 rounded-full ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                  <DollarSign size={12} className={`${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`} />
                </div>
              </div>
              
              <div className="flex-1 flex flex-col justify-center">
                <div className="text-lg font-semibold text-zinc-800 dark:text-white mb-2 text-center">
                  {formatCurrency(totalSpent)}
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
            
            {/* Transaction Insights - Replacing Efficiency */}
            <div className={`rounded-[30px] p-4 ${theme === 'dark' ? 'bg-[#26242e]' : 'bg-white border border-gray-100'} p-3 flex flex-col justify-between`}>
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-xs font-medium text-zinc-500 dark:text-gray-400">Avg. Transaction</h4>
                <div className={`p-1.5 rounded-full ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                  <CreditCard size={12} className={`${theme === 'dark' ? 'text-green-300' : 'text-green-600'}`} />
                </div>
              </div>
              
              <div className="flex-1 flex flex-col justify-center items-center">
                <div className="text-3xl font-bold text-center text-zinc-800 dark:text-white">
                  {formatCurrency(totalSpent / Math.max(avgTransactionsPerWeek * 4, 1))}
                </div>
                <div className={`text-xs font-medium mt-1 ${
                  totalSpent > monthlyBudget 
                    ? 'text-red-500 dark:text-red-400' 
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  per purchase
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
