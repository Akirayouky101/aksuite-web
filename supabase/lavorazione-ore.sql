-- ============================================================
-- SESSIONI ORE E MATERIALI PER LAVORAZIONE
-- ============================================================

-- Sessioni di lavoro (ore tracciate per giorno/persona)
CREATE TABLE IF NOT EXISTS public.lavorazione_ore (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lavorazione_id UUID REFERENCES public.lavorazioni(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT DEFAULT '',
  work_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  minutes SMALLINT DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materiali extra utilizzati durante l'intervento
CREATE TABLE IF NOT EXISTS public.lavorazione_materiali (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lavorazione_id UUID REFERENCES public.lavorazioni(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT DEFAULT '',
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_sku TEXT DEFAULT '',
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'pz',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.lavorazione_ore ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lavorazione_materiali ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lav_ore_all" ON public.lavorazione_ore;
CREATE POLICY "lav_ore_all" ON public.lavorazione_ore
  FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "lav_materiali_all" ON public.lavorazione_materiali;
CREATE POLICY "lav_materiali_all" ON public.lavorazione_materiali
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Indici
CREATE INDEX IF NOT EXISTS idx_lav_ore_lavorazione ON public.lavorazione_ore(lavorazione_id);
CREATE INDEX IF NOT EXISTS idx_lav_ore_user ON public.lavorazione_ore(user_id);
CREATE INDEX IF NOT EXISTS idx_lav_ore_date ON public.lavorazione_ore(work_date);
CREATE INDEX IF NOT EXISTS idx_lav_materiali_lavorazione ON public.lavorazione_materiali(lavorazione_id);
CREATE INDEX IF NOT EXISTS idx_lav_materiali_user ON public.lavorazione_materiali(user_id);
