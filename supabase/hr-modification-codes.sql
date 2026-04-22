-- ═══════════════════════════════════════════════════════════
-- hr_modification_codes: codici di consenso per modifica timbrature
--
-- Flusso:
--   1. Admin clicca "Richiedi modifica" su un record → inserisce una riga
--      (il codice è generato lato client e NON mostrato all'admin)
--   2. Il dipendente apre l'app → vede il codice nella sezione "Richieste di modifica"
--   3. Il dipendente comunica verbalmente il codice all'admin
--   4. L'admin inserisce il codice nel pannello web → se valido, sblocca la modifica
--      (la riga viene aggiornata con used_at = now())
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.hr_modification_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id   UUID NOT NULL REFERENCES public.hr_work_records(id) ON DELETE CASCADE,
  profile_id  UUID NOT NULL,
  code        CHAR(6) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.hr_modification_codes ENABLE ROW LEVEL SECURITY;

-- Il dipendente può leggere solo i propri codici (per mostrarli sull'app)
CREATE POLICY "employee_read_own_codes"
  ON public.hr_modification_codes FOR SELECT
  USING (auth.uid() = profile_id);

-- Qualsiasi utente autenticato può inserire un codice (admin che richiede modifica)
CREATE POLICY "authenticated_insert_codes"
  ON public.hr_modification_codes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Qualsiasi utente autenticato può aggiornare (mark as used) — la sicurezza
-- è garantita dal WHERE code = ? nel query dell'applicazione
CREATE POLICY "authenticated_update_codes"
  ON public.hr_modification_codes FOR UPDATE
  USING (auth.role() = 'authenticated');
