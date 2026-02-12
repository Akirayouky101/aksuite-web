-- Item Relations Table - Universal linking system
-- Links any entity type to any other entity type (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.item_relations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Source entity (the "from" item)
  source_type TEXT NOT NULL, -- 'password', 'call', 'task', 'note', 'event', 'transaction'
  source_id UUID NOT NULL,
  
  -- Target entity (the "to" item)
  target_type TEXT NOT NULL, -- 'password', 'call', 'task', 'note', 'event', 'transaction'
  target_id UUID NOT NULL,
  
  -- Relation metadata
  relation_type TEXT DEFAULT 'related', -- 'related', 'depends_on', 'blocks', 'duplicates', 'implements', etc.
  notes TEXT, -- Optional notes about the relationship
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure no duplicate relations
  CONSTRAINT unique_relation UNIQUE (user_id, source_type, source_id, target_type, target_id)
);

-- Enable Row Level Security
ALTER TABLE public.item_relations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own relations"
  ON public.item_relations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own relations"
  ON public.item_relations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own relations"
  ON public.item_relations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own relations"
  ON public.item_relations FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS item_relations_user_id_idx ON public.item_relations(user_id);
CREATE INDEX IF NOT EXISTS item_relations_source_idx ON public.item_relations(source_type, source_id);
CREATE INDEX IF NOT EXISTS item_relations_target_idx ON public.item_relations(target_type, target_id);
CREATE INDEX IF NOT EXISTS item_relations_type_idx ON public.item_relations(relation_type);

-- Create composite index for faster lookups
CREATE INDEX IF NOT EXISTS item_relations_composite_idx ON public.item_relations(user_id, source_type, source_id);
