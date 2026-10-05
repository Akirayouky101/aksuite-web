-- Fix existing call push reminders: calls store the date and time separately.
CREATE OR REPLACE FUNCTION public.sync_call_push_reminder() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM push_reminders WHERE source_type = 'call' AND source_id = NEW.id;
  IF NEW.follow_up AND ((NEW.follow_up_date + COALESCE(NEW.follow_up_time, '09:00'::time)) AT TIME ZONE 'Europe/Rome') > NOW() THEN
    INSERT INTO push_reminders (source_type, source_id, user_id, reminder_at, title, body)
    VALUES ('call', NEW.id, NEW.user_id, (NEW.follow_up_date + COALESCE(NEW.follow_up_time, '09:00'::time)) AT TIME ZONE 'Europe/Rome', 'Richiamo programmato', 'Richiamare ' || NEW.caller_name);
  END IF;
  RETURN NEW;
END; $$;

INSERT INTO push_reminders (source_type, source_id, user_id, reminder_at, title, body)
SELECT 'call', id, user_id, (follow_up_date + COALESCE(follow_up_time, '09:00'::time)) AT TIME ZONE 'Europe/Rome', 'Richiamo programmato', 'Richiamare ' || caller_name
FROM calls
WHERE follow_up AND ((follow_up_date + COALESCE(follow_up_time, '09:00'::time)) AT TIME ZONE 'Europe/Rome') > NOW()
ON CONFLICT (source_type, source_id, user_id) DO UPDATE
SET reminder_at = EXCLUDED.reminder_at, title = EXCLUDED.title, body = EXCLUDED.body, claimed_at = NULL, sent_at = NULL, last_error = NULL;