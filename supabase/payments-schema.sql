CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  payment_type TEXT NOT NULL,
  recipient TEXT NOT NULL,
  reason TEXT DEFAULT '',
  is_installment BOOLEAN DEFAULT false,
  payment_mode TEXT NOT NULL DEFAULT 'fixed',
  salary_percentage NUMERIC(5, 2) NOT NULL DEFAULT 20,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  down_payment NUMERIC(12, 2) NOT NULL DEFAULT 0,
  installment_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  installments_count INTEGER NOT NULL DEFAULT 1,
  paid_installments INTEGER[] NOT NULL DEFAULT '{}',
  payers JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT DEFAULT '',
  down_payment_due_date DATE,
  down_payment_paid_at TIMESTAMP WITH TIME ZONE,
  down_payment_payer_payments JSONB NOT NULL DEFAULT '[]'::jsonb,
  installment_schedule JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can update their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can delete their own payments" ON public.payments;
CREATE POLICY "Users can view their own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own payments" ON public.payments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own payments" ON public.payments FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS payments_user_id_idx ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS payments_created_at_idx ON public.payments(created_at DESC);

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payers JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS down_payment_due_date DATE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS down_payment_paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS down_payment_payer_payments JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS installment_schedule JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_mode TEXT NOT NULL DEFAULT 'fixed';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS salary_percentage NUMERIC(5, 2) NOT NULL DEFAULT 20;