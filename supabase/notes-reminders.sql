-- Note reminders for the native iOS app.
ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS reminder_at TIMESTAMP WITH TIME ZONE;