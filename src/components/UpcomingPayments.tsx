import React, { useState, useEffect } from 'react';
import { Calendar, List, Plus, AlertCircle, ChevronLeft, ChevronRight, CheckCircle, Clock, Repeat } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isBefore } from 'date-fns';
import { UpcomingPayment } from '../types';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

interface UpcomingPaymentsProps {
  userId: string;
  onAddPayment: () => void;
}

export function UpcomingPayments({ userId, onAddPayment }: UpcomingPaymentsProps) {
  const { theme, formatCurrency } = useTheme();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [upcomingPayments, setUpcomingPayments] = useState<UpcomingPayment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);

  // Fetch upcoming payments
  useEffect(() => {
    const fetchUpcomingPayments = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Fetching upcoming payments for user:', userId);
        
        // First verify that the table exists and you have permissions
        const { count, error: verifyError } = await supabase
          .from('upcoming_payments')
          .select('*', { count: 'exact', head: true });
        
        if (verifyError) {
          console.error('Error verifying upcoming_payments table:', verifyError);
          if (verifyError.message.includes('does not exist')) {
            throw new Error('The upcoming_payments table does not exist in the database. Please create it first.');
          }
          if (verifyError.message.includes('row-level security')) {
            throw new Error('You do not have permission to access the upcoming payments data.');
          }
          throw verifyError;
        }
        
        console.log('Table verification successful. Count:', count);
        
        const { data, error } = await supabase
          .from('upcoming_payments')
          .select(`
            *,
            category:categories(id, name, color)
          `)
          .eq('user_id', userId)
          .order('due_date', { ascending: true });

        if (error) {
          console.error('Supabase error fetching payments:', error);
          throw error;
        }
        
        console.log('Upcoming payments fetched:', data?.length || 0, 'records');
        
        // Process data to ensure all properties are valid
        const processedData = (data || []).map(payment => {
          // If category is null, provide a default
          if (!payment.category) {
            payment.category = {
              id: null,
              name: 'Uncategorized',
              color: '#cccccc'
            };
          }
          return payment;
        });
        
        setUpcomingPayments(processedData);
      } catch (error: any) {
        console.error('Error fetching upcoming payments:', error);
        setError(error.message || 'Failed to fetch upcoming payments. Check console for details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUpcomingPayments();

    // Set up real-time subscription for upcoming payments
    const channel = supabase
      .channel('upcoming-payments-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'upcoming_payments',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        console.log('Real-time update for upcoming payments:', payload);
        fetchUpcomingPayments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Function to mark a payment as paid/unpaid
  const togglePaymentStatus = async (paymentId: string, currentStatus: boolean) => {
    setUpdatingPaymentId(paymentId);
    
    try {
      console.log('Toggling payment status for:', paymentId, 'Current status:', currentStatus);
      const { error } = await supabase
        .from('upcoming_payments')
        .update({ 
          is_paid: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .eq('user_id', userId); // Add user_id check for additional security

      if (error) {
        console.error('Supabase error toggling payment status:', error);
        throw error;
      }
      
      // Update local state for immediate UI update
      setUpcomingPayments(payments => 
        payments.map(payment => 
          payment.id === paymentId 
            ? { ...payment, is_paid: !currentStatus } 
            : payment
        )
      );
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      if (error.message && error.message.includes('row-level security')) {
        setError('Permission denied: You may not have access to modify this data due to security settings.');
      } else {
        setError(error.message || 'An error occurred while updating the payment');
      }
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  // Get days for the calendar view
  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const daysInMonth = getDaysInMonth();

  // Navigate between months
  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // Get payments for a specific day
  const getPaymentsForDay = (day: Date) => {
    return upcomingPayments.filter(payment => 
      isSameDay(new Date(payment.due_date), day)
    );
  };

  // Group payments by date for list view
  const groupedPayments = upcomingPayments.reduce((acc, payment) => {
    const date = payment.due_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(payment);
    return acc;
  }, {} as Record<string, UpcomingPayment[]>);

  // Sort dates for the list view
  const sortedDates = Object.keys(groupedPayments).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );

  // Function to determine if a payment is overdue
  const isOverdue = (dueDate: string, isPaid: boolean) => {
    if (isPaid) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return isBefore(new Date(dueDate), today);
  };

  return (
    <div className="h-full">
      {isLoading ? (
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-lime-600 dark:border-gray-400"></div>
        </div>
      ) : viewMode === 'list' ? (
        <div className="h-full">
          {sortedDates.length > 0 ? (
            <div className="space-y-4">
              {sortedDates.map((date) => {
                // Format date for display
                const formattedDate = format(new Date(date), 'EEEE, MMMM d, yyyy');
                const isToday = isSameDay(new Date(date), new Date());
                const isPast = isBefore(new Date(date), new Date()) && !isToday;
                
                // Determine date label styling
                const dateLabelClass = isToday 
                  ? theme === 'dark' ? 'text-lime-500 font-semibold' : 'text-lime-700 font-semibold'
                  : isPast
                    ? theme === 'dark' ? 'text-red-400' : 'text-red-600'
                    : theme === 'dark' ? 'text-gray-400' : 'text-zinc-500';
                
                return (
                  <div key={date} className="pb-3">
                    <div className="flex items-center mb-2">
                      <p className={`text-sm ${dateLabelClass}`}>
                        {isToday ? 'Today - ' : ''}{formattedDate}
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      {groupedPayments[date].map((payment) => {
                        const overdueStatus = isOverdue(payment.due_date, payment.is_paid);
                        
                        return (
                          <div 
                            key={payment.id} 
                            className={`flex justify-between items-center p-3.5 rounded-xl ${
                              payment.is_paid
                                ? theme === 'dark' ? 'bg-gray-700/50' : 'bg-zinc-100/90'
                                : overdueStatus
                                  ? theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'
                                  : theme === 'dark' ? 'bg-gray-700' : 'bg-zinc-50'
                            } shadow-sm`}
                          >
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => togglePaymentStatus(payment.id, payment.is_paid)}
                                disabled={updatingPaymentId === payment.id}
                                className={`w-7 h-7 rounded-full flex items-center justify-center shadow-sm ${
                                  payment.is_paid
                                    ? theme === 'dark' ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-700'
                                    : overdueStatus
                                      ? theme === 'dark' ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-700'
                                      : theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-white text-zinc-600'
                                }`}
                              >
                                {updatingPaymentId === payment.id ? (
                                  <span className="animate-pulse">...</span>
                                ) : payment.is_paid ? (
                                  <CheckCircle size={14} />
                                ) : (
                                  <Clock size={14} />
                                )}
                              </button>
                              <div>
                                <div className="flex items-center">
                                  <p className={`font-medium ${
                                    payment.is_paid
                                      ? theme === 'dark' ? 'text-gray-400' : 'text-zinc-500'
                                      : theme === 'dark' ? 'text-white' : 'text-zinc-800'
                                  }`}>
                                    {payment.title}
                                  </p>
                                  {payment.is_recurring && (
                                    <span className={`ml-2 p-1 rounded ${
                                      theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-white text-zinc-700'
                                    } shadow-sm`}>
                                      <Repeat size={10} />
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2 text-xs">
                                  <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-zinc-500'}`}>
                                    {payment.category?.name || 'Uncategorized'}
                                  </span>
                                  <div 
                                    className="w-2 h-2 rounded-full" 
                                    style={{ backgroundColor: payment.category?.color }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                            <span className={`font-medium ${
                              payment.is_paid
                                ? theme === 'dark' ? 'text-gray-400' : 'text-zinc-500'
                                : theme === 'dark' ? 'text-white' : 'text-zinc-800'
                            }`}>
                              {formatCurrency(payment.amount)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="bg-zinc-50 dark:bg-gray-700 p-5 rounded-xl shadow-sm mb-4">
                <AlertCircle className="h-10 w-10 mx-auto mb-3 text-zinc-400 dark:text-gray-400" />
                <p className="text-zinc-800 dark:text-white font-medium">No upcoming payments found</p>
                <p className="text-sm mt-1 text-zinc-500 dark:text-gray-400">Add payments to track your expenses</p>
              </div>
              <button
                onClick={onAddPayment}
                className={`mt-4 px-5 py-2.5 rounded-xl ${theme === 'dark' ? 'bg-lime-600 hover:bg-lime-700' : 'bg-lime-600 hover:bg-lime-700'} text-white shadow-sm transition-colors duration-200 font-medium`}
              >
                Add Payment
              </button>
            </div>
          )}
        </div>
      ) : (
        // Calendar View - Same structure but updated styles
        <div className="overflow-y-auto flex-grow scrollbar-thin p-4">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={goToPreviousMonth}
              className={`p-1 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <ChevronLeft size={20} className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
            </button>
            <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <button 
              onClick={goToNextMonth}
              className={`p-1 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <ChevronRight size={20} className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className={`text-center text-xs font-medium p-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {day}
              </div>
            ))}
            
            {daysInMonth.map(day => {
              const dayPayments = getPaymentsForDay(day);
              const hasPayments = dayPayments.length > 0;
              const isToday = isSameDay(day, new Date());
              const hasOverduePayments = dayPayments.some(payment => 
                isOverdue(payment.due_date, payment.is_paid)
              );
              
              return (
                <div 
                  key={day.toString()} 
                  className={`min-h-[70px] p-1 border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-md ${
                    isToday 
                      ? theme === 'dark' ? 'bg-blue-900/20 border-blue-500' : 'bg-blue-50 border-blue-200' 
                      : hasOverduePayments && !isToday
                        ? theme === 'dark' ? 'bg-red-900/10 border-red-700/30' : 'bg-red-50/50 border-red-200/50'
                        : ''
                  }`}
                >
                  <div className={`text-right text-xs p-1 ${
                    isToday 
                      ? theme === 'dark' ? 'text-blue-400 font-bold' : 'text-blue-600 font-bold'
                      : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  
                  {hasPayments && (
                    <div className="mt-1 overflow-y-auto max-h-[40px]">
                      {dayPayments.map(payment => {
                        const overdueStatus = isOverdue(payment.due_date, payment.is_paid);
                        
                        return (
                          <div 
                            key={payment.id} 
                            className={`text-xs p-1 mb-1 rounded flex items-center justify-between ${
                              payment.is_paid
                                ? theme === 'dark' ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-100/70 text-gray-500'
                                : overdueStatus
                                  ? theme === 'dark' ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-700'
                                  : theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700'
                            } truncate`}
                            title={`${payment.title} - ${formatCurrency(payment.amount)}${payment.is_recurring ? ' (Recurring)' : ''}${payment.is_paid ? ' (Paid)' : ''}`}
                          >
                            <div className="flex items-center space-x-1 truncate">
                              {payment.is_recurring && (
                                <span className="mr-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                    <path d="M3 3v5h5" />
                                  </svg>
                                </span>
                              )}
                              <span className="truncate">{payment.title}</span>
                            </div>
                            <span className="ml-1 font-medium shrink-0">{formatCurrency(payment.amount)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
