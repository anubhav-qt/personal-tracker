import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { UserSettings } from '../types';

interface ThemeContextProps {
  theme: 'light' | 'dark';
  updateTheme: (theme: 'light' | 'dark') => void;
  currencySymbol: string;
  updateCurrency: (currency: string) => void;
  formatCurrency: (amount: number) => string;
}

const ThemeContext = createContext<ThemeContextProps>({
  theme: 'dark', // Changed default to dark
  updateTheme: () => {},
  currencySymbol: '$',
  updateCurrency: () => {},
  formatCurrency: () => '',
});

interface ThemeProviderProps {
  children: React.ReactNode;
  initialSettings?: UserSettings;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children,
  initialSettings
}) => {
  // Get theme from localStorage first, then fallback to dark
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('preferredTheme') as 'light' | 'dark' | null;
    return savedTheme || 'dark';
  });
  
  const [currency, setCurrency] = useState(initialSettings?.currency || 'USD');
  
  const updateTheme = useCallback((newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    // Store theme in localStorage for persistence across page refreshes
    localStorage.setItem('preferredTheme', newTheme);
  }, []);
  
  const updateCurrency = useCallback((newCurrency: string) => {
    setCurrency(newCurrency);
  }, []);

  // Apply theme to document body when theme changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Get currency symbol
  const getCurrencySymbol = (currencyCode: string) => {
    switch (currencyCode) {
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      case 'GBP':
        return '£';
      case 'JPY':
        return '¥';
      case 'CAD':
        return 'C$';
      case 'AUD':
        return 'A$';
      case 'INR':
        return '₹';
      default:
        return '$';
    }
  };

  const currencySymbol = getCurrencySymbol(currency);

  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }, [currency]);

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        updateTheme,
        currencySymbol,
        updateCurrency,
        formatCurrency
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);