-- ══════════════════════════════════════════════════════════════
-- SPLIT MAGAZZINO → LISTINI + MAGAZZINO AST/ZG
-- Esegui in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════

-- Aggiunge colonna warehouse ai prodotti esistenti
-- 'listino'         → prodotti del Listino (ex Magazzino, default)
-- 'magazzino_astzg' → prodotti del Magazzino AST/ZG fisico
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS warehouse TEXT NOT NULL DEFAULT 'listino';

-- Tutti i prodotti esistenti diventano automaticamente 'listino'
-- (già garantito dal DEFAULT, ma per sicurezza)
UPDATE public.products SET warehouse = 'listino' WHERE warehouse IS NULL OR warehouse = '';

-- Indice per query veloci per warehouse
CREATE INDEX IF NOT EXISTS idx_products_warehouse ON public.products(warehouse);
