-- Events/Calendar Table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  all_day BOOLEAN DEFAULT false,
  location TEXT,
  color TEXT DEFAULT 'blue',
  is_recurring BOOLEAN DEFAULT false,
  recurring_type TEXT, -- 'daily', 'weekly', 'monthly', 'yearly'
  reminder_minutes INTEGER DEFAULT 30, -- Minutes before event to remind
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own events"
  ON public.events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own events"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events"
  ON public.events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events"
  ON public.events FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS events_user_id_idx ON public.events(user_id);
CREATE INDEX IF NOT EXISTS events_start_date_idx ON public.events(start_date DESC);
CREATE INDEX IF NOT EXISTS events_end_date_idx ON public.events(end_date DESC);
CREATE INDEX IF NOT EXISTS events_all_day_idx ON public.events(all_day);
CREATE INDEX IF NOT EXISTS events_is_recurring_idx ON public.events(is_recurring) WHERE is_recurring = true;
