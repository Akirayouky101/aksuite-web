-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create passwords table
CREATE TABLE IF NOT EXISTS public.passwords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  username TEXT NOT NULL,
  encrypted_password TEXT NOT NULL,
  website TEXT,
  category TEXT NOT NULL DEFAULT 'Personal',
  emoji TEXT DEFAULT '🔥',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passwords ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Passwords policies
CREATE POLICY "Users can view own passwords"
  ON public.passwords FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own passwords"
  ON public.passwords FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own passwords"
  ON public.passwords FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own passwords"
  ON public.passwords FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS passwords_user_id_idx ON public.passwords(user_id);
CREATE INDEX IF NOT EXISTS passwords_category_idx ON public.passwords(category);
CREATE INDEX IF NOT EXISTS passwords_created_at_idx ON public.passwords(created_at DESC);

-- Create budget table for family budget management
CREATE TABLE IF NOT EXISTS public.budget_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  emoji TEXT DEFAULT '💰',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for budget
ALTER TABLE public.budget_transactions ENABLE ROW LEVEL SECURITY;

-- Budget policies
CREATE POLICY "Users can view own budget transactions"
  ON public.budget_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budget transactions"
  ON public.budget_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budget transactions"
  ON public.budget_transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budget transactions"
  ON public.budget_transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for budget
CREATE INDEX IF NOT EXISTS budget_user_id_idx ON public.budget_transactions(user_id);
CREATE INDEX IF NOT EXISTS budget_date_idx ON public.budget_transactions(date DESC);
CREATE INDEX IF NOT EXISTS budget_type_idx ON public.budget_transactions(type);

-- Create recurring transactions table
CREATE TABLE IF NOT EXISTS public.budget_recurring (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  emoji TEXT DEFAULT '💰',
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31),
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  next_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for recurring transactions
ALTER TABLE public.budget_recurring ENABLE ROW LEVEL SECURITY;

-- Recurring transactions policies
CREATE POLICY "Users can view own recurring transactions"
  ON public.budget_recurring FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recurring transactions"
  ON public.budget_recurring FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring transactions"
  ON public.budget_recurring FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring transactions"
  ON public.budget_recurring FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for recurring transactions
CREATE INDEX IF NOT EXISTS recurring_user_id_idx ON public.budget_recurring(user_id);
CREATE INDEX IF NOT EXISTS recurring_next_date_idx ON public.budget_recurring(next_date);
CREATE INDEX IF NOT EXISTS recurring_active_idx ON public.budget_recurring(is_active);

-- Function to process recurring transactions
CREATE OR REPLACE FUNCTION public.process_recurring_transactions()
RETURNS void AS $$
DECLARE
  recurring_record RECORD;
  new_next_date DATE;
BEGIN
  -- Loop through all active recurring transactions that are due
  FOR recurring_record IN
    SELECT * FROM public.budget_recurring
    WHERE is_active = true AND next_date <= CURRENT_DATE
  LOOP
    -- Insert the transaction
    INSERT INTO public.budget_transactions (
      user_id, type, amount, category, description, emoji, date
    ) VALUES (
      recurring_record.user_id,
      recurring_record.type,
      recurring_record.amount,
      recurring_record.category,
      recurring_record.description,
      recurring_record.emoji,
      recurring_record.next_date
    );

    -- Calculate next occurrence date
    CASE recurring_record.frequency
      WHEN 'daily' THEN
        new_next_date := recurring_record.next_date + INTERVAL '1 day';
      WHEN 'weekly' THEN
        new_next_date := recurring_record.next_date + INTERVAL '1 week';
      WHEN 'monthly' THEN
        new_next_date := recurring_record.next_date + INTERVAL '1 month';
      WHEN 'yearly' THEN
        new_next_date := recurring_record.next_date + INTERVAL '1 year';
    END CASE;

    -- Update the recurring transaction with new next_date
    UPDATE public.budget_recurring
    SET next_date = new_next_date, updated_at = NOW()
    WHERE id = recurring_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
