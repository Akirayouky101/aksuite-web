-- ══════════════════════════════════════════════════════
-- MIGRATION v3: warehouse_requests
-- 1. Funzione get_warehouse_users() — restituisce solo utenti con can_warehouse=true
--    (SECURITY DEFINER: bypassа RLS su user_permissions, leggibile da tutti gli autenticati)
-- 2. Policy DELETE per admin — solo l'owner del sistema può cancellare dal DB
-- ══════════════════════════════════════════════════════

-- ─── 1. Funzione: utenti con permesso magazzino ───────
CREATE OR REPLACE FUNCTION get_warehouse_users()
RETURNS TABLE(id uuid, full_name text, email text)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.email
  FROM profiles p
  JOIN user_permissions up ON up.user_id = p.id
  WHERE up.can_warehouse = true
  ORDER BY p.full_name;
$$;

-- Permetti agli utenti autenticati di chiamare la funzione
GRANT EXECUTE ON FUNCTION get_warehouse_users() TO authenticated;

-- ─── 2. Policy DELETE su warehouse_requests ──────────
-- Permette la cancellazione SOLO agli admin (controllo UI aggiuntivo: solo creator)
CREATE POLICY "Admin can delete warehouse requests"
  ON warehouse_requests
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_id = auth.uid()
        AND is_admin = true
    )
  );
