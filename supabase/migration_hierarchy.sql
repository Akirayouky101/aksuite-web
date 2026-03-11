-- ═══════════════════════════════════════════════════════════════
-- MIGRAZIONE: Gerarchia nodi impianto (Switch, NVR annidati)
-- Da eseguire nella SQL Editor di Supabase dashboard
-- ═══════════════════════════════════════════════════════════════

-- 1. Aggiunge parent_id (self-referencing, nullable)
ALTER TABLE public.installation_devices
  ADD COLUMN IF NOT EXISTS parent_id UUID
  REFERENCES public.installation_devices(id) ON DELETE SET NULL;

-- 2. Rimuovi il vecchio CHECK e ricrealo con 'Switch' incluso
ALTER TABLE public.installation_devices
  DROP CONSTRAINT IF EXISTS installation_devices_tipo_check;

ALTER TABLE public.installation_devices
  ADD CONSTRAINT installation_devices_tipo_check
  CHECK (tipo IN ('NVR', 'DVR', 'XVR', 'HDCVI', 'Switch', 'Altro'));

-- 3. Indice per performance query albero
CREATE INDEX IF NOT EXISTS installation_devices_parent_id_idx
  ON public.installation_devices(parent_id);

-- Verifica
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'installation_devices'
  AND column_name = 'parent_id';
