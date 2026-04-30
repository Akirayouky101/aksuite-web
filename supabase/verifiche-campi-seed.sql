-- ═══════════════════════════════════════════════════════════════
-- VERIFICHE TECNOALARM — Seed campi definizioni (da modulo PDF)
-- Esegui su Supabase SQL Editor DOPO verifiche-tecnoalarm.sql
-- Idempotente: ON CONFLICT aggiorna se già esiste
-- ═══════════════════════════════════════════════════════════════

INSERT INTO public.verifiche_campi_definizioni
  (nome, etichetta, categoria, tipo, opzioni, obbligatorio, ordine, attivo)
VALUES

-- ── Attività ────────────────────────────────────────────────────
-- Tipo di intervento eseguito (corrisponde alle checkbox "Attività" del modulo)
(
  'attivita_tipo',
  'Tipo Attività',
  'attivita',
  'select',
  ARRAY[
    'Manutenzione in Loco Ordinaria',
    'Manutenzione in Loco Straordinaria',
    'Manutenzione Remota Ordinaria',
    'Manutenzione Remota Straordinaria',
    'Intervento in Garanzia'
  ],
  true, 1, true
),

-- ── Controlli (checkbox del modulo, numerati come sul foglio) ───
('ctrl_verifica_anomalie',         '1. Verifica Anomalie',                     'controlli', 'boolean', '{}', false, 10, true),
('ctrl_orologio',                  '2. Controllo Orologio',                    'controlli', 'boolean', '{}', false, 11, true),
('ctrl_batteria_centrale',         '3. Controllo Batteria Centrale',           'controlli', 'boolean', '{}', false, 12, true),
('ctrl_batteria_moduli',           '4. Controllo Batteria Moduli Alimentati',  'controlli', 'boolean', '{}', false, 13, true),
('ctrl_batteria_sirene',           '5. Controllo Batteria Sirene',             'controlli', 'boolean', '{}', false, 14, true),
('ctrl_batteria_tecnocell',        '6. Controllo Batteria Tecnocell',          'controlli', 'boolean', '{}', false, 15, true),
('ctrl_batteria_rivelatori',       '7. Controllo Batteria Rivelatori',         'controlli', 'boolean', '{}', false, 16, true),
('ctrl_alimentazione_centrale',    '8. Controllo Alimentazione Centrale',      'controlli', 'boolean', '{}', false, 17, true),
('ctrl_alimentazione_sirena',      '9. Controllo Alimentazione Sirena',        'controlli', 'boolean', '{}', false, 18, true),
('ctrl_alimentazione_tecnocell',   '10. Controllo Alimentazione Tecnocell',    'controlli', 'boolean', '{}', false, 19, true),
('ctrl_alimentazione_dispositivi', '11. Controllo Alimentazione Dispositivi',  'controlli', 'boolean', '{}', false, 20, true),
('ctrl_alimentazioni_rivelatori',  '12. Controllo Alimentazioni Rivelatori',   'controlli', 'boolean', '{}', false, 21, true),
('ctrl_connessione_tcs',           '13. Connessione Servizio TCS',             'controlli', 'boolean', '{}', false, 22, true),
('ctrl_livello_gsm',               '14. Livello Segnale GSM',                  'controlli', 'boolean', '{}', false, 23, true),
('ctrl_test_comunicatori',         '15. Test Funzionamento Comunicatori',      'controlli', 'boolean', '{}', false, 24, true),
('ctrl_pulizia_sensori',           '16. Pulizia Sensori',                      'controlli', 'boolean', '{}', false, 25, true),
('ctrl_aggiornamento_firmware',    '17. Aggiornamento Firmware',               'controlli', 'boolean', '{}', false, 26, true),
('ctrl_zone',                      '18. Controllo Zone',                       'controlli', 'boolean', '{}', false, 27, true),
('ctrl_test_sirene',               '19. Test Funzionamento Sirene',            'controlli', 'boolean', '{}', false, 28, true),
('ctrl_psnt_network',              '20. PSNT Network Type',                    'controlli', 'boolean', '{}', false, 29, true),
('ctrl_custom_21',                 '21. (Personalizzabile)',                   'controlli', 'boolean', '{}', false, 30, true),
('ctrl_custom_22',                 '22. (Personalizzabile)',                   'controlli', 'boolean', '{}', false, 31, true),

-- ── Misurazioni Tensioni ─────────────────────────────────────────
-- Corrispondono alla tabella "Volt." del modulo: Alimentazione / Batteria / Batteria disalimentata
('mis_volt_alim_centrale',       'Volt. Alimentazione — Centrale',           'misurazioni', 'numero', '{}', false, 40, true),
('mis_volt_batt_centrale',       'Volt. Batteria — Centrale',                'misurazioni', 'numero', '{}', false, 41, true),
('mis_volt_batt_dis_centrale',   'Volt. Batteria Disalim. — Centrale',       'misurazioni', 'numero', '{}', false, 42, true),
('mis_volt_alim_sirena1',        'Volt. Alimentazione — Sirena 1',           'misurazioni', 'numero', '{}', false, 43, true),
('mis_volt_batt_sirena1',        'Volt. Batteria — Sirena 1',                'misurazioni', 'numero', '{}', false, 44, true),
('mis_volt_batt_dis_sirena1',    'Volt. Batteria Disalim. — Sirena 1',       'misurazioni', 'numero', '{}', false, 45, true),
('mis_volt_alim_sirena2',        'Volt. Alimentazione — Sirena 2',           'misurazioni', 'numero', '{}', false, 46, true),
('mis_volt_batt_sirena2',        'Volt. Batteria — Sirena 2',                'misurazioni', 'numero', '{}', false, 47, true),
('mis_volt_batt_dis_sirena2',    'Volt. Batteria Disalim. — Sirena 2',       'misurazioni', 'numero', '{}', false, 48, true),

-- ── Dati Tecnici ─────────────────────────────────────────────────
('segnale_gsm',       'Segnale GSM (valore)',    'dati_tecnici', 'testo', '{}', false, 50, true),
('operatore_gsm',     'Operatore GSM',           'dati_tecnici', 'testo', '{}', false, 51, true),
('versione_firmware', 'Versione Firmware',       'dati_tecnici', 'testo', '{}', false, 52, true)

ON CONFLICT (nome) DO UPDATE SET
  etichetta    = EXCLUDED.etichetta,
  categoria    = EXCLUDED.categoria,
  tipo         = EXCLUDED.tipo,
  opzioni      = EXCLUDED.opzioni,
  obbligatorio = EXCLUDED.obbligatorio,
  ordine       = EXCLUDED.ordine,
  attivo       = EXCLUDED.attivo;
