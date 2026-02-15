-- Add client_id to lavorazioni for client linking
ALTER TABLE lavorazioni ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS lavorazioni_client_id_idx ON lavorazioni(client_id);
