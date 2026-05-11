-- ============================================================
-- MAGAZZINO ELETTRICO — Nuove colonne ubicazione prodotto
-- ============================================================
-- Aggiunge Campata e Ripiano (Scaffale esiste già come "shelf")
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS campata TEXT DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS ripiano TEXT DEFAULT '';

-- Indici per ricerche per ubicazione
CREATE INDEX IF NOT EXISTS idx_products_shelf ON public.products(shelf);
CREATE INDEX IF NOT EXISTS idx_products_campata ON public.products(campata);
