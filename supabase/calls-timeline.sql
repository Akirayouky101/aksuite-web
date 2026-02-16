-- Create calls_timeline table for tracking events/history of each call
CREATE TABLE IF NOT EXISTS public.calls_timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id UUID REFERENCES public.calls(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'nota',
    'richiamata',
    'risposta_cliente',
    'preventivo_inviato',
    'sopralluogo',
    'appuntamento',
    'ordine',
    'problema',
    'completamento',
    'altro'
  )) DEFAULT 'nota',
  created_by_name TEXT DEFAULT '',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.calls_timeline ENABLE ROW LEVEL SECURITY;

-- Timeline policies
CREATE POLICY "Users can view timeline of own calls"
  ON public.calls_timeline FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert call timeline entries"
  ON public.calls_timeline FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own call timeline entries"
  ON public.calls_timeline FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own call timeline entries"
  ON public.calls_timeline FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS calls_timeline_call_id_idx ON public.calls_timeline(call_id);
CREATE INDEX IF NOT EXISTS calls_timeline_user_id_idx ON public.calls_timeline(user_id);
CREATE INDEX IF NOT EXISTS calls_timeline_created_at_idx ON public.calls_timeline(created_at);
