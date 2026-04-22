-- ═══════════════════════════════════════════════════════════
-- hr_modification_codes — ESEGUI TUTTO NEL SQL EDITOR DI SUPABASE
-- ═══════════════════════════════════════════════════════════

-- 1. Crea tabella (sicuro se già esiste)
CREATE TABLE IF NOT EXISTS public.hr_modification_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id   UUID NOT NULL REFERENCES public.hr_work_records(id) ON DELETE CASCADE,
  profile_id  UUID NOT NULL,
  code        CHAR(6) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. Abilita RLS
ALTER TABLE public.hr_modification_codes ENABLE ROW LEVEL SECURITY;

-- 3. Rimuovi TUTTE le policy esistenti (anche vecchie)
DROP POLICY IF EXISTS "employee_read_own_codes"   ON public.hr_modification_codes;
DROP POLICY IF EXISTS "authenticated_read_codes"  ON public.hr_modification_codes;
DROP POLICY IF EXISTS "authenticated_insert_codes" ON public.hr_modification_codes;
DROP POLICY IF EXISTS "authenticated_update_codes" ON public.hr_modification_codes;
DROP POLICY IF EXISTS "authenticated_delete_codes" ON public.hr_modification_codes;

-- 4. Policy SELECT: tutti gli utenti autenticati possono leggere tutti i codici
--    (necessario affinché l'admin veda i campanelli dei dipendenti)
CREATE POLICY "authenticated_read_codes"
  ON public.hr_modification_codes FOR SELECT
  USING (auth.role() = 'authenticated');

-- 5. Policy INSERT: tutti gli utenti autenticati possono inserire
CREATE POLICY "authenticated_insert_codes"
  ON public.hr_modification_codes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 6. Policy UPDATE: tutti gli utenti autenticati possono aggiornare
CREATE POLICY "authenticated_update_codes"
  ON public.hr_modification_codes FOR UPDATE
  USING (auth.role() = 'authenticated');

-- 7. Policy DELETE: tutti gli utenti autenticati possono eliminare
CREATE POLICY "authenticated_delete_codes"
  ON public.hr_modification_codes FOR DELETE
  USING (auth.role() = 'authenticated');

-- 8. Abilita realtime per aggiornamenti live nel pannello web
ALTER PUBLICATION supabase_realtime ADD TABLE public.hr_modification_codes;
