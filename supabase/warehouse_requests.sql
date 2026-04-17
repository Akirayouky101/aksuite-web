-- ══════════════════════════════════════════════════════
-- TABELLA: warehouse_requests (Prelievi Magazzino)
-- Sistema di richieste prelievo con approvazione admin
-- ══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS warehouse_requests (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_by   TEXT        NOT NULL,               -- nome del richiedente (testo libero)
  status         TEXT        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'approved', 'rejected')),
  items          JSONB       NOT NULL DEFAULT '[]',  -- [{product_id, product_name, sku, quantity, unit}]
  notes          TEXT,                               -- note facoltative
  approved_by    TEXT,                               -- nome admin che ha approvato/rifiutato
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_warehouse_requests_user_id  ON warehouse_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_requests_status   ON warehouse_requests(status);
CREATE INDEX IF NOT EXISTS idx_warehouse_requests_created  ON warehouse_requests(created_at DESC);

-- RLS
ALTER TABLE warehouse_requests ENABLE ROW LEVEL SECURITY;

-- Tutti gli utenti autenticati possono leggere le richieste (stessa organizzazione)
CREATE POLICY "Authenticated users can view warehouse requests"
  ON warehouse_requests FOR SELECT
  TO authenticated
  USING (true);

-- Chiunque autenticato può inserire una richiesta
CREATE POLICY "Authenticated users can insert warehouse requests"
  ON warehouse_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Chiunque autenticato può aggiornare (approvazione gestita lato app)
CREATE POLICY "Authenticated users can update warehouse requests"
  ON warehouse_requests FOR UPDATE
  TO authenticated
  USING (true);

-- Trigger aggiorna updated_at
CREATE OR REPLACE FUNCTION update_warehouse_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_warehouse_requests_updated_at ON warehouse_requests;
CREATE TRIGGER trg_warehouse_requests_updated_at
  BEFORE UPDATE ON warehouse_requests
  FOR EACH ROW EXECUTE FUNCTION update_warehouse_requests_updated_at();
