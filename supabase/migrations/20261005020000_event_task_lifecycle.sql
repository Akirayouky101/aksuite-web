BEGIN;
ALTER TABLE public.events
  ADD COLUMN is_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN completed_at timestamptz,
  ADD COLUMN archived_at timestamptz;
ALTER TABLE public.work_items
  ADD COLUMN completed_at timestamptz,
  ADD COLUMN archived_at timestamptz;

UPDATE public.work_items SET completed_at = updated_at WHERE status = 'completed';

CREATE OR REPLACE FUNCTION public.stamp_completion() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE completed boolean; previously_completed boolean;
BEGIN
  IF TG_TABLE_NAME = 'events' THEN
    completed := NEW.is_completed;
    IF TG_OP = 'UPDATE' THEN previously_completed := OLD.is_completed; END IF;
  ELSE
    completed := NEW.status = 'completed';
    IF TG_OP = 'UPDATE' THEN previously_completed := OLD.status = 'completed'; END IF;
  END IF;
  IF completed THEN
    IF TG_OP = 'INSERT' OR NOT previously_completed THEN
      NEW.completed_at := now();
      NEW.archived_at := NULL;
    ELSE
      NEW.completed_at := OLD.completed_at;
    END IF;
  ELSE
    NEW.completed_at := NULL;
    NEW.archived_at := NULL;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER events_stamp_completion BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.stamp_completion();
CREATE TRIGGER work_items_stamp_completion BEFORE INSERT OR UPDATE ON public.work_items
  FOR EACH ROW EXECUTE FUNCTION public.stamp_completion();
CREATE INDEX events_lifecycle_idx ON public.events (is_completed, archived_at, completed_at DESC, id);
CREATE INDEX todo_lifecycle_idx ON public.work_items (user_id, kind, status, archived_at, completed_at DESC, id);

CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('archive-completed-events-todos', '*/5 * * * *', $job$
  UPDATE public.events SET archived_at = now()
  WHERE is_completed AND archived_at IS NULL AND completed_at <= now() - interval '7 days';
  UPDATE public.work_items SET archived_at = now()
  WHERE kind = 'todo' AND status = 'completed' AND archived_at IS NULL AND completed_at <= now() - interval '7 days';
$job$);

-- Completed appointments must no longer generate pre-event reminders.
CREATE OR REPLACE FUNCTION public.sync_calendar_reminders() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.calendar_reminders WHERE event_id = NEW.id;
  IF NOT NEW.is_completed AND NEW.reminder_minutes > 0 AND NEW.start_date > now() THEN
    IF NEW.user_id IS NOT NULL THEN
      INSERT INTO public.calendar_reminders (event_id, user_id, reminder_at)
      VALUES (NEW.id, NEW.user_id, NEW.start_date - NEW.reminder_minutes * interval '1 minute');
    END IF;
    IF NEW.assigned_to IS NOT NULL AND NEW.assigned_to IS DISTINCT FROM NEW.user_id THEN
      INSERT INTO public.calendar_reminders (event_id, user_id, reminder_at)
      VALUES (NEW.id, NEW.assigned_to, NEW.start_date - NEW.reminder_minutes * interval '1 minute');
    END IF;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER sync_calendar_reminders_on_event ON public.events;
CREATE TRIGGER sync_calendar_reminders_on_event
  AFTER INSERT OR UPDATE OF start_date, reminder_minutes, user_id, assigned_to, is_completed ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.sync_calendar_reminders();
CREATE OR REPLACE FUNCTION public.search_completed_history(
  term text, date_from timestamptz DEFAULT NULL, date_until timestamptz DEFAULT NULL,
  cursor_time timestamptz DEFAULT NULL, cursor_id uuid DEFAULT NULL, cursor_kind text DEFAULT NULL
) RETURNS TABLE(kind text, item jsonb, completion_time timestamptz, item_id uuid)
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public AS $$
BEGIN
  IF length(trim(term)) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'Search text must contain 1-200 characters'; END IF;
  RETURN QUERY
  WITH history AS (
    SELECT 'event'::text AS k, to_jsonb(e) AS payload, e.completed_at AS t, e.id AS key,
      lower(concat_ws(' ', e.title, e.description, e.location)) AS searchable
      FROM public.events e WHERE e.is_completed
    UNION ALL
    SELECT 'todo', to_jsonb(w), w.completed_at, w.id, lower(concat_ws(' ', w.title, w.description, w.notes, w.next_action, w.checklist::text))
      FROM public.work_items w WHERE w.kind = 'todo' AND w.status = 'completed'
  )
  SELECT h.k, h.payload, h.t, h.key FROM history h
  WHERE position(lower(trim(term)) in h.searchable) > 0
    AND (date_from IS NULL OR h.t >= date_from)
    AND (date_until IS NULL OR h.t <= date_until)
    AND (cursor_time IS NULL OR (h.t, h.key, h.k) < (cursor_time, cursor_id, cursor_kind))
  ORDER BY h.t DESC, h.key DESC, h.k DESC LIMIT 6;
END; $$;
REVOKE ALL ON FUNCTION public.search_completed_history(text,timestamptz,timestamptz,timestamptz,uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_completed_history(text,timestamptz,timestamptz,timestamptz,uuid,text) TO authenticated;
COMMIT;
