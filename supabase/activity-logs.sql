-- ===================================================================
-- ACTIVITY LOG: Cronologia attivita' dell'ufficio
-- Traccia chi fa cosa su ogni modulo
-- Esegui su Supabase SQL Editor
-- ===================================================================

-- 1. Tabella activity_logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL DEFAULT '',
  user_email TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  entity_type TEXT NOT NULL,
  entity_name TEXT NOT NULL DEFAULT '',
  details TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Indici per performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON public.activity_logs(entity_type);

-- 3. RLS: tutti gli utenti autenticati vedono tutta la cronologia
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all logs" ON public.activity_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert logs" ON public.activity_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Solo admin puo' eliminare i log
CREATE POLICY "Admin can delete logs" ON public.activity_logs
  FOR DELETE USING (auth.uid() = '3740d43e-4020-4020-8582-ad305f9d06b4'::uuid);

-- 4. Pulizia automatica: mantieni solo ultimi 90 giorni
-- (opzionale, esegui manualmente o con cron)
-- DELETE FROM public.activity_logs WHERE created_at < now() - interval '90 days';
