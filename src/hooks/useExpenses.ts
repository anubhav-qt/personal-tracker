import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Expense } from '../types';

export function useExpenses(userId: string | undefined) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
  const channelRef = useRef<any>(null);
  const initialLoadComplete = useRef(false);

  const fetchExpenses = useCallback(async () => {
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

      if (error) throw error;
      console.log('Expenses fetched successfully:', data?.length || 0, 'records');
      
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
      
      // Important: create a new array reference to ensure React detects the change
      setExpenses(processedData);
      setLastRefreshTime(new Date());
      initialLoadComplete.current = true;
    } catch (err: any) {
      console.error('Error fetching expenses:', err);
      setError(err.message || 'Failed to fetch expenses');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Setup real-time subscriptions
  useEffect(() => {
    if (!userId) return;
    
    // Clean up any existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    const setupRealtimeSubscription = async () => {
      try {
        console.log('Setting up real-time subscription for expenses...');
        
        // First load the initial data
        await fetchExpenses();
        
        // Generate a unique channel name to avoid conflicts
        const channelName = `expenses-${userId}-${Date.now()}`;
        console.log(`Creating channel: ${channelName}`);
        
        // Then set up the realtime subscription
        const channel = supabase
          .channel(channelName)
          .on('postgres_changes', {
            event: 'INSERT', 
            schema: 'public',
            table: 'expenses',
            filter: `user_id=eq.${userId}`
          }, (payload) => {
            console.log('INSERT event received:', payload);
            fetchExpenses();
          })
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'expenses',
            filter: `user_id=eq.${userId}`
          }, (payload) => {
            console.log('UPDATE event received:', payload);
            fetchExpenses();
          })
          .on('postgres_changes', {
            event: 'DELETE',
            schema: 'public',
            table: 'expenses'
          }, (payload) => {
            console.log('DELETE event received:', payload);
            fetchExpenses();
          });
        
        const status = await channel.subscribe((status) => {
          console.log(`Subscription status: ${status}`);
          if (status !== 'SUBSCRIBED') {
            console.error('Failed to subscribe to realtime changes');
          }
        });
        
        channelRef.current = channel;
        console.log('Channel subscribed with status:', status);
      } catch (error) {
        console.error('Error in realtime subscription setup:', error);
      }
    };
    
    setupRealtimeSubscription();
    
    return () => {
      console.log('Cleaning up expenses subscription');
      if (channelRef.current) {
        console.log('Removing channel:', channelRef.current);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, fetchExpenses]);

  const addExpense = async (expenseData: Omit<Expense, 'id' | 'category'>) => {
    try {
      console.log('Adding new expense:', expenseData);
      const { data, error } = await supabase
        .from('expenses')
        .insert([{ ...expenseData, user_id: userId }])
        .select(`
          *,
          category:categories(id, name, color)
        `);

      if (error) throw error;
      
      console.log('Expense added successfully, updating local state');
      
      // Optimistically update the UI before real-time kicks in
      if (data && data.length > 0) {
        const newExpense = data[0] as Expense;
        setExpenses(prev => [newExpense, ...prev]);
      }
      
      // Also refresh from server to ensure consistency
      setLastRefreshTime(new Date());
      fetchExpenses();
      
      return { success: true, data };
    } catch (err: any) {
      console.error('Error adding expense:', err);
      return { success: false, error: err.message };
    }
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    try {
      console.log('Updating expense:', id, updates);
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          category:categories(id, name, color)
        `);

      if (error) throw error;
      
      console.log('Expense updated successfully, updating local state');
      
      // Optimistically update the UI
      if (data && data.length > 0) {
        const updatedExpense = data[0] as Expense;
        setExpenses(prev => 
          prev.map(exp => exp.id === id ? updatedExpense : exp)
        );
      }
      
      // Also refresh from server to ensure consistency
      setLastRefreshTime(new Date());
      fetchExpenses();
      
      return { success: true, data };
    } catch (err: any) {
      console.error('Error updating expense:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      console.log('Deleting expense:', id);
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      console.log('Expense deleted successfully, updating local state');
      
      // Optimistically update the UI
      setExpenses(prev => prev.filter(exp => exp.id !== id));
      
      // Also refresh from server to ensure consistency
      setLastRefreshTime(new Date());
      fetchExpenses();
      
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting expense:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    expenses,
    isLoading,
    error,
    fetchExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    lastRefreshTime
  };
}
