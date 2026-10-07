# Password vault (format v1)

Shared, end-to-end encrypted password vault used by the web app
(`lib/passwordVault/*`, `platforms/Desktop/app/components/PasswordVaultPanel.tsx`)
and the native iPhone / iPad / macOS apps
(`platforms/MobileNative/AKSuite/Features/Passwords/PasswordVault*.swift`).
Both implementations must stay byte-compatible with this document.

## Goals and threat model

- `passwords.encrypted_password` and `passwords.encrypted_pin_code` are encrypted
  client-side. The database and Supabase operators only see ciphertext,
  public keys and wrapped (encrypted) keys.
- Each user unlocks with a **master password**. It is separate from the login
  password and is never sent to the server. A **recovery key** is the only
  fallback. AK Suite cannot recover a vault if both are lost.
- No static or embedded keys. All keys, salts and nonces come from the platform
  CSPRNG (`crypto.getRandomValues`, `SecRandomCopyBytes`).
- New-format values are never decoded with a legacy fallback. Integrity or key
  errors are shown as errors.
- Not protected against: a compromised client device or browser session while
  the vault is unlocked, malicious JavaScript served by the web origin, or a
  member who already holds the vault key.

## Key hierarchy

| Key | What it is | Where it is stored |
| --- | --- | --- |
| Vault key (VK) | 32 random bytes, identified by `password_vault.key_id` (UUID) | Never stored in plaintext. Wrapped per member in `password_vault_grants`. |
| User key pair | ECDH P-256. Public key is the 65-byte uncompressed point. Private key is the 97-byte X9.63 form (`04‖X‖Y‖D`). | `password_vault_members.public_key`, plus the private key wrapped twice (see below). |
| Master key | PBKDF2-HMAC-SHA256 over the NFC-normalized UTF-8 master password, 16-byte salt, 600 000 iterations (accepted range 600 000–10 000 000), 32-byte output | Derived only; never stored. |
| Recovery key | 32 random bytes, shown once as `AKR1-` followed by Base32 (no padding) in groups of 4 | Derived only. KEK = HKDF-SHA256(ikm = recovery bytes, salt = `recovery_salt`, info = `aksuite.vault.v1.recovery-kek`). |

Master passwords must be at least 12 Unicode code points long.

## Encodings

- Byte values are standard Base64 with padding. Decoding is strict.
- UUIDs are lowercase.
- AES-256-GCM output is `nonce(12) ‖ ciphertext ‖ tag(16)`.

### Wrapped private key

`private_key_master` and `private_key_recovery` are AES-GCM encryptions of the
97-byte private key.

- AAD: `aksuite.vault.v1|user-private-key|<userId>|master` (or `|recovery`).
- After unwrapping, the first 65 bytes must equal `public_key`.

### Grant (VK for one member)

1. Generate an ephemeral P-256 key pair.
2. `Z` = ECDH x-coordinate (32 bytes).
3. `info` = `aksuite.vault.v1.grant|<keyId>|<recipientUserId>`.
4. KEK = HKDF-SHA256(ikm = `Z`, salt = `ephemeralPub ‖ recipientPub`, info = `info`).
5. `wrapped_vault_key` = AES-GCM(KEK, VK, AAD = `info`).

### Field envelope

The envelope is `akv1.<keyId>.<base64(nonce‖ct‖tag)>`, with:

- Field key: the VK used directly as an AES-256-GCM key.
- AAD: `aksuite.vault.v1|<keyId>|passwords|<rowId>|<field>`, where `field` is
  `password` or `pin`.

This AAD binds every ciphertext to its row and field, so swapped or copied
values fail authentication. Rows store `vault_format = 1`, and the plaintext
`pin_code` column is always `NULL` for v1 rows.

### Fingerprint

The fingerprint is the first 10 bytes of SHA-256(public key), as uppercase hex
in groups of 4. Members compare fingerprints over a trusted channel (in person
or by phone) before granting access.

## Database

- `supabase/migrations/20261007000000_password_vault.sql`
  - Adds tables `password_vault` (singleton), `password_vault_members` and
    `password_vault_grants`, with RLS restricted to the user's own rows.
  - Adds RPCs:
    - `password_vault_bootstrap`: admin only, via `user_permissions.is_admin`.
    - `password_vault_grant`: only for members who already have access.
    - `password_vault_directory`: lists the enrolled members.
  - Adds `passwords.encrypted_pin_code` and `passwords.vault_format` (default 0)
    with shape checks, plus a trigger that prevents downgrading v1 rows back to
    legacy.
  - When a member's `public_key` changes, a trigger deletes their grant.
- `supabase/password-vault-enforce.sql`: optional, run manually after migration.
  It refuses to run while legacy rows exist. Once run, it makes v1 mandatory.

The vault migration has been applied to production. The user has completed
conversion of existing credentials. Optional enforcement has not been applied.

### Production rollout status (2026-10-07)

- The linked production project is `tecvggqaunfbelqksghj`. The additive
  `20261007000000_password_vault` migration was committed and recorded in its
  migration history.
- Immediately after the schema migration, all 24 existing credentials were
  still legacy; password and PIN fields compared before and after it were
  unchanged. The shared vault had not yet been initialized at that point.
  The optional enforcement script was not run.
- A protected pre-migration PostgreSQL custom-format backup was created outside
  Git (directory mode 700, archive mode 600). Native `pg_dump` with the
  authorized `postgres` role bypassed the unavailable Docker daemon.
  Verification read all archive contents and its 1,030 catalog entries
  successfully; a checksum is retained locally. A restore into a separate
  database has not been performed. Database dumps do not include Storage file
  contents or project-level secrets/configuration.
- The pending macOS push-device migration is separate and was intentionally
  not applied as part of this vault rollout. A future migration push must
  explicitly account for this older pending migration; do not blindly apply
  all pending migrations.
- The web vault release (`965f79c`) was pushed to `main`; its Vercel production
  deployment is Ready and aliased to `aksuite.app`. The production login screen
  was checked in a browser. The user subsequently confirmed vault setup and
  successful unlock on both Mac and iPhone, then completed credential conversion.
  Read-only verification after conversion found 24 v1 credentials, zero legacy
  credentials and zero non-null plaintext PIN fields. Native source improvements
  remain local; the web visual redesign is versioned separately from that release.

## Rollout

1. Create and verify a protected, recoverable database backup.
2. Apply `20261007000000_password_vault.sql`.
3. Deploy the web app and native builds together. Older clients cannot read v1
   values, and new clients can't save until the vault is unlocked.
4. An administrator opens Passwords, creates a master password, saves the
   recovery key, confirms it was saved and taps **Attiva cassaforte**.
   Then the administrator taps **Crea cassaforte condivisa**.
5. Every other user creates their own master password and sends their
   fingerprint to an unlocked member. That member verifies it under
   **Membri → Impronta verificata** and grants access.
6. An unlocked member runs **Migra ora**. This converts legacy Base64 passwords
   and plaintext PINs to v1. Each row is round-trip verified and updated only if
   it hasn't changed since it was read. Rows that were skipped or failed stay
   legacy and can be retried.
7. Optionally, once no legacy rows remain, run `password-vault-enforce.sql`.

## Client behaviour

- **Locking:**
  - The vault locks after 10 minutes of inactivity, on sign-out or user change,
    and on the native apps when they go to the background.
  - The VK is kept only in memory while unlocked.
  - On the native apps, locking closes an open password editor and discards
    any unsaved draft without prompting, so plaintext never outlives the lock.
    Closing the editor manually with changes asks to save or discard first.
  - On the web, locking clears and closes an open password editor, masks secrets
    in a detail dialog, and cancels an in-flight unlock or decryption result.
- **Quick unlock (iPhone/iPad only, opt-in):**
  - The VK is stored in a Keychain item protected by `.biometryCurrentSet` and
    `WhenPasscodeSetThisDeviceOnly`.
  - The item is removed when the user turns quick unlock off, resets their keys,
    or changes biometrics.
  - macOS always uses the master password.
- **Recovery:** the recovery key plus a new master password re-wraps the same
  private key and issues a new recovery key. The new wrappers are committed only
  after the user confirms they saved the new key.
- **Reset** (both secrets lost): deletes the user's member row and grant. Another
  member must grant access again. Shared data is untouched.

## Limitations

- **Revocation:** removing a grant does not revoke a member who already knows the
  VK. Real revocation needs a new vault key and re-encryption of every row. That
  rotation is not implemented in v1; the envelope's `keyId` allows it later.
- **Shared RLS:** the existing `passwords` RLS lets any authenticated user delete
  rows or overwrite ciphertext. AES-GCM detects tampering but cannot prevent
  deletion or denial of service.
- **Metadata:** titles, usernames, websites, notes, categories and favourites
  remain unencrypted.
- **Legacy rows:** until migrated, legacy rows are only Base64-encoded. The UI
  marks them and offers the explicit migration.
