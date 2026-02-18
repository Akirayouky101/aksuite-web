-- ═══════════════════════════════════════════════════════════════
-- FIX: Rimuovi policy ricorsiva e ricrea senza ricorsione
-- Esegui su Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. Rimuovi le policy esistenti (causano ricorsione infinita)
DROP POLICY IF EXISTS "admin_full_access" ON user_permissions;
DROP POLICY IF EXISTS "users_read_own_permissions" ON user_permissions;

-- 2. Policy SELECT: ogni utente legge i propri permessi
-- L'admin (hardcoded) legge tutti
CREATE POLICY "select_own_or_admin" ON user_permissions
  FOR SELECT USING (
    auth.uid() = user_id
    OR auth.uid() = '3740d43e-4020-4020-8582-ad305f9d06b4'::uuid
  );

-- 3. Policy INSERT: solo admin hardcoded puo' inserire
CREATE POLICY "insert_admin_only" ON user_permissions
  FOR INSERT WITH CHECK (
    auth.uid() = '3740d43e-4020-4020-8582-ad305f9d06b4'::uuid
  );

-- 4. Policy UPDATE: solo admin hardcoded puo' aggiornare
CREATE POLICY "update_admin_only" ON user_permissions
  FOR UPDATE USING (
    auth.uid() = '3740d43e-4020-4020-8582-ad305f9d06b4'::uuid
  );

-- 5. Policy DELETE: solo admin hardcoded puo' eliminare
CREATE POLICY "delete_admin_only" ON user_permissions
  FOR DELETE USING (
    auth.uid() = '3740d43e-4020-4020-8582-ad305f9d06b4'::uuid
  );
