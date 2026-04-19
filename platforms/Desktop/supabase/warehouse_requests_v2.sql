-- ══════════════════════════════════════════════════════
-- MIGRATION v2: warehouse_requests — tipo + data + fulfilled
-- Aggiunge: request_type (prelievo/ordine) e expected_date
-- Items JSONB ora supporta fulfilled_quantity per gli ordini
-- ══════════════════════════════════════════════════════

-- Aggiungi colonne mancanti
ALTER TABLE warehouse_requests
  ADD COLUMN IF NOT EXISTS request_type TEXT NOT NULL DEFAULT 'prelievo'
    CHECK (request_type IN ('prelievo', 'ordine')),
  ADD COLUMN IF NOT EXISTS expected_date DATE;

-- Indice su request_type per filtrare velocemente prelievi vs ordini
CREATE INDEX IF NOT EXISTS idx_warehouse_requests_type
  ON warehouse_requests(request_type);

-- Nota: la colonna items (JSONB) mantiene la struttura base già esistente.
-- Per gli ordini, ogni elemento include anche fulfilled_quantity (integer, default 0).
-- Struttura: [{product_id, product_name, sku, quantity, unit, fulfilled_quantity?}]
-- fulfilled_quantity viene gestito dall'app quando si "spara" un codice dal pannello admin.
