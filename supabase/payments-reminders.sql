-- Explicit payment reminders for the native iOS app.
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS reminder_at TIMESTAMP WITH TIME ZONE;