import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseList } from './components/ExpenseList';
import { Dashboard } from './components/Dashboard';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { FinanceChat } from './components/FinanceChat';
import { Settings } from './components/Settings';
import { CategoryManager } from './components/CategoryManager';
import { Home, BarChart2, LogOut, DollarSign, ArrowUp, ArrowDown, TrendingUp, Settings as SettingsIcon } from 'lucide-react';
import { Expense, Category, UserSettings } from './types';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { useExpenses } from './hooks/useExpenses';

function App() {
  const [session, setSession] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authError, setAuthError] = useState<string>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeView, setActiveView] = useState('home'); // 'home', 'dashboard', or 'settings'
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    monthlyBudget: 2000,
    theme: 'light',
    currency: 'USD',
  });
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  
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
            <div className="lg:col-span-2 space-y-8">
              {/* Show summary cards in the main view */}
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

              <ExpenseList
                userId={session.user.id}
                onEditExpense={handleEditExpense}
              />
            </div>

            <div>
              <ExpenseForm
                categories={categories}
                editingExpense={editingExpense}
                setEditingExpense={setEditingExpense}
                userId={session.user.id}
              />
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

      {/* Navigation Toggle with Animation */}
      <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-full shadow-lg p-1 z-10 transition-colors duration-200`}>
        <div className="flex items-center relative">
          <div 
            className={`absolute h-full ${
              activeView === 'home' ? 'left-0' : activeView === 'dashboard' ? 'left-1/3' : 'left-2/3'
            } w-1/3 bg-blue-100 dark:bg-blue-900/50 rounded-full transition-all duration-300 ease-in-out`}
          />
          <button
            onClick={() => setActiveView('home')}
            className={`flex items-center justify-center p-3 rounded-full z-10 relative ${
              activeView === 'home' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            } transition-colors duration-200`}
          >
            <Home size={24} />
          </button>
          <button
            onClick={() => setActiveView('dashboard')}
            className={`flex items-center justify-center p-3 rounded-full z-10 relative ${
              activeView === 'dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            } transition-colors duration-200`}
          >
            <BarChart2 size={24} />
          </button>
          <button
            onClick={() => setActiveView('settings')}
            className={`flex items-center justify-center p-3 rounded-full z-10 relative ${
              activeView === 'settings' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            } transition-colors duration-200`}
          >
            <SettingsIcon size={24} />
          </button>
        </div>
      </div>

      {/* Chat Button */}
      <div className="fixed bottom-8 right-8 z-20">
        <FinanceChat 
          isOpen={isChatOpen} 
          onToggle={() => setIsChatOpen(!isChatOpen)} 
          expenses={expenses}
        />
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