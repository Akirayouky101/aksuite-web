ALTER TABLE public.work_items
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'work';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'work_items_kind_check' AND conrelid = 'public.work_items'::regclass) THEN
    ALTER TABLE public.work_items
      ADD CONSTRAINT work_items_kind_check CHECK (kind IN ('work', 'todo'));
  END IF;
END $$;