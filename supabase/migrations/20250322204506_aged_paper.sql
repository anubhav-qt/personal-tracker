/*
  # Add Initial Demo Data

  1. Changes
    - Add sample categories with different colors and icons
    - Add sample expenses across different categories and dates
    
  2. Notes
    - All data is associated with the authenticated user's ID
    - Sample data includes a variety of expense types and amounts
    - Dates are spread across the current month for better visualization
*/

-- Function to get the current user's ID
CREATE OR REPLACE FUNCTION get_auth_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid();
$$;

-- Insert sample categories
INSERT INTO categories (name, color, icon, user_id) VALUES
  ('Groceries', '#22c55e', 'shopping-cart', get_auth_user_id()),
  ('Transportation', '#3b82f6', 'car', get_auth_user_id()),
  ('Entertainment', '#ec4899', 'tv', get_auth_user_id()),
  ('Utilities', '#f59e0b', 'zap', get_auth_user_id()),
  ('Dining Out', '#8b5cf6', 'utensils', get_auth_user_id())
ON CONFLICT (name, user_id) DO NOTHING;

-- Insert sample expenses
WITH category_ids AS (
  SELECT id, name FROM categories WHERE user_id = get_auth_user_id()
)
INSERT INTO expenses (amount, description, date, category_id, user_id)
SELECT 
  amount,
  description,
  date,
  category_id,
  get_auth_user_id()
FROM (
  VALUES
    (75.50, 'Weekly groceries', CURRENT_DATE - INTERVAL '6 days', (SELECT id FROM category_ids WHERE name = 'Groceries')),
    (45.00, 'Gas station', CURRENT_DATE - INTERVAL '5 days', (SELECT id FROM category_ids WHERE name = 'Transportation')),
    (25.00, 'Movie tickets', CURRENT_DATE - INTERVAL '4 days', (SELECT id FROM category_ids WHERE name = 'Entertainment')),
    (120.00, 'Electricity bill', CURRENT_DATE - INTERVAL '3 days', (SELECT id FROM category_ids WHERE name = 'Utilities')),
    (35.00, 'Restaurant dinner', CURRENT_DATE - INTERVAL '2 days', (SELECT id FROM category_ids WHERE name = 'Dining Out')),
    (65.30, 'Supermarket run', CURRENT_DATE - INTERVAL '1 day', (SELECT id FROM category_ids WHERE name = 'Groceries')),
    (15.00, 'Bus fare', CURRENT_DATE, (SELECT id FROM category_ids WHERE name = 'Transportation')),
    (85.00, 'Internet bill', CURRENT_DATE, (SELECT id FROM category_ids WHERE name = 'Utilities')),
    (42.00, 'Pizza night', CURRENT_DATE, (SELECT id FROM category_ids WHERE name = 'Dining Out')),
    (30.00, 'Streaming service', CURRENT_DATE, (SELECT id FROM category_ids WHERE name = 'Entertainment'))
) AS sample_expenses(amount, description, date, category_id);