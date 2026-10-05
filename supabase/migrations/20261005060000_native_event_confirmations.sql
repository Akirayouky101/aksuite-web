BEGIN;
ALTER TABLE public.push_devices
  ADD COLUMN event_confirmations boolean NOT NULL DEFAULT false;
COMMIT;
