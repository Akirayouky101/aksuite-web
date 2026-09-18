CREATE TABLE IF NOT EXISTS public.password_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.password_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, parent_id, name)
);

ALTER TABLE public.password_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own password categories"
  ON public.password_categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own password categories"
  ON public.password_categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own password categories"
  ON public.password_categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own password categories"
  ON public.password_categories FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS password_categories_user_id_idx ON public.password_categories(user_id);
CREATE INDEX IF NOT EXISTS password_categories_parent_id_idx ON public.password_categories(parent_id);