import React from 'react';
import { Expense, UserSettings, UpcomingPayment } from '../types';
import { RecentActivity } from './dashboard/RecentActivity';
import { UpcomingPayments } from './UpcomingPayments';
import { BudgetStats } from './dashboard/BudgetStats';
import { TopCategories } from './dashboard/TopCategories';
import { Plus } from 'lucide-react';

interface MainDashboardProps {
  expenses: Expense[];
  userSettings: UserSettings;
  theme: 'light' | 'dark';
  formatCurrency: (amount: number) => string;
  onOpenTipsModal: () => void;
  onEditExpense: (expense: Expense) => void;
  onAddPayment: () => void;
  onEditPayment: (payment: UpcomingPayment) => void;
  userId: string;
  onToggleTheme: () => void; // Add this prop
}

export function MainDashboard({
  expenses,
  userSettings,
  theme,
  formatCurrency,
  onOpenTipsModal,
  onEditExpense,
  onAddPayment,
  onEditPayment,
  userId,
  onToggleTheme
}: MainDashboardProps) {
  // Calculate financial metrics
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const monthlyBudget = userSettings.monthlyBudget;
  const budgetRemaining = monthlyBudget - totalSpent;
  
  // Get this month and previous month expenses
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  
  const thisMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate.getMonth() === thisMonth && expenseDate.getFullYear() === thisYear;
  });
  
  const prevMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    const prevMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const prevYear = thisMonth === 0 ? thisYear - 1 : thisYear;
    return expenseDate.getMonth() === prevMonth && expenseDate.getFullYear() === prevYear;
  });
  
  const thisMonthTotal = thisMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const prevMonthTotal = prevMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  const monthOverMonthChange = prevMonthTotal > 0 
    ? ((thisMonthTotal - prevMonthTotal) / prevMonthTotal) * 100 
    : 0;
    
  const isIncreased = monthOverMonthChange > 0;

  // Function to get recent activity
  const getRecentActivity = (expenses: Expense[], limit: number) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return expenses
      .filter(expense => new Date(expense.date) >= sevenDaysAgo)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  };

  // Function to get top categories
  const getTopCategories = (expenses: Expense[], limit: number) => {
    const categoryMap = new Map<string, { name: string, amount: number, color: string }>();
    
    expenses.forEach(expense => {
      const categoryName = expense.category?.name || 'Uncategorized';
      const categoryColor = expense.category?.color || '#808080';
      
      if (categoryMap.has(categoryName)) {
        const existing = categoryMap.get(categoryName)!;
        existing.amount += expense.amount;
        categoryMap.set(categoryName, existing);
      } else {
        categoryMap.set(categoryName, { 
          name: categoryName, 
          amount: expense.amount,
          color: categoryColor
        });
      }
    });
    
    return Array.from(categoryMap.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, limit);
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="rounded-2xl shadow-sm overflow-hidden bg-lime-200 dark:bg-gray-800 transition-all duration-200">
          <div className="p-6 flex justify-between items-center border-b border-lime-300 dark:border-gray-700">
            <h3 className="text-lg font-medium text-zinc-800 dark:text-white">Recent Activity</h3>
            <span className="text-xs px-3 py-1 rounded-full bg-white/80 dark:bg-gray-700 text-zinc-800 dark:text-blue-400 font-medium shadow-sm">
              Last 7 days
            </span>
          </div>
          <div className="h-[360px] overflow-y-auto p-6 space-y-3">
            <RecentActivity 
              recentActivity={getRecentActivity(expenses, 10)} 
              formatCurrency={formatCurrency}
              onEditExpense={onEditExpense}
              theme={theme}
            />
          </div>
        </div>

        {/* Upcoming Payments */}
        <div className="rounded-2xl shadow-sm overflow-hidden bg-white dark:bg-gray-800 transition-all duration-200">
          <div className="p-6 border-b border-zinc-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-medium text-zinc-800 dark:text-white">Upcoming Payments</h3>
            <button
              onClick={onAddPayment}
              className="p-2 rounded-full bg-zinc-100 dark:bg-gray-700 text-zinc-800 dark:text-white hover:bg-zinc-200 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="h-[360px] overflow-y-auto p-6">
            <UpcomingPayments 
              userId={userId}
              onAddPayment={onAddPayment}
            />
          </div>
        </div>

        {/* Budget Stats */}
        <div className="rounded-2xl p-6 transition-all duration-200">
          <BudgetStats
            totalSpent={totalSpent}
            budgetRemaining={budgetRemaining}
            monthOverMonthChange={monthOverMonthChange}
            isIncreased={isIncreased}
            monthlyBudget={monthlyBudget}
            userSettings={userSettings}
            formatCurrency={formatCurrency}
            theme={theme}
            onToggleTheme={onToggleTheme}
          />
        </div>

        {/* Top Categories */}
        <div className="rounded-2xl shadow-sm overflow-hidden bg-lime-200 dark:bg-gray-800 transition-all duration-200">
          <div className="p-6 border-b border-lime-300 dark:border-gray-700">
            <h3 className="text-lg font-medium text-zinc-800 dark:text-white">Top Spending Categories</h3>
          </div>
          <div className="h-[360px] overflow-y-auto p-6">
            <TopCategories 
              topCategories={getTopCategories(expenses, 8)} 
              totalSpent={totalSpent}
              formatCurrency={formatCurrency}
              theme={theme}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
