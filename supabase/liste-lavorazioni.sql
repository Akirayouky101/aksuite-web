-- ============================================================
-- LISTE LAVORAZIONI
-- ============================================================

-- Lista principale
CREATE TABLE IF NOT EXISTS public.liste_lavorazioni (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  lavorazione_id UUID REFERENCES public.lavorazioni(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'bozza' CHECK (status IN ('bozza', 'confermata', 'in_lavorazione', 'completata', 'annullata')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Componenti (prodotti dal magazzino)
CREATE TABLE IF NOT EXISTS public.lista_lavorazione_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lista_id UUID REFERENCES public.liste_lavorazioni(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_sku TEXT DEFAULT '',
  product_category TEXT DEFAULT '',
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'pz',
  unit_price NUMERIC DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Utenti assegnati alla lista
CREATE TABLE IF NOT EXISTS public.lista_lavorazione_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lista_id UUID REFERENCES public.liste_lavorazioni(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT DEFAULT '',
  role TEXT DEFAULT 'tecnico',
  UNIQUE(lista_id, user_id)
);

-- RLS
ALTER TABLE public.liste_lavorazioni ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lista_lavorazione_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lista_lavorazione_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "liste_lavorazioni_all" ON public.liste_lavorazioni;
CREATE POLICY "liste_lavorazioni_all" ON public.liste_lavorazioni
  FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "lista_items_all" ON public.lista_lavorazione_items;
CREATE POLICY "lista_items_all" ON public.lista_lavorazione_items
  FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "lista_users_all" ON public.lista_lavorazione_users;
CREATE POLICY "lista_users_all" ON public.lista_lavorazione_users
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Indici
CREATE INDEX IF NOT EXISTS idx_liste_lav_user ON public.liste_lavorazioni(user_id);
CREATE INDEX IF NOT EXISTS idx_liste_lav_client ON public.liste_lavorazioni(client_id);
CREATE INDEX IF NOT EXISTS idx_liste_lav_lavorazione ON public.liste_lavorazioni(lavorazione_id);
CREATE INDEX IF NOT EXISTS idx_lista_items_lista ON public.lista_lavorazione_items(lista_id);
CREATE INDEX IF NOT EXISTS idx_lista_users_lista ON public.lista_lavorazione_users(lista_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_liste_lavorazioni_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_liste_lav_updated ON public.liste_lavorazioni;
CREATE TRIGGER trg_liste_lav_updated
  BEFORE UPDATE ON public.liste_lavorazioni
  FOR EACH ROW EXECUTE FUNCTION update_liste_lavorazioni_updated_at();
