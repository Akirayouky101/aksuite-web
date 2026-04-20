-- ══════════════════════════════════════════════════════════════
-- SISTEMA TICKET INTERNO
-- Esegui in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════

-- Tabella ticket
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'aperto',       -- aperto | in_corso | completato | chiuso
  priority TEXT NOT NULL DEFAULT 'normale',     -- bassa | normale | alta | urgente
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name TEXT,                         -- nome snapshot al momento della creazione
  due_date DATE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- owner RLS
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabella assegnatari (molti-a-molti)
CREATE TABLE IF NOT EXISTS public.ticket_assignees (
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,                               -- nome snapshot
  assigned_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (ticket_id, user_id)
);

-- Permesso can_tickets nella tabella user_permissions
ALTER TABLE public.user_permissions
  ADD COLUMN IF NOT EXISTS can_tickets BOOLEAN NOT NULL DEFAULT false;

-- Indici
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_ticket_assignees_user_id ON public.ticket_assignees(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_assignees_ticket_id ON public.ticket_assignees(ticket_id);

-- RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_assignees ENABLE ROW LEVEL SECURITY;

-- Policy tickets: l'utente vede i ticket creati da lui O assegnati a lui O è admin
DROP POLICY IF EXISTS "tickets_select" ON public.tickets;
CREATE POLICY "tickets_select" ON public.tickets FOR SELECT USING (
  auth.uid() = user_id
  OR auth.uid() = created_by
  OR auth.uid() IN (SELECT user_id FROM public.ticket_assignees WHERE ticket_id = tickets.id)
  OR auth.uid() IN (SELECT user_id FROM public.user_permissions WHERE is_admin = true)
);

DROP POLICY IF EXISTS "tickets_insert" ON public.tickets;
CREATE POLICY "tickets_insert" ON public.tickets FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "tickets_update" ON public.tickets;
CREATE POLICY "tickets_update" ON public.tickets FOR UPDATE USING (
  auth.uid() = user_id
  OR auth.uid() = created_by
  OR auth.uid() IN (SELECT user_id FROM public.user_permissions WHERE is_admin = true)
);

DROP POLICY IF EXISTS "tickets_delete" ON public.tickets;
CREATE POLICY "tickets_delete" ON public.tickets FOR DELETE USING (
  auth.uid() = user_id
  OR auth.uid() = created_by
  OR auth.uid() IN (SELECT user_id FROM public.user_permissions WHERE is_admin = true)
);

-- Policy ticket_assignees
DROP POLICY IF EXISTS "ticket_assignees_select" ON public.ticket_assignees;
CREATE POLICY "ticket_assignees_select" ON public.ticket_assignees FOR SELECT USING (true);

DROP POLICY IF EXISTS "ticket_assignees_insert" ON public.ticket_assignees;
CREATE POLICY "ticket_assignees_insert" ON public.ticket_assignees FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "ticket_assignees_delete" ON public.ticket_assignees;
CREATE POLICY "ticket_assignees_delete" ON public.ticket_assignees FOR DELETE USING (true);
