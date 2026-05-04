-- ═══════════════════════════════════════════════════════
-- CALENDARIO MULTI-UTENTE
-- Aggiunge: assigned_to, assigned_to_name, is_shared
-- Gli utenti vedono: propri eventi + eventi assegnati a loro
-- L'admin vede tutti gli eventi
-- ═══════════════════════════════════════════════════════

-- 1. Aggiungi colonne alla tabella events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_to_name TEXT,
  ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by_name TEXT;

-- Popola created_by per gli eventi esistenti (usa user_id come fallback)
UPDATE public.events SET created_by = user_id WHERE created_by IS NULL;

-- 2. Indici per performance
CREATE INDEX IF NOT EXISTS events_assigned_to_idx ON public.events(assigned_to);
CREATE INDEX IF NOT EXISTS events_is_shared_idx ON public.events(is_shared) WHERE is_shared = true;
CREATE INDEX IF NOT EXISTS events_created_by_idx ON public.events(created_by);

-- 3. Elimina policy esistenti
DROP POLICY IF EXISTS "Users can view their own events" ON public.events;
DROP POLICY IF EXISTS "Users can insert their own events" ON public.events;
DROP POLICY IF EXISTS "Users can update their own events" ON public.events;
DROP POLICY IF EXISTS "Users can delete their own events" ON public.events;

-- 4. Nuove policy: utente vede propri eventi + eventi assegnati a lui + eventi condivisi
CREATE POLICY "Users can view their events"
  ON public.events FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.uid() = assigned_to
    OR is_shared = true
  );

CREATE POLICY "Users can insert their own events"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update events they own or are assigned to"
  ON public.events FOR UPDATE
  USING (
    auth.uid() = user_id
    OR auth.uid() = assigned_to
  );

CREATE POLICY "Users can delete their own events"
  ON public.events FOR DELETE
  USING (auth.uid() = user_id);
