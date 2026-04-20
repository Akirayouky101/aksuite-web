-- ══════════════════════════════════════════════════════════════
-- TICKET CATEGORIE + ALLEGATI
-- Esegui in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════

-- Aggiunge colonna categoria ai ticket
-- ordine | preventivo | assistenza | documentazione | chiamata
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'assistenza';

-- Per categoria "chiamata": direzione (in | out)
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS call_direction TEXT;  -- 'in' | 'out' | NULL

-- Per categoria "preventivo": riferimento al preventivo esistente
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS preventivo_id UUID REFERENCES public.preventivi(id) ON DELETE SET NULL;
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS preventivo_numero TEXT;  -- snapshot del numero

CREATE INDEX IF NOT EXISTS idx_tickets_category ON public.tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_preventivo_id ON public.tickets(preventivo_id);

-- ──────────────────────────────────────────────────────────────
-- Tabella allegati ticket
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ticket_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_by_name TEXT,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  storage_path TEXT NOT NULL,   -- path nel bucket Supabase Storage
  public_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket_id ON public.ticket_attachments(ticket_id);

ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;

-- Stessi utenti che vedono il ticket possono vedere gli allegati
DROP POLICY IF EXISTS "ticket_attachments_select" ON public.ticket_attachments;
CREATE POLICY "ticket_attachments_select" ON public.ticket_attachments FOR SELECT USING (
  ticket_id IN (
    SELECT id FROM public.tickets
    WHERE
      auth.uid() = user_id
      OR auth.uid() = created_by
      OR auth.uid() IN (SELECT user_id FROM public.ticket_assignees WHERE ticket_id = tickets.id)
      OR auth.uid() IN (SELECT user_id FROM public.user_permissions WHERE is_admin = true)
  )
);

DROP POLICY IF EXISTS "ticket_attachments_insert" ON public.ticket_attachments;
CREATE POLICY "ticket_attachments_insert" ON public.ticket_attachments FOR INSERT WITH CHECK (
  auth.uid() = uploaded_by
);

DROP POLICY IF EXISTS "ticket_attachments_delete" ON public.ticket_attachments;
CREATE POLICY "ticket_attachments_delete" ON public.ticket_attachments FOR DELETE USING (
  auth.uid() = uploaded_by
  OR auth.uid() IN (SELECT user_id FROM public.user_permissions WHERE is_admin = true)
);
