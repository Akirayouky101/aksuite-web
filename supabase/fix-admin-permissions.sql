-- ═══════════════════════════════════════════════════════════════
-- FIX: Assicura che il tuo account admin abbia i permessi
-- Esegui su Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Verifica se il record esiste
SELECT * FROM user_permissions WHERE user_id = '3740d43e-4020-4020-8582-ad305f9d06b4';

-- Se la query sopra restituisce 0 righe, questo inserisce il record:
INSERT INTO user_permissions (
  user_id, is_admin,
  can_calls, can_lavorazioni, can_tasks, can_calendar,
  can_budget, can_passwords, can_notes, can_clients,
  can_visits, can_suppliers, can_orders, can_warehouse, can_preventivi
)
VALUES (
  '3740d43e-4020-4020-8582-ad305f9d06b4',
  true,
  true, true, true, true,
  true, true, true, true,
  true, true, true, true, true
)
ON CONFLICT (user_id) DO UPDATE SET
  is_admin = true,
  can_calls = true,
  can_lavorazioni = true,
  can_tasks = true,
  can_calendar = true,
  can_budget = true,
  can_passwords = true,
  can_notes = true,
  can_clients = true,
  can_visits = true,
  can_suppliers = true,
  can_orders = true,
  can_warehouse = true,
  can_preventivi = true,
  updated_at = now();
