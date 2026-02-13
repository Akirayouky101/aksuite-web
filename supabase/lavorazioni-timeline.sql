-- Create lavorazioni_timeline table for tracking events/history of each lavorazione
CREATE TABLE IF NOT EXISTS public.lavorazioni_timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lavorazione_id UUID REFERENCES public.lavorazioni(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'nota',
    'chiamata_cliente',
    'presa_in_carico',
    'sopralluogo',
    'lavoro_in_corso',
    'consegna',
    'materiale',
    'problema',
    'completamento',
    'altro'
  )) DEFAULT 'nota',
  created_by_name TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.lavorazioni_timeline ENABLE ROW LEVEL SECURITY;

-- Timeline policies (user can manage timeline entries of their own lavorazioni)
CREATE POLICY "Users can view timeline of own lavorazioni"
  ON public.lavorazioni_timeline FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert timeline entries"
  ON public.lavorazioni_timeline FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own timeline entries"
  ON public.lavorazioni_timeline FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own timeline entries"
  ON public.lavorazioni_timeline FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS lavorazioni_timeline_lavorazione_id_idx ON public.lavorazioni_timeline(lavorazione_id);
CREATE INDEX IF NOT EXISTS lavorazioni_timeline_user_id_idx ON public.lavorazioni_timeline(user_id);
CREATE INDEX IF NOT EXISTS lavorazioni_timeline_created_at_idx ON public.lavorazioni_timeline(created_at);
