BEGIN;
CREATE TABLE public.google_calendar_connections (
  user_id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  google_subject text NOT NULL,
  google_email text NOT NULL,
  credentials text NOT NULL,
  calendar_id text,
  initial_from timestamptz NOT NULL DEFAULT now(),
  sync_token text,
  page_token text,
  full_reset boolean NOT NULL DEFAULT false,
  lease_id uuid,
  lease_until timestamptz,
  last_sync_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.google_calendar_oauth_states (
  state_hash text PRIMARY KEY,
  code_verifier text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE TABLE public.google_calendar_links (
  user_id uuid NOT NULL REFERENCES public.google_calendar_connections ON DELETE CASCADE,
  calendar_id text NOT NULL,
  google_event_id text NOT NULL,
  local_event_id uuid REFERENCES public.events ON DELETE SET NULL,
  original_event_id uuid NOT NULL,
  local_hash text NOT NULL,
  google_etag text NOT NULL,
  recurrence jsonb NOT NULL DEFAULT '[]',
  google_timezone text NOT NULL DEFAULT 'Europe/Rome',
  PRIMARY KEY (user_id, calendar_id, google_event_id),
  UNIQUE(user_id, calendar_id, original_event_id)
);
CREATE TABLE public.google_calendar_outbox (
  user_id uuid NOT NULL REFERENCES public.google_calendar_connections ON DELETE CASCADE,
  event_id uuid NOT NULL,
  target_google_id text,
  version uuid NOT NULL DEFAULT gen_random_uuid(),
  changed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, event_id)
);
ALTER TABLE public.google_calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_calendar_oauth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_calendar_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_calendar_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.google_calendar_connections, public.google_calendar_oauth_states, public.google_calendar_links, public.google_calendar_outbox FROM anon, authenticated;
GRANT ALL ON public.google_calendar_connections, public.google_calendar_oauth_states, public.google_calendar_links, public.google_calendar_outbox TO service_role;

CREATE FUNCTION public.google_calendar_local_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE changed_event_id uuid; changed_owner_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN changed_event_id := OLD.id; changed_owner_id := OLD.user_id;
  ELSE changed_event_id := NEW.id; changed_owner_id := NEW.user_id; END IF;
  IF TG_OP = 'UPDATE' AND (NEW.title, NEW.description, NEW.location, NEW.start_date, NEW.end_date, NEW.all_day, NEW.is_recurring, NEW.recurring_type, NEW.is_completed)
    IS NOT DISTINCT FROM (OLD.title, OLD.description, OLD.location, OLD.start_date, OLD.end_date, OLD.all_day, OLD.is_recurring, OLD.recurring_type, OLD.is_completed) THEN
    RETURN NEW;
  END IF;
  IF EXISTS (SELECT 1 FROM public.google_calendar_connections WHERE user_id = changed_owner_id AND calendar_id IS NOT NULL) THEN
    INSERT INTO public.google_calendar_outbox(user_id,event_id) VALUES(changed_owner_id,changed_event_id)
    ON CONFLICT(user_id,event_id) DO UPDATE SET version = gen_random_uuid(), changed_at = now();
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;
CREATE TRIGGER events_google_calendar_outbox AFTER INSERT OR UPDATE OR DELETE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.google_calendar_local_change();

CREATE FUNCTION public.lock_google_calendar(owner_id uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE lease uuid;
BEGIN
  UPDATE public.google_calendar_connections SET lease_id = gen_random_uuid(), lease_until = now() + interval '2 minutes'
  WHERE user_id = owner_id AND (lease_until IS NULL OR lease_until < now()) RETURNING lease_id INTO lease;
  RETURN lease;
END; $$;
REVOKE ALL ON FUNCTION public.lock_google_calendar(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lock_google_calendar(uuid) TO service_role;

CREATE FUNCTION public.configure_google_calendar(owner_id uuid, chosen_calendar text, from_date timestamptz, lease uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.google_calendar_connections
  SET calendar_id = chosen_calendar, initial_from = from_date, sync_token = NULL, page_token = NULL, full_reset = false, last_error = NULL
  WHERE user_id = owner_id AND lease_id = lease AND lease_until > now();
  IF NOT FOUND THEN RAISE EXCEPTION 'Calendar lock lost'; END IF;
  INSERT INTO public.google_calendar_outbox(user_id,event_id)
    SELECT owner_id,id FROM public.events WHERE user_id = owner_id AND NOT is_completed AND archived_at IS NULL
    ON CONFLICT(user_id,event_id) DO NOTHING;
END; $$;
REVOKE ALL ON FUNCTION public.configure_google_calendar(uuid,text,timestamptz,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.configure_google_calendar(uuid,text,timestamptz,uuid) TO service_role;
COMMIT;
