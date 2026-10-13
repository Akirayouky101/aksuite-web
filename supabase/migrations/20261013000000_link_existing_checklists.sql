ALTER TABLE public.work_items
  ADD COLUMN IF NOT EXISTS checklist_source_id uuid REFERENCES public.work_items(id) ON DELETE SET NULL;

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
