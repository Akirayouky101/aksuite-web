-- HR Schema - Risorse Umane
-- Run this in Supabase SQL Editor

-- ── Tabella dipendenti ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hr_employees (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name           TEXT NOT NULL,
  role                TEXT,
  department          TEXT,
  email               TEXT,
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
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── Tabella richieste ferie/permessi ───────────────────────────
CREATE TABLE IF NOT EXISTS public.hr_leave_requests (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id   UUID NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('ferie','permesso','malattia','maternita_paternita','altro')),
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  days          INTEGER NOT NULL DEFAULT 1,
  notes         TEXT,
  status        TEXT NOT NULL DEFAULT 'in_attesa' CHECK (status IN ('in_attesa','approvato','rifiutato')),
  reviewed_by   TEXT,
  reviewed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Permesso HR nella tabella user_permissions ─────────────────
ALTER TABLE public.user_permissions
  ADD COLUMN IF NOT EXISTS can_hr BOOLEAN NOT NULL DEFAULT false;

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE public.hr_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_leave_requests ENABLE ROW LEVEL SECURITY;

-- Tutti gli utenti autenticati dello stesso account admin vedono i dati HR
-- (stessa logica usata nel resto dell'app: no per-tenant isolation qui,
--  usa la politica shared data come gli altri moduli)

DROP POLICY IF EXISTS "hr_employees_select" ON public.hr_employees;
CREATE POLICY "hr_employees_select" ON public.hr_employees
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "hr_employees_insert" ON public.hr_employees;
CREATE POLICY "hr_employees_insert" ON public.hr_employees
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "hr_employees_update" ON public.hr_employees;
CREATE POLICY "hr_employees_update" ON public.hr_employees
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "hr_employees_delete" ON public.hr_employees;
CREATE POLICY "hr_employees_delete" ON public.hr_employees
  FOR DELETE USING (auth.role() = 'authenticated');

-- Leave requests
DROP POLICY IF EXISTS "hr_leave_select" ON public.hr_leave_requests;
CREATE POLICY "hr_leave_select" ON public.hr_leave_requests
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "hr_leave_insert" ON public.hr_leave_requests;
CREATE POLICY "hr_leave_insert" ON public.hr_leave_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "hr_leave_update" ON public.hr_leave_requests;
CREATE POLICY "hr_leave_update" ON public.hr_leave_requests
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "hr_leave_delete" ON public.hr_leave_requests;
CREATE POLICY "hr_leave_delete" ON public.hr_leave_requests
  FOR DELETE USING (auth.role() = 'authenticated');

-- ── Indici ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_hr_employees_user ON public.hr_employees(user_id);
CREATE INDEX IF NOT EXISTS idx_hr_employees_status ON public.hr_employees(status);
CREATE INDEX IF NOT EXISTS idx_hr_leave_employee ON public.hr_leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_leave_status ON public.hr_leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_hr_leave_dates ON public.hr_leave_requests(start_date, end_date);
