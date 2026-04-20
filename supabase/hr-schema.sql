-- HR Schema v2 - Risorse Umane
-- I dipendenti vengono dai profili esistenti (tabella profiles).
-- Questo schema aggiunge solo le info HR extra senza duplicare gli utenti.
-- Run this in Supabase SQL Editor

-- ── Pulizia schema v1 (drop sicuro, CASCADE rimuove dipendenze) ──
DROP TABLE IF EXISTS public.hr_work_records    CASCADE;
DROP TABLE IF EXISTS public.hr_documents       CASCADE;
DROP TABLE IF EXISTS public.hr_leave_requests  CASCADE;
DROP TABLE IF EXISTS public.hr_profiles        CASCADE;
DROP TABLE IF EXISTS public.hr_employees       CASCADE;

-- ── hr_profiles: dati HR aggiuntivi per utente (1:1 con profiles) ──
CREATE TABLE IF NOT EXISTS public.hr_profiles (
  profile_id          UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  role                TEXT,
  department          TEXT,
  phone               TEXT,
  birth_date          DATE,
  hire_date           DATE,
  contract_type       TEXT CHECK (contract_type IN ('indeterminato','determinato','apprendistato','collaborazione','stage','consulente')),
  contract_end_date   DATE,
  gross_salary        NUMERIC(10,2),
  net_salary          NUMERIC(10,2),
  iban                TEXT,
  tax_code            TEXT,
  address             TEXT,
  emergency_contact   TEXT,
  photo_url           TEXT,
  notes               TEXT,
  status              TEXT NOT NULL DEFAULT 'attivo' CHECK (status IN ('attivo','in_prova','sospeso','cessato')),
  ferie_giorni_anno   INTEGER NOT NULL DEFAULT 26,
  ferie_giorni_residui INTEGER NOT NULL DEFAULT 26,
  permessi_ore_anno   INTEGER NOT NULL DEFAULT 104,
  permessi_ore_residui INTEGER NOT NULL DEFAULT 104,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── hr_documents: documenti/file per dipendente per categoria ──
CREATE TABLE IF NOT EXISTS public.hr_documents (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category    TEXT NOT NULL CHECK (category IN ('corsi','corsi_sicurezza','documenti','certificazioni_mediche','training','timbrature')),
  name        TEXT NOT NULL,
  file_url    TEXT,
  file_name   TEXT,
  expiry_date DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── hr_leave_requests: ferie, permessi, malattie ───────────────
CREATE TABLE IF NOT EXISTS public.hr_leave_requests (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_name TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('ferie','permesso','malattia','maternita_paternita','altro')),
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  days         NUMERIC(5,1) NOT NULL DEFAULT 1,
  hours        NUMERIC(5,1),
  notes        TEXT,
  status       TEXT NOT NULL DEFAULT 'in_attesa' CHECK (status IN ('in_attesa','approvato','rifiutato')),
  reviewed_by  TEXT,
  reviewed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── hr_work_records: timbrature digitali / ore lavorate ────────
CREATE TABLE IF NOT EXISTS public.hr_work_records (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  hours_worked NUMERIC(5,2) NOT NULL DEFAULT 0,
  check_in     TIME,
  check_out    TIME,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, date)
);

-- ── Permesso HR ────────────────────────────────────────────────
ALTER TABLE public.user_permissions
  ADD COLUMN IF NOT EXISTS can_hr BOOLEAN NOT NULL DEFAULT false;

-- ── Row Level Security ─────────────────────────────────────────
ALTER TABLE public.hr_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_documents     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_work_records  ENABLE ROW LEVEL SECURITY;

-- hr_profiles
DROP POLICY IF EXISTS "hr_profiles_select" ON public.hr_profiles;
CREATE POLICY "hr_profiles_select" ON public.hr_profiles FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "hr_profiles_insert" ON public.hr_profiles;
CREATE POLICY "hr_profiles_insert" ON public.hr_profiles FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "hr_profiles_update" ON public.hr_profiles;
CREATE POLICY "hr_profiles_update" ON public.hr_profiles FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "hr_profiles_delete" ON public.hr_profiles;
CREATE POLICY "hr_profiles_delete" ON public.hr_profiles FOR DELETE USING (auth.role() = 'authenticated');

-- hr_documents
DROP POLICY IF EXISTS "hr_docs_select" ON public.hr_documents;
CREATE POLICY "hr_docs_select" ON public.hr_documents FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "hr_docs_insert" ON public.hr_documents;
CREATE POLICY "hr_docs_insert" ON public.hr_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "hr_docs_update" ON public.hr_documents;
CREATE POLICY "hr_docs_update" ON public.hr_documents FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "hr_docs_delete" ON public.hr_documents;
CREATE POLICY "hr_docs_delete" ON public.hr_documents FOR DELETE USING (auth.role() = 'authenticated');

-- hr_leave_requests
DROP POLICY IF EXISTS "hr_leave_select" ON public.hr_leave_requests;
CREATE POLICY "hr_leave_select" ON public.hr_leave_requests FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "hr_leave_insert" ON public.hr_leave_requests;
CREATE POLICY "hr_leave_insert" ON public.hr_leave_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "hr_leave_update" ON public.hr_leave_requests;
CREATE POLICY "hr_leave_update" ON public.hr_leave_requests FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "hr_leave_delete" ON public.hr_leave_requests;
CREATE POLICY "hr_leave_delete" ON public.hr_leave_requests FOR DELETE USING (auth.role() = 'authenticated');

-- hr_work_records
DROP POLICY IF EXISTS "hr_work_select" ON public.hr_work_records;
CREATE POLICY "hr_work_select" ON public.hr_work_records FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "hr_work_insert" ON public.hr_work_records;
CREATE POLICY "hr_work_insert" ON public.hr_work_records FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "hr_work_update" ON public.hr_work_records;
CREATE POLICY "hr_work_update" ON public.hr_work_records FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "hr_work_delete" ON public.hr_work_records;
CREATE POLICY "hr_work_delete" ON public.hr_work_records FOR DELETE USING (auth.role() = 'authenticated');

-- ── Indici ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_hr_docs_profile   ON public.hr_documents(profile_id);
CREATE INDEX IF NOT EXISTS idx_hr_docs_category  ON public.hr_documents(category);
CREATE INDEX IF NOT EXISTS idx_hr_leave_profile  ON public.hr_leave_requests(profile_id);
CREATE INDEX IF NOT EXISTS idx_hr_leave_status   ON public.hr_leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_hr_work_profile   ON public.hr_work_records(profile_id);
CREATE INDEX IF NOT EXISTS idx_hr_work_date      ON public.hr_work_records(date);
