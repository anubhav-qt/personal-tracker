import React, { useState, useEffect } from 'react';
import { Category, UpcomingPayment } from '../types';
import { useTheme } from '../context/ThemeContext';
import { X, PlusCircle, Save, Clock, Repeat } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UpcomingPaymentFormModalProps {
  categories: Category[];
  editingPayment: UpcomingPayment | null;
  setEditingPayment: (payment: UpcomingPayment | null) => void;
  userId: string;
  onClose: () => void;
}

export const UpcomingPaymentFormModal = ({ 
  categories, 
  editingPayment, 
  setEditingPayment,
  userId,
  onClose
}: UpcomingPaymentFormModalProps) => {
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form when editing a payment or reset when not editing
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

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setDueDate(new Date().toISOString().split('T')[0]);
    setCategoryId('');
    setIsRecurring(false);
    setIsPaid(false);
    setError(null);
    setEditingPayment(null);
  };

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
        user_id: userId,
        updated_at: new Date().toISOString(),
        created_at: editingPayment ? undefined : new Date().toISOString() // Set created_at for new records only
      };

      if (editingPayment) {
        // Update existing payment
        const { error } = await supabase
          .from('upcoming_payments')
          .update(paymentData)
          .eq('id', editingPayment.id)
          .eq('user_id', userId); // Add user_id check for additional security

        if (error) {
          throw new Error(error.message || 'Failed to update payment');
        }
      } else {
        // Create new payment
        const { error } = await supabase
          .from('upcoming_payments')
          .insert(paymentData);

        if (error) {
          throw new Error(error.message || 'Failed to add payment');
        }
      }

      // Clear form and close modal
      resetForm();
      onClose();
      
    } catch (error: any) {
      console.error('Error saving payment:', error);
      setError(error.message || 'An error occurred while saving the payment');
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        ></div>

        {/* Centered Modal Container */}
        <div className="inline-block w-full max-w-lg rounded-2xl text-left overflow-hidden shadow-xl transform transition-all my-8 align-middle">
          <div className={`${theme === 'dark' ? 'bg-[#26242e]' : 'bg-white'} px-6 pt-6 pb-6 sm:p-6 relative`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {editingPayment ? 'Edit Payment' : 'Add New Payment'}
              </h2>
              <button
                onClick={onClose}
                className={`${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-zinc-500 hover:text-zinc-700'}`}
              >
                <X size={20} />
              </button>
            </div>
            
            {error && (
              <div className={`mb-4 ${theme === 'dark' ? 'bg-red-900/50 border-red-800' : 'bg-red-50 border-red-200'} text-red-600 dark:text-red-400 px-4 py-3 rounded-md text-sm border`}>
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`mt-1 block w-full rounded-md ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'border-gray-300 text-gray-900'
                  } shadow-sm focus:border-purple-500 focus:ring-purple-500 transition-colors duration-200`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`mt-1 block w-full rounded-md ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'border-gray-300 text-gray-900'
                  } shadow-sm focus:border-purple-500 focus:ring-purple-500 transition-colors duration-200`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className={`mt-1 block w-full rounded-md ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'border-gray-300 text-gray-900'
                  } shadow-sm focus:border-purple-500 focus:ring-purple-500 transition-colors duration-200`}
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={`mt-1 block w-full rounded-md ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'border-gray-300 text-gray-900'
                  } shadow-sm focus:border-purple-500 focus:ring-purple-500 transition-colors duration-200`}
                  required
                />
              </div>

              <div className="flex space-x-6 mt-2">
                <div className="flex items-center">
                  <input
                    id="is-recurring"
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className={`h-4 w-4 rounded ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-purple-600' 
                        : 'border-gray-300 text-purple-600'
                    } focus:ring-purple-500`}
                  />
                  <label htmlFor="is-recurring" className={`ml-2 block text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    <div className="flex items-center">
                      <Repeat size={14} className="mr-1" />
                      Recurring Payment
                    </div>
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
                        ? 'bg-gray-700 border-gray-600 text-purple-600' 
                        : 'border-gray-300 text-purple-600'
                    } focus:ring-purple-500`}
                  />
                  <label htmlFor="is-paid" className={`ml-2 block text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    <div className="flex items-center">
                      <Clock size={14} className="mr-1" />
                      Already Paid
                    </div>
                  </label>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-2.5 px-4 rounded-xl shadow-sm transition-colors duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {editingPayment ? (
                    <>
                      <Save size={18} />
                      {isLoading ? 'Updating...' : 'Update Payment'}
                    </>
                  ) : (
                    <>
                      <PlusCircle size={18} />
                      {isLoading ? 'Adding...' : 'Add Payment'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};