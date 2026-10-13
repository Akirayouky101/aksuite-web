ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS parent_client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS clients_parent_client_idx
  ON public.clients(parent_client_id);

CREATE TABLE IF NOT EXISTS public.work_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'work' CHECK (kind IN ('work', 'todo')),
  checklist_source_id UUID REFERENCES public.work_items(id) ON DELETE SET NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'waiting', 'completed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  due_date DATE,
  next_action TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  materials JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.work_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own work items" ON public.work_items;
CREATE POLICY "Users manage own work items"
  ON public.work_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS work_items_user_status_idx
  ON public.work_items(user_id, status, due_date);

CREATE INDEX IF NOT EXISTS work_items_client_idx
  ON public.work_items(client_id);

CREATE INDEX IF NOT EXISTS work_items_checklist_source_idx
  ON public.work_items(checklist_source_id)
  WHERE checklist_source_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.validate_work_item_checklist_source() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE source_checklist jsonb;
BEGIN
  IF NEW.checklist_source_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.kind <> 'work' OR NEW.checklist_source_id = NEW.id THEN
    RAISE EXCEPTION 'A checklist can only be linked to a work item';
  END IF;
  SELECT checklist INTO source_checklist
  FROM public.work_items
  WHERE id = NEW.checklist_source_id AND user_id = NEW.user_id AND kind = 'todo';
  IF NOT FOUND THEN RAISE EXCEPTION 'Checklist source not found'; END IF;
  NEW.checklist := source_checklist;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.sync_linked_work_item_checklists() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.kind = 'todo' AND NEW.checklist IS DISTINCT FROM OLD.checklist THEN
    UPDATE public.work_items
    SET checklist = NEW.checklist, updated_at = now()
    WHERE checklist_source_id = NEW.id AND checklist IS DISTINCT FROM NEW.checklist;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS work_items_validate_checklist_source ON public.work_items;
CREATE TRIGGER work_items_validate_checklist_source
BEFORE INSERT OR UPDATE OF checklist_source_id ON public.work_items
FOR EACH ROW EXECUTE FUNCTION public.validate_work_item_checklist_source();

DROP TRIGGER IF EXISTS work_items_sync_linked_checklists ON public.work_items;
CREATE TRIGGER work_items_sync_linked_checklists
AFTER UPDATE OF checklist ON public.work_items
FOR EACH ROW EXECUTE FUNCTION public.sync_linked_work_item_checklists();