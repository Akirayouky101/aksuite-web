-- ══════════════════════════════════════════════════════
-- KIOSK SETUP — Account condiviso magazzino
-- Credenziali kiosk: magazzino@zgimpiantisrl.it / Magazzino2026!
--
-- ISTRUZIONI:
-- 1. Crea l'utente nel pannello Supabase:
--    Authentication > Users > Invite user (o Add user)
--    Email: magazzino@zgimpiantisrl.it
--    Password: Magazzino2026!
--
-- 2. Esegui questo script nel SQL Editor di Supabase
--    (l'UUID viene ricavato automaticamente dall'email)
--
-- 3. Assicurati che Giuliano e Lorenzo abbiano can_prelievo = true
--    (già presenti nei profili — usa la query di verifica al fondo)
-- ══════════════════════════════════════════════════════

-- ─── Passo 1: Imposta permessi utente kiosk (SOLO can_prelievo) ───────────────
-- L'UUID viene ricavato automaticamente dall'email — nessuna modifica necessaria.

INSERT INTO user_permissions (
  user_id,
  is_admin,
  can_calls, can_lavorazioni, can_tasks, can_calendar,
  can_budget, can_passwords, can_notes, can_clients,
  can_visits, can_suppliers, can_orders, can_warehouse,
  can_preventivi, can_sopralluoghi, can_installations,
  can_prelievo, can_kits, can_tickets, can_hr,
  can_cancelli, can_verifiche
)
SELECT
  u.id,
  false,
  false, false, false, false,
  false, false, false, false,
  false, false, false, false,
  false, false, false,
  true,   -- can_prelievo: UNICO permesso abilitato → attiva modalità kiosk
  false, false, false,
  false, false
FROM auth.users u
WHERE u.email = 'magazzino@zgimpiantisrl.it'
ON CONFLICT (user_id) DO UPDATE SET
  is_admin = false,
  can_calls = false, can_lavorazioni = false, can_tasks = false, can_calendar = false,
  can_budget = false, can_passwords = false, can_notes = false, can_clients = false,
  can_visits = false, can_suppliers = false, can_orders = false, can_warehouse = false,
  can_preventivi = false, can_sopralluoghi = false, can_installations = false,
  can_prelievo = true,
  can_kits = false, can_tickets = false, can_hr = false,
  can_cancelli = false, can_verifiche = false;

-- ─── Passo 2: Aggiorna get_warehouse_users() per escludere l'account kiosk ───
-- L'account magazzino@zgimpiantisrl.it è un login condiviso, non una persona reale.
-- Va escluso dal dropdown "Chi sei?" nel modal prelievo.

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
    AND p.email != 'magazzino@zgimpiantisrl.it'   -- escludi account kiosk condiviso
  ORDER BY p.full_name;
$$;

GRANT EXECUTE ON FUNCTION get_warehouse_users() TO authenticated;

-- ─── Passo 3 (opzionale): Verifica che Giuliano e Lorenzo abbiano can_prelievo ─
-- Esegui questa query per vedere i permessi attuali:
--
-- SELECT p.full_name, p.email, up.can_prelievo
-- FROM profiles p
-- JOIN user_permissions up ON up.user_id = p.id
-- WHERE p.full_name ILIKE '%giuliano%' OR p.full_name ILIKE '%lorenzo%';
--
-- Se can_prelievo è false, aggiornalo:
--
-- UPDATE user_permissions
-- SET can_prelievo = true
-- WHERE user_id IN (
--   SELECT p.id FROM profiles p
--   WHERE p.full_name ILIKE '%giuliano%' OR p.full_name ILIKE '%lorenzo%'
-- );
