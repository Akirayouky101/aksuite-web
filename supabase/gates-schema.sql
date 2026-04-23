-- ═══════════════════════════════════════════════════════════
-- GATES — Archivio Cancelli & Manutenzioni
-- Esegui nel SQL Editor di Supabase
-- ═══════════════════════════════════════════════════════════

-- 1. Tabella cancelli (un cancello = un'installazione presso un cliente)
CREATE TABLE IF NOT EXISTS public.gates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,                          -- es. "Cancello Principale", "Sbarra P1"
  brand       TEXT,                                   -- Nice, CAME, BFT, Faac, Gibidi, altro
  model       TEXT,                                   -- es. "Robus 600", "Wingo 5000"
  type        TEXT,                                   -- scorrevole / battente / sbarra / garage / altro
  motor_count INT NOT NULL DEFAULT 1,                 -- 1 o 2 (battente doppio)
  install_date DATE,
  serial_number TEXT,
  notes       TEXT,
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabella interventi di manutenzione
CREATE TABLE IF NOT EXISTS public.gate_maintenances (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gate_id     UUID NOT NULL REFERENCES public.gates(id) ON DELETE CASCADE,
  profile_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  type        TEXT NOT NULL DEFAULT 'ordinaria',      -- installazione / ordinaria / straordinaria / guasto
  description TEXT,

  -- Parametri Nice (compatibile T4 / View / Era)
  -- Motore 1
  m1_work_mode        TEXT,   -- F1: Modo lavoro (automatico/semiautomatico/manuale/passo-passo)
  m1_pause_time       TEXT,   -- F2: Tempo pausa apertura (secondi)
  m1_partial_open     TEXT,   -- F3: Apertura parziale (%)
  m1_obstacle_sens    TEXT,   -- F4: Sensibilità ostacoli (0-9)
  m1_preflash         TEXT,   -- F5: Pre-lampeggio (secondi)
  m1_encoder          TEXT,   -- F6: Encoder (abilitato/disabilitato)
  m1_slowdown         TEXT,   -- F7: Rallentamento (abilitato/disabilitato)
  m1_electric_lock    TEXT,   -- F8: Elettroserratura (abilitato/disabilitato)
  m1_open_limit       TEXT,   -- Finecorsa apertura
  m1_close_limit      TEXT,   -- Finecorsa chiusura
  m1_open_force       TEXT,   -- Forza apertura
  m1_close_force      TEXT,   -- Forza chiusura

  -- Motore 2 (battente doppio)
  m2_work_mode        TEXT,
  m2_pause_time       TEXT,
  m2_partial_open     TEXT,
  m2_obstacle_sens    TEXT,
  m2_preflash         TEXT,
  m2_encoder          TEXT,
  m2_slowdown         TEXT,
  m2_electric_lock    TEXT,
  m2_open_limit       TEXT,
  m2_close_limit      TEXT,
  m2_open_force       TEXT,
  m2_close_force      TEXT,

  -- Parametri extra / altri brand (JSONB flessibile)
  extra_params        JSONB DEFAULT '{}',

  photos              TEXT[],  -- array di URL foto
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- 3. Indici
CREATE INDEX IF NOT EXISTS idx_gates_client_id        ON public.gates(client_id);
CREATE INDEX IF NOT EXISTS idx_gate_maintenances_gate ON public.gate_maintenances(gate_id);
CREATE INDEX IF NOT EXISTS idx_gate_maintenances_date ON public.gate_maintenances(date DESC);

-- 4. RLS
ALTER TABLE public.gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gate_maintenances ENABLE ROW LEVEL SECURITY;

-- Gates: leggibile da tutti gli autenticati con permesso can_cancelli (controllo lato app)
CREATE POLICY "authenticated_read_gates"
  ON public.gates FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_insert_gates"
  ON public.gates FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "authenticated_update_gates"
  ON public.gates FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_delete_gates"
  ON public.gates FOR DELETE
  USING (auth.role() = 'authenticated');

-- Maintenances
CREATE POLICY "authenticated_read_maintenances"
  ON public.gate_maintenances FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_insert_maintenances"
  ON public.gate_maintenances FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "authenticated_update_maintenances"
  ON public.gate_maintenances FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_delete_maintenances"
  ON public.gate_maintenances FOR DELETE
  USING (auth.role() = 'authenticated');

-- 5. Aggiungi can_cancelli alla tabella user_permissions
ALTER TABLE public.user_permissions
  ADD COLUMN IF NOT EXISTS can_cancelli BOOLEAN NOT NULL DEFAULT false;

-- 6. Aggiorna l'admin con can_cancelli = true
UPDATE public.user_permissions
SET can_cancelli = true
WHERE is_admin = true;

-- 7. Trigger updated_at su gates
CREATE OR REPLACE FUNCTION update_gates_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_gates_updated
  BEFORE UPDATE ON public.gates
  FOR EACH ROW EXECUTE FUNCTION update_gates_timestamp();
