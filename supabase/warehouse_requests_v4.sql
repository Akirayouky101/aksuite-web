-- ══════════════════════════════════════════════════════
-- MIGRATION v4: Separazione permessi magazzino
-- can_warehouse = accesso magazzino (inventario, carico, scarico)
-- can_prelievo  = accesso kiosk prelievi/ordini materiale
-- ══════════════════════════════════════════════════════

-- Aggiungi colonna can_prelievo
ALTER TABLE user_permissions
  ADD COLUMN IF NOT EXISTS can_prelievo BOOLEAN NOT NULL DEFAULT false;

-- Aggiorna funzione: dropdown kiosk mostra utenti con can_prelievo (non can_warehouse)
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
  WHERE up.can_prelievo = true
  ORDER BY p.full_name;
$$;

GRANT EXECUTE ON FUNCTION get_warehouse_users() TO authenticated;
