import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserSettings } from '../types';

interface ThemeContextProps {
  theme: 'light' | 'dark';
  currency: string;
  currencySymbol: string;
  updateTheme: (theme: 'light' | 'dark') => void;
  updateCurrency: (currency: string) => void;
  formatCurrency: (amount: number) => string;
}

const ThemeContext = createContext<ThemeContextProps>({
  theme: 'light',
  currency: 'USD',
  currencySymbol: '$',
  updateTheme: () => {},
  updateCurrency: () => {},
  formatCurrency: () => '',
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
  initialSettings?: UserSettings;
}

const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  INR: '₹',
};

export function ThemeProvider({ children, initialSettings }: ThemeProviderProps) {
  console.log('ThemeProvider initialSettings:', initialSettings);
  
  const [theme, setTheme] = useState<'light' | 'dark'>(initialSettings?.theme || 'light');
  const [currency, setCurrency] = useState(initialSettings?.currency || 'USD');
  const [currencySymbol, setCurrencySymbol] = useState(currencySymbols[initialSettings?.currency || 'USD'] || '$');

  // Apply theme class to document
  useEffect(() => {
    console.log('Applying theme:', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const updateTheme = (newTheme: 'light' | 'dark') => {
    console.log('Updating theme to:', newTheme);
    setTheme(newTheme);
  };

  const updateCurrency = (newCurrency: string) => {
    console.log('Updating currency to:', newCurrency);
    setCurrency(newCurrency);
    setCurrencySymbol(currencySymbols[newCurrency] || '$');
  };

  const formatCurrency = (amount: number): string => {
    try {
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: currency,
        currencyDisplay: 'symbol'
      }).format(amount);
    } catch (error) {
      console.error('Error formatting currency:', error);
      return `${currencySymbol}${amount.toFixed(2)}`;
    }
  };

  const contextValue = {
    theme,
    updateTheme,
    currency,
    currencySymbol,
    updateCurrency,
    formatCurrency
  };

  console.log('Providing theme context:', contextValue);
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}