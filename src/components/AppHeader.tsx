import React, { useState, useEffect } from 'react';
import { LogOut, Settings, Menu, X, DollarSign, Dumbbell, GraduationCap, User, Moon, Sun } from 'lucide-react';

interface AppHeaderProps {
  theme: 'light' | 'dark';
  onSettingsClick: () => void;
  onSignOut: () => void;
  activeView?: string;
  setActiveView?: (view: string) => void;
  onToggleTheme?: () => void;
}

export function AppHeader({ 
  theme, 
  onSettingsClick, 
  onSignOut, 
  activeView = 'home',
  setActiveView,
  onToggleTheme
}: AppHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Navigation items
  const navItems = [
    { name: 'Expenses', icon: DollarSign, id: 'home' },
    { name: 'Fitness', icon: Dumbbell, id: 'fitness' },
    { name: 'Academics', icon: GraduationCap, id: 'academics' },
  ];
  
  return (
    <header 
      className={`${theme === 'dark' ? 'bg-[#26242e]/95 shadow-gray-900/20' : 'bg-white/95 shadow-gray-200/50'} 
      ${scrolled ? 'shadow-lg' : 'shadow-sm'} 
      fixed top-0 w-full z-50 backdrop-blur-md transition-all duration-300`}
    >
      {/* Desktop Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-lg ${theme === 'dark' ? 'bg-purple-600' : 'bg-gradient-to-r from-purple-500 to-blue-400'} flex items-center justify-center mr-3`}>
              <span className="text-white font-bold">FT</span>
            </div>
            <h1 className={`text-xl font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-800'} tracking-tight`}>
              Finance<span className={`font-bold ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>Tracker</span>
            </h1>
          </div>
          
          {/* Navigation - Desktop */}
          <nav className="hidden md:flex space-x-1">
            {setActiveView && navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center
                ${activeView === item.id 
                  ? theme === 'dark' 
                    ? 'bg-gray-700 text-purple-300' 
                    : 'bg-purple-50 text-purple-700' 
                  : theme === 'dark'
                    ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <item.icon size={16} className="mr-1.5" />
                {item.name}
              </button>
            ))}
          </nav>
          
          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200`}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun size={18} className="text-yellow-300" />
                ) : (
                  <Moon size={18} className="text-gray-600" />
                )}
              </button>
            )}
            
            {/* Settings Button */}
            <button
              onClick={onSettingsClick}
              className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200`}
              aria-label="Settings"
            >
              <Settings size={18} className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} />
            </button>
            
            {/* Profile/Sign Out Button */}
            <button
              onClick={onSignOut}
              className={`hidden sm:inline-flex items-center px-3 py-2 border-[1.5px] text-sm font-medium rounded-full
              ${theme === 'dark' 
                ? 'text-gray-300 border-gray-600 hover:bg-gray-700' 
                : 'text-gray-700 border-gray-300 hover:bg-gray-100'} 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200`}
            >
              <User size={16} className="mr-2" />
              Sign Out
            </button>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden inline-flex items-center justify-center p-2 rounded-md
              ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'} 
              focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white`}
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Nav Menu */}
      {mobileMenuOpen && (
        <div className={`md:hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <div className="px-2 pt-2 pb-3 space-y-1">
            {setActiveView && navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`block w-full px-3 py-2 rounded-md text-base font-medium transition-all duration-200 text-left flex items-center
                ${activeView === item.id 
                  ? theme === 'dark' 
                    ? 'bg-gray-900 text-purple-300' 
                    : 'bg-purple-50 text-purple-700' 
                  : theme === 'dark'
                    ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon size={18} className="mr-2" />
                {item.name}
              </button>
            ))}
            <button
              onClick={onSignOut}
              className={`w-full mt-2 flex items-center px-3 py-2 rounded-md text-base font-medium 
              ${theme === 'dark' ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-50 text-gray-900 hover:bg-gray-100'} 
              transition-all duration-200`}
            >
              <LogOut size={18} className="mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
