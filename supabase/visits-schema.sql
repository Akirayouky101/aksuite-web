-- Visits Table - Track office visitors
CREATE TABLE IF NOT EXISTS public.visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Visitor information
  visitor_name TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  email TEXT,
  
  -- Visit details
  visit_type TEXT NOT NULL, -- 'riunione', 'colloquio', 'consegna', 'assistenza', 'altro'
  priority TEXT DEFAULT 'media', -- 'urgente', 'alta', 'media', 'bassa'
  visit_date TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  
  -- Follow-up
  follow_up BOOLEAN DEFAULT false,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own visits"
  ON public.visits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own visits"
  ON public.visits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own visits"
  ON public.visits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own visits"
  ON public.visits FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS visits_user_id_idx ON public.visits(user_id);
CREATE INDEX IF NOT EXISTS visits_date_idx ON public.visits(visit_date);
CREATE INDEX IF NOT EXISTS visits_status_idx ON public.visits(status);
CREATE INDEX IF NOT EXISTS visits_composite_idx ON public.visits(user_id, visit_date DESC);

-- Update the item_relations table to support 'visit' type
COMMENT ON TABLE public.visits IS 'Office visitors registry - tracks people visiting the office';
