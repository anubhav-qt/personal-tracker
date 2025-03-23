import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ArrowDown, ArrowUp, DollarSign, TrendingUp } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface DashboardProps {
  expenses: any[];
  totalSpent: number;
  monthlyBudget: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function Dashboard({ expenses, totalSpent, monthlyBudget }: DashboardProps) {
  const { theme, formatCurrency, currencySymbol } = useTheme();

  const categoryTotals = expenses.reduce((acc: any, expense: any) => {
    const category = expense.category.name;
    acc[category] = (acc[category] || 0) + expense.amount;
    return acc;
  }, {});

  const chartData = Object.entries(categoryTotals).map(([name, amount]) => ({
    name,
    amount,
  }));

  const pieData = chartData.map(item => ({
    name: item.name,
    value: Number(item.amount)
  }));

  const budgetRemaining = monthlyBudget - totalSpent;
  const percentageUsed = (totalSpent / monthlyBudget) * 100;

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

  return (
    <div className="space-y-6">
      <h2 className={`text-2xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Expense Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md transition-colors duration-200`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Spent</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalSpent)}</p>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
              <DollarSign size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md transition-colors duration-200`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Budget Remaining</p>
              <p className={`text-2xl font-bold ${
                budgetRemaining >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(budgetRemaining)}
              </p>
            </div>
            <div className={`p-2 rounded-full ${
              budgetRemaining >= 0 
                ? 'bg-green-100 dark:bg-green-900/50' 
                : 'bg-red-100 dark:bg-red-900/50'
            }`}>
              {budgetRemaining >= 0 ? 
                <ArrowUp size={20} className="text-green-600 dark:text-green-400" /> : 
                <ArrowDown size={20} className="text-red-600 dark:text-red-400" />
              }
            </div>
          </div>
        </div>
        
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md transition-colors duration-200`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Month over Month</p>
              <p className={`text-2xl font-bold ${!isIncreased ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {monthOverMonthChange.toFixed(1)}%
              </p>
            </div>
            <div className={`p-2 rounded-full ${!isIncreased ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
              <TrendingUp size={20} className={!isIncreased ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} />
            </div>
          </div>
        </div>
      </div>

      <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md transition-colors duration-200`}>
        <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Budget Usage</h2>
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block text-blue-600 dark:text-blue-400">
                {percentageUsed.toFixed(1)}% Used
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold inline-block text-blue-600 dark:text-blue-400">
                {formatCurrency(monthlyBudget)}
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
            <div
              style={{ width: `${Math.min(percentageUsed, 100)}%` }}
              className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                percentageUsed > 100 ? 'bg-red-500' : 'bg-blue-500'
              }`}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md transition-colors duration-200`}>
          <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Spending by Category</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#f5f5f5'} />
                <XAxis 
                  dataKey="name" 
                  scale="band" 
                  stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'} 
                />
                <YAxis 
                  stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'} 
                />
                <Tooltip 
                  formatter={(value) => [formatCurrency(Number(value)), 'Amount']} 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                    borderColor: theme === 'dark' ? '#4B5563' : '#E5E7EB',
                    color: theme === 'dark' ? '#F9FAFB' : '#111827'
                  }}
                />
                <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md transition-colors duration-200`}>
          <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Expense Distribution</h2>
          <div className="h-64 flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [formatCurrency(Number(value)), 'Amount']} 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                    borderColor: theme === 'dark' ? '#4B5563' : '#E5E7EB',
                    color: theme === 'dark' ? '#F9FAFB' : '#111827'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}