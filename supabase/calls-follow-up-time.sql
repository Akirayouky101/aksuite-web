ALTER TABLE public.calls
  ADD COLUMN IF NOT EXISTS follow_up_time TIME;

CREATE INDEX IF NOT EXISTS calls_follow_up_datetime_idx
  ON public.calls(follow_up_date, follow_up_time)
  WHERE follow_up = true;