-- ═══════════════════════════════════════════════════════════════════════════
-- Password vault v1 (shared vault, per-user master password + recovery key)
-- Spec: docs/password-vault.md
--
-- The server never receives plaintext secrets, master passwords, recovery keys,
-- private keys or the vault key. It only stores public keys and encrypted
-- wrappers. Existing rows in public.passwords are left untouched
-- (vault_format = 0, "legacy") until a user explicitly migrates them from the app.
-- Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Single shared vault (one row). key_id identifies the vault key used in ciphertext AAD.
CREATE TABLE IF NOT EXISTS public.password_vault (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),
  key_id UUID NOT NULL UNIQUE,
  format_version SMALLINT NOT NULL DEFAULT 1 CHECK (format_version = 1),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Per-user key material. Private key (P-256) is stored only encrypted:
--    once under a PBKDF2 master-password key and once under an HKDF recovery-key key.
CREATE TABLE IF NOT EXISTS public.password_vault_members (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  format_version SMALLINT NOT NULL DEFAULT 1 CHECK (format_version = 1),
  public_key TEXT NOT NULL CHECK (char_length(public_key) = 88),
  kdf_algorithm TEXT NOT NULL CHECK (kdf_algorithm = 'PBKDF2-HMAC-SHA256'),
  kdf_iterations INTEGER NOT NULL CHECK (kdf_iterations BETWEEN 600000 AND 10000000),
  kdf_salt TEXT NOT NULL CHECK (char_length(kdf_salt) = 24),
  private_key_master TEXT NOT NULL CHECK (char_length(private_key_master) = 168),
  recovery_salt TEXT NOT NULL CHECK (char_length(recovery_salt) = 24),
  private_key_recovery TEXT NOT NULL CHECK (char_length(private_key_recovery) = 168),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Vault key wrapped to each member's public key (ECDH P-256 + HKDF-SHA256 + AES-256-GCM).
CREATE TABLE IF NOT EXISTS public.password_vault_grants (
  user_id UUID PRIMARY KEY REFERENCES public.password_vault_members(user_id) ON DELETE CASCADE,
  key_id UUID NOT NULL REFERENCES public.password_vault(key_id),
  format_version SMALLINT NOT NULL DEFAULT 1 CHECK (format_version = 1),
  recipient_public_key TEXT NOT NULL CHECK (char_length(recipient_public_key) = 88),
  ephemeral_public_key TEXT NOT NULL CHECK (char_length(ephemeral_public_key) = 88),
  wrapped_vault_key TEXT NOT NULL CHECK (char_length(wrapped_vault_key) = 80),
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. passwords: v1 ciphertext columns. Legacy columns are preserved.
ALTER TABLE public.passwords
  ADD COLUMN IF NOT EXISTS encrypted_pin_code TEXT,
  ADD COLUMN IF NOT EXISTS vault_format SMALLINT NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'passwords_vault_format_check') THEN
    ALTER TABLE public.passwords ADD CONSTRAINT passwords_vault_format_check CHECK (vault_format IN (0, 1));
  END IF;
  -- v1 rows: secrets must be v1 envelopes and the legacy plaintext PIN must be empty.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'passwords_vault_v1_shape') THEN
    ALTER TABLE public.passwords ADD CONSTRAINT passwords_vault_v1_shape CHECK (
      vault_format <> 1 OR (
        encrypted_password LIKE 'akv1.%'
        AND pin_code IS NULL
        AND (encrypted_pin_code IS NULL OR encrypted_pin_code LIKE 'akv1.%')
      )
    );
  END IF;
  -- Legacy rows must not carry v1 data (NOT VALID: existing rows are not re-checked).
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'passwords_vault_legacy_shape') THEN
    ALTER TABLE public.passwords ADD CONSTRAINT passwords_vault_legacy_shape CHECK (
      vault_format <> 0 OR (encrypted_pin_code IS NULL AND encrypted_password NOT LIKE 'akv1.%')
    ) NOT VALID;
  END IF;
END $$;

-- Never allow a v1 row to be downgraded to legacy.
CREATE OR REPLACE FUNCTION public.password_vault_prevent_downgrade()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.vault_format = 1 AND NEW.vault_format <> 1 THEN
    RAISE EXCEPTION 'Una password cifrata non può tornare al formato legacy.' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS passwords_vault_prevent_downgrade ON public.passwords;
CREATE TRIGGER passwords_vault_prevent_downgrade
  BEFORE UPDATE OF vault_format ON public.passwords
  FOR EACH ROW EXECUTE FUNCTION public.password_vault_prevent_downgrade();

-- Members: keep updated_at fresh; a changed public key invalidates the existing grant.
CREATE OR REPLACE FUNCTION public.password_vault_members_touch()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  NEW.updated_at := now();
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'user_id non modificabile.' USING ERRCODE = 'P0001';
  END IF;
  IF NEW.public_key IS DISTINCT FROM OLD.public_key THEN
    DELETE FROM public.password_vault_grants WHERE user_id = OLD.user_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS password_vault_members_touch ON public.password_vault_members;
CREATE TRIGGER password_vault_members_touch
  BEFORE UPDATE ON public.password_vault_members
  FOR EACH ROW EXECUTE FUNCTION public.password_vault_members_touch();

-- 5. Helpers (SECURITY DEFINER to avoid recursive RLS).
CREATE OR REPLACE FUNCTION public.password_vault_has_access(p_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.password_vault_grants g
    JOIN public.password_vault v ON v.key_id = g.key_id
    JOIN public.password_vault_members m ON m.user_id = g.user_id AND m.public_key = g.recipient_public_key
    WHERE g.user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.password_vault_is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_permissions WHERE user_id = auth.uid() AND is_admin = true);
$$;

-- 6. RLS
ALTER TABLE public.password_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_vault_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_vault_grants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "password_vault_select" ON public.password_vault;
CREATE POLICY "password_vault_select" ON public.password_vault
  FOR SELECT TO authenticated USING (true);
-- No INSERT/UPDATE/DELETE policies: the vault is created only via password_vault_bootstrap().

DROP POLICY IF EXISTS "password_vault_members_select_own" ON public.password_vault_members;
DROP POLICY IF EXISTS "password_vault_members_insert_own" ON public.password_vault_members;
DROP POLICY IF EXISTS "password_vault_members_update_own" ON public.password_vault_members;
DROP POLICY IF EXISTS "password_vault_members_delete_own" ON public.password_vault_members;
CREATE POLICY "password_vault_members_select_own" ON public.password_vault_members
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "password_vault_members_insert_own" ON public.password_vault_members
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "password_vault_members_update_own" ON public.password_vault_members
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "password_vault_members_delete_own" ON public.password_vault_members
  FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "password_vault_grants_select_own" ON public.password_vault_grants;
DROP POLICY IF EXISTS "password_vault_grants_delete_own" ON public.password_vault_grants;
CREATE POLICY "password_vault_grants_select_own" ON public.password_vault_grants
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "password_vault_grants_delete_own" ON public.password_vault_grants
  FOR DELETE TO authenticated USING (user_id = auth.uid());
-- No INSERT/UPDATE policies: grants are written only via the RPCs below.

-- 7. RPCs
-- Bootstrap: an enrolled admin creates the vault and grants it to themselves atomically.
CREATE OR REPLACE FUNCTION public.password_vault_bootstrap(
  p_key_id UUID, p_recipient_public_key TEXT, p_ephemeral_public_key TEXT, p_wrapped_vault_key TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Accesso richiesto.' USING ERRCODE = '42501'; END IF;
  IF NOT public.password_vault_is_admin() THEN
    RAISE EXCEPTION 'Solo un amministratore può creare la cassaforte condivisa.' USING ERRCODE = 'P0001';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.password_vault_members WHERE user_id = v_uid AND public_key = p_recipient_public_key) THEN
    RAISE EXCEPTION 'Configura prima la tua master password.' USING ERRCODE = 'P0001';
  END IF;
  IF EXISTS (SELECT 1 FROM public.password_vault) THEN
    RAISE EXCEPTION 'La cassaforte condivisa esiste già.' USING ERRCODE = 'P0001';
  END IF;
  INSERT INTO public.password_vault (id, key_id, created_by) VALUES (true, p_key_id, v_uid);
  INSERT INTO public.password_vault_grants (user_id, key_id, recipient_public_key, ephemeral_public_key, wrapped_vault_key, granted_by)
  VALUES (v_uid, p_key_id, p_recipient_public_key, p_ephemeral_public_key, p_wrapped_vault_key, v_uid);
END $$;

-- Grant: a member with access wraps the vault key to another enrolled user's current public key.
CREATE OR REPLACE FUNCTION public.password_vault_grant(
  p_user_id UUID, p_key_id UUID, p_recipient_public_key TEXT, p_ephemeral_public_key TEXT, p_wrapped_vault_key TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Accesso richiesto.' USING ERRCODE = '42501'; END IF;
  IF NOT public.password_vault_has_access(v_uid) THEN
    RAISE EXCEPTION 'Solo chi ha accesso alla cassaforte può concederlo.' USING ERRCODE = 'P0001';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.password_vault WHERE key_id = p_key_id) THEN
    RAISE EXCEPTION 'La chiave della cassaforte non corrisponde.' USING ERRCODE = 'P0001';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.password_vault_members WHERE user_id = p_user_id AND public_key = p_recipient_public_key) THEN
    RAISE EXCEPTION 'Le chiavi del collega sono cambiate. Aggiorna l’elenco e verifica di nuovo l’impronta.' USING ERRCODE = 'P0001';
  END IF;
  INSERT INTO public.password_vault_grants (user_id, key_id, recipient_public_key, ephemeral_public_key, wrapped_vault_key, granted_by)
  VALUES (p_user_id, p_key_id, p_recipient_public_key, p_ephemeral_public_key, p_wrapped_vault_key, v_uid)
  ON CONFLICT (user_id) DO UPDATE SET
    key_id = EXCLUDED.key_id,
    format_version = 1,
    recipient_public_key = EXCLUDED.recipient_public_key,
    ephemeral_public_key = EXCLUDED.ephemeral_public_key,
    wrapped_vault_key = EXCLUDED.wrapped_vault_key,
    granted_by = EXCLUDED.granted_by,
    created_at = now();
END $$;

-- Directory of enrolled users (public keys only), visible to members who already have access.
CREATE OR REPLACE FUNCTION public.password_vault_directory()
RETURNS TABLE (user_id UUID, email TEXT, full_name TEXT, public_key TEXT, has_access BOOLEAN)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.password_vault_has_access(auth.uid()) THEN
    RAISE EXCEPTION 'Solo chi ha accesso alla cassaforte può vedere i membri.' USING ERRCODE = 'P0001';
  END IF;
  RETURN QUERY
    SELECT m.user_id, p.email, p.full_name, m.public_key, public.password_vault_has_access(m.user_id)
    FROM public.password_vault_members m
    LEFT JOIN public.profiles p ON p.id = m.user_id
    ORDER BY public.password_vault_has_access(m.user_id), p.email;
END $$;

-- Internal helpers: only callable from the SECURITY DEFINER RPCs above.
REVOKE ALL ON FUNCTION public.password_vault_has_access(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.password_vault_is_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.password_vault_bootstrap(UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.password_vault_grant(UUID, UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.password_vault_directory() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.password_vault_members_touch() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.password_vault_bootstrap(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.password_vault_grant(UUID, UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.password_vault_directory() TO authenticated;

GRANT SELECT ON public.password_vault TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.password_vault_members TO authenticated;
GRANT SELECT, DELETE ON public.password_vault_grants TO authenticated;

COMMIT;
