-- Add pin_code, notes, and is_favorite columns to passwords table
-- Execute this in the Supabase SQL Editor

ALTER TABLE public.passwords 
ADD COLUMN IF NOT EXISTS pin_code TEXT DEFAULT NULL;

ALTER TABLE public.passwords 
ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL;

ALTER TABLE public.passwords 
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;
