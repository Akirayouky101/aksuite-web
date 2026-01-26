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

-- Create budget limits table
CREATE TABLE IF NOT EXISTS public.budget_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  limit_amount DECIMAL(10, 2) NOT NULL CHECK (limit_amount > 0),
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'yearly')),
  alert_threshold INTEGER DEFAULT 80 CHECK (alert_threshold BETWEEN 1 AND 100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category, period)
);

-- Enable RLS for budget limits
ALTER TABLE public.budget_limits ENABLE ROW LEVEL SECURITY;

-- Budget limits policies
CREATE POLICY "Users can view own budget limits"
  ON public.budget_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budget limits"
  ON public.budget_limits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budget limits"
  ON public.budget_limits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budget limits"
  ON public.budget_limits FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for budget limits
CREATE INDEX IF NOT EXISTS limits_user_id_idx ON public.budget_limits(user_id);
CREATE INDEX IF NOT EXISTS limits_category_idx ON public.budget_limits(category);
CREATE INDEX IF NOT EXISTS limits_active_idx ON public.budget_limits(is_active);

-- Function to check budget limit status
CREATE OR REPLACE FUNCTION public.check_budget_limit_status(
  p_user_id UUID,
  p_category TEXT,
  p_period TEXT DEFAULT 'monthly'
)
RETURNS TABLE (
  limit_amount DECIMAL(10, 2),
  current_spending DECIMAL(10, 2),
  percentage_used DECIMAL(5, 2),
  alert_threshold INTEGER,
  status TEXT,
  remaining_amount DECIMAL(10, 2)
) AS $$
DECLARE
  v_limit RECORD;
  v_spending DECIMAL(10, 2);
  v_start_date DATE;
  v_percentage DECIMAL(5, 2);
BEGIN
  -- Get the limit for this category
  SELECT * INTO v_limit
  FROM public.budget_limits
  WHERE user_id = p_user_id
    AND category = p_category
    AND period = p_period
    AND is_active = true
  LIMIT 1;

  -- If no limit set, return null
  IF v_limit IS NULL THEN
    RETURN;
  END IF;

  -- Calculate start date based on period
  CASE p_period
    WHEN 'daily' THEN
      v_start_date := CURRENT_DATE;
    WHEN 'weekly' THEN
      v_start_date := CURRENT_DATE - INTERVAL '7 days';
    WHEN 'monthly' THEN
      v_start_date := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    WHEN 'yearly' THEN
      v_start_date := DATE_TRUNC('year', CURRENT_DATE)::DATE;
  END CASE;

  -- Calculate current spending for the category in this period
  SELECT COALESCE(SUM(amount), 0) INTO v_spending
  FROM public.budget_transactions
  WHERE user_id = p_user_id
    AND category = p_category
    AND type = 'expense'
    AND date >= v_start_date
    AND date <= CURRENT_DATE;

  -- Calculate percentage used
  v_percentage := (v_spending / v_limit.limit_amount) * 100;

  -- Determine status
  RETURN QUERY SELECT
    v_limit.limit_amount,
    v_spending,
    v_percentage,
    v_limit.alert_threshold,
    CASE
      WHEN v_percentage >= 100 THEN 'exceeded'
      WHEN v_percentage >= v_limit.alert_threshold THEN 'warning'
      ELSE 'ok'
    END,
    v_limit.limit_amount - v_spending;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all active limits with their status
CREATE OR REPLACE FUNCTION public.get_all_budget_limits_status(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  category TEXT,
  period TEXT,
  limit_amount DECIMAL(10, 2),
  current_spending DECIMAL(10, 2),
  percentage_used DECIMAL(5, 2),
  alert_threshold INTEGER,
  status TEXT,
  remaining_amount DECIMAL(10, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bl.id,
    bl.category,
    bl.period,
    COALESCE(cls.limit_amount, bl.limit_amount) as limit_amount,
    COALESCE(cls.current_spending, 0) as current_spending,
    COALESCE(cls.percentage_used, 0) as percentage_used,
    bl.alert_threshold,
    COALESCE(cls.status, 'ok') as status,
    COALESCE(cls.remaining_amount, bl.limit_amount) as remaining_amount
  FROM public.budget_limits bl
  LEFT JOIN LATERAL public.check_budget_limit_status(p_user_id, bl.category, bl.period) cls ON true
  WHERE bl.user_id = p_user_id
    AND bl.is_active = true
  ORDER BY cls.percentage_used DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create calls table for customer call management
CREATE TABLE IF NOT EXISTS public.calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  caller_name TEXT NOT NULL,
  company TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  call_type TEXT NOT NULL CHECK (call_type IN ('informazioni', 'assistenza', 'vendita', 'reclamo', 'altro')),
  priority TEXT NOT NULL CHECK (priority IN ('bassa', 'media', 'alta', 'urgente')) DEFAULT 'media',
  notes TEXT NOT NULL,
  follow_up BOOLEAN DEFAULT false,
  follow_up_date DATE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'cancelled')) DEFAULT 'pending',
  call_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for calls
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

-- Calls policies
CREATE POLICY "Users can view own calls"
  ON public.calls FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calls"
  ON public.calls FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calls"
  ON public.calls FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calls"
  ON public.calls FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for calls
CREATE INDEX IF NOT EXISTS calls_user_id_idx ON public.calls(user_id);
CREATE INDEX IF NOT EXISTS calls_status_idx ON public.calls(status);
CREATE INDEX IF NOT EXISTS calls_priority_idx ON public.calls(priority);
CREATE INDEX IF NOT EXISTS calls_call_date_idx ON public.calls(call_date DESC);
CREATE INDEX IF NOT EXISTS calls_follow_up_date_idx ON public.calls(follow_up_date) WHERE follow_up = true;

