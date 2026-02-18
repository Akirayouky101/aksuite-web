-- ===================================================================
-- FIX: Unifica i trigger per auth.users per evitare errori
-- "Database error creating new user"
-- Esegui su Supabase SQL Editor
-- ===================================================================

-- 1. Rimuovi entrambi i trigger esistenti
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_permissions ON auth.users;

-- 2. Rimuovi le vecchie funzioni
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS create_default_permissions();

-- 3. Crea una UNICA funzione che fa tutto (profilo + permessi)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Crea profilo
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;

  -- Crea permessi vuoti
  INSERT INTO public.user_permissions (
    user_id, is_admin, 
    can_calls, can_lavorazioni, can_tasks, can_calendar, 
    can_budget, can_passwords, can_notes, can_clients, 
    can_visits, can_suppliers, can_orders, can_warehouse, can_preventivi
  )
  VALUES (
    NEW.id, false,
    false, false, false, false,
    false, false, false, false,
    false, false, false, false, false
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Crea UN solo trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Assicurati che profiles abbia policy INSERT
-- (il trigger usa SECURITY DEFINER quindi bypassa RLS, ma per sicurezza)
DROP POLICY IF EXISTS "Allow insert for new users" ON public.profiles;
CREATE POLICY "Allow insert for new users" ON public.profiles
  FOR INSERT WITH CHECK (true);
