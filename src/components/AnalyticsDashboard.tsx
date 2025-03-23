import { useState, useMemo } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { format, subDays, subMonths, subYears, startOfWeek, startOfMonth, startOfYear, isAfter } from 'date-fns';
import { Expense } from '../types';
import { useTheme } from '../context/ThemeContext';

interface AnalyticsDashboardProps {
  expenses: Expense[];
}

type TimeRange = 'week' | 'month' | 'year';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#9467bd', '#e377c2', '#7f7f7f', '#bcbd22'];

export function AnalyticsDashboard({ expenses }: AnalyticsDashboardProps) {
  const { theme, formatCurrency } = useTheme();
  const [timeRange, setTimeRange] = useState<TimeRange>('month');

  // Filter expenses based on selected time range
  const filteredExpenses = useMemo(() => {
    const today = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'week':
        startDate = subDays(today, 7);
        break;
      case 'month':
        startDate = subMonths(today, 1);
        break;
      case 'year':
        startDate = subYears(today, 1);
        break;
      default:
        startDate = subMonths(today, 1);
    }

    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return isAfter(expenseDate, startDate);
    });
  }, [expenses, timeRange]);

  // Prepare category data for pie chart
  const categoryData = useMemo(() => {
    const categoryMap = new Map<string, number>();
    
    filteredExpenses.forEach(expense => {
      const category = expense.category.name;
      const current = categoryMap.get(category) || 0;
      categoryMap.set(category, current + expense.amount);
    });
    
    return Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredExpenses]);

  // Prepare daily spending data for line chart
  const dailySpendingData = useMemo(() => {
    const dailyMap = new Map<string, number>();
    
    // Initialize the map with dates in range
    const today = new Date();
    let daysToShow = 30;
    
    if (timeRange === 'week') {
      daysToShow = 7;
    } else if (timeRange === 'year') {
      // For year, we'll do monthly aggregation instead of daily
      const monthlyMap = new Map<string, number>();
      
      for (let i = 0; i < 12; i++) {
        const date = subMonths(today, i);
        const monthKey = format(date, 'MMM yyyy');
        monthlyMap.set(monthKey, 0);
      }
      
      filteredExpenses.forEach(expense => {
        const expenseDate = new Date(expense.date);
        const monthKey = format(expenseDate, 'MMM yyyy');
        if (monthlyMap.has(monthKey)) {
          const current = monthlyMap.get(monthKey) || 0;
          monthlyMap.set(monthKey, current + expense.amount);
        }
      });
      
      return Array.from(monthlyMap.entries())
        .map(([date, amount]) => ({ date, amount }))
        .reverse();
    }
    
    // For week and month, use daily data
    for (let i = 0; i < daysToShow; i++) {
      const date = subDays(today, i);
      const dateKey = format(date, 'yyyy-MM-dd');
      dailyMap.set(dateKey, 0);
    }
    
    filteredExpenses.forEach(expense => {
      const dateKey = expense.date;
      if (dailyMap.has(dateKey)) {
        const current = dailyMap.get(dateKey) || 0;
        dailyMap.set(dateKey, current + expense.amount);
      }
    });
    
    return Array.from(dailyMap.entries())
      .map(([date, amount]) => ({ 
        date: format(new Date(date), timeRange === 'week' ? 'EEE' : 'MMM dd'), 
        amount 
      }))
      .reverse();
  }, [filteredExpenses, timeRange]);

  // Get total amount spent in the current period
  const totalSpent = useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [filteredExpenses]);

  // Get average daily spending
  const averageSpending = useMemo(() => {
    if (filteredExpenses.length === 0) return 0;
    
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
    return totalSpent / days;
  }, [filteredExpenses, totalSpent, timeRange]);

  // Most expensive category
  const topCategory = useMemo(() => {
    if (categoryData.length === 0) return { name: 'None', value: 0 };
    return categoryData.reduce((max, cat) => cat.value > max.value ? cat : max, { name: '', value: 0 });
  }, [categoryData]);

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg shadow-md p-6 transition-colors duration-200`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Expense Analytics Dashboard
        </h2>
        
        <div className="inline-flex p-1 space-x-1 bg-gray-100 dark:bg-gray-700 rounded-md">
          <button
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
              timeRange === 'week' 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            onClick={() => setTimeRange('week')}
          >
            Week
          </button>
          <button
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
              timeRange === 'month' 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            onClick={() => setTimeRange('month')}
          >
            Month
          </button>
          <button
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
              timeRange === 'year' 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            onClick={() => setTimeRange('year')}
          >
            Year
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg transition-colors duration-200`}>
          <h3 className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-1`}>
            {timeRange === 'week' ? 'Weekly' : timeRange === 'month' ? 'Monthly' : 'Yearly'} Spending
          </h3>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(totalSpent)}
          </p>
        </div>
        <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg transition-colors duration-200`}>
          <h3 className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-1`}>
            {timeRange === 'year' ? 'Monthly' : 'Daily'} Average
          </h3>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(averageSpending)}
          </p>
        </div>
        <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg transition-colors duration-200`}>
          <h3 className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-1`}>
            Top Category
          </h3>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {topCategory.name}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatCurrency(topCategory.value)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Spending Over Time Chart */}
        <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg transition-colors duration-200`}>
          <h3 className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
            Spending Over Time
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={dailySpendingData}
                margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
              >
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  stroke={theme === 'dark' ? '#374151' : '#EDEDED'} 
                  strokeDasharray="3 3" 
                />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: theme === 'dark' ? '#D1D5DB' : '#4B5563' }} 
                />
                <YAxis 
                  tick={{ fill: theme === 'dark' ? '#D1D5DB' : '#4B5563' }}
                  tickFormatter={(value) => formatCurrency(value).split('.')[0]} 
                />
                <Tooltip 
                  formatter={(value) => [formatCurrency(Number(value)), "Amount"]}
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                    borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
                    color: theme === 'dark' ? '#F9FAFB' : '#111827'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#3B82F6" 
                  fillOpacity={1} 
                  fill="url(#colorAmount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution Pie Chart */}
        <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg transition-colors duration-200`}>
          <h3 className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
            Spending by Category
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), "Amount"]}
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                    borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
                    color: theme === 'dark' ? '#F9FAFB' : '#111827'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Breakdown Bar Chart */}
      <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg transition-colors duration-200`}>
        <h3 className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
          Category Breakdown
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={categoryData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              layout="vertical"
            >
              <CartesianGrid 
                stroke={theme === 'dark' ? '#374151' : '#EDEDED'} 
                strokeDasharray="3 3" 
              />
              <XAxis 
                type="number"
                tick={{ fill: theme === 'dark' ? '#D1D5DB' : '#4B5563' }}
                tickFormatter={(value) => formatCurrency(value).split('.')[0]} 
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                tick={{ fill: theme === 'dark' ? '#D1D5DB' : '#4B5563' }} 
                width={100}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value)), "Amount"]}
                contentStyle={{ 
                  backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                  borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
                  color: theme === 'dark' ? '#F9FAFB' : '#111827'
                }}
              />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="mt-6">
        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          This dashboard analyzes your spending patterns over the selected time period.
          Switch between weekly, monthly, and yearly views to get different perspectives on your expenses.
        </p>
      </div>
    </div>
  );
}
