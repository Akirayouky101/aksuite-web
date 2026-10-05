BEGIN;
SET LOCAL statement_timeout = '15s';

CREATE TEMP TABLE shopping_test_context ON COMMIT DROP AS
SELECT id AS owner_id, gen_random_uuid() AS outsider_id,
  gen_random_uuid() AS list_id, gen_random_uuid() AS item_id
FROM auth.users ORDER BY created_at LIMIT 1;
GRANT SELECT ON shopping_test_context TO authenticated;

DO $test$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM shopping_test_context) THEN
    RAISE EXCEPTION 'Shopping integration test requires one existing user';
  END IF;
  IF has_table_privilege('anon', 'public.shopping_lists', 'SELECT')
    OR has_table_privilege('anon', 'public.shopping_items', 'SELECT') THEN
    RAISE EXCEPTION 'Anonymous role must not have access to shopping data';
  END IF;
END
$test$;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', (SELECT owner_id::text FROM shopping_test_context), true);

INSERT INTO public.shopping_lists (id, title)
SELECT list_id, 'AK Suite transaction test' FROM shopping_test_context;
INSERT INTO public.shopping_items (id, list_id, name, quantity, notes)
SELECT item_id, list_id, 'Test product', '2 confezioni', 'Test note' FROM shopping_test_context;
UPDATE public.shopping_items SET purchased = true
WHERE id = (SELECT item_id FROM shopping_test_context);

DO $test$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.shopping_items
    WHERE id = (SELECT item_id FROM shopping_test_context) AND purchased
  ) THEN
    RAISE EXCEPTION 'Owner must be able to create, read and update products';
  END IF;
  BEGIN
    UPDATE public.shopping_lists SET user_id = (SELECT outsider_id FROM shopping_test_context)
    WHERE id = (SELECT list_id FROM shopping_test_context);
    RAISE EXCEPTION 'Ownership transfer must not be allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END
$test$;

SELECT set_config('request.jwt.claim.sub', (SELECT outsider_id::text FROM shopping_test_context), true);

DO $test$
DECLARE
  affected integer;
BEGIN
  IF EXISTS (SELECT 1 FROM public.shopping_lists WHERE id = (SELECT list_id FROM shopping_test_context))
    OR EXISTS (SELECT 1 FROM public.shopping_items WHERE id = (SELECT item_id FROM shopping_test_context)) THEN
    RAISE EXCEPTION 'Another identity must not see private lists or products';
  END IF;
  UPDATE public.shopping_items SET name = 'Forbidden'
  WHERE id = (SELECT item_id FROM shopping_test_context);
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN RAISE EXCEPTION 'Another identity must not update products'; END IF;
  DELETE FROM public.shopping_lists WHERE id = (SELECT list_id FROM shopping_test_context);
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN RAISE EXCEPTION 'Another identity must not delete lists'; END IF;
  BEGIN
    INSERT INTO public.shopping_items (list_id, name)
    SELECT list_id, 'Forbidden' FROM shopping_test_context;
    RAISE EXCEPTION 'Another identity must not add products to private lists';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END
$test$;

SELECT set_config('request.jwt.claim.sub', (SELECT owner_id::text FROM shopping_test_context), true);
DELETE FROM public.shopping_lists WHERE id = (SELECT list_id FROM shopping_test_context);

RESET ROLE;
DO $test$
BEGIN
  IF EXISTS (SELECT 1 FROM public.shopping_items WHERE id = (SELECT item_id FROM shopping_test_context)) THEN
    RAISE EXCEPTION 'Deleting a list must cascade to its products';
  END IF;
END
$test$;

ROLLBACK;
