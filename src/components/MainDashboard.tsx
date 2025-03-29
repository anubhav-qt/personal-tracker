import { useState } from 'react';
import { Expense, UserSettings, UpcomingPayment } from '../types';
import { BudgetStats } from './dashboard/BudgetStats';
import { format, subDays, subMonths, isAfter } from 'date-fns';
import { 
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';

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

  // State for time range toggle in charts - now separate for each chart
  const [timeRangeSpending, setTimeRangeSpending] = useState<'week' | 'month'>('week');
  const [timeRangeCategory, setTimeRangeCategory] = useState<'week' | 'month'>('week');
  
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
    <div className="flex justify-center">
      <div 
        className="scale-75 origin-center"
        style={{
          margin: '-12.5% 0', // This creates a negative margin equal to 25% of the scaled height (100%-75%=25%, divided by 2 for top/bottom)
          width: '133.33%',   // This compensates for the scale (1/0.75 = 1.3333...)
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-24 gap-y-6">  
          {/* Card 1 - Top Left - Premium minimal look */}
          <div className={`rounded-[30px] p-6 overflow-hidden h-[618px] w-[618px] flex justify-center items-center ${theme === 'dark' ? 'bg-[#26242e]' : 'bg-white'} shadow-sm`}>
            <div className="flex flex-col items-center justify-center h-full w-full p-6">
              <div className={`rounded-full p-8 mb-6 ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-blue-50/50'}`}>
                <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
                    stroke={theme === 'dark' ? '#94a3b8' : '#3b82f6'} 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                Feature 1
              </h3>
              <p className={`text-center max-w-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                This premium feature provides advanced analytics for your financial planning. Coming soon.
              </p>
            </div>
          </div>

          {/* Budget Stats - Top Right */}
          <div className="rounded-[30px] transition-all duration-200">
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

          {/* Card 3 - Bottom Left - Spending Over Time (Area Chart) */}
          <div className={`rounded-[30px] h-[618px] w-[618px] overflow-hidden p-6 ${theme === 'dark' ? 'bg-[#26242e]' : 'bg-white'} shadow-sm`}>
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                  Spending Over Time
                </h3>
                <div className="time-selector">
                  <div className="time-toggle">
                    <button 
                      className={`time-btn ${timeRangeSpending === 'week' ? 'active' : ''}`}
                      onClick={() => setTimeRangeSpending('week')}
                    >
                      Weekly
                    </button>
                    <button 
                      className={`time-btn ${timeRangeSpending === 'month' ? 'active' : ''}`}
                      onClick={() => setTimeRangeSpending('month')}
                    >
                      Monthly
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex-1">
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
              </div>
            </div>
          </div>

          {/* Card 4 - Bottom Right - Spending by Category (Pie Chart) */}
          <div className={`rounded-[30px] p-6 overflow-hidden h-[618px] w-[618px] ${theme === 'dark' ? 'bg-[#26242e]' : 'bg-white'} shadow-sm`}>
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                  Spending by Category
                </h3>
                <div className="time-selector">
                  <div className="time-toggle">
                    <button 
                      className={`time-btn ${timeRangeCategory === 'week' ? 'active' : ''}`}
                      onClick={() => setTimeRangeCategory('week')}
                    >
                      Weekly
                    </button>
                    <button 
                      className={`time-btn ${timeRangeCategory === 'month' ? 'active' : ''}`}
                      onClick={() => setTimeRangeCategory('month')}
                    >
                      Monthly
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 flex items-center justify-center">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={90}
                        outerRadius={140}
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
          </div>
        </div>
      </div>
    </div>
  );
}
