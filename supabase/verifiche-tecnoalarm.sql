-- ═══════════════════════════════════════════════════════════════
-- VERIFICHE TECNOALARM — Manutenzioni Programmate
-- Esegui su Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Tabella principale verifiche ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.verifiche_tecnoalarm (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_by_name     TEXT NOT NULL DEFAULT '',

  -- Anagrafica impianto / cliente
  cliente             TEXT NOT NULL DEFAULT '',
  indirizzo           TEXT DEFAULT '',
  telefono            TEXT DEFAULT '',
  riferimento         TEXT DEFAULT '',      -- persona di riferimento in loco
  codice_impianto     TEXT DEFAULT '',      -- codice interno Tecnoalarm

  -- Tipo e pianificazione
  tipo_verifica       TEXT NOT NULL DEFAULT 'semestrale'
                        CHECK (tipo_verifica IN ('mensile','trimestrale','semestrale','annuale','straordinaria')),
  periodicita_mesi    INTEGER DEFAULT 6,    -- ogni quanti mesi ricorrenza

  -- Scadenze
  data_ultima_verifica DATE,
  data_prossima_verifica DATE NOT NULL,     -- scadenza programmata
  data_esecuzione     DATE,                 -- quando è stata effettivamente eseguita

  -- Stato
  stato               TEXT NOT NULL DEFAULT 'programmata'
                        CHECK (stato IN ('programmata','in_scadenza','scaduta','in_corso','completata','annullata')),

  -- Tecnico assegnato
  tecnico_assegnato   TEXT DEFAULT '',
  tecnico_user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Esito e note
  esito               TEXT CHECK (esito IN ('positivo','positivo_con_riserva','negativo',NULL)),
  note_tecniche       TEXT DEFAULT '',
  note_interne        TEXT DEFAULT '',
  firma_cliente       BOOLEAN DEFAULT false,
  firma_tecnico       BOOLEAN DEFAULT false,

  -- Allegati (URL array in Supabase Storage)
  allegati            TEXT[] DEFAULT '{}',

  -- Campi flessibili: quali campi del modulo sono abilitati per questa verifica
  -- Sarà popolato con i nomi dei campi selezionati (es: ['centrale','sirene','batterie',...])
  campi_abilitati     TEXT[] DEFAULT '{}',

  -- Valori compilati per i campi flessibili (chiave=nome_campo, valore=risposta)
  campi_valori        JSONB DEFAULT '{}',

  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- ── 2. Tabella definizioni campi (popolata quando l'utente passa il file) ─────
-- Ogni riga = un campo del modulo di verifica Tecnoalarm.
-- Puoi abilitare/disabilitare campi per ogni verifica tramite 'campi_abilitati'.
CREATE TABLE IF NOT EXISTS public.verifiche_campi_definizioni (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome        TEXT NOT NULL UNIQUE,          -- chiave tecnica (es: 'batterie_centrale')
  etichetta   TEXT NOT NULL,                  -- label mostrata all'utente
  categoria   TEXT NOT NULL DEFAULT 'generale',
  tipo        TEXT NOT NULL DEFAULT 'boolean'
                CHECK (tipo IN ('boolean','testo','numero','select','data','note')),
  opzioni     TEXT[] DEFAULT '{}',            -- per tipo 'select'
  obbligatorio BOOLEAN DEFAULT false,
  ordine      INTEGER DEFAULT 0,
  attivo      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── 3. Indici ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS verifiche_user_id_idx          ON public.verifiche_tecnoalarm(user_id);
CREATE INDEX IF NOT EXISTS verifiche_stato_idx            ON public.verifiche_tecnoalarm(stato);
CREATE INDEX IF NOT EXISTS verifiche_prossima_idx         ON public.verifiche_tecnoalarm(data_prossima_verifica);
CREATE INDEX IF NOT EXISTS verifiche_cliente_idx          ON public.verifiche_tecnoalarm(cliente);
CREATE INDEX IF NOT EXISTS verifiche_tecnico_uid_idx      ON public.verifiche_tecnoalarm(tecnico_user_id);

-- ── 4. Trigger updated_at ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_verifiche_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER verifiche_tecnoalarm_updated_at
  BEFORE UPDATE ON public.verifiche_tecnoalarm
  FOR EACH ROW EXECUTE FUNCTION public.update_verifiche_updated_at();

-- ── 5. Aggiunge can_verifiche PRIMA delle policy (le policy la referenziano) ──
ALTER TABLE public.user_permissions
  ADD COLUMN IF NOT EXISTS can_verifiche BOOLEAN NOT NULL DEFAULT false;

UPDATE public.user_permissions
  SET can_verifiche = true
  WHERE user_id = '3740d43e-4020-4020-8582-ad305f9d06b4';

-- ── 6. RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE public.verifiche_tecnoalarm          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifiche_campi_definizioni   ENABLE ROW LEVEL SECURITY;

-- Verifiche: accesso per chi ha can_verifiche o è admin
DROP POLICY IF EXISTS "verifiche_select" ON public.verifiche_tecnoalarm;
CREATE POLICY "verifiche_select" ON public.verifiche_tecnoalarm
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_permissions
      WHERE can_verifiche = true OR is_admin = true
    )
  );

DROP POLICY IF EXISTS "verifiche_insert" ON public.verifiche_tecnoalarm;
CREATE POLICY "verifiche_insert" ON public.verifiche_tecnoalarm
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.user_permissions
      WHERE can_verifiche = true OR is_admin = true
    )
  );

DROP POLICY IF EXISTS "verifiche_update" ON public.verifiche_tecnoalarm;
CREATE POLICY "verifiche_update" ON public.verifiche_tecnoalarm
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_permissions
      WHERE can_verifiche = true OR is_admin = true
    )
  );

DROP POLICY IF EXISTS "verifiche_delete" ON public.verifiche_tecnoalarm;
CREATE POLICY "verifiche_delete" ON public.verifiche_tecnoalarm
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_permissions
      WHERE is_admin = true
    )
  );

-- Campi definizioni: leggibili da chi ha can_verifiche, modificabili solo da admin
DROP POLICY IF EXISTS "campi_def_select" ON public.verifiche_campi_definizioni;
CREATE POLICY "campi_def_select" ON public.verifiche_campi_definizioni
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_permissions
      WHERE can_verifiche = true OR is_admin = true
    )
  );

DROP POLICY IF EXISTS "campi_def_write" ON public.verifiche_campi_definizioni;
CREATE POLICY "campi_def_write" ON public.verifiche_campi_definizioni
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_permissions WHERE is_admin = true
    )
  );

-- ── 7. Aggiorna create_default_permissions per includere can_verifiche ────────
CREATE OR REPLACE FUNCTION create_default_permissions()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_permissions (
    user_id, is_admin, can_calls, can_lavorazioni, can_tasks, can_calendar,
    can_budget, can_passwords, can_notes, can_clients, can_visits, can_suppliers,
    can_orders, can_warehouse, can_preventivi, can_sopralluoghi, can_installations,
    can_prelievo, can_kits, can_tickets, can_hr, can_cancelli, can_verifiche
  )
  VALUES (
    NEW.id,
    false, false, false, false, false,
    false, false, false, false, false, false,
    false, false, false, false, false,
    false, false, false, false, false, false
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 9. Funzione: aggiorna automaticamente lo stato in base alla scadenza ───────
-- Esegui manualmente o tramite cron/pg_cron se disponibile
CREATE OR REPLACE FUNCTION public.aggiorna_stato_verifiche()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  -- Scaduta: data_prossima_verifica < oggi e stato ancora 'programmata' o 'in_scadenza'
  UPDATE public.verifiche_tecnoalarm
    SET stato = 'scaduta'
    WHERE data_prossima_verifica < CURRENT_DATE
      AND stato IN ('programmata', 'in_scadenza');

  -- In scadenza: scadenza tra oggi e +15 giorni
  UPDATE public.verifiche_tecnoalarm
    SET stato = 'in_scadenza'
    WHERE data_prossima_verifica BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '15 days')
      AND stato = 'programmata';
END;
$$;
