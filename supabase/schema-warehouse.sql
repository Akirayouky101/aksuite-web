-- ============================================
-- AKSUITE - SISTEMA MAGAZZINO / ORDINI / FORNITORI
-- ============================================

-- ═══ FORNITORI ═══
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  category TEXT DEFAULT 'generale',
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  phone2 TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  zip_code TEXT,
  province TEXT,
  country TEXT DEFAULT 'Italia',
  vat_number TEXT,
  fiscal_code TEXT,
  payment_terms TEXT,
  notes TEXT,
  is_favorite BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own suppliers" ON public.suppliers FOR ALL USING (auth.uid() = user_id);

-- ═══ PRODOTTI MAGAZZINO ═══
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  barcode TEXT,
  qr_code TEXT,
  category TEXT DEFAULT 'generale',
  subcategory TEXT,
  brand TEXT,
  model TEXT,
  unit TEXT DEFAULT 'pz',
  quantity INTEGER DEFAULT 0,
  min_quantity INTEGER DEFAULT 0,
  max_quantity INTEGER,
  location TEXT,
  shelf TEXT,
  purchase_price DECIMAL(12,2) DEFAULT 0,
  sell_price DECIMAL(12,2) DEFAULT 0,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  image_url TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own products" ON public.products FOR ALL USING (auth.uid() = user_id);

-- ═══ ORDINI ═══
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_number TEXT,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'bozza' CHECK (status IN ('bozza', 'da_ordinare', 'ordinato', 'in_consegna', 'ricevuto_parziale', 'ricevuto', 'contestato', 'annullato')),
  order_date DATE,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  total_amount DECIMAL(12,2) DEFAULT 0,
  shipping_cost DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'da_pagare' CHECK (payment_status IN ('da_pagare', 'pagato', 'parziale', 'contestato')),
  ddt_number TEXT,
  invoice_number TEXT,
  tracking_number TEXT,
  priority TEXT DEFAULT 'normale' CHECK (priority IN ('bassa', 'normale', 'alta', 'urgente')),
  lavorazione_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own orders" ON public.orders FOR ALL USING (auth.uid() = user_id);

-- ═══ ARTICOLI ORDINE ═══
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_sku TEXT,
  product_barcode TEXT,
  quantity_ordered INTEGER DEFAULT 1,
  quantity_received INTEGER DEFAULT 0,
  unit_price DECIMAL(12,2) DEFAULT 0,
  total_price DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own order items" ON public.order_items FOR ALL USING (auth.uid() = user_id);

-- ═══ MOVIMENTI MAGAZZINO ═══
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('carico', 'scarico', 'reso', 'inventario', 'trasferimento')),
  quantity INTEGER NOT NULL,
  previous_quantity INTEGER DEFAULT 0,
  new_quantity INTEGER DEFAULT 0,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own stock movements" ON public.stock_movements FOR ALL USING (auth.uid() = user_id);
