ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS work_item_id UUID REFERENCES public.work_items(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS events_work_item_id_idx ON public.events(work_item_id);