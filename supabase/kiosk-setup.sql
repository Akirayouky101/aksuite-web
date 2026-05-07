-- Cancella utente kiosk magazzino (tutti i record correlati)
DO $$
DECLARE
  kiosk_id uuid;
BEGIN
  SELECT id INTO kiosk_id FROM auth.users WHERE email = 'magazzino@zgimpiantisrl.it';
  IF kiosk_id IS NOT NULL THEN
    DELETE FROM auth.identities    WHERE user_id = kiosk_id;
    DELETE FROM user_permissions   WHERE user_id = kiosk_id;
    DELETE FROM profiles           WHERE id      = kiosk_id;
    DELETE FROM auth.users         WHERE id      = kiosk_id;
    RAISE NOTICE 'Utente kiosk eliminato: %', kiosk_id;
  ELSE
    RAISE NOTICE 'Utente non trovato.';
  END IF;
END $$;
