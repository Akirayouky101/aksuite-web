-- ═══════════════════════════════════════════════════════════════
-- USER PERMISSIONS SYSTEM
-- Esegui su Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. Tabella user_permissions: ogni riga = permessi di un utente
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin BOOLEAN DEFAULT false,
  can_calls BOOLEAN DEFAULT false,
  can_lavorazioni BOOLEAN DEFAULT false,
  can_tasks BOOLEAN DEFAULT false,
  can_calendar BOOLEAN DEFAULT false,
  can_budget BOOLEAN DEFAULT false,
  can_passwords BOOLEAN DEFAULT false,
  can_notes BOOLEAN DEFAULT false,
  can_clients BOOLEAN DEFAULT false,
  can_visits BOOLEAN DEFAULT false,
  can_suppliers BOOLEAN DEFAULT false,
  can_orders BOOLEAN DEFAULT false,
  can_warehouse BOOLEAN DEFAULT false,
  can_preventivi BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- 2. Indice per lookup rapido
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);

-- 3. RLS policies
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Admin (il tuo account) puo' leggere e scrivere tutto
CREATE POLICY "admin_full_access" ON user_permissions
  FOR ALL USING (
    auth.uid() = '3740d43e-4020-4020-8582-ad305f9d06b4'::uuid
    OR EXISTS (
      SELECT 1 FROM user_permissions up 
      WHERE up.user_id = auth.uid() AND up.is_admin = true
    )
  );

-- Ogni utente puo' leggere SOLO i propri permessi
CREATE POLICY "users_read_own_permissions" ON user_permissions
  FOR SELECT USING (auth.uid() = user_id);

-- 4. Inserisci te stesso come admin con tutti i permessi
INSERT INTO user_permissions (user_id, is_admin, can_calls, can_lavorazioni, can_tasks, can_calendar, can_budget, can_passwords, can_notes, can_clients, can_visits, can_suppliers, can_orders, can_warehouse, can_preventivi)
VALUES (
  '3740d43e-4020-4020-8582-ad305f9d06b4',
  true, true, true, true, true, true, true, true, true, true, true, true, true, true
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

-- 5. Funzione trigger per updated_at
CREATE OR REPLACE FUNCTION update_user_permissions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_permissions_updated
  BEFORE UPDATE ON user_permissions
  FOR EACH ROW EXECUTE FUNCTION update_user_permissions_timestamp();

-- 6. Funzione per creare automaticamente permessi vuoti quando un utente si registra
CREATE OR REPLACE FUNCTION create_default_permissions()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_permissions (user_id, is_admin, can_calls, can_lavorazioni, can_tasks, can_calendar, can_budget, can_passwords, can_notes, can_clients, can_visits, can_suppliers, can_orders, can_warehouse, can_preventivi)
  VALUES (NEW.id, false, false, false, false, false, false, false, false, false, false, false, false, false, false)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: quando un nuovo utente viene creato in auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created_permissions
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_permissions();
