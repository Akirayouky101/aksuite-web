-- Create clients table for customer directory/rubrica
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  company TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  phone2 TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  city TEXT DEFAULT '',
  zip_code TEXT DEFAULT '',
  province TEXT DEFAULT '',
  fiscal_code TEXT DEFAULT '',
  vat_number TEXT DEFAULT '',
  category TEXT DEFAULT 'privato',
  notes TEXT DEFAULT '',
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Clients policies
CREATE POLICY "Users can view own clients"
  ON public.clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients"
  ON public.clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
  ON public.clients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
  ON public.clients FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS clients_user_id_idx ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS clients_name_idx ON public.clients(name);
CREATE INDEX IF NOT EXISTS clients_company_idx ON public.clients(company);
CREATE INDEX IF NOT EXISTS clients_city_idx ON public.clients(city);
CREATE INDEX IF NOT EXISTS clients_category_idx ON public.clients(category);
CREATE INDEX IF NOT EXISTS clients_is_favorite_idx ON public.clients(is_favorite) WHERE is_favorite = true;
