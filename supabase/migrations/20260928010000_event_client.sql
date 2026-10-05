ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS events_client_id_idx ON public.events(client_id);