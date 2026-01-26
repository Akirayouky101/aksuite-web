-- Create calls table for customer call management (ONLY CALLS - safe to run)
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own calls" ON public.calls;
DROP POLICY IF EXISTS "Users can insert own calls" ON public.calls;
DROP POLICY IF EXISTS "Users can update own calls" ON public.calls;
DROP POLICY IF EXISTS "Users can delete own calls" ON public.calls;

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
