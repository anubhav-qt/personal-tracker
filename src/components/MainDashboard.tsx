import React from 'react';
import { Expense, UserSettings, UpcomingPayment } from '../types';
import { BudgetStats } from './dashboard/BudgetStats';

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
  onToggleTheme: () => void;
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

  // Stylized blank card component
  const BlankCard = ({ label }: { label: string }) => {
    return (
      <div className="relative h-full w-full rounded-[30px] overflow-hidden">
        <div 
          className={`absolute inset-0 flex items-center justify-center font-bold text-2xl text-white 
                    ${theme === 'dark' ? 'bg-[#26242e]' : 'bg-[#191a19]'}`}
        >
          {label}
        </div>
        <div 
          className={`absolute top-0 right-0 w-1/5 h-1/5 rounded-bl-[100%]
                    ${theme === 'dark' ? 'bg-gray-700/70' : 'bg-[#3f4344]'}
                    transition-all duration-500 z-10 hover:w-full hover:h-full hover:rounded-[30px]
                    group-hover:w-full group-hover:h-full group-hover:rounded-[30px]`}
        ></div>
        <div 
          className={`absolute bottom-0 left-0 w-1/5 h-1/5 rounded-tr-[100%]
                    ${theme === 'dark' ? 'bg-gray-700/70' : 'bg-[#3f4344]'}
                    transition-all duration-500 z-20 hover:w-full hover:h-full hover:rounded-[30px]
                    group-hover:w-full group-hover:h-full group-hover:rounded-[30px]
                    hover:after:content-['COMING_SOON'] after:flex after:items-center after:justify-center
                    after:text-white after:font-bold after:text-2xl`}
        ></div>
      </div>
    );
  };

  return (
    <div className="flex justify-center">
      <div 
        className="scale-75 origin-center"
        style={{
          margin: '-12.5% 0', // This creates a negative margin equal to 25% of the scaled height (100%-75%=25%, divided by 2 for top/bottom)
          width: '133.33%',   // This compensates for the scale (1/0.75 = 1.3333...)
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1 - Top Left */}
          <div className="rounded-[30px] p-6 overflow-hidden h-[618px] group cursor-pointer">
            <BlankCard label="FEATURE 1" />
          </div>

          {/* Budget Stats - Top Right */}
          <div className="rounded-[30px] p-6 transition-all duration-200">
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
              expenses={expenses} // Pass expenses to BudgetStats
            />
          </div>

          {/* Card 3 - Bottom Left */}
          <div className="rounded-[30px] p-6 overflow-hidden h-[618px] group cursor-pointer">
            <BlankCard label="FEATURE 2" />
          </div>

          {/* Card 4 - Bottom Right */}
          <div className="rounded-[30px] p-6 overflow-hidden h-[618px] group cursor-pointer">
            <BlankCard label="FEATURE 3" />
          </div>
        </div>
      </div>
    </div>
  );
}
