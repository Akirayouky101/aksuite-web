-- ===================================================================
-- FIX: Dati condivisi per tutti gli utenti dell'ufficio
-- Tutti gli utenti autenticati vedono e modificano gli STESSI dati
-- Esegui su Supabase SQL Editor
-- ===================================================================

-- ═══════════════════════════════════════
-- 1. PASSWORDS
-- ═══════════════════════════════════════
DROP POLICY IF EXISTS "Users can view own passwords" ON public.passwords;
DROP POLICY IF EXISTS "Users can insert own passwords" ON public.passwords;
DROP POLICY IF EXISTS "Users can update own passwords" ON public.passwords;
DROP POLICY IF EXISTS "Users can delete own passwords" ON public.passwords;

CREATE POLICY "Authenticated users can view all passwords" ON public.passwords
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert passwords" ON public.passwords
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update passwords" ON public.passwords
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete passwords" ON public.passwords
  FOR DELETE USING (auth.role() = 'authenticated');

-- ═══════════════════════════════════════
-- 2. BUDGET_TRANSACTIONS
-- ═══════════════════════════════════════
DROP POLICY IF EXISTS "Users can view own budget transactions" ON public.budget_transactions;
DROP POLICY IF EXISTS "Users can insert own budget transactions" ON public.budget_transactions;
DROP POLICY IF EXISTS "Users can update own budget transactions" ON public.budget_transactions;
DROP POLICY IF EXISTS "Users can delete own budget transactions" ON public.budget_transactions;

CREATE POLICY "Authenticated users can view all budget_transactions" ON public.budget_transactions
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert budget_transactions" ON public.budget_transactions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update budget_transactions" ON public.budget_transactions
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete budget_transactions" ON public.budget_transactions
  FOR DELETE USING (auth.role() = 'authenticated');

-- ═══════════════════════════════════════
-- 3. BUDGET_RECURRING
-- ═══════════════════════════════════════
DROP POLICY IF EXISTS "Users can view own recurring transactions" ON public.budget_recurring;
DROP POLICY IF EXISTS "Users can insert own recurring transactions" ON public.budget_recurring;
DROP POLICY IF EXISTS "Users can update own recurring transactions" ON public.budget_recurring;
DROP POLICY IF EXISTS "Users can delete own recurring transactions" ON public.budget_recurring;

CREATE POLICY "Authenticated users can view all budget_recurring" ON public.budget_recurring
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert budget_recurring" ON public.budget_recurring
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update budget_recurring" ON public.budget_recurring
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete budget_recurring" ON public.budget_recurring
  FOR DELETE USING (auth.role() = 'authenticated');

-- ═══════════════════════════════════════
-- 4. BUDGET_LIMITS
-- ═══════════════════════════════════════
DROP POLICY IF EXISTS "Users can view own budget limits" ON public.budget_limits;
DROP POLICY IF EXISTS "Users can insert own budget limits" ON public.budget_limits;
DROP POLICY IF EXISTS "Users can update own budget limits" ON public.budget_limits;
DROP POLICY IF EXISTS "Users can delete own budget limits" ON public.budget_limits;

CREATE POLICY "Authenticated users can view all budget_limits" ON public.budget_limits
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert budget_limits" ON public.budget_limits
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update budget_limits" ON public.budget_limits
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete budget_limits" ON public.budget_limits
  FOR DELETE USING (auth.role() = 'authenticated');

-- ═══════════════════════════════════════
-- 5. CALLS
-- ═══════════════════════════════════════
DROP POLICY IF EXISTS "Users can view own calls" ON public.calls;
DROP POLICY IF EXISTS "Users can insert own calls" ON public.calls;
DROP POLICY IF EXISTS "Users can update own calls" ON public.calls;
DROP POLICY IF EXISTS "Users can delete own calls" ON public.calls;

CREATE POLICY "Authenticated users can view all calls" ON public.calls
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert calls" ON public.calls
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update calls" ON public.calls
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete calls" ON public.calls
  FOR DELETE USING (auth.role() = 'authenticated');

-- ═══════════════════════════════════════
-- 6. TASKS
-- ═══════════════════════════════════════
DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;

CREATE POLICY "Authenticated users can view all tasks" ON public.tasks
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update tasks" ON public.tasks
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete tasks" ON public.tasks
  FOR DELETE USING (auth.role() = 'authenticated');

-- ═══════════════════════════════════════
-- 7. NOTES
-- ═══════════════════════════════════════
DROP POLICY IF EXISTS "Users can view own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can insert own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can update own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON public.notes;
DROP POLICY IF EXISTS "Authenticated users full access" ON public.notes;

CREATE POLICY "Authenticated users can view all notes" ON public.notes
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert notes" ON public.notes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update notes" ON public.notes
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete notes" ON public.notes
  FOR DELETE USING (auth.role() = 'authenticated');

-- ═══════════════════════════════════════
-- 8. EVENTS
-- ═══════════════════════════════════════
DROP POLICY IF EXISTS "Users can view own events" ON public.events;
DROP POLICY IF EXISTS "Users can insert own events" ON public.events;
DROP POLICY IF EXISTS "Users can update own events" ON public.events;
DROP POLICY IF EXISTS "Users can delete own events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users full access" ON public.events;

CREATE POLICY "Authenticated users can view all events" ON public.events
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert events" ON public.events
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update events" ON public.events
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete events" ON public.events
  FOR DELETE USING (auth.role() = 'authenticated');

-- ═══════════════════════════════════════
-- 9. CLIENTS
-- ═══════════════════════════════════════
DROP POLICY IF EXISTS "Users can view own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can insert own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON public.clients;

CREATE POLICY "Authenticated users can view all clients" ON public.clients
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert clients" ON public.clients
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update clients" ON public.clients
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete clients" ON public.clients
  FOR DELETE USING (auth.role() = 'authenticated');

-- ═══════════════════════════════════════
-- 10. VISITS
-- ═══════════════════════════════════════
DROP POLICY IF EXISTS "Users can view own visits" ON public.visits;
DROP POLICY IF EXISTS "Users can insert own visits" ON public.visits;
DROP POLICY IF EXISTS "Users can update own visits" ON public.visits;
DROP POLICY IF EXISTS "Users can delete own visits" ON public.visits;

CREATE POLICY "Authenticated users can view all visits" ON public.visits
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert visits" ON public.visits
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update visits" ON public.visits
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete visits" ON public.visits
  FOR DELETE USING (auth.role() = 'authenticated');

-- ═══════════════════════════════════════
-- 11. SUPPLIERS
-- ═══════════════════════════════════════
DROP POLICY IF EXISTS "Users can view own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can insert own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can update own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can delete own suppliers" ON public.suppliers;

CREATE POLICY "Authenticated users can view all suppliers" ON public.suppliers
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert suppliers" ON public.suppliers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update suppliers" ON public.suppliers
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete suppliers" ON public.suppliers
  FOR DELETE USING (auth.role() = 'authenticated');

-- ═══════════════════════════════════════
-- 12. ORDERS
-- ═══════════════════════════════════════
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can delete own orders" ON public.orders;

CREATE POLICY "Authenticated users can view all orders" ON public.orders
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert orders" ON public.orders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update orders" ON public.orders
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete orders" ON public.orders
  FOR DELETE USING (auth.role() = 'authenticated');

-- ═══════════════════════════════════════
-- 13. PRODUCTS
-- ═══════════════════════════════════════
DROP POLICY IF EXISTS "Users can view own products" ON public.products;
DROP POLICY IF EXISTS "Users can insert own products" ON public.products;
DROP POLICY IF EXISTS "Users can update own products" ON public.products;
DROP POLICY IF EXISTS "Users can delete own products" ON public.products;

CREATE POLICY "Authenticated users can view all products" ON public.products
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert products" ON public.products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update products" ON public.products
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete products" ON public.products
  FOR DELETE USING (auth.role() = 'authenticated');

-- ═══════════════════════════════════════
-- 14. LAVORAZIONI
-- ═══════════════════════════════════════
DROP POLICY IF EXISTS "Users can view own lavorazioni" ON public.lavorazioni;
DROP POLICY IF EXISTS "Users can insert own lavorazioni" ON public.lavorazioni;
DROP POLICY IF EXISTS "Users can update own lavorazioni" ON public.lavorazioni;
DROP POLICY IF EXISTS "Users can delete own lavorazioni" ON public.lavorazioni;

CREATE POLICY "Authenticated users can view all lavorazioni" ON public.lavorazioni
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert lavorazioni" ON public.lavorazioni
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update lavorazioni" ON public.lavorazioni
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete lavorazioni" ON public.lavorazioni
  FOR DELETE USING (auth.role() = 'authenticated');

-- ═══════════════════════════════════════
-- 15. TEAM_MEMBERS
-- ═══════════════════════════════════════
DROP POLICY IF EXISTS "Users can view own team_members" ON public.team_members;
DROP POLICY IF EXISTS "Users can insert own team_members" ON public.team_members;
DROP POLICY IF EXISTS "Users can update own team_members" ON public.team_members;
DROP POLICY IF EXISTS "Users can delete own team_members" ON public.team_members;

CREATE POLICY "Authenticated users can view all team_members" ON public.team_members
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert team_members" ON public.team_members
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update team_members" ON public.team_members
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete team_members" ON public.team_members
  FOR DELETE USING (auth.role() = 'authenticated');

-- ═══════════════════════════════════════
-- 16. ITEM_RELATIONS
-- ═══════════════════════════════════════
DROP POLICY IF EXISTS "Users can view own item_relations" ON public.item_relations;
DROP POLICY IF EXISTS "Users can insert own item_relations" ON public.item_relations;
DROP POLICY IF EXISTS "Users can update own item_relations" ON public.item_relations;
DROP POLICY IF EXISTS "Users can delete own item_relations" ON public.item_relations;
DROP POLICY IF EXISTS "Authenticated users full access" ON public.item_relations;

CREATE POLICY "Authenticated users can view all item_relations" ON public.item_relations
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert item_relations" ON public.item_relations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update item_relations" ON public.item_relations
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete item_relations" ON public.item_relations
  FOR DELETE USING (auth.role() = 'authenticated');

-- ═══════════════════════════════════════
-- 17. PROFILES (gia' aggiornato ma conferma)
-- ═══════════════════════════════════════
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile or admin" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile or admin" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert for new users" ON public.profiles;

CREATE POLICY "Authenticated users can view all profiles" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update own profile or admin" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id
    OR auth.uid() = '3740d43e-4020-4020-8582-ad305f9d06b4'::uuid
  );

-- ═══════════════════════════════════════
-- VERIFICA FINALE
-- ═══════════════════════════════════════
SELECT 'Tutte le policy aggiornate! Dati condivisi per tutti gli utenti.' as risultato;
