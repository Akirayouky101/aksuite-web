-- Notes Management Table
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  tags TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT false,
  folder TEXT DEFAULT 'general',
  color TEXT DEFAULT 'blue',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notes"
  ON public.notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes"
  ON public.notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
  ON public.notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON public.notes FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS notes_user_id_idx ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS notes_is_pinned_idx ON public.notes(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS notes_folder_idx ON public.notes(folder);
CREATE INDEX IF NOT EXISTS notes_tags_idx ON public.notes USING GIN(tags);
CREATE INDEX IF NOT EXISTS notes_created_at_idx ON public.notes(created_at DESC);
