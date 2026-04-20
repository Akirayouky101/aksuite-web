-- ══════════════════════════════════════════════════════
-- SISTEMA KIT — Schema completo
-- Tabella kits: bundle di prodotti riutilizzabili
-- Tabella kit_items: componenti del kit con quantità
-- ══════════════════════════════════════════════════════

-- ─── Tabella principale KIT ───────────────────────────
CREATE TABLE IF NOT EXISTS public.kits (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        TEXT        NOT NULL,
  sku         TEXT,                    -- codice interno kit
  qr_code     TEXT,                    -- payload QR: "KIT:<uuid>" generato automaticamente
  category    TEXT        DEFAULT 'generale',
  description TEXT,
  notes       TEXT,
  is_active   BOOLEAN     DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_kits_user_id  ON public.kits(user_id);
CREATE INDEX IF NOT EXISTS idx_kits_sku      ON public.kits(sku);
CREATE UNIQUE INDEX IF NOT EXISTS idx_kits_qr_code ON public.kits(qr_code) WHERE qr_code IS NOT NULL;

-- RLS: ogni utente gestisce i propri kit, ma tutti i team member li vedono (come i prodotti)
ALTER TABLE public.kits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view kits"
  ON public.kits FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own kits"
  ON public.kits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own kits"
  ON public.kits FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own kits"
  ON public.kits FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ─── Componenti del KIT ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.kit_items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id      UUID        REFERENCES public.kits(id) ON DELETE CASCADE NOT NULL,
  product_id  UUID        REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT       NOT NULL,   -- snapshot nome al momento creazione
  product_sku  TEXT,                  -- snapshot SKU
  quantity    INTEGER     NOT NULL DEFAULT 1 CHECK (quantity > 0),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kit_items_kit_id     ON public.kit_items(kit_id);
CREATE INDEX IF NOT EXISTS idx_kit_items_product_id ON public.kit_items(product_id);

ALTER TABLE public.kit_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view kit_items"
  ON public.kit_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Kit owners can manage kit_items"
  ON public.kit_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.kits WHERE id = kit_id AND user_id = auth.uid()));

-- ─── Trigger updated_at su kits ──────────────────────
CREATE OR REPLACE FUNCTION update_kits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_kits_updated_at ON public.kits;
CREATE TRIGGER trg_kits_updated_at
  BEFORE UPDATE ON public.kits
  FOR EACH ROW EXECUTE FUNCTION update_kits_updated_at();

-- ─── Funzione: disponibilità KIT ────────────────────
-- Restituisce per ogni kit_item se lo stock è sufficiente
CREATE OR REPLACE FUNCTION get_kit_availability(p_kit_id UUID)
RETURNS TABLE(
  product_id   UUID,
  product_name TEXT,
  product_sku  TEXT,
  required_qty INTEGER,
  current_qty  INTEGER,
  is_available BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    ki.product_id,
    ki.product_name,
    ki.product_sku,
    ki.quantity        AS required_qty,
    COALESCE(p.quantity, 0) AS current_qty,
    COALESCE(p.quantity, 0) >= ki.quantity AS is_available
  FROM kit_items ki
  LEFT JOIN products p ON p.id = ki.product_id
  WHERE ki.kit_id = p_kit_id;
$$;

GRANT EXECUTE ON FUNCTION get_kit_availability(UUID) TO authenticated;
