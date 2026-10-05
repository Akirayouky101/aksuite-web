-- Recurring reminders for notes and payments.
ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS recurrence_type TEXT CHECK (recurrence_type IN ('daily', 'weekly', 'monthly', 'yearly')),
  ADD COLUMN IF NOT EXISTS recurrence_until TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS recurrence_type TEXT CHECK (recurrence_type IN ('daily', 'weekly', 'monthly', 'yearly')),
  ADD COLUMN IF NOT EXISTS recurrence_until TIMESTAMP WITH TIME ZONE;

CREATE OR REPLACE FUNCTION public.advance_recurring_reminder(p_source_type TEXT, p_source_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_reminder TIMESTAMP WITH TIME ZONE;
  recurrence TEXT;
  recurrence_end TIMESTAMP WITH TIME ZONE;
  next_reminder TIMESTAMP WITH TIME ZONE;
BEGIN
  IF p_source_type NOT IN ('note', 'payment') THEN RETURN; END IF;

  EXECUTE format('SELECT reminder_at, recurrence_type, recurrence_until FROM public.%I WHERE id = $1', CASE p_source_type WHEN 'note' THEN 'notes' ELSE 'payments' END)
    INTO current_reminder, recurrence, recurrence_end
    USING p_source_id;

  IF recurrence IS NULL OR current_reminder IS NULL THEN RETURN; END IF;
  next_reminder := CASE recurrence
    WHEN 'daily' THEN current_reminder + INTERVAL '1 day'
    WHEN 'weekly' THEN current_reminder + INTERVAL '1 week'
    WHEN 'monthly' THEN current_reminder + INTERVAL '1 month'
    WHEN 'yearly' THEN current_reminder + INTERVAL '1 year'
  END;
  IF recurrence_end IS NOT NULL AND next_reminder > recurrence_end THEN RETURN; END IF;

  EXECUTE format('UPDATE public.%I SET reminder_at = $1, updated_at = NOW() WHERE id = $2', CASE p_source_type WHEN 'note' THEN 'notes' ELSE 'payments' END)
    USING next_reminder, p_source_id;
END;
$$;