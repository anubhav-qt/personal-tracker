import { useState, useEffect } from 'react';
import { UserSettings } from '../types';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun, Download, Tag, DollarSign, Sliders, Save, XCircle, CheckCircle } from 'lucide-react';

interface SettingsProps {
  settings: UserSettings;
  onSaveSettings: (settings: UserSettings) => Promise<void>;
  onExportCSV: () => void;
  onManageCategories: () => void;
  expenses: any[];
}

export function Settings({ settings, onSaveSettings, onExportCSV, onManageCategories, expenses }: SettingsProps) {
  const [monthlyBudget, setMonthlyBudget] = useState(settings.monthlyBudget.toString());
  const [theme, setTheme] = useState<'light' | 'dark'>(settings.theme);
  const [currency, setCurrency] = useState(settings.currency);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [activeSection, setActiveSection] = useState('general');
  
  const { theme: currentTheme, currencySymbol, updateTheme, updateCurrency } = useTheme();
  
  // Ensure settings are in sync with props
  useEffect(() => {
    setMonthlyBudget(settings.monthlyBudget.toString());
    setTheme(settings.theme);
    setCurrency(settings.currency);
  }, [settings]);

  // Update local theme context when theme changes
  useEffect(() => {
    if (theme !== currentTheme) {
      updateTheme(theme);
    }
  }, [theme, currentTheme, updateTheme]);

  // Update local currency context when currency changes
  useEffect(() => {
    updateCurrency(currency);
  }, [currency, updateCurrency]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const newSettings: UserSettings = {
        monthlyBudget: parseFloat(monthlyBudget),
        theme,
        currency,
      };

      // Apply theme immediately before saving
      updateTheme(theme);
      updateCurrency(currency);

      await onSaveSettings(newSettings);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`max-w-4xl mx-auto ${currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md overflow-hidden transition-colors duration-200`}>
      <div className={`${currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} transition-colors duration-200`}>
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h2 className={`text-2xl font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Settings</h2>
          <p className={`mt-1 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Manage your application preferences and data
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Sidebar/Navigation */}
        <div className={`w-full md:w-64 ${currentTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} transition-colors duration-200`}>
          <nav className="p-4">
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => setActiveSection('general')}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
                    activeSection === 'general'
                      ? currentTheme === 'dark' 
                        ? 'bg-gray-700 text-white'
                        : 'bg-white text-blue-600 shadow-sm'
                      : currentTheme === 'dark'
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        : 'text-gray-700 hover:bg-white hover:text-blue-600 hover:shadow-sm'
                  }`}
                >
                  <Sliders className="mr-3 h-5 w-5" />
                  <span>General</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveSection('appearance')}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
                    activeSection === 'appearance'
                      ? currentTheme === 'dark' 
                        ? 'bg-gray-700 text-white'
                        : 'bg-white text-blue-600 shadow-sm'
                      : currentTheme === 'dark'
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        : 'text-gray-700 hover:bg-white hover:text-blue-600 hover:shadow-sm'
                  }`}
                >
                  {currentTheme === 'dark' ? (
                    <Moon className="mr-3 h-5 w-5" />
                  ) : (
                    <Sun className="mr-3 h-5 w-5" />
                  )}
                  <span>Appearance</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveSection('financial')}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
                    activeSection === 'financial'
                      ? currentTheme === 'dark' 
                        ? 'bg-gray-700 text-white'
                        : 'bg-white text-blue-600 shadow-sm'
                      : currentTheme === 'dark'
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        : 'text-gray-700 hover:bg-white hover:text-blue-600 hover:shadow-sm'
                  }`}
                >
                  <DollarSign className="mr-3 h-5 w-5" />
                  <span>Financial</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveSection('data')}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
                    activeSection === 'data'
                      ? currentTheme === 'dark' 
                        ? 'bg-gray-700 text-white'
                        : 'bg-white text-blue-600 shadow-sm'
                      : currentTheme === 'dark'
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        : 'text-gray-700 hover:bg-white hover:text-blue-600 hover:shadow-sm'
                  }`}
                >
                  <Download className="mr-3 h-5 w-5" />
                  <span>Data Management</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {message && (
            <div className={`mb-6 p-4 rounded-md flex items-center ${
              message.type === 'success' 
                ? currentTheme === 'dark' ? 'bg-green-900/50 text-green-200' : 'bg-green-50 text-green-700'
                : currentTheme === 'dark' ? 'bg-red-900/50 text-red-200' : 'bg-red-50 text-red-700'
            } transition-colors duration-200`}>
              {message.type === 'success' ? (
                <CheckCircle className="mr-2 h-5 w-5" />
              ) : (
                <XCircle className="mr-2 h-5 w-5" />
              )}
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* General Settings */}
            {activeSection === 'general' && (
              <div className="space-y-6">
                <h3 className={`text-lg font-medium ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  General Settings
                </h3>
                
                <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Configure basic application preferences.
                </p>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Your changes are saved automatically when you modify settings.
                  </p>
                </div>
              </div>
            )}

            {/* Appearance Settings */}
            {activeSection === 'appearance' && (
              <div className="space-y-6">
                <h3 className={`text-lg font-medium ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Appearance
                </h3>

                <div>
                  <label className={`block text-sm font-medium ${currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                    Theme
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`relative flex flex-col items-center p-4 rounded-lg border-2 ${
                        theme === 'light'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                          : 'border-gray-200 dark:border-gray-700'
                      } transition-colors duration-200`}
                    >
                      {theme === 'light' && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full"></div>
                      )}
                      <Sun className={`h-8 w-8 mb-2 ${theme === 'light' ? 'text-blue-500' : 'text-gray-400'}`} />
                      <span className={`text-sm font-medium ${theme === 'light' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                        Light Mode
                      </span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`relative flex flex-col items-center p-4 rounded-lg border-2 ${
                        theme === 'dark'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                          : 'border-gray-200 dark:border-gray-700'
                      } transition-colors duration-200`}
                    >
                      {theme === 'dark' && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full"></div>
                      )}
                      <Moon className={`h-8 w-8 mb-2 ${theme === 'dark' ? 'text-blue-500' : 'text-gray-400'}`} />
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                        Dark Mode
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Financial Settings */}
            {activeSection === 'financial' && (
              <div className="space-y-6">
                <h3 className={`text-lg font-medium ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Financial Settings
                </h3>

                <div>
                  <label className={`block text-sm font-medium ${currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                    Monthly Budget
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      <span className="sm:text-sm">{currencySymbol}</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={monthlyBudget}
                      onChange={(e) => setMonthlyBudget(e.target.value)}
                      className={`focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm ${
                        currentTheme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } rounded-md`}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <p className={`mt-1 text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Set your monthly spending limit to track budget progress.
                  </p>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      currentTheme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="CAD">CAD ($)</option>
                    <option value="AUD">AUD ($)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>

                <button
                  onClick={() => onManageCategories()}
                  type="button"
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md ${
                    currentTheme === 'dark' 
                      ? 'bg-blue-700 hover:bg-blue-800 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  <Tag className="mr-2 h-5 w-5" />
                  Manage Categories
                </button>
              </div>
            )}

            {/* Data Management */}
            {activeSection === 'data' && (
              <div className="space-y-6">
                <h3 className={`text-lg font-medium ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Data Management
                </h3>

                <div className={`border ${currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-lg p-5`}>
                  <h4 className={`text-md font-medium ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
                    Export Data
                  </h4>
                  <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
                    Download your expense data as a CSV file for use in spreadsheet applications.
                  </p>
                  <button
                    onClick={onExportCSV}
                    type="button"
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md ${
                      currentTheme === 'dark' 
                        ? 'bg-green-700 hover:bg-green-800 text-white' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Export as CSV ({expenses.length} records)
                  </button>
                </div>

                <div className={`border ${currentTheme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} rounded-lg p-5`}>
                  <h4 className={`text-md font-medium ${currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                    Data Status
                  </h4>
                  <div className={`${currentTheme === 'dark' ? 'bg-gray-900' : 'bg-white'} p-3 rounded-md shadow-sm text-sm`}>
                    <p className={`${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      <span className="font-medium">Total expenses:</span> {expenses.length}
                    </p>
                    <p className={`${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      <span className="font-medium">Last update:</span> {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="pt-5 mt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full md:w-auto ${
                  currentTheme === 'dark' 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                } py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center`}
              >
                <Save className="mr-2 h-5 w-5" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
