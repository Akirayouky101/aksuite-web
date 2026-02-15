-- Add 'in_corso' status to calls table
-- Drop old CHECK constraint and add new one with 'in_corso'
ALTER TABLE public.calls DROP CONSTRAINT IF EXISTS calls_status_check;
ALTER TABLE public.calls ADD CONSTRAINT calls_status_check CHECK (status IN ('pending', 'in_corso', 'completed', 'cancelled'));
