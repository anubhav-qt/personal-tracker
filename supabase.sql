-- Categories Table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial categories
INSERT INTO categories (name, color) VALUES 
('Food', '#EF4444'),
('Transport', '#F59E0B'),
('Entertainment', '#8B5CF6'),
('Utilities', '#10B981'),
('Shopping', '#EC4899'),
('Housing', '#6366F1'),
('Healthcare', '#059669'),
('Education', '#2563EB'),
('Travel', '#7C3AED'),
('Other', '#4B5563');

-- Expenses Table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  date DATE NOT NULL,
  category_id UUID REFERENCES categories(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX expenses_user_id_idx ON expenses(user_id);
CREATE INDEX expenses_date_idx ON expenses(date);
CREATE INDEX expenses_category_id_idx ON expenses(category_id);

-- Enable Row Level Security
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create policy for expenses (users can only see their own expenses)
CREATE POLICY "Users can only access their own expenses"
  ON expenses FOR ALL
  USING (auth.uid() = user_id);

-- User Settings Table
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  settings JSONB NOT NULL DEFAULT '{"monthlyBudget": 2000, "theme": "light", "currency": "USD"}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Fix user_settings permissions and structure

-- Make sure the user_settings table has proper structure
ALTER TABLE user_settings ALTER COLUMN settings SET DEFAULT '{"monthlyBudget": 2000, "theme": "light", "currency": "USD"}'::jsonb;

-- Drop old policies
DROP POLICY IF EXISTS "Users can only access their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;

-- Create comprehensive policy for all operations
CREATE POLICY "Users can manage their own settings"
  ON user_settings
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Make sure triggers are set up for timestamp updates
DROP TRIGGER IF EXISTS set_timestamp ON user_settings;

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON user_settings
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

-- Enable RLS (in case it was disabled)
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
