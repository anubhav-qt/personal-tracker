import React, { useState, useEffect } from 'react';
import { Calendar, List, Grid, Plus, AlertCircle, ChevronLeft, ChevronRight, CheckCircle, Clock, Repeat, Edit, Trash2, EyeOff, Eye } from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths, 
  isBefore,
  getDay,
  startOfWeek,
  addDays
} from 'date-fns';
import { UpcomingPayment } from '../types';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

interface UpcomingPaymentsProps {
  userId: string;
  onAddPayment: () => void;
  onEditPayment?: (payment: UpcomingPayment) => void;
}

export function UpcomingPayments({ userId, onAddPayment, onEditPayment }: UpcomingPaymentsProps) {
  const { theme, formatCurrency } = useTheme();
  // Set default view to grid (changed from calendar)
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'calendar'>('grid');
  const [upcomingPayments, setUpcomingPayments] = useState<UpcomingPayment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  const [showCompletedPayments, setShowCompletedPayments] = useState(false);

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

  // Filter payments based on the showCompletedPayments toggle
  const filteredPayments = upcomingPayments.filter(payment => 
    showCompletedPayments ? true : !payment.is_paid
  );

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

  // Function to delete a payment
  const handleDeletePayment = async (paymentId: string) => {
    if (!userId) return;

    setDeletingPaymentId(paymentId);
    
    try {
      const { error } = await supabase
        .from('upcoming_payments')
        .delete()
        .eq('id', paymentId)
        .eq('user_id', userId); // Security check to ensure the payment belongs to the user

      if (error) {
        console.error('Error deleting payment:', error);
        throw new Error(error.message);
      }

      // Optimistic UI update
      setUpcomingPayments(payments => payments.filter(payment => payment.id !== paymentId));
      
    } catch (error: any) {
      console.error('Error deleting payment:', error);
      setError(error.message || 'Failed to delete payment');
    } finally {
      setDeletingPaymentId(null);
    }
  };

  // Function to handle editing a payment
  const handleEditPayment = (payment: UpcomingPayment) => {
    if (onEditPayment) {
      onEditPayment(payment);
    } else {
      console.warn('Edit payment handler not provided');
    }
  };

  // Get days for the calendar view - improved to show proper calendar grid
  const getCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    
    // Calculate days needed to include the whole month plus any days needed to complete the week grid
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const daysBeforeMonth = [];
    const daysAfterMonth = [];

    // Add days from previous month to fill the first week
    const firstDayOfMonth = getDay(monthStart);
    for (let i = 0; i < firstDayOfMonth; i++) {
      daysBeforeMonth.unshift(addDays(startDate, i));
    }

    // Add days from next month to complete the grid
    const lastWeekRemainder = (daysInMonth.length + daysBeforeMonth.length) % 7;
    if (lastWeekRemainder > 0) {
      const daysToAdd = 7 - lastWeekRemainder;
      for (let i = 1; i <= daysToAdd; i++) {
        daysAfterMonth.push(addDays(monthEnd, i));
      }
    }

    return [...daysBeforeMonth.reverse(), ...daysInMonth, ...daysAfterMonth];
  };

  const calendarDays = getCalendarDays();

  // Navigate between months
  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // Get payments for a specific day
  const getPaymentsForDay = (day: Date) => {
    return filteredPayments.filter(payment => 
      isSameDay(new Date(payment.due_date), day)
    );
  };

  // Group payments by date for list view
  const groupedPayments = filteredPayments.reduce((acc, payment) => {
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

  // Function to determine if a date is from the current month
  const isCurrentMonthDay = (day: Date) => {
    return day.getMonth() === currentMonth.getMonth();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with filters and controls */}
      <div className="flex flex-wrap justify-between items-center mb-4">
        <div className="flex space-x-1 mb-2 sm:mb-0">
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
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-1.5 rounded ${viewMode === 'calendar' ? theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-white text-gray-800 shadow-sm' : ''}`}
              title="Calendar view"
            >
              <Calendar size={16} />
            </button>
          </div>
          
          {/* Toggle for completed payments */}
          <button
            onClick={() => setShowCompletedPayments(!showCompletedPayments)}
            className={`p-1.5 rounded flex items-center ${
              theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-white'
            } transition-colors`}
            title={showCompletedPayments ? "Hide completed payments" : "Show completed payments"}
          >
            {showCompletedPayments ? (
              <>
                <EyeOff size={16} className="mr-1" />
                <span className="text-xs hidden sm:inline">Hide Completed</span>
              </>
            ) : (
              <>
                <Eye size={16} className="mr-1" />
                <span className="text-xs hidden sm:inline">Show Completed</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center">
          <span className={`px-3 py-1 rounded-full text-sm ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
            {filteredPayments.length} payments
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-lime-600 dark:border-gray-400"></div>
        </div>
      ) : error ? (
        <div className={`p-4 rounded-lg text-center ${theme === 'dark' ? 'bg-red-900/20 text-red-200' : 'bg-red-50 text-red-700'}`}>
          {error}
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 p-6 text-center">
          <div className={`p-5 rounded-xl shadow-sm mb-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <AlertCircle className="h-10 w-10 mx-auto mb-3 text-gray-400" />
            <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              {upcomingPayments.length === 0 ? "No upcoming payments found" : "No payments to display"}
            </p>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              {upcomingPayments.length === 0 
                ? "Add payments to track your expenses" 
                : showCompletedPayments 
                  ? "Try adding new payments" 
                  : "Try showing completed payments"}
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onAddPayment}
              className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm transition-colors duration-200 font-medium"
            >
              Add Payment
            </button>
            {!showCompletedPayments && upcomingPayments.length > 0 && filteredPayments.length === 0 && (
              <button
                onClick={() => setShowCompletedPayments(true)}
                className="mt-4 px-5 py-2.5 rounded-xl bg-gray-500 hover:bg-gray-600 text-white shadow-sm transition-colors duration-200 font-medium"
              >
                Show Completed
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'list' ? (
        <div className="flex-1 overflow-y-auto">
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
                <div key={date} className="pb-2">
                  <div className="flex items-center mb-2">
                    <p className={`text-xs ${dateLabelClass}`}>
                      {isToday ? 'Today - ' : ''}{formattedDate}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    {groupedPayments[date].map((payment) => {
                      const overdueStatus = isOverdue(payment.due_date, payment.is_paid);
                      
                      return (
                        <div 
                          key={payment.id} 
                          className={`flex justify-between items-center p-3 rounded-[15px] ${
                            payment.is_paid
                              ? theme === 'dark' ? 'bg-gray-700/30' : 'bg-zinc-100/90'
                              : overdueStatus
                                ? theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'
                                : theme === 'dark' ? 'bg-gray-700/50' : 'bg-white/80 border border-gray-100'
                          } shadow-sm`}
                        >
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => togglePaymentStatus(payment.id, payment.is_paid)}
                              disabled={updatingPaymentId === payment.id}
                              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
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
                                <CheckCircle size={16} />
                              ) : (
                                <Clock size={16} />
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
                                {payment.category && (
                                  <div 
                                    className="w-2 h-2 rounded-full" 
                                    style={{ backgroundColor: payment.category?.color }}
                                  ></div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className={`font-medium mr-4 ${
                              payment.is_paid
                                ? theme === 'dark' ? 'text-gray-400' : 'text-zinc-500'
                                : theme === 'dark' ? 'text-white' : 'text-zinc-800'
                            }`}>
                              {formatCurrency(payment.amount)}
                            </span>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleEditPayment(payment)}
                                className={`p-1.5 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
                                title="Edit payment"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDeletePayment(payment.id)}
                                disabled={deletingPaymentId === payment.id}
                                className={`p-1.5 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-400 hover:text-red-300' : 'hover:bg-gray-100 text-gray-500 hover:text-red-500'} disabled:opacity-50`}
                                title="Delete payment"
                              >
                                {deletingPaymentId === payment.id ? (
                                  <span className="animate-pulse">...</span>
                                ) : (
                                  <Trash2 size={14} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="flex-1 overflow-y-auto">
          {/* Updated grid to match the same layout as the Expense Tracker component */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredPayments.map((payment) => {
              const overdueStatus = isOverdue(payment.due_date, payment.is_paid);
              const formattedDate = format(new Date(payment.due_date), 'MMM d, yyyy');
              
              return (
                <div
                  key={payment.id}
                  className={`p-4 rounded-[15px] ${
                    payment.is_paid
                      ? theme === 'dark' ? 'bg-gray-700/30' : 'bg-zinc-100/90'
                      : overdueStatus
                        ? theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'
                        : theme === 'dark' ? 'bg-gray-700/50' : 'bg-white/80 border border-gray-100'
                  } shadow-sm`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div 
                      className={`px-2 py-1 rounded text-xs ${
                        payment.is_paid
                          ? theme === 'dark' ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'
                          : overdueStatus
                            ? theme === 'dark' ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'
                            : theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {formattedDate}
                    </div>
                    
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEditPayment(payment)}
                        className={`p-1.5 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
                        title="Edit payment"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeletePayment(payment.id)}
                        disabled={deletingPaymentId === payment.id}
                        className={`p-1.5 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-400 hover:text-red-300' : 'hover:bg-gray-100 text-gray-500 hover:text-red-500'} disabled:opacity-50`}
                        title="Delete payment"
                      >
                        {deletingPaymentId === payment.id ? (
                          <span className="animate-pulse">...</span>
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className={`font-medium mb-1 flex items-center ${
                        payment.is_paid
                          ? theme === 'dark' ? 'text-gray-400' : 'text-zinc-500'
                          : theme === 'dark' ? 'text-white' : 'text-zinc-800'
                      }`}>
                        {payment.title}
                        {payment.is_recurring && (
                          <span className={`ml-2 p-0.5 rounded ${
                            theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-white text-zinc-700'
                          } shadow-sm`}>
                            <Repeat size={10} />
                          </span>
                        )}
                      </h4>
                      
                      <div className="flex items-center mb-3">
                        {payment.category && (
                          <div 
                            className="w-2 h-2 rounded-full mr-2"
                            style={{ backgroundColor: payment.category?.color }}
                          ></div>
                        )}
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-zinc-500'}`}>
                          {payment.category?.name || 'Uncategorized'}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => togglePaymentStatus(payment.id, payment.is_paid)}
                      disabled={updatingPaymentId === payment.id}
                      className={`p-1.5 rounded-full ${
                        payment.is_paid
                          ? theme === 'dark' ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-700'
                          : overdueStatus
                            ? theme === 'dark' ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-700'
                            : theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-white text-zinc-600'
                      } shadow-sm`}
                    >
                      {updatingPaymentId === payment.id ? (
                        <span className="animate-pulse">...</span>
                      ) : payment.is_paid ? (
                        <CheckCircle size={14} />
                      ) : (
                        <Clock size={14} />
                      )}
                    </button>
                  </div>
                  
                  <div className={`text-lg font-bold ${
                    payment.is_paid
                      ? theme === 'dark' ? 'text-gray-400' : 'text-zinc-500'
                      : theme === 'dark' ? 'text-white' : 'text-zinc-800'
                  }`}>
                    {formatCurrency(payment.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // Calendar View - Improved to display proper calendar grid
        <div className="flex-1 overflow-y-auto">
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
            
            {calendarDays.map(day => {
              const dayPayments = getPaymentsForDay(day);
              const hasPayments = dayPayments.length > 0;
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isCurrentMonthDay(day);
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
                        : !isCurrentMonth
                          ? theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100/30'
                          : ''
                  }`}
                >
                  <div className={`text-right text-xs p-1 ${
                    isToday 
                      ? theme === 'dark' ? 'text-blue-400 font-bold' : 'text-blue-600 font-bold'
                      : !isCurrentMonth
                        ? theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
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
                            } truncate group relative`}
                            title={`${payment.title} - ${formatCurrency(payment.amount)}${payment.is_recurring ? ' (Recurring)' : ''}${payment.is_paid ? ' (Paid)' : ''}`}
                          >
                            <div className="flex items-center space-x-1 truncate">
                              {payment.is_recurring && (
                                <span className="mr-1">
                                  <Repeat size={10} />
                                </span>
                              )}
                              <span className="truncate">{payment.title}</span>
                            </div>
                            <span className="ml-1 font-medium shrink-0">{formatCurrency(payment.amount)}</span>
                            
                            {/* Hover controls for edit/delete */}
                            <div className="absolute right-0 top-0 h-full hidden group-hover:flex items-center bg-gradient-to-l from-inherit via-inherit pr-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditPayment(payment);
                                }}
                                className={`p-1 rounded-full ${theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-white text-gray-600'} mr-1`}
                                title="Edit payment"
                              >
                                <Edit size={10} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePayment(payment.id);
                                }}
                                disabled={deletingPaymentId === payment.id}
                                className={`p-1 rounded-full ${theme === 'dark' ? 'bg-gray-600 text-red-300' : 'bg-white text-red-500'}`}
                                title="Delete payment"
                              >
                                {deletingPaymentId === payment.id ? (
                                  <span className="animate-pulse">...</span>
                                ) : (
                                  <Trash2 size={10} />
                                )}
                              </button>
                            </div>
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
