BEGIN;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('photos', 'photos', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']);

CREATE TABLE public.photo_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  note_id uuid REFERENCES public.notes ON DELETE SET NULL,
  work_item_id uuid REFERENCES public.work_items ON DELETE SET NULL,
  checklist_entry_id text,
  storage_path text NOT NULL UNIQUE,
  file_name text NOT NULL CHECK (length(file_name) BETWEEN 1 AND 255),
  content_type text NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes integer NOT NULL CHECK (size_bytes BETWEEN 1 AND 10485760),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (note_id IS NULL OR work_item_id IS NULL),
  CHECK (storage_path = user_id::text || '/' || id::text)
);
ALTER TABLE public.photo_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read and delete photos" ON public.photo_assets FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Owners delete photos" ON public.photo_assets FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Owners attach photos to saved entities" ON public.photo_assets FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid()
  AND (note_id IS NULL OR EXISTS (SELECT 1 FROM public.notes WHERE id = note_id AND user_id = auth.uid()))
  AND (work_item_id IS NULL OR EXISTS (SELECT 1 FROM public.work_items w WHERE w.id = work_item_id AND w.user_id = auth.uid()
    AND (checklist_entry_id IS NULL OR EXISTS (
      SELECT 1 FROM jsonb_array_elements(w.checklist) entry
      WHERE entry->>'id' = checklist_entry_id OR EXISTS (
        SELECT 1 FROM jsonb_array_elements(COALESCE(entry->'steps', '[]'::jsonb)) step WHERE step->>'id' = checklist_entry_id
      )
    ))
  ))
  AND (checklist_entry_id IS NULL OR work_item_id IS NOT NULL)
);
CREATE INDEX photo_assets_history_idx ON public.photo_assets (user_id, created_at DESC, id DESC);
CREATE INDEX photo_assets_work_idx ON public.photo_assets (work_item_id, checklist_entry_id);
CREATE INDEX photo_assets_note_idx ON public.photo_assets (note_id);
CREATE POLICY "Private photo read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Private photo upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Private photo delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);
COMMIT;
