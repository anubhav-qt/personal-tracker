import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseList } from './components/ExpenseList';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { Settings } from './components/Settings';
import { CategoryManager } from './components/CategoryManager';
import { Home, BarChart2, LogOut, DollarSign, ArrowUp, ArrowDown, TrendingUp, Settings as SettingsIcon, Sparkles, Plus, Lightbulb } from 'lucide-react';
import { Expense, Category, UserSettings, UpcomingPayment } from './types';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { useExpenses } from './hooks/useExpenses';
import { format } from 'date-fns';
import { AiInsights } from './components/AiInsights';
import { SmartMoneyTips } from './components/SmartMoneyTips';
import { getExpenseInsights, getSmartSavingTips } from './lib/gemini';
import { ExpenseFormModal } from './components/ExpenseFormModal';
import { SmartMoneyTipsModal } from './components/SmartMoneyTipsModal';
import { UpcomingPayments } from './components/UpcomingPayments';
import { PaymentFormModal } from './components/PaymentFormModal';

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
  const [isTipsLoading, setIsTipsLoading] = useState(true);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isTipsModalOpen, setIsTipsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<UpcomingPayment | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
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
    setIsExpenseModalOpen(true);
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
        expense.category?.name || 'Uncategorized',
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

  // Load AI content when expenses change
  useEffect(() => {
    if (session?.user?.id && expenses.length > 0) {
      loadAiTips();
    }
  }, [expenses.length, monthlyBudget]); // reload when expenses or budget changes

  // Add a function to filter expenses from the last week only
  const getLastWeekExpenses = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= oneWeekAgo;
    });
  };

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
                onClick={() => setActiveView('settings')}
                className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200`}
              >
                <SettingsIcon size={20} className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`} />
              </button>
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
          <div>
            {/* Main content - Now taking up full width */}
            <div className="space-y-6">
              {/* Top Row: Three cards with equal width */}
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
                
                {/* Budget Progress Card */}
                <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md transition-colors duration-200`}>
                  <h3 className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
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
                    <div className={`overflow-hidden h-2 mb-2 text-xs flex rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
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
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {budgetRemaining >= 0 
                        ? `You have ${formatCurrency(budgetRemaining)} left to spend this month.`
                        : `You've exceeded your monthly budget by ${formatCurrency(Math.abs(budgetRemaining))}.`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Second Row: Two equal cards with fixed height */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Top Categories Card */}
                <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md transition-colors duration-200 h-80 flex flex-col overflow-hidden`}>
                  <div className={`p-6 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} border-b`}>
                    <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Top Spending Categories
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-4">
                      {getTopCategories(expenses, 8).map((category, index) => (
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
                      {getTopCategories(expenses, 8).length === 0 && (
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          No expense data available yet.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Activity Card */}
                <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md transition-colors duration-200 h-80 flex flex-col overflow-hidden`}>
                  <div className={`p-6 flex justify-between items-center ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} border-b`}>
                    <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Recent Activity
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 text-blue-800'}`}>
                      Last 7 days
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-3">
                      {getRecentActivity(expenses, 10).map((expense, index) => {
                        const categoryColor = expense.category ? expense.category.color : '#cccccc'; // Default color
                        return (
                          <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-600' : 'bg-white'}`}>
                                <div 
                                  className="w-2 h-2 rounded-full" 
                                  style={{ backgroundColor: categoryColor }}
                                ></div>
                              </div>
                              <div>
                                <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  {expense.description}
                                </p>
                                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {format(new Date(expense.date), 'MMM d, yyyy')} · {expense.category?.name || 'Uncategorized'}
                                </p>
                              </div>
                            </div>
                            <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {formatCurrency(expense.amount)}
                            </span>
                          </div>
                        );
                      })}
                      {getRecentActivity(expenses, 10).length === 0 && (
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          No recent activity. Add an expense to get started!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Replace ExpenseList with UpcomingPayments */}
              <UpcomingPayments 
                userId={session.user.id} 
                onAddPayment={() => {
                  setEditingPayment(null);
                  setIsPaymentModalOpen(true);
                }}
              />
            </div>
          </div>
        ) : activeView === 'dashboard' ? (
          <div className="space-y-8">
            <AnalyticsDashboard expenses={expenses} />
          </div>
        ) : activeView === 'ai' ? (
          <div>
            <AiInsights 
              expenses={expenses} 
              onOpenTips={() => setIsTipsModalOpen(true)}
            />
          </div>
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
      
      {/* Navigation Toggle with integrated buttons */}
      <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-full shadow-lg p-1 z-10 transition-colors duration-200`}>
        <div className="flex items-center justify-center space-x-1 relative">
          <button
            onClick={() => setActiveView('home')}
            className={`p-3 rounded-full z-10 ${
              activeView === 'home' 
                ? `${theme === 'dark' ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-600'}`
                : `text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700`
            } transition-colors duration-200`}
          >
            <Home size={22} />
          </button>
          
          <button
            onClick={() => setActiveView('dashboard')}
            className={`p-3 rounded-full z-10 ${
              activeView === 'dashboard' 
                ? `${theme === 'dark' ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-600'}`
                : `text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700`
            } transition-colors duration-200`}
          >
            <BarChart2 size={22} />
          </button>
          
          {/* Add Expense Button (Center) - aligned with other buttons */}
          <button
            onClick={() => {
              setEditingExpense(null);
              setIsExpenseModalOpen(true);
            }}
            className={`p-3 rounded-full z-20 
              ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'}
              text-white shadow-md transition-colors duration-200`}
          >
            <Plus size={24} />
          </button>
          
          <button
            onClick={() => setActiveView('ai')}
            className={`p-3 rounded-full z-10 ${
              activeView === 'ai' 
                ? `${theme === 'dark' ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-600'}`
                : `text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700`
            } transition-colors duration-200`}
          >
            <Sparkles size={22} />
          </button>
        </div>
      </div>

      {/* Modals */}
      {isExpenseModalOpen && (
        <ExpenseFormModal
          categories={categories}
          editingExpense={editingExpense}
          setEditingExpense={setEditingExpense}
          userId={session.user.id}
          onClose={() => setIsExpenseModalOpen(false)}
        />
      )}

      {isPaymentModalOpen && (
        <PaymentFormModal
          userId={session.user.id}
          categories={categories}
          editingPayment={editingPayment}
          onClose={() => setIsPaymentModalOpen(false)}
        />
      )}

      {isTipsModalOpen && (
        <SmartMoneyTipsModal
          tips={aiTips}
          isLoading={isTipsLoading}
          onRefresh={loadAiTips}
          onClose={() => setIsTipsModalOpen(false)}
          theme={theme}
        />
      )}

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