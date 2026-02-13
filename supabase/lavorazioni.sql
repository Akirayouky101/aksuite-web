-- Create lavorazioni (work orders/interventions) table
CREATE TABLE IF NOT EXISTS public.lavorazioni (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  call_id UUID REFERENCES public.calls(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  assigned_to TEXT DEFAULT '',
  scheduled_date DATE,
  scheduled_time TIME,
  status TEXT NOT NULL CHECK (status IN ('da_fare', 'in_corso', 'completata', 'annullata')) DEFAULT 'da_fare',
  priority TEXT NOT NULL CHECK (priority IN ('bassa', 'media', 'alta', 'urgente')) DEFAULT 'media',
  address TEXT DEFAULT '',
  city TEXT DEFAULT '',
  zip_code TEXT DEFAULT '',
  province TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.lavorazioni ENABLE ROW LEVEL SECURITY;

-- Lavorazioni policies
CREATE POLICY "Users can view own lavorazioni"
  ON public.lavorazioni FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lavorazioni"
  ON public.lavorazioni FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lavorazioni"
  ON public.lavorazioni FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own lavorazioni"
  ON public.lavorazioni FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS lavorazioni_user_id_idx ON public.lavorazioni(user_id);
CREATE INDEX IF NOT EXISTS lavorazioni_call_id_idx ON public.lavorazioni(call_id);
CREATE INDEX IF NOT EXISTS lavorazioni_status_idx ON public.lavorazioni(status);
CREATE INDEX IF NOT EXISTS lavorazioni_scheduled_date_idx ON public.lavorazioni(scheduled_date);
