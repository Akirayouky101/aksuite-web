-- ============================================================
-- IMPEGNI MAGAZZINO — Sandbox / Prenotazioni prodotti
-- ============================================================
CREATE TABLE IF NOT EXISTS public.impegni_magazzino (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  job_reference TEXT DEFAULT '',
  note TEXT DEFAULT '',
  status TEXT DEFAULT 'attivo' CHECK (status IN ('attivo', 'evaso', 'annullato')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.impegni_magazzino ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Accesso completo autenticati impegni"
  ON public.impegni_magazzino FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_impegni_product ON public.impegni_magazzino(product_id);
CREATE INDEX IF NOT EXISTS idx_impegni_user ON public.impegni_magazzino(user_name);
CREATE INDEX IF NOT EXISTS idx_impegni_status ON public.impegni_magazzino(status);

-- Trigger aggiornamento updated_at
CREATE OR REPLACE FUNCTION update_impegni_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER impegni_updated_at
  BEFORE UPDATE ON public.impegni_magazzino
  FOR EACH ROW EXECUTE FUNCTION update_impegni_updated_at();

-- ============================================================
-- PERMESSI nuovi moduli
-- ============================================================
ALTER TABLE public.user_permissions ADD COLUMN IF NOT EXISTS can_scansione_veloce BOOLEAN DEFAULT false;
ALTER TABLE public.user_permissions ADD COLUMN IF NOT EXISTS can_impegni BOOLEAN DEFAULT false;
