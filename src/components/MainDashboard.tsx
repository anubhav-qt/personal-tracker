import { useState } from 'react';
import { Expense, UserSettings, UpcomingPayment } from '../types';
import { BudgetStats } from './dashboard/BudgetStats';
import { format, subDays, subMonths, isAfter } from 'date-fns';
import { 
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { ExpenseTracking } from './ExpenseTracking';
import { UpcomingPayments } from './UpcomingPayments';

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

// Colors for pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function MainDashboard({
  expenses,
  userSettings,
  theme,
  formatCurrency,
  onToggleTheme,
  onEditExpense,
  onAddPayment,
  onEditPayment,
  userId
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

  // State for time range toggle in charts
  const [timeRangeSpending, setTimeRangeSpending] = useState<'week' | 'month'>('week');
  const [timeRangeCategory, setTimeRangeCategory] = useState<'week' | 'month'>('week');
  
  // New state for visualization type toggle
  const [visualizationType, setVisualizationType] = useState<'time' | 'category'>('time');
  
  // Prepare spending over time data
  const spendingOverTimeData = (() => {
    const dailyMap = new Map<string, number>();
    const today = new Date();
    const daysToShow = timeRangeSpending === 'week' ? 7 : 30;
    
    // Initialize the map with dates in range
    for (let i = 0; i < daysToShow; i++) {
      const date = subDays(today, i);
      const dateKey = format(date, 'yyyy-MM-dd');
      dailyMap.set(dateKey, 0);
    }
    
    // Fill in actual data
    expenses.forEach(expense => {
      const dateKey = expense.date;
      if (dailyMap.has(dateKey)) {
        const current = dailyMap.get(dateKey) || 0;
        dailyMap.set(dateKey, current + expense.amount);
      }
    });
    
    return Array.from(dailyMap.entries())
      .map(([date, amount]) => ({ 
        date: format(new Date(date), timeRangeSpending === 'week' ? 'EEE' : 'dd'), 
        amount 
      }))
      .reverse();
  })();

  // Prepare category data for pie chart
  const categoryData = (() => {
    const categoryMap = new Map<string, number>();
    
    // Filter expenses based on selected time range
    const filteredExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const startDate = timeRangeCategory === 'week' 
        ? subDays(new Date(), 7)
        : subMonths(new Date(), 1);
      return isAfter(expenseDate, startDate);
    });
    
    // Group by category
    filteredExpenses.forEach(expense => {
      const category = expense.category?.name || 'Uncategorized';
      const current = categoryMap.get(category) || 0;
      categoryMap.set(category, current + expense.amount);
    });
    
    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value) // Sort by descending value
      .slice(0, 6); // Limit to top 6 categories
  })();

  return (
    <div className="w-full max-w-[1100px] mx-auto">
      {/* Main grid container with responsive columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-5">  
        {/* Card 1 - Expense Tracking Feature */}
        <div className={`rounded-[24px] p-5 overflow-hidden aspect-square w-full ${theme === 'dark' ? 'bg-[#26242e]' : 'bg-white'} shadow-sm`}>
          <ExpenseTracking 
            userId={userId} 
            onEditExpense={onEditExpense} 
            onAddExpense={() => {
              // This should trigger the ExpenseFormModal
              onEditExpense(null as any); // Using null to indicate new expense
            }} 
            formatCurrency={formatCurrency} 
            theme={theme} 
          />
        </div>

        {/* Budget Stats - Top Right */}
        <div className="rounded-[24px] transition-all duration-200 aspect-square w-full">
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
            expenses={expenses}
          />
        </div>

        {/* Card 3 - Upcoming Payments (replacing Spending Over Time) */}
        <div className={`rounded-[24px] aspect-square w-full overflow-hidden p-5 ${theme === 'dark' ? 'bg-[#26242e]' : 'bg-white'} shadow-sm`}>
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto pr-2">
              <UpcomingPayments
                userId={userId}
                onAddPayment={onAddPayment}
                onEditPayment={onEditPayment}
              />
            </div>
          </div>
        </div>

        {/* Card 4 - Combined Spending Visualizations (Pie Chart + Area Chart) */}
        <div className={`rounded-[24px] p-5 overflow-hidden aspect-square w-full ${theme === 'dark' ? 'bg-[#26242e]' : 'bg-white'} shadow-sm`}>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                Spending Analytics
              </h3>
              <div className="flex">
                {/* Visualization Type Toggle */}
                <div className="visualization-toggle mr-2">
                  <button 
                    className={`px-2 py-1 text-xs font-medium rounded-l-lg border ${
                      visualizationType === 'time' 
                        ? theme === 'dark' 
                          ? 'bg-purple-600 text-white border-purple-500' 
                          : 'bg-lime-600 text-white border-lime-500' 
                        : theme === 'dark' 
                          ? 'border-gray-600 text-gray-300' 
                          : 'border-gray-300 text-gray-600'
                    } transition-colors`}
                    onClick={() => setVisualizationType('time')}
                  >
                    Timeline
                  </button>
                  <button 
                    className={`px-2 py-1 text-xs font-medium rounded-r-lg border ${
                      visualizationType === 'category' 
                        ? theme === 'dark' 
                          ? 'bg-purple-600 text-white border-purple-500' 
                          : 'bg-lime-600 text-white border-lime-500' 
                        : theme === 'dark' 
                          ? 'border-gray-600 text-gray-300' 
                          : 'border-gray-300 text-gray-600'
                    } transition-colors`}
                    onClick={() => setVisualizationType('category')}
                  >
                    Categories
                  </button>
                </div>
                
                {/* Time Range Toggle - shown based on current visualization */}
                <div className="time-toggle">
                  {visualizationType === 'time' ? (
                    <>
                      <button 
                        className={`px-2 py-1 text-xs font-medium rounded-l-lg border ${
                          timeRangeSpending === 'week' 
                            ? theme === 'dark' 
                              ? 'bg-purple-600 text-white border-purple-500' 
                              : 'bg-lime-600 text-white border-lime-500' 
                            : theme === 'dark' 
                              ? 'border-gray-600 text-gray-300' 
                              : 'border-gray-300 text-gray-600'
                        } transition-colors`}
                        onClick={() => setTimeRangeSpending('week')}
                      >
                        Weekly
                      </button>
                      <button 
                        className={`px-2 py-1 text-xs font-medium rounded-r-lg border ${
                          timeRangeSpending === 'month' 
                            ? theme === 'dark' 
                              ? 'bg-purple-600 text-white border-purple-500' 
                              : 'bg-lime-600 text-white border-lime-500' 
                            : theme === 'dark' 
                              ? 'border-gray-600 text-gray-300' 
                              : 'border-gray-300 text-gray-600'
                        } transition-colors`}
                        onClick={() => setTimeRangeSpending('month')}
                      >
                        Monthly
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        className={`px-2 py-1 text-xs font-medium rounded-l-lg border ${
                          timeRangeCategory === 'week' 
                            ? theme === 'dark' 
                              ? 'bg-purple-600 text-white border-purple-500' 
                              : 'bg-lime-600 text-white border-lime-500' 
                            : theme === 'dark' 
                              ? 'border-gray-600 text-gray-300' 
                              : 'border-gray-300 text-gray-600'
                        } transition-colors`}
                        onClick={() => setTimeRangeCategory('week')}
                      >
                        Weekly
                      </button>
                      <button 
                        className={`px-2 py-1 text-xs font-medium rounded-r-lg border ${
                          timeRangeCategory === 'month' 
                            ? theme === 'dark' 
                              ? 'bg-purple-600 text-white border-purple-500' 
                              : 'bg-lime-600 text-white border-lime-500' 
                            : theme === 'dark' 
                              ? 'border-gray-600 text-gray-300' 
                              : 'border-gray-300 text-gray-600'
                        } transition-colors`}
                        onClick={() => setTimeRangeCategory('month')}
                      >
                        Monthly
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex-1">
              {visualizationType === 'time' ? (
                /* Spending Over Time Chart */
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={spendingOverTimeData}
                    margin={{ top: 10, right: 10, bottom: 20, left: 10 }}
                  >
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme === 'dark' ? '#8983f7' : '#8983f7'} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={theme === 'dark' ? '#8983f7' : '#8983f7'} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid 
                      stroke={theme === 'dark' ? '#374151' : '#f1f5f9'} 
                      strokeDasharray="3 3" 
                      vertical={false}
                    />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: theme === 'dark' ? '#d1d5db' : '#64748b' }} 
                      axisLine={{ stroke: theme === 'dark' ? '#374151' : '#e2e8f0' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: theme === 'dark' ? '#d1d5db' : '#64748b' }}
                      tickFormatter={(value) => formatCurrency(value).split('.')[0]} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value)), "Amount"]}
                      contentStyle={{ 
                        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                        borderColor: theme === 'dark' ? '#374151' : '#e2e8f0',
                        borderRadius: '6px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke={theme === 'dark' ? '#8983f7' : '#8983f7'} 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorAmount)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                /* Spending by Category Chart */
                <div className="flex flex-col h-full">
                  <div className="flex-1 flex items-center justify-center">
                    {categoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius="30%"
                            outerRadius="60%"
                            paddingAngle={2}
                            dataKey="value"
                            labelLine={false}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          >
                            {categoryData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[index % COLORS.length]} 
                                stroke={theme === 'dark' ? '#26242e' : '#ffffff'}
                                strokeWidth={3}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => [formatCurrency(Number(value)), "Amount"]}
                            contentStyle={{ 
                              backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                              borderColor: theme === 'dark' ? '#374151' : '#e2e8f0',
                              borderRadius: '6px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full">
                        <svg className="w-16 h-16 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <p className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          No spending data for this period.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
