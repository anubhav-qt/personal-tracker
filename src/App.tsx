import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseList } from './components/ExpenseList';
import { Dashboard } from './components/Dashboard';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { Settings } from './components/Settings';
import { CategoryManager } from './components/CategoryManager';
import { Home, BarChart2, LogOut, DollarSign, ArrowUp, ArrowDown, TrendingUp, Settings as SettingsIcon, Sparkles } from 'lucide-react';
import { Expense, Category, UserSettings } from './types';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { useExpenses } from './hooks/useExpenses';
import { format } from 'date-fns';
import { AiInsights } from './components/AiInsights';
import { getExpenseInsights, getSmartSavingTips } from './lib/gemini';

function App() {
  const [session, setSession] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authError, setAuthError] = useState<string>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeView, setActiveView] = useState('home'); // 'home', 'dashboard', 'ai', or 'settings'
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    monthlyBudget: 2000,
    theme: 'light',
    currency: 'USD',
  });
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [aiTips, setAiTips] = useState<string>('Loading personalized tips...');
  const [savingsAdvice, setSavingsAdvice] = useState<string>('Analyzing your financial data...');
  const [isTipsLoading, setIsTipsLoading] = useState(true);
  const [isSavingsLoading, setIsSavingsLoading] = useState(true);
  
  const { updateTheme, updateCurrency, formatCurrency, theme } = useTheme();

  // Use our custom hook to manage expenses
  const { 
    expenses,
    isLoading: isExpenseLoading,
    error: expensesError
  } = useExpenses(session?.user?.id);

  useEffect(() => {
    // Update theme context whenever settings change
    if (userSettings) {
      updateTheme(userSettings.theme);
      updateCurrency(userSettings.currency);
    }
  }, [userSettings, updateTheme, updateCurrency]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchCategories();
      fetchUserSettings();
    }
  }, [session]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchUserSettings = async () => {
    if (!session?.user?.id) return;
    
    try {
      console.log('Checking if user_settings table exists...');
      
      // First check if the table exists
      const { error: tableCheckError } = await supabase
        .from('user_settings')
        .select('count')
        .limit(1);
        
      if (tableCheckError) {
        console.error('Error checking user_settings table:', tableCheckError);
        console.log('The user_settings table might not exist. Please run the SQL script to create it.');
        return;
      }
      
      console.log('Fetching user settings for user:', session.user.id);
      const { data, error } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('No settings found, creating default settings');
          await createDefaultUserSettings();
          // Fetch the default settings we just created
          const { data: newData, error: fetchError } = await supabase
            .from('user_settings')
            .select('settings')
            .eq('user_id', session.user.id)
            .single();
            
          if (fetchError) {
            console.error('Error fetching new settings:', fetchError);
            return;
          }
            
          if (newData) {
            console.log('Default settings loaded:', newData.settings);
            setUserSettings(newData.settings);
          }
        } else {
          console.error('Error fetching settings:', error);
        }
      } else if (data) {
        console.log('Settings loaded:', data.settings);
        setUserSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching user settings:', error);
    }
  };

  const createDefaultUserSettings = async () => {
    if (!session?.user?.id) return;
    
    try {
      const defaultSettings: UserSettings = {
        monthlyBudget: 2000,
        theme: 'light' as 'light',
        currency: 'USD'
      };
      
      console.log('Creating default settings for user:', session.user.id);
      const { error } = await supabase
        .from('user_settings')
        .insert({
          user_id: session.user.id,
          settings: defaultSettings
        });

      if (error) throw error;
      
      setUserSettings(defaultSettings);
    } catch (error) {
      console.error('Error creating default user settings:', error);
    }
  };

  const saveUserSettings = async (newSettings: UserSettings) => {
    if (!session?.user?.id) {
      console.error('No user ID available for saving settings');
      throw new Error('You must be logged in to save settings');
    }
    
    try {
      console.log('Attempting to save settings for user:', session.user.id, newSettings);
      
      // First check if user settings already exist
      const { data: existingSettings, error: checkError } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();
        
      if (checkError) {
        console.error('Error checking existing settings:', checkError);
        throw checkError;
      }
      
      let saveError;
      
      if (existingSettings) {
        // Update existing settings
        console.log('Updating existing settings');
        const { error } = await supabase
          .from('user_settings')
          .update({ 
            settings: newSettings
          })
          .eq('user_id', session.user.id);
        
        saveError = error;
      } else {
        // Insert new settings if they don't exist
        console.log('Creating new settings');
        const { error } = await supabase
          .from('user_settings')
          .insert({
            user_id: session.user.id,
            settings: newSettings
          });
        
        saveError = error;
      }
      
      if (saveError) {
        console.error('Supabase error when saving settings:', saveError);
        throw saveError;
      }
      
      console.log('Settings saved successfully');
      setUserSettings(newSettings);
      
      // Immediately apply theme and currency changes
      updateTheme(newSettings.theme);
      updateCurrency(newSettings.currency);
    } catch (error) {
      console.error('Error saving user settings:', error);
      throw error; // Rethrow to allow the Settings component to show an error
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error: any) {
      setAuthError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError('');

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      setAuthError('Check your email for the confirmation link.');
    } catch (error: any) {
      setAuthError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error signing out:', error);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setActiveView('home'); // Ensure we're on the home view to see the form
  };

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

  const exportToCSV = () => {
    // Create CSV content
    const headers = ['Date', 'Description', 'Category', 'Amount'];
    const csvRows = [headers];
    
    expenses.forEach(expense => {
      const row = [
        expense.date,
        expense.description,
        expense.category.name,
        expense.amount.toString()
      ];
      csvRows.push(row);
    });
    
    // Convert to CSV string
    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `expenses-export-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  const getRecentActivity = (expenses: Expense[], limit: number) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return expenses
      .filter(expense => new Date(expense.date) >= sevenDaysAgo)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  };

  // New function to load AI tips based on user data
  const loadAiTips = async () => {
    if (expenses.length === 0) {
      setAiTips("Start tracking your expenses to receive personalized financial tips!");
      setIsTipsLoading(false);
      return;
    }
    
    setIsTipsLoading(true);
    try {
      const prompt = `I need 3-4 money-saving tips based on this financial data:
        Total spent: ${formatCurrency(totalSpent)}
        Monthly budget: ${formatCurrency(monthlyBudget)}
        Budget remaining: ${formatCurrency(budgetRemaining)}
        Top spending categories: ${getTopCategories(expenses, 3).map(cat => cat.name).join(', ')}
        
        Format as simple bullet points for easy reading.`;
      
      const tips = await getSmartSavingTips(prompt);
      setAiTips(tips);
    } catch (error) {
      console.error('Error getting AI tips:', error);
      setAiTips("Unable to generate personalized tips at this time. Please try again later.");
    } finally {
      setIsTipsLoading(false);
    }
  };

  // New function to load AI savings advice
  const loadSavingsAdvice = async () => {
    if (expenses.length === 0) {
      setSavingsAdvice("Add some expenses to get personalized savings insights!");
      setIsSavingsLoading(false);
      return;
    }
    
    setIsSavingsLoading(true);
    try {
      const prompt = `Provide a brief savings insight based on:
        Total spent: ${formatCurrency(totalSpent)}
        Monthly budget: ${formatCurrency(monthlyBudget)}
        Budget remaining: ${formatCurrency(budgetRemaining)}
        Budget status: ${budgetRemaining >= 0 ? 'Under budget' : 'Over budget'}
        
        Keep it to 1-2 sentences, conversational and direct.`;
      
      const advice = await getSmartSavingTips(prompt);
      setSavingsAdvice(advice);
    } catch (error) {
      console.error('Error getting AI savings advice:', error);
      setSavingsAdvice("We're unable to analyze your savings potential right now. Please check back later.");
    } finally {
      setIsSavingsLoading(false);
    }
  };

  // Load AI content when expenses change
  useEffect(() => {
    if (session?.user?.id && expenses.length > 0) {
      loadAiTips();
      loadSavingsAdvice();
    }
  }, [expenses.length, monthlyBudget]); // reload when expenses or budget changes

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-center mb-6">Expense Tracker</h1>
          
          <form onSubmit={handleSignIn} className="space-y-4">
            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {authError}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>

              <button
                type="button"
                onClick={handleSignUp}
                disabled={isLoading}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'} pb-24`}>
      <nav className={`${theme === 'dark' ? 'bg-gray-800 shadow-gray-700/30' : 'bg-white shadow-sm'} transition-colors duration-200`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Expense Tracker</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={handleSignOut}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md
                ${theme === 'dark' ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'} 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200`}
              >
                <LogOut size={18} className="mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'home' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left content area (2/3 width on large screens) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Spent Card */}
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
                
                {/* Budget Remaining Card */}
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
                
                {/* Month over Month Card */}
                <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md transition-colors duration-200`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Month over Month</p>
                      <p className={`text-2xl font-bold ${
                        !isIncreased 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {monthOverMonthChange.toFixed(1)}%
                      </p>
                    </div>
                    <div className={`p-2 rounded-full ${
                      !isIncreased 
                        ? 'bg-green-100 dark:bg-green-900/50' 
                        : 'bg-red-100 dark:bg-red-900/50'
                    }`}>
                      <TrendingUp size={20} className={
                        !isIncreased 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      } />
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle Row: Two-column grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Budget Progress Card */}
                <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md transition-colors duration-200`}>
                  <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Budget Progress
                  </h3>
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className={`text-xs font-semibold inline-block ${
                          budgetRemaining >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {totalSpent > 0 ? ((totalSpent / monthlyBudget) * 100).toFixed(1) : '0'}% Used
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-semibold inline-block ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                          {formatCurrency(totalSpent)} / {formatCurrency(monthlyBudget)}
                        </span>
                      </div>
                    </div>
                    <div className={`overflow-hidden h-2 mb-4 text-xs flex rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div
                        style={{ width: `${Math.min((totalSpent / monthlyBudget) * 100, 100)}%` }}
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                          budgetRemaining >= 0 
                            ? totalSpent / monthlyBudget > 0.8 
                              ? 'bg-yellow-500 dark:bg-yellow-600' 
                              : 'bg-green-500 dark:bg-green-600'
                            : 'bg-red-500 dark:bg-red-600'
                        }`}
                      ></div>
                    </div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {budgetRemaining >= 0 
                        ? `You have ${formatCurrency(budgetRemaining)} left to spend this month.`
                        : `You've exceeded your monthly budget by ${formatCurrency(Math.abs(budgetRemaining))}.`
                      }
                    </p>
                  </div>
                </div>

                {/* Top Categories Card */}
                <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md transition-colors duration-200`}>
                  <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Top Spending Categories
                  </h3>
                  <div className="space-y-4">
                    {getTopCategories(expenses, 3).map((category, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: category.color }}
                          ></div>
                          <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            {category.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{formatCurrency(category.amount)}</span>
                          <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {((category.amount / totalSpent) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                    {getTopCategories(expenses, 3).length === 0 && (
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        No expense data available yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Activity Card */}
              <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md transition-colors duration-200`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Recent Activity
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 text-blue-800'}`}>
                    Last 7 days
                  </span>
                </div>
                <div className="space-y-3">
                  {getRecentActivity(expenses, 3).map((expense, index) => (
                    <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-600' : 'bg-white'}`}>
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: expense.category.color }}
                          ></div>
                        </div>
                        <div>
                          <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {expense.description}
                          </p>
                          <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {format(new Date(expense.date), 'MMM d, yyyy')} · {expense.category.name}
                          </p>
                        </div>
                      </div>
                      <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {formatCurrency(expense.amount)}
                      </span>
                    </div>
                  ))}
                  {getRecentActivity(expenses, 3).length === 0 && (
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      No recent activity. Add an expense to get started!
                    </p>
                  )}
                </div>
              </div>

              {/* Expense List with fixed height */}
              <div className="h-96">
                <ExpenseList
                  userId={session.user.id}
                  onEditExpense={handleEditExpense}
                />
              </div>
            </div>

            {/* Right sidebar (1/3 width on large screens) */}
            <div className="space-y-6">
              {/* Expense Form */}
              <div className="h-auto">
                <ExpenseForm
                  categories={categories}
                  editingExpense={editingExpense}
                  setEditingExpense={setEditingExpense}
                  userId={session.user.id}
                />
              </div>

              {/* AI-powered Monthly Savings Estimator Card */}
              <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md transition-colors duration-200`}>
                <div className="flex items-center mb-4">
                  <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} flex-1`}>
                    Savings Insights
                  </h3>
                  <Sparkles size={18} className="text-purple-500" />
                </div>
                
                {isSavingsLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-pulse flex space-x-2">
                      <div className="rounded-full bg-slate-400 h-2 w-2"></div>
                      <div className="rounded-full bg-slate-400 h-2 w-2"></div>
                      <div className="rounded-full bg-slate-400 h-2 w-2"></div>
                    </div>
                  </div>
                ) : (
                  <div className={`p-4 rounded-lg mb-4 ${budgetRemaining >= 0 ? theme === 'dark' ? 'bg-purple-900/20' : 'bg-purple-50' : theme === 'dark' ? 'bg-purple-900/20' : 'bg-purple-50'}`}>
                    <div 
                      className={`prose prose-sm max-w-none ${theme === 'dark' ? 'prose-invert text-purple-300' : 'text-purple-800'}`}
                      dangerouslySetInnerHTML={{ __html: savingsAdvice }}
                    ></div>
                  </div>
                )}
                
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {budgetRemaining >= 0 
                    ? `Current savings projection: ${formatCurrency(budgetRemaining * 12)}/year`
                    : `Current deficit: ${formatCurrency(Math.abs(budgetRemaining))}/month`
                  }
                </p>
              </div>

              {/* AI-powered Tips Card */}
              <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md transition-colors duration-200`}>
                <div className="flex items-center mb-4">
                  <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} flex-1`}>
                    Smart Money Tips
                  </h3>
                  <Sparkles size={18} className="text-purple-500" />
                </div>
                
                {isTipsLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-pulse flex space-x-2">
                      <div className="rounded-full bg-slate-400 h-2 w-2"></div>
                      <div className="rounded-full bg-slate-400 h-2 w-2"></div>
                      <div className="rounded-full bg-slate-400 h-2 w-2"></div>
                    </div>
                  </div>
                ) : (
                  <div 
                    className={`prose prose-sm max-w-none ${theme === 'dark' ? 'prose-invert text-gray-300' : 'text-gray-700'}`}
                    dangerouslySetInnerHTML={{ __html: aiTips }}
                  ></div>
                )}
                
                <button 
                  onClick={loadAiTips}
                  className={`mt-4 text-xs px-3 py-1 rounded-full ${
                    theme === 'dark' 
                      ? 'bg-purple-900/30 text-purple-300 hover:bg-purple-900/50' 
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  } transition-colors duration-200`}
                >
                  Refresh tips
                </button>
              </div>
            </div>
          </div>
        ) : activeView === 'dashboard' ? (
          <div className="space-y-8">
            <Dashboard
              expenses={expenses}
              totalSpent={totalSpent}
              monthlyBudget={monthlyBudget}
            />
            <AnalyticsDashboard expenses={expenses} />
          </div>
        ) : activeView === 'ai' ? (
          <AiInsights expenses={expenses} />
        ) : (
          <Settings 
            settings={userSettings}
            onSaveSettings={saveUserSettings}
            onExportCSV={exportToCSV}
            onManageCategories={() => setIsCategoryManagerOpen(true)}
            expenses={expenses}
          />
        )}
      </main>

      {/* Navigation Toggle with Animation - Updated with AI button */}
      <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-full shadow-lg p-1 z-10 transition-colors duration-200`}>
        <div className="flex items-center relative">
          <div 
            className={`absolute h-full ${
              activeView === 'home' ? 'left-0' : 
              activeView === 'dashboard' ? 'left-1/4' : 
              activeView === 'ai' ? 'left-2/4' : 'left-3/4'
            } w-1/4 bg-blue-100 dark:bg-blue-900/50 rounded-full transition-all duration-300 ease-in-out`}
          />
          <button
            onClick={() => setActiveView('home')}
            className={`flex items-center justify-center p-3 rounded-full z-10 relative ${
              activeView === 'home' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            } transition-colors duration-200`}
          >
            <Home size={22} />
          </button>
          <button
            onClick={() => setActiveView('dashboard')}
            className={`flex items-center justify-center p-3 rounded-full z-10 relative ${
              activeView === 'dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            } transition-colors duration-200`}
          >
            <BarChart2 size={22} />
          </button>
          <button
            onClick={() => setActiveView('ai')}
            className={`flex items-center justify-center p-3 rounded-full z-10 relative ${
              activeView === 'ai' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            } transition-colors duration-200`}
          >
            <Sparkles size={22} />
          </button>
          <button
            onClick={() => setActiveView('settings')}
            className={`flex items-center justify-center p-3 rounded-full z-10 relative ${
              activeView === 'settings' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            } transition-colors duration-200`}
          >
            <SettingsIcon size={22} />
          </button>
        </div>
      </div>

      {/* Category Manager Modal */}
      {isCategoryManagerOpen && (
        <CategoryManager
          categories={categories}
          onClose={() => setIsCategoryManagerOpen(false)}
          onCategoriesChange={fetchCategories}
        />
      )}
    </div>
  );
}

// Wrapping the export with a container component that gets the initialSettings
function AppContainer() {
  const [initialSettings, setInitialSettings] = useState<UserSettings | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getInitialSettings() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        try {
          const { data, error } = await supabase
            .from('user_settings')
            .select('settings')
            .eq('user_id', session.user.id)
            .single();

          if (!error && data) {
            setInitialSettings(data.settings);
          }
        } catch (error) {
          console.error('Error fetching initial settings:', error);
        }
      }
      setLoading(false);
    }

    getInitialSettings();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><LoadingSpinner /></div>;
  }

  return (
    <ThemeProvider initialSettings={initialSettings}>
      <App />
    </ThemeProvider>
  );
}

export default AppContainer;