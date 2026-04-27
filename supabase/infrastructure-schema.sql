-- ─────────────────────────────────────────────────────────────────────────────
-- INFRASTRUTTURA AZIENDALE — credenziali interne
-- PC, Server, NAS, Email, Router, Switch, NVR/DVR, Altro
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.infrastructure_items (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type                TEXT NOT NULL CHECK (type IN ('PC','Server','NAS','Email','Router','Switch','NVR','DVR','Firewall','Stampante','Altro')),
  name                TEXT NOT NULL,
  hostname            TEXT,
  ip_address          TEXT,
  mac_address         TEXT,
  location            TEXT,
  username            TEXT,
  encrypted_password  TEXT,
  secondary_username  TEXT,
  encrypted_secondary_password TEXT,
  port                TEXT,
  domain              TEXT,
  os_version          TEXT,
  serial_number       TEXT,
  notes               TEXT,
  is_favorite         BOOLEAN DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.infrastructure_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own infrastructure" ON public.infrastructure_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own infrastructure" ON public.infrastructure_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own infrastructure" ON public.infrastructure_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own infrastructure" ON public.infrastructure_items
  FOR DELETE USING (auth.uid() = user_id);

-- Admin: accesso completo
CREATE POLICY "Admin full access infrastructure" ON public.infrastructure_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_permissions
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- ── Trigger updated_at ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_infrastructure_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER infrastructure_updated_at
  BEFORE UPDATE ON public.infrastructure_items
  FOR EACH ROW EXECUTE FUNCTION public.update_infrastructure_updated_at();

-- ── Indici ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS infrastructure_user_id_idx ON public.infrastructure_items(user_id);
CREATE INDEX IF NOT EXISTS infrastructure_type_idx ON public.infrastructure_items(type);
