BEGIN;

CREATE TABLE public.shopping_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 120),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX shopping_lists_owner_idx ON public.shopping_lists (user_id, created_at DESC);

CREATE TABLE public.shopping_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 160),
  quantity text NOT NULL DEFAULT '' CHECK (char_length(quantity) <= 60),
  notes text NOT NULL DEFAULT '' CHECK (char_length(notes) <= 1000),
  purchased boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX shopping_items_list_idx ON public.shopping_items (list_id, created_at);

ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.shopping_lists, public.shopping_items FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopping_lists, public.shopping_items TO authenticated;
GRANT ALL ON public.shopping_lists, public.shopping_items TO service_role;

CREATE POLICY shopping_lists_owner ON public.shopping_lists
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY shopping_items_owner ON public.shopping_items
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.shopping_lists list
    WHERE list.id = shopping_items.list_id AND list.user_id = (SELECT auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.shopping_lists list
    WHERE list.id = shopping_items.list_id AND list.user_id = (SELECT auth.uid())
  ));

COMMIT;
