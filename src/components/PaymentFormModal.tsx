import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Clock, Repeat } from 'lucide-react';
import { Category, UpcomingPayment } from '../types';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

interface PaymentFormModalProps {
  userId: string;
  categories: Category[];
  editingPayment: UpcomingPayment | null;
  onClose: () => void;
}

export function PaymentFormModal({ 
  userId, 
  categories, 
  editingPayment, 
  onClose 
}: PaymentFormModalProps) {
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form when editing a payment
  useEffect(() => {
    if (editingPayment) {
      setTitle(editingPayment.title);
      setAmount(editingPayment.amount.toString());
      setDueDate(editingPayment.due_date);
      setCategoryId(editingPayment.category_id || '');
      setIsRecurring(editingPayment.is_recurring);
      setIsPaid(editingPayment.is_paid);
    } else {
      // Reset form for new payment
      setTitle('');
      setAmount('');
      setDueDate(new Date().toISOString().split('T')[0]);
      setCategoryId('');
      setIsRecurring(false);
      setIsPaid(false);
    }
  }, [editingPayment]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const paymentData = {
        title,
        amount: parseFloat(amount),
        due_date: dueDate,
        category_id: categoryId || null,
        is_recurring: isRecurring,
        is_paid: isPaid,
        user_id: userId, // Make sure user_id is explicitly set
        updated_at: new Date().toISOString(),
        created_at: editingPayment ? undefined : new Date().toISOString() // Set created_at for new records only
      };

      console.log('Saving payment with data:', paymentData);

      if (editingPayment) {
        // Update existing payment
        const { error } = await supabase
          .from('upcoming_payments')
          .update(paymentData)
          .eq('id', editingPayment.id)
          .eq('user_id', userId); // Add user_id check for additional security

        if (error) {
          console.error('Supabase error updating payment:', error);
          throw error;
        }
      } else {
        // Create new payment
        const { error } = await supabase
          .from('upcoming_payments')
          .insert(paymentData);

        if (error) {
          console.error('Supabase error creating payment:', error);
          throw error;
        }
      }

      onClose();
    } catch (error: any) {
      console.error('Error saving payment:', error);
      if (error.message.includes('row-level security')) {
        setError('Permission denied: You may not have access to modify this data due to security settings.');
      } else {
        setError(error.message || 'An error occurred while saving the payment');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        ></div>

        {/* Modal Container */}
        <div className="inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} px-4 pt-5 pb-4 sm:p-6 sm:pb-4 relative`}>
            <button
              onClick={onClose}
              className={`absolute top-4 right-4 ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <X size={24} />
            </button>
            
            <div className="sm:flex sm:items-start mb-4">
              <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${
                theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'
              } sm:mx-0 sm:h-10 sm:w-10`}>
                <Clock size={20} />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className={`text-lg leading-6 font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {editingPayment ? 'Edit Payment' : 'Add Upcoming Payment'}
                </h3>
                <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {editingPayment 
                    ? 'Update the details of your upcoming payment.' 
                    : 'Add a new payment to keep track of your upcoming expenses.'}
                </p>
              </div>
            </div>
            
            {error && (
              <div className={`mb-4 p-3 rounded ${theme === 'dark' ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-700'} text-sm`}>
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`block w-full rounded-md shadow-sm ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'border-gray-300 text-gray-900'
                  } focus:border-blue-500 focus:ring-blue-500`}
                  required
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Amount
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`block w-full rounded-md shadow-sm ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'border-gray-300 text-gray-900'
                  } focus:border-blue-500 focus:ring-blue-500`}
                  required
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={`block w-full rounded-md shadow-sm ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'border-gray-300 text-gray-900'
                  } focus:border-blue-500 focus:ring-blue-500`}
                  required
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className={`block w-full rounded-md shadow-sm ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'border-gray-300 text-gray-900'
                  } focus:border-blue-500 focus:ring-blue-500`}
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex space-x-6">
                <div className="flex items-center">
                  <input
                    id="is-recurring"
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className={`h-4 w-4 rounded ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-blue-600' 
                        : 'border-gray-300 text-blue-600'
                    } focus:ring-blue-500`}
                  />
                  <label htmlFor="is-recurring" className={`ml-2 block text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Recurring Payment
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="is-paid"
                    type="checkbox"
                    checked={isPaid}
                    onChange={(e) => setIsPaid(e.target.checked)}
                    className={`h-4 w-4 rounded ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-blue-600' 
                        : 'border-gray-300 text-blue-600'
                    } focus:ring-blue-500`}
                  />
                  <label htmlFor="is-paid" className={`ml-2 block text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Already Paid
                  </label>
                </div>
              </div>
              
              <div className="pt-4 mt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 ${
                    theme === 'dark' 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  } text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm disabled:opacity-50`}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : editingPayment ? (
                    <span className="flex items-center">
                      <Save className="mr-2 h-4 w-4" />
                      Update Payment
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Payment
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
