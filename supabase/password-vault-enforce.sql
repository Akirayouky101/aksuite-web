-- ═══════════════════════════════════════════════════════════════════════════
-- Password vault: OPTIONAL final enforcement (run manually, later).
-- Run ONLY after:
--   1. every web/iOS/iPadOS/macOS client in use runs the vault-enabled version, and
--   2. all legacy rows were migrated from the app ("Migra ora").
-- Afterwards old app versions can no longer create Base64/plaintext entries.
-- The legacy pin_code column is kept (always NULL) for compatibility.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

DO $$
DECLARE
  v_legacy BIGINT;
BEGIN
  SELECT count(*) INTO v_legacy FROM public.passwords WHERE vault_format <> 1 OR pin_code IS NOT NULL;
  IF v_legacy > 0 THEN
    RAISE EXCEPTION 'Ci sono ancora % password legacy: migrale dall''app prima di applicare questo script.', v_legacy;
  END IF;
END $$;

ALTER TABLE public.passwords ALTER COLUMN vault_format SET DEFAULT 1;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'passwords_vault_v1_only') THEN
    ALTER TABLE public.passwords ADD CONSTRAINT passwords_vault_v1_only CHECK (vault_format = 1 AND pin_code IS NULL);
  END IF;
END $$;

COMMIT;
