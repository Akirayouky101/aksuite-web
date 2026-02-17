-- ═══════════════════════════════════════════════
-- Aggiunge campo "direzione chiamata" alla tabella calls
-- In Entrata (inbound) / In Uscita (outbound)
-- ═══════════════════════════════════════════════

ALTER TABLE public.calls 
  ADD COLUMN IF NOT EXISTS call_direction TEXT DEFAULT 'inbound' 
  CHECK (call_direction IN ('inbound', 'outbound'));

-- Le chiamate esistenti restano come "inbound" di default
