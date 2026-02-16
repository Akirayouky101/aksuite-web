-- ═══════════════════════════════════════════════
-- FORNITORI PRE-CARICATI - Distributori IT/Elettrico
-- Eseguire DOPO schema-warehouse.sql
-- Nota: user_id deve essere sostituito con il vostro UUID utente
-- ═══════════════════════════════════════════════

-- Per ottenere il vostro user_id:
-- SELECT id FROM auth.users LIMIT 1;

-- Sostituire 'YOUR_USER_ID' con il UUID reale
-- Oppure usare una variabile:

DO $$
DECLARE
  uid UUID;
BEGIN
  -- Prende il primo utente disponibile
  SELECT id INTO uid FROM auth.users LIMIT 1;

  IF uid IS NULL THEN
    RAISE EXCEPTION 'Nessun utente trovato. Registrarsi prima.';
  END IF;

  -- ═══ SACCHI - Materiale Elettrico ═══
  INSERT INTO suppliers (user_id, name, code, category, contact_name, email, phone, website, address, city, zip_code, province, vat_number, payment_terms, notes, is_favorite)
  VALUES (uid, 'Sacchi Elettroforniture', 'SACCHI', 'Materiale Elettrico', NULL, NULL, '+39 0362 6351', 'https://www.sacchi.it', 'Via Privata G. Sacchi 2', 'Barzano''', '23891', 'LC', '00689730133', 'Bonifico 30gg', '84 punti vendita in Italia. 2.5M di prodotti a catalogo. Distributore materiale elettrico leader.', true)
  ON CONFLICT DO NOTHING;

  -- ═══ ESPRINET - Distributore IT ═══
  INSERT INTO suppliers (user_id, name, code, category, contact_name, email, phone, website, address, city, zip_code, province, vat_number, payment_terms, notes, is_favorite)
  VALUES (uid, 'Esprinet', 'ESPRINET', 'Distributore IT', NULL, NULL, NULL, 'https://www.esprinet.com', 'Via Energy Park 20', 'Vimercate', '20871', 'MB', 'IT02999990969', 'Bonifico 30gg', 'Leader distribuzione IT in Italia e Spagna. 4.1 miliardi di fatturato. 130.000+ prodotti. Server, storage, networking, PC, periferiche.', true)
  ON CONFLICT DO NOTHING;

  -- ═══ BREVI - Distributore IT ═══
  INSERT INTO suppliers (user_id, name, code, category, contact_name, email, phone, website, address, city, zip_code, province, vat_number, payment_terms, notes, is_favorite)
  VALUES (uid, 'Brevi', 'BREVI', 'Distributore IT', NULL, NULL, NULL, 'https://www.brevi.it', 'Via Orio al Serio 20', 'Grassobbio', '24050', 'BG', '01004950166', 'Bonifico 30gg', 'Distributore IT da 43 anni. Rete Cash & Carry. Prodotti IT, networking, consumabili, accessori.', true)
  ON CONFLICT DO NOTHING;

  -- ═══ AMAZON BUSINESS - E-commerce B2B ═══
  INSERT INTO suppliers (user_id, name, code, category, contact_name, email, phone, website, address, city, zip_code, province, vat_number, payment_terms, notes, is_favorite)
  VALUES (uid, 'Amazon Business', 'AMAZON', 'E-commerce', NULL, NULL, NULL, 'https://business.amazon.it', NULL, NULL, NULL, NULL, NULL, 'Carta/Bonifico', 'Marketplace B2B. Ampia gamma prodotti IT, elettrico, consumabili. Consegna rapida. Fatturazione elettronica.', true)
  ON CONFLICT DO NOTHING;

  -- ═══ MEDIAWORLD BUSINESS - E-commerce ═══
  INSERT INTO suppliers (user_id, name, code, category, contact_name, email, phone, website, address, city, zip_code, province, vat_number, payment_terms, notes, is_favorite)
  VALUES (uid, 'Mediaworld Business', 'MEDIAWORLD', 'E-commerce', NULL, NULL, NULL, 'https://www.mediaworld.it', NULL, NULL, NULL, NULL, NULL, 'Carta/Bonifico', 'Vendita prodotti elettronica. PC, notebook, periferiche, accessori. Sezione Business.', false)
  ON CONFLICT DO NOTHING;

  -- ═══ REXEL - Materiale Elettrico ═══
  INSERT INTO suppliers (user_id, name, code, category, contact_name, email, phone, website, address, city, zip_code, province, vat_number, payment_terms, notes, is_favorite)
  VALUES (uid, 'Rexel Italia', 'REXEL', 'Materiale Elettrico', NULL, NULL, NULL, 'https://www.rexel.it', NULL, NULL, NULL, NULL, NULL, 'Bonifico 30gg', 'Distributore globale materiale elettrico. Automazione, illuminazione, cavi, quadri elettrici.', false)
  ON CONFLICT DO NOTHING;

  -- ═══ SONEPAR - Materiale Elettrico ═══
  INSERT INTO suppliers (user_id, name, code, category, contact_name, email, phone, website, address, city, zip_code, province, vat_number, payment_terms, notes, is_favorite)
  VALUES (uid, 'Sonepar Italia', 'SONEPAR', 'Materiale Elettrico', NULL, NULL, NULL, 'https://www.sonepar.it', NULL, NULL, NULL, NULL, NULL, 'Bonifico 30gg', 'Distributore mondiale materiale elettrico. Presente in Italia con rete capillare.', false)
  ON CONFLICT DO NOTHING;

  -- ═══ INGRAM MICRO - Distributore IT ═══
  INSERT INTO suppliers (user_id, name, code, category, contact_name, email, phone, website, address, city, zip_code, province, vat_number, payment_terms, notes, is_favorite)
  VALUES (uid, 'Ingram Micro', 'INGRAM', 'Distributore IT', NULL, NULL, NULL, 'https://www.ingrammicro.com', NULL, NULL, NULL, NULL, NULL, 'Bonifico 30gg', 'Distributore globale IT. Server, storage, cloud, networking, sicurezza, software.', false)
  ON CONFLICT DO NOTHING;

  -- ═══ COMPUTER GROSS - Distributore IT ═══
  INSERT INTO suppliers (user_id, name, code, category, contact_name, email, phone, website, address, city, zip_code, province, vat_number, payment_terms, notes, is_favorite)
  VALUES (uid, 'Computer Gross', 'COMPGROSS', 'Distributore IT', NULL, NULL, NULL, 'https://www.computergross.it', 'Via del Pino 1', 'Empoli', '50053', 'FI', NULL, 'Bonifico 30gg', 'Distributore IT italiano. Ampia gamma prodotti informatici e networking.', false)
  ON CONFLICT DO NOTHING;

  -- ═══ RS COMPONENTS - Componentistica ═══
  INSERT INTO suppliers (user_id, name, code, category, contact_name, email, phone, website, address, city, zip_code, province, vat_number, payment_terms, notes, is_favorite)
  VALUES (uid, 'RS Components', 'RS', 'Componentistica', NULL, NULL, NULL, 'https://it.rs-online.com', NULL, NULL, NULL, NULL, NULL, 'Carta/Bonifico', 'Distributore componenti elettronici, automazione industriale, utensili, strumentazione.', false)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Inseriti 10 fornitori pre-caricati per utente %', uid;
END $$;
