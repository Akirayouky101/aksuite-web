CREATE TABLE IF NOT EXISTS public.push_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_token TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'ios' CHECK (platform IN ('ios')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, device_token)
);

ALTER TABLE public.push_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own push devices"
  ON public.push_devices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can register own push devices"
  ON public.push_devices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own push devices"
  ON public.push_devices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own push devices"
  ON public.push_devices FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS push_devices_user_id_idx ON public.push_devices(user_id);