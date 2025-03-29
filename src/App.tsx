import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Expense, Category, UserSettings, UpcomingPayment } from './types';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useExpenses } from './hooks/useExpenses';
import { AuthForm } from './components/AuthForm';
import { AppHeader } from './components/AppHeader';
import { MainDashboard } from './components/MainDashboard';
import { BottomNavigation } from './components/BottomNavigation';
import { AiInsights } from './components/AiInsights';
import { Settings } from './components/Settings';
import { CategoryManager } from './components/CategoryManager';
import { ExpenseFormModal } from './components/ExpenseFormModal';
import { SmartMoneyTipsModal } from './components/SmartMoneyTipsModal';
import { UpcomingPaymentFormModal } from './components/UpcomingPaymentFormModal';
import { getSmartSavingTips } from './lib/gemini';
import { Fitness } from './components/Fitness';
import { Academics } from './components/Academics';
import { FitnessAI } from './components/FitnessAI';
import { AcademicsAI } from './components/AcademicsAI';

function App() {
  const [session, setSession] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeView, setActiveView] = useState('home'); // 'home', 'fitness', 'academics', 'ai', 'fitness-ai', 'academics-ai', or 'settings'
  const [userSettings, setUserSettings] = useState<UserSettings>({
    monthlyBudget: 2000,
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
    // Update currency context whenever settings change
    if (userSettings) {
      updateCurrency(userSettings.currency);
    }
  }, [userSettings, updateCurrency]);

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
        
        // Filter out theme property from loaded settings to ensure it's not part of state
        const { theme: _, ...filteredSettings } = data.settings;
        setUserSettings(filteredSettings);
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
      // Filter out any theme property that might have been included
      const serverSettings = {
        monthlyBudget: newSettings.monthlyBudget,
        currency: newSettings.currency,
        // theme is deliberately excluded
      };
      
      console.log('Attempting to save settings for user:', session.user.id, serverSettings);
      
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
            settings: serverSettings
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
            settings: serverSettings
          });
        
        saveError = error;
      }
      
      if (saveError) {
        console.error('Supabase error when saving settings:', saveError);
        throw saveError;
      }
      
      console.log('Settings saved successfully');
      
      // Update local state with user values but don't overwrite theme
      setUserSettings(prev => ({
        ...newSettings,
      }));
      
      // Only update currency from settings, theme is handled separately
      updateCurrency(newSettings.currency);
    } catch (error) {
      console.error('Error saving user settings:', error);
      throw error; // Rethrow to allow the Settings component to show an error
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error signing out:', error);
  };

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

  // New function to load AI tips based on user data
  const loadAiTips = async () => {
    if (expenses.length === 0) {
      setAiTips("Start tracking your expenses to receive personalized financial tips!");
      setIsTipsLoading(false);
      return;
    }
    
    setIsTipsLoading(true);
    try {
      // Calculate metrics for the prompt
      const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const budgetRemaining = userSettings.monthlyBudget - totalSpent;
      
      // Get top categories
      const categoryMap = new Map<string, number>();
      expenses.forEach(expense => {
        const categoryName = expense.category?.name || 'Uncategorized';
        const current = categoryMap.get(categoryName) || 0;
        categoryMap.set(categoryName, current + expense.amount);
      });
      
      const topCategories = Array.from(categoryMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name]) => name);
      
      const prompt = `I need 3-4 money-saving tips based on this financial data:
        Total spent: ${formatCurrency(totalSpent)}
        Monthly budget: ${formatCurrency(userSettings.monthlyBudget)}
        Budget remaining: ${formatCurrency(budgetRemaining)}
        Top spending categories: ${topCategories.join(', ')}
        
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
  }, [expenses.length, userSettings.monthlyBudget]); // reload when expenses or budget changes

  // Add a toggle theme function
  const toggleTheme = () => {
    // Only toggle theme in the frontend without modifying userSettings
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    updateTheme(newTheme);
    // We no longer update userSettings here
  };

  if (!session) {
    return <AuthForm setSession={setSession} />;
  }

  // Update the main app name to reflect it's a comprehensive personal tracker
  const appName = "Personal Tracker";

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      theme === 'dark' 
        ? 'bg-[rgb(23_23_23/1)] text-white' 
        : 'bg-zinc-50 text-black'
    } pb-24`}>
      <AppHeader 
        theme={theme}
        onSettingsClick={() => setActiveView('settings')}
        onSignOut={handleSignOut}
        activeView={activeView}
        setActiveView={setActiveView}
        onToggleTheme={toggleTheme}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
        {activeView === 'home' ? (
          <MainDashboard 
            expenses={expenses}
            userSettings={userSettings}
            theme={theme}
            formatCurrency={formatCurrency}
            onOpenTipsModal={() => setIsTipsModalOpen(true)}
            onEditExpense={(expense) => {
              setEditingExpense(expense);
              setIsExpenseModalOpen(true);
            }}
            onAddPayment={() => {
              setEditingPayment(null);
              setIsPaymentModalOpen(true);
            }}
            onEditPayment={(payment) => {
              setEditingPayment(payment);
              setIsPaymentModalOpen(true);
            }}
            userId={session.user.id}
            onToggleTheme={toggleTheme} // Add this prop
          />
        ) : activeView === 'fitness' ? (
          <Fitness theme={theme} />
        ) : activeView === 'academics' ? (
          <Academics theme={theme} />
        ) : activeView === 'ai' ? (
          <AiInsights 
            expenses={expenses} 
            onOpenTips={() => setIsTipsModalOpen(true)}
          />
        ) : activeView === 'fitness-ai' ? (
          <FitnessAI theme={theme} />
        ) : activeView === 'academics-ai' ? (
          <AcademicsAI theme={theme} />
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
      
      <BottomNavigation 
        activeView={activeView}
        setActiveView={setActiveView}
        theme={theme}
        onAddExpense={() => {
          setEditingExpense(null);
          setIsExpenseModalOpen(true);
        }}
      />

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
        <UpcomingPaymentFormModal
          userId={session.user.id}
          categories={categories}
          editingPayment={editingPayment}
          setEditingPayment={setEditingPayment}
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
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
}

export default AppContainer;