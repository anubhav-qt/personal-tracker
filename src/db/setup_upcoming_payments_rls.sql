-- First, create the upcoming_payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.upcoming_payments (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users NOT NULL,
    title text NOT NULL,
    amount numeric NOT NULL,
    due_date date NOT NULL,
    is_paid boolean DEFAULT false,
    is_recurring boolean DEFAULT false,
    category_id uuid REFERENCES public.categories,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.upcoming_payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own upcoming payments" ON public.upcoming_payments;
DROP POLICY IF EXISTS "Users can insert their own upcoming payments" ON public.upcoming_payments;
DROP POLICY IF EXISTS "Users can update their own upcoming payments" ON public.upcoming_payments;
DROP POLICY IF EXISTS "Users can delete their own upcoming payments" ON public.upcoming_payments;

-- Create RLS policies
-- 1. Policy for viewing payments (SELECT)
CREATE POLICY "Users can view their own upcoming payments"
  ON public.upcoming_payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Policy for adding payments (INSERT)
CREATE POLICY "Users can insert their own upcoming payments"
  ON public.upcoming_payments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Policy for updating payments (UPDATE)
CREATE POLICY "Users can update their own upcoming payments"
  ON public.upcoming_payments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Policy for deleting payments (DELETE)
CREATE POLICY "Users can delete their own upcoming payments"
  ON public.upcoming_payments
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add indices for better performance
CREATE INDEX IF NOT EXISTS upcoming_payments_user_id_idx ON public.upcoming_payments (user_id);
CREATE INDEX IF NOT EXISTS upcoming_payments_due_date_idx ON public.upcoming_payments (due_date);
