-- Push reminders created from web clients: notes, payments, and call follow-ups.
CREATE TABLE IF NOT EXISTS public.push_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_type TEXT NOT NULL CHECK (source_type IN ('note', 'payment', 'call')),
  source_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_at TIMESTAMP WITH TIME ZONE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  claimed_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  UNIQUE(source_type, source_id, user_id)
);

ALTER TABLE public.push_reminders ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS push_reminders_due_idx ON public.push_reminders(reminder_at) WHERE sent_at IS NULL;

CREATE OR REPLACE FUNCTION public.sync_note_push_reminder() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM push_reminders WHERE source_type = 'note' AND source_id = NEW.id;
  IF NEW.reminder_at > NOW() THEN INSERT INTO push_reminders (source_type, source_id, user_id, reminder_at, title, body) VALUES ('note', NEW.id, NEW.user_id, NEW.reminder_at, 'Nota', NEW.title); END IF;
  RETURN NEW;
END; $$;
CREATE OR REPLACE FUNCTION public.sync_payment_push_reminder() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM push_reminders WHERE source_type = 'payment' AND source_id = NEW.id;
  IF NEW.reminder_at > NOW() THEN INSERT INTO push_reminders (source_type, source_id, user_id, reminder_at, title, body) VALUES ('payment', NEW.id, NEW.user_id, NEW.reminder_at, 'Pagamento in scadenza', NEW.payment_type || ' · ' || NEW.recipient); END IF;
  RETURN NEW;
END; $$;
CREATE OR REPLACE FUNCTION public.sync_call_push_reminder() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM push_reminders WHERE source_type = 'call' AND source_id = NEW.id;
  IF NEW.follow_up AND ((NEW.follow_up_date + COALESCE(NEW.follow_up_time, '09:00'::time)) AT TIME ZONE 'Europe/Rome') > NOW() THEN INSERT INTO push_reminders (source_type, source_id, user_id, reminder_at, title, body) VALUES ('call', NEW.id, NEW.user_id, (NEW.follow_up_date + COALESCE(NEW.follow_up_time, '09:00'::time)) AT TIME ZONE 'Europe/Rome', 'Richiamo programmato', 'Richiamare ' || NEW.caller_name); END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS sync_note_push_reminder_on_note ON public.notes;
CREATE TRIGGER sync_note_push_reminder_on_note AFTER INSERT OR UPDATE OF reminder_at, title ON public.notes FOR EACH ROW EXECUTE FUNCTION public.sync_note_push_reminder();
DROP TRIGGER IF EXISTS sync_payment_push_reminder_on_payment ON public.payments;
CREATE TRIGGER sync_payment_push_reminder_on_payment AFTER INSERT OR UPDATE OF reminder_at, payment_type, recipient ON public.payments FOR EACH ROW EXECUTE FUNCTION public.sync_payment_push_reminder();
DROP TRIGGER IF EXISTS sync_call_push_reminder_on_call ON public.calls;
CREATE TRIGGER sync_call_push_reminder_on_call AFTER INSERT OR UPDATE OF follow_up, follow_up_date, caller_name ON public.calls FOR EACH ROW EXECUTE FUNCTION public.sync_call_push_reminder();

INSERT INTO push_reminders (source_type, source_id, user_id, reminder_at, title, body)
SELECT 'note', id, user_id, reminder_at, 'Nota', title FROM notes WHERE reminder_at > NOW()
ON CONFLICT (source_type, source_id, user_id) DO UPDATE SET reminder_at = EXCLUDED.reminder_at, title = EXCLUDED.title, body = EXCLUDED.body, claimed_at = NULL, sent_at = NULL, last_error = NULL;
INSERT INTO push_reminders (source_type, source_id, user_id, reminder_at, title, body)
SELECT 'payment', id, user_id, reminder_at, 'Pagamento in scadenza', payment_type || ' · ' || recipient FROM payments WHERE reminder_at > NOW()
ON CONFLICT (source_type, source_id, user_id) DO UPDATE SET reminder_at = EXCLUDED.reminder_at, title = EXCLUDED.title, body = EXCLUDED.body, claimed_at = NULL, sent_at = NULL, last_error = NULL;
INSERT INTO push_reminders (source_type, source_id, user_id, reminder_at, title, body)
SELECT 'call', id, user_id, (follow_up_date + COALESCE(follow_up_time, '09:00'::time)) AT TIME ZONE 'Europe/Rome', 'Richiamo programmato', 'Richiamare ' || caller_name FROM calls WHERE follow_up AND ((follow_up_date + COALESCE(follow_up_time, '09:00'::time)) AT TIME ZONE 'Europe/Rome') > NOW()
ON CONFLICT (source_type, source_id, user_id) DO UPDATE SET reminder_at = EXCLUDED.reminder_at, title = EXCLUDED.title, body = EXCLUDED.body, claimed_at = NULL, sent_at = NULL, last_error = NULL;

CREATE OR REPLACE FUNCTION public.claim_push_reminders(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (reminder_id UUID, source_type TEXT, source_id UUID, user_id UUID, title TEXT, body TEXT)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  WITH due AS (SELECT id FROM push_reminders WHERE sent_at IS NULL AND reminder_at <= NOW() AND (claimed_at IS NULL OR claimed_at < NOW() - INTERVAL '5 minutes') ORDER BY reminder_at LIMIT LEAST(GREATEST(p_limit, 1), 100) FOR UPDATE SKIP LOCKED)
  UPDATE push_reminders reminder SET claimed_at = NOW(), attempts = reminder.attempts + 1 FROM due WHERE reminder.id = due.id
  RETURNING reminder.id, reminder.source_type, reminder.source_id, reminder.user_id, reminder.title, reminder.body;
$$;