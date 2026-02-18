-- ===================================================================
-- FIX: Permetti all'admin di leggere TUTTI i profili
-- Esegui su Supabase SQL Editor
-- ===================================================================

-- 1. Aggiorna policy SELECT su profiles: admin puo' leggere tutti
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile or admin" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id
    OR auth.uid() = '3740d43e-4020-4020-8582-ad305f9d06b4'::uuid
  );

-- 2. Aggiungi policy UPDATE per admin (puo' aggiornare tutti)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile or admin" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id
    OR auth.uid() = '3740d43e-4020-4020-8582-ad305f9d06b4'::uuid
  );

-- 3. Verifica: conta i profili (dovrebbe essere > 1)
SELECT count(*) as total_profiles FROM public.profiles;
