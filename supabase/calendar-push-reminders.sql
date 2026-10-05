-- Calendar push reminders
-- Apply this after events-schema.sql and push-devices.sql.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE TABLE IF NOT EXISTS public.calendar_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_at TIMESTAMP WITH TIME ZONE NOT NULL,
  claimed_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.calendar_reminders ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS calendar_reminders_due_idx
  ON public.calendar_reminders(reminder_at)
  WHERE sent_at IS NULL;

CREATE OR REPLACE FUNCTION public.sync_calendar_reminders()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.calendar_reminders WHERE event_id = NEW.id;

  IF NEW.reminder_minutes > 0 AND NEW.start_date > NOW() THEN
    INSERT INTO public.calendar_reminders (event_id, user_id, reminder_at)
    VALUES (NEW.id, NEW.user_id, NEW.start_date - (NEW.reminder_minutes * INTERVAL '1 minute'));

    IF NEW.assigned_to IS NOT NULL AND NEW.assigned_to <> NEW.user_id THEN
      INSERT INTO public.calendar_reminders (event_id, user_id, reminder_at)
      VALUES (NEW.id, NEW.assigned_to, NEW.start_date - (NEW.reminder_minutes * INTERVAL '1 minute'));
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_calendar_reminders_on_event ON public.events;
CREATE TRIGGER sync_calendar_reminders_on_event
  AFTER INSERT OR UPDATE OF start_date, reminder_minutes, user_id, assigned_to ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.sync_calendar_reminders();

INSERT INTO public.calendar_reminders (event_id, user_id, reminder_at)
SELECT event.id, event.user_id, event.start_date - (event.reminder_minutes * INTERVAL '1 minute')
FROM public.events AS event
WHERE event.reminder_minutes > 0
  AND event.start_date > NOW()
ON CONFLICT (event_id, user_id) DO UPDATE
SET reminder_at = EXCLUDED.reminder_at,
    claimed_at = NULL,
    sent_at = NULL,
    last_error = NULL;

INSERT INTO public.calendar_reminders (event_id, user_id, reminder_at)
SELECT event.id, event.assigned_to, event.start_date - (event.reminder_minutes * INTERVAL '1 minute')
FROM public.events AS event
WHERE event.reminder_minutes > 0
  AND event.start_date > NOW()
  AND event.assigned_to IS NOT NULL
  AND event.assigned_to <> event.user_id
ON CONFLICT (event_id, user_id) DO UPDATE
SET reminder_at = EXCLUDED.reminder_at,
    claimed_at = NULL,
    sent_at = NULL,
    last_error = NULL;

CREATE OR REPLACE FUNCTION public.claim_calendar_reminders(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (reminder_id UUID, event_id UUID, user_id UUID, title TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH due_reminders AS (
    SELECT reminder.id
    FROM public.calendar_reminders AS reminder
    WHERE reminder.sent_at IS NULL
      AND reminder.reminder_at <= NOW()
      AND (reminder.claimed_at IS NULL OR reminder.claimed_at < NOW() - INTERVAL '5 minutes')
    ORDER BY reminder.reminder_at
    LIMIT LEAST(GREATEST(p_limit, 1), 100)
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.calendar_reminders AS reminder
  SET claimed_at = NOW(), attempts = reminder.attempts + 1
  FROM due_reminders, public.events AS event
  WHERE reminder.id = due_reminders.id
    AND event.id = reminder.event_id
  RETURNING reminder.id, reminder.event_id, reminder.user_id, event.title;
$$;

-- Replace YOUR_PROJECT_REF with the subdomain from your Supabase project URL.
-- Add the service role key once with:
-- SELECT vault.create_secret('YOUR_SERVICE_ROLE_KEY', 'calendar_reminders_service_key');
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'calendar-push-reminders';

SELECT cron.schedule(
  'calendar-push-reminders',
  '* * * * *',
  $job$
    SELECT net.http_post(
      url := 'https://tecvggqaunfbelqksghj.supabase.co/functions/v1/calendar-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          SELECT decrypted_secret
          FROM vault.decrypted_secrets
          WHERE name = 'calendar_reminders_service_key'
          LIMIT 1
        )
      ),
      body := '{}'::jsonb
    );
  $job$
);