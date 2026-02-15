-- Add image_url to lavorazioni_timeline
ALTER TABLE lavorazioni_timeline ADD COLUMN IF NOT EXISTS image_url text;

-- Create storage bucket for timeline photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('timeline-photos', 'timeline-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Users can upload timeline photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'timeline-photos');

-- Allow authenticated users to read
CREATE POLICY "Users can read timeline photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'timeline-photos');

-- Allow users to delete their own photos
CREATE POLICY "Users can delete own timeline photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'timeline-photos');
