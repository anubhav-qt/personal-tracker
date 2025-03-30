import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Expense } from '../types';
import { useTheme } from '../context/ThemeContext';
import { format, subDays, subMonths, isAfter } from 'date-fns';
import { Edit, Trash2, Plus, AlertCircle, Calendar, List, Grid } from 'lucide-react';

interface ExpenseTrackingProps {
  userId: string;
  onEditExpense: (expense: Expense) => void;
  onAddExpense: () => void;
  formatCurrency: (amount: number) => string;
  theme: 'light' | 'dark';
}

type TimeFilter = 'week' | 'month' | 'all';

export function ExpenseTracking({ 
  userId, 
  onEditExpense, 
  onAddExpense,
  formatCurrency,
  theme 
}: ExpenseTrackingProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  // Changed default view to grid
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  
  // Fetch expenses
  useEffect(() => {
    const fetchExpenses = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Fetching expenses for user:', userId);
        
        const { data, error } = await supabase
          .from('expenses')
          .select(`
            *,
            category:categories(id, name, color)
          `)
          .eq('user_id', userId)
          .order('date', { ascending: false });

        if (error) {
          console.error('Supabase error fetching expenses:', error);
          throw error;
        }
        
        console.log('Expenses fetched:', data?.length || 0, 'records');
        
        // Process data to ensure all properties are valid
        const processedData = (data || []).map(expense => {
          // If category is null, provide a default
          if (!expense.category) {
            expense.category = {
              id: null,
              name: 'Uncategorized',
              color: '#cccccc'
            };
          }
          return expense;
        });
        
        setExpenses(processedData);
      } catch (error: any) {
        console.error('Error fetching expenses:', error);
        setError(error.message || 'Failed to fetch expenses. Check console for details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpenses();

    // Set up real-time subscription for expenses
    const channel = supabase
      .channel('expenses-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'expenses',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        console.log('Real-time update for expenses:', payload);
        fetchExpenses();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Filter expenses based on time range
  useEffect(() => {
    if (!expenses.length) {
      setFilteredExpenses([]);
      return;
    }

    let filtered: Expense[];
    const today = new Date();

    if (timeFilter === 'week') {
      const startDate = subDays(today, 7);
      filtered = expenses.filter(expense => 
        isAfter(new Date(expense.date), startDate)
      );
    } else if (timeFilter === 'month') {
      const startDate = subMonths(today, 1);
      filtered = expenses.filter(expense => 
        isAfter(new Date(expense.date), startDate)
      );
    } else {
      // Show all expenses
      filtered = [...expenses];
    }

    setFilteredExpenses(filtered);
  }, [expenses, timeFilter]);

  // Delete expense
  const handleDeleteExpense = async (expenseId: string) => {
    if (!userId) return;

    setDeletingExpenseId(expenseId);
    
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)
        .eq('user_id', userId); // Security check to ensure the expense belongs to the user

      if (error) {
        console.error('Error deleting expense:', error);
        throw new Error(error.message);
      }

      // Optimistic UI update
      setExpenses(expenses.filter(expense => expense.id !== expenseId));
      
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      setError(error.message || 'Failed to delete expense');
    } finally {
      setDeletingExpenseId(null);
    }
  };

  // Get total amount for filtered expenses
  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  // Group expenses by date for list view
  const groupedExpenses = filteredExpenses.reduce((acc, expense) => {
    const date = expense.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(expense);
    return acc;
  }, {} as Record<string, Expense[]>);

  // Sort dates for the list view
  const sortedDates = Object.keys(groupedExpenses).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header with filters and controls */}
      <div className="flex flex-wrap justify-between items-center mb-8">
        <div className="flex items-center mb-2">
          <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            Expense Tracker
          </h3>
          <span className={`ml-3 px-3 py-1 rounded-full text-sm ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
            {filteredExpenses.length} expenses
          </span>
        </div>

        <div className="flex space-x-2 mt-2 sm:mt-0">
          {/* Toggle view mode */}
          <div className={`p-1 rounded-lg flex ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-white text-gray-800 shadow-sm' : ''}`}
              title="List view"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-white text-gray-800 shadow-sm' : ''}`}
              title="Grid view"
            >
              <Grid size={16} />
            </button>
          </div>

          {/* Time filters - Updated to match Spending Analytics style */}
          <div className="time-toggle flex">
            <button 
              className={`px-2.5 py-1 text-xs font-medium rounded-l-lg border ${
                timeFilter === 'week' 
                  ? theme === 'dark' 
                    ? 'bg-purple-600 text-white border-purple-500' 
                    : 'bg-lime-600 text-white border-lime-500' 
                  : theme === 'dark' 
                    ? 'border-gray-600 text-gray-300' 
                    : 'border-gray-300 text-gray-600'
              } transition-colors`}
              onClick={() => setTimeFilter('week')}
            >
              Weekly
            </button>
            <button 
              className={`px-2.5 py-1 text-xs font-medium border ${
                timeFilter === 'month' 
                  ? theme === 'dark' 
                    ? 'bg-purple-600 text-white border-purple-500' 
                    : 'bg-lime-600 text-white border-lime-500' 
                  : theme === 'dark' 
                    ? 'border-gray-600 text-gray-300' 
                    : 'border-gray-300 text-gray-600'
              } transition-colors`}
              onClick={() => setTimeFilter('month')}
            >
              Monthly
            </button>
            <button 
              className={`px-2.5 py-1 text-xs font-medium rounded-r-lg border ${
                timeFilter === 'all' 
                  ? theme === 'dark' 
                    ? 'bg-purple-600 text-white border-purple-500' 
                    : 'bg-lime-600 text-white border-lime-500' 
                  : theme === 'dark' 
                    ? 'border-gray-600 text-gray-300' 
                    : 'border-gray-300 text-gray-600'
              } transition-colors`}
              onClick={() => setTimeFilter('all')}
            >
              All Time
            </button>
          </div>
          
          {/* Updated Add expense button to match UpcomingPayments style */}
          <button 
            onClick={onAddExpense}
            className="ml-auto px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm transition-colors duration-200 flex items-center"
            title="Add new expense"
          >
            <Plus size={16} className="mr-1" />
            <span className="text-sm">Add Expense</span>
          </button>
        </div>
      </div>

      {/* Summary card - Updated styling to match UpcomingPayments */}
      <div className={`mb-6 p-4 rounded-[15px] ${theme === 'dark' ? 'bg-gray-700' : 'bg-white border border-gray-100'} shadow-sm`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Total ({timeFilter === 'week' ? 'This Week' : timeFilter === 'month' ? 'This Month' : 'All Time'})
            </p>
            <p className="text-2xl font-bold mt-1">
              {formatCurrency(totalAmount)}
            </p>
          </div>
          <div className={`p-3 rounded-full ${theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-blue-600'}`}>
            <Calendar size={20} />
          </div>
        </div>
      </div>

      {/* Expenses list or grid - added padding for spacing from scrollbar */}
      <div className="flex-grow overflow-y-auto pr-2">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className={`p-4 rounded-lg text-center ${theme === 'dark' ? 'bg-red-900/20 text-red-200' : 'bg-red-50 text-red-700'}`}>
            {error}
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className={`p-5 rounded-xl shadow-sm mb-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <AlertCircle className="h-10 w-10 mx-auto mb-3 text-gray-400" />
              <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>No expenses found</p>
              <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {timeFilter !== 'all' ? 'Try changing the time filter or add new expenses' : 'Add your first expense to get started'}
              </p>
            </div>
            <button
              onClick={onAddExpense}
              className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm transition-colors duration-200 font-medium"
            >
              Add Expense
            </button>
          </div>
        ) : viewMode === 'list' ? (
          // List view
          <div className="space-y-4">
            {sortedDates.map((date) => {
              const formattedDate = format(new Date(date), 'EEEE, MMMM d, yyyy');
              
              return (
                <div key={date} className="pb-2">
                  <div className="flex items-center mb-2">
                    <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formattedDate}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    {groupedExpenses[date].map((expense) => (
                      <div 
                        key={expense.id} 
                        className={`flex justify-between items-center p-3 rounded-[15px] ${
                          theme === 'dark' ? 'bg-gray-700 hover:bg-gray-700/80' : 'bg-white hover:bg-gray-50 border border-gray-100'
                        } shadow-sm transition-colors duration-200`}
                      >
                        <div className="flex items-center space-x-3">
                          <div 
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              theme === 'dark' ? 'bg-gray-600' : 'bg-gray-100'
                            }`}
                            style={{ backgroundColor: expense.category?.color + '20' }}
                          >
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: expense.category?.color }}
                            ></div>
                          </div>
                          <div>
                            <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                              {expense.description}
                            </p>
                            <div className="flex items-center space-x-2 text-xs">
                              <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                {expense.category?.name || 'Uncategorized'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                            {formatCurrency(expense.amount)}
                          </span>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => onEditExpense(expense)}
                              className={`p-1.5 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
                              title="Edit expense"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(expense.id)}
                              disabled={deletingExpenseId === expense.id}
                              className={`p-1.5 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-400 hover:text-red-300' : 'hover:bg-gray-100 text-gray-500 hover:text-red-500'} disabled:opacity-50`}
                              title="Delete expense"
                            >
                              {deletingExpenseId === expense.id ? (
                                <span className="animate-pulse">...</span>
                              ) : (
                                <Trash2 size={14} />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Grid view - Updated styling to match UpcomingPayments
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredExpenses.map((expense) => (
              <div
                key={expense.id}
                className={`p-4 rounded-[15px] ${
                  theme === 'dark' ? 'bg-gray-700 hover:bg-gray-700/80' : 'bg-white hover:bg-gray-50 border border-gray-100'
                } shadow-sm transition-colors duration-200`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div 
                    className={`px-2 py-1 rounded text-xs ${
                      theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {format(new Date(expense.date), 'MMM d, yyyy')}
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => onEditExpense(expense)}
                      className={`p-1.5 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
                      title="Edit expense"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      disabled={deletingExpenseId === expense.id}
                      className={`p-1.5 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-400 hover:text-red-300' : 'hover:bg-gray-100 text-gray-500 hover:text-red-500'} disabled:opacity-50`}
                      title="Delete expense"
                    >
                      {deletingExpenseId === expense.id ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                </div>
                <h4 className={`font-medium mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                  {expense.description}
                </h4>
                <div className="flex items-center mb-3">
                  <div 
                    className="w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: expense.category?.color }}
                  ></div>
                  <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {expense.category?.name || 'Uncategorized'}
                  </span>
                </div>
                <div className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                  {formatCurrency(expense.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}