-- Add address fields and assigned_to to calls table
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '';
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS zip_code TEXT DEFAULT '';
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS province TEXT DEFAULT '';
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS assigned_to TEXT DEFAULT '';

-- Create team_members table for assignee dropdown
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Team members policies
CREATE POLICY "Users can view own team members"
  ON public.team_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own team members"
  ON public.team_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own team members"
  ON public.team_members FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own team members"
  ON public.team_members FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS team_members_user_id_idx ON public.team_members(user_id);
