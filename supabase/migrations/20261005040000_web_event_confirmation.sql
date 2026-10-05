BEGIN;
CREATE TABLE public.web_push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE CHECK (endpoint LIKE 'https://%'),
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.web_push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage own web push subscriptions" ON public.web_push_subscriptions FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX web_push_owner_idx ON public.web_push_subscriptions (user_id);

CREATE TABLE public.event_confirmation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  due_at timestamptz NOT NULL,
  sent_at timestamptz,
  claimed_at timestamptz,
  lease_id uuid,
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  UNIQUE (event_id, user_id)
);
ALTER TABLE public.event_confirmation_queue ENABLE ROW LEVEL SECURITY;
CREATE INDEX event_confirmation_due_idx ON public.event_confirmation_queue (due_at) WHERE sent_at IS NULL;

CREATE FUNCTION public.event_confirmation_due(start_at timestamptz, end_at timestamptz, whole_day boolean)
RETURNS timestamptz LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE WHEN whole_day THEN
    (((COALESCE(end_at, start_at) AT TIME ZONE 'Europe/Rome')::date + 1)::timestamp AT TIME ZONE 'Europe/Rome')
    ELSE COALESCE(end_at, start_at) END;
$$;
CREATE FUNCTION public.queue_event_confirmation() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND
     (NEW.start_date, NEW.end_date, NEW.all_day, NEW.user_id, NEW.assigned_to, NEW.is_completed)
       IS NOT DISTINCT FROM (OLD.start_date, OLD.end_date, OLD.all_day, OLD.user_id, OLD.assigned_to, OLD.is_completed) THEN
    RETURN NEW;
  END IF;
  DELETE FROM public.event_confirmation_queue WHERE event_id = NEW.id;
  IF NOT NEW.is_completed THEN
    IF NEW.user_id IS NOT NULL THEN
      INSERT INTO public.event_confirmation_queue(event_id, user_id, due_at)
      VALUES (NEW.id, NEW.user_id, public.event_confirmation_due(NEW.start_date, NEW.end_date, NEW.all_day));
    END IF;
    IF NEW.assigned_to IS NOT NULL AND NEW.assigned_to IS DISTINCT FROM NEW.user_id THEN
      INSERT INTO public.event_confirmation_queue(event_id, user_id, due_at)
      VALUES (NEW.id, NEW.assigned_to, public.event_confirmation_due(NEW.start_date, NEW.end_date, NEW.all_day));
    END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER events_queue_confirmation AFTER INSERT OR UPDATE OF start_date, end_date, all_day, user_id, assigned_to, is_completed
ON public.events FOR EACH ROW EXECUTE FUNCTION public.queue_event_confirmation();
INSERT INTO public.event_confirmation_queue(event_id,user_id,due_at)
SELECT id,user_id,public.event_confirmation_due(start_date,end_date,all_day) FROM public.events
WHERE user_id IS NOT NULL AND NOT is_completed AND public.event_confirmation_due(start_date,end_date,all_day) > now();
INSERT INTO public.event_confirmation_queue(event_id,user_id,due_at)
SELECT id,assigned_to,public.event_confirmation_due(start_date,end_date,all_day) FROM public.events
WHERE NOT is_completed AND assigned_to IS NOT NULL AND assigned_to IS DISTINCT FROM user_id
  AND public.event_confirmation_due(start_date,end_date,all_day) > now();

CREATE FUNCTION public.claim_event_confirmations() RETURNS TABLE(
  queue_id uuid, event_id uuid, user_id uuid, lease_id uuid, title text
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY WITH pending AS (
    SELECT q.id FROM public.event_confirmation_queue q
    WHERE q.sent_at IS NULL AND q.due_at <= now()
      AND (q.claimed_at IS NULL OR q.claimed_at < now() - interval '5 minutes')
      AND q.attempts < 12
    ORDER BY q.due_at LIMIT 5 FOR UPDATE SKIP LOCKED
  ), claimed AS (
    UPDATE public.event_confirmation_queue q SET claimed_at = now(), lease_id = gen_random_uuid(), attempts = q.attempts + 1
    FROM pending p WHERE q.id = p.id
    RETURNING q.*
  )
  SELECT q.id, q.event_id, q.user_id, q.lease_id, e.title FROM claimed q
  JOIN public.events e ON e.id = q.event_id WHERE NOT e.is_completed;
END; $$;
REVOKE ALL ON FUNCTION public.claim_event_confirmations() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_event_confirmations() TO service_role;
COMMIT;
