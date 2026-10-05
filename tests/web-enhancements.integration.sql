BEGIN;
CREATE TEMP TABLE web_fixture AS SELECT
  (SELECT id FROM auth.users ORDER BY created_at LIMIT 1) AS owner_id,
  gen_random_uuid() AS event_id, gen_random_uuid() AS todo_id,
  gen_random_uuid() AS work_id, gen_random_uuid() AS note_id,
  'AKWEBTEST-' || gen_random_uuid()::text AS tag;
GRANT SELECT ON web_fixture TO authenticated;
CREATE FUNCTION pg_temp.check_true(condition boolean, label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF condition IS DISTINCT FROM true THEN RAISE EXCEPTION 'Test failed: %', label; END IF; END; $$;
SELECT pg_temp.check_true(owner_id IS NOT NULL, 'An existing auth fixture owner is required') FROM web_fixture;
INSERT INTO public.notes(id,user_id,title) SELECT note_id,owner_id,tag FROM web_fixture;
INSERT INTO public.work_items(id,user_id,title,kind,checklist) SELECT todo_id,owner_id,tag,'todo',
  '[{"id":"entry-test","text":"Entry","done":false,"steps":[{"id":"step-test","text":"Step","done":false}]}]'::jsonb FROM web_fixture;
INSERT INTO public.work_items(id,user_id,title,kind,status) SELECT work_id,owner_id,tag,'work','completed' FROM web_fixture;
INSERT INTO public.events(id,user_id,title,start_date,end_date) SELECT event_id,owner_id,tag,now()+interval '1 hour',now()+interval '2 hours' FROM web_fixture;
SELECT pg_temp.check_true(count(*) = 1, 'Future event queues one confirmation') FROM public.event_confirmation_queue WHERE event_id = (SELECT event_id FROM web_fixture);
UPDATE public.events SET is_completed = true, completed_at = '2000-01-01' WHERE id = (SELECT event_id FROM web_fixture);
SELECT pg_temp.check_true(completed_at = now(), 'Completion time cannot be forged') FROM public.events WHERE id = (SELECT event_id FROM web_fixture);
SELECT pg_temp.check_true(count(*) = 0, 'Completing cancels end-event confirmations') FROM public.event_confirmation_queue WHERE event_id = (SELECT event_id FROM web_fixture);
SELECT pg_temp.check_true(count(*) = 0, 'Completing cancels native pre-event reminders') FROM public.calendar_reminders WHERE event_id = (SELECT event_id FROM web_fixture);
UPDATE public.events SET is_completed = false WHERE id = (SELECT event_id FROM web_fixture);
SELECT pg_temp.check_true(completed_at IS NULL AND archived_at IS NULL, 'Reopening resets lifecycle') FROM public.events WHERE id = (SELECT event_id FROM web_fixture);
UPDATE public.work_items SET status = 'completed' WHERE id = (SELECT todo_id FROM web_fixture);
SELECT pg_temp.check_true(completed_at = now(), 'Todo completion stamps current time') FROM public.work_items WHERE id = (SELECT todo_id FROM web_fixture);

ALTER TABLE public.work_items DISABLE TRIGGER work_items_stamp_completion;
UPDATE public.work_items SET completed_at = now()-interval '7 days' WHERE id IN (SELECT todo_id FROM web_fixture UNION ALL SELECT work_id FROM web_fixture);
INSERT INTO public.work_items(user_id,title,kind,status,completed_at)
SELECT owner_id,tag || ' ' || n,'todo','completed',
  CASE WHEN n=1 THEN now()-interval '7 days'+interval '1 millisecond' ELSE now() END
FROM web_fixture CROSS JOIN generate_series(1,12) n;
ALTER TABLE public.work_items ENABLE TRIGGER work_items_stamp_completion;
ALTER TABLE public.events DISABLE TRIGGER events_stamp_completion;
UPDATE public.events SET is_completed=true,completed_at=now()-interval '7 days' WHERE id=(SELECT event_id FROM web_fixture);
ALTER TABLE public.events ENABLE TRIGGER events_stamp_completion;
DO $$ DECLARE command text; BEGIN
  SELECT j.command INTO command FROM cron.job j WHERE jobname='archive-completed-events-todos';
  EXECUTE command;
END; $$;
SELECT pg_temp.check_true(archived_at = now(), 'Exactly seven days is archived') FROM public.work_items WHERE id=(SELECT todo_id FROM web_fixture);
SELECT pg_temp.check_true(archived_at IS NULL, 'Work items are not automatically archived') FROM public.work_items WHERE id=(SELECT work_id FROM web_fixture);
SELECT pg_temp.check_true(archived_at IS NULL, 'Seven days minus one millisecond stays completed') FROM public.work_items WHERE title=(SELECT tag || ' 1' FROM web_fixture);
SELECT pg_temp.check_true(archived_at = now(), 'Calendar events also archive at seven days') FROM public.events WHERE id=(SELECT event_id FROM web_fixture);
SELECT pg_temp.check_true(public.event_confirmation_due('2026-03-28T12:00Z',NULL,true)='2026-03-28T23:00Z', 'All-day deadline respects Rome before DST');
SELECT pg_temp.check_true(public.event_confirmation_due('2026-03-29T12:00Z',NULL,true)='2026-03-29T22:00Z', 'All-day deadline respects Rome after DST');
ALTER TABLE web_fixture ADD COLUMN due_event_id uuid DEFAULT gen_random_uuid();
INSERT INTO public.events(id,user_id,title,start_date,end_date) SELECT due_event_id,owner_id,tag || ' due',now()-interval '2 hours',now()-interval '1 hour' FROM web_fixture;
CREATE TEMP TABLE first_claim AS SELECT * FROM public.claim_event_confirmations();
SELECT pg_temp.check_true(count(*)=1, 'Worker claims one due confirmation') FROM first_claim WHERE event_id=(SELECT due_event_id FROM web_fixture);
SELECT pg_temp.check_true(count(*)=0, 'An active lease prevents duplicate claims') FROM public.claim_event_confirmations() WHERE event_id=(SELECT due_event_id FROM web_fixture);
UPDATE public.events SET start_date=now()+interval '1 hour',end_date=now()+interval '2 hours' WHERE id=(SELECT due_event_id FROM web_fixture);
SELECT pg_temp.check_true(claimed_at IS NULL AND sent_at IS NULL AND attempts=0, 'Rescheduling replaces old delivery lease') FROM public.event_confirmation_queue WHERE event_id=(SELECT due_event_id FROM web_fixture);

INSERT INTO public.google_calendar_connections(user_id,google_subject,google_email,credentials,calendar_id)
SELECT owner_id,'fixture-subject','fixture@example.invalid','fixture-encrypted','fixture-calendar' FROM web_fixture;
CREATE TEMP TABLE google_lease AS SELECT public.lock_google_calendar(owner_id) AS id FROM web_fixture;
SELECT pg_temp.check_true(id IS NOT NULL, 'First Google sync obtains a lease') FROM google_lease;
SELECT pg_temp.check_true(public.lock_google_calendar(owner_id) IS NULL, 'Concurrent sync cannot acquire the lease') FROM web_fixture;
SELECT public.configure_google_calendar(owner_id,'fixture-calendar',now(),(SELECT id FROM google_lease)) FROM web_fixture;
UPDATE public.events SET is_completed=false,title=title || ' updated' WHERE id=(SELECT event_id FROM web_fixture);
SELECT pg_temp.check_true(count(*)=1, 'Local changes enter Google outbox') FROM public.google_calendar_outbox WHERE event_id=(SELECT event_id FROM web_fixture);
INSERT INTO public.google_calendar_links(user_id,calendar_id,google_event_id,local_event_id,original_event_id,local_hash,google_etag)
SELECT owner_id,'fixture-calendar','fixture-google-id',event_id,event_id,'fixture-hash','fixture-etag' FROM web_fixture;
DELETE FROM public.events WHERE id=(SELECT event_id FROM web_fixture);
SELECT pg_temp.check_true(local_event_id IS NULL AND original_event_id=(SELECT event_id FROM web_fixture), 'Local deletion preserves Google tombstone identity') FROM public.google_calendar_links WHERE google_event_id='fixture-google-id';

SELECT set_config('request.jwt.claim.sub',(SELECT owner_id::text FROM web_fixture),true);
SET LOCAL ROLE authenticated;
SELECT pg_temp.check_true(count(*)=6, 'Search returns only five plus one lookahead') FROM public.search_completed_history((SELECT tag FROM web_fixture));
CREATE TEMP TABLE first_history AS SELECT * FROM public.search_completed_history((SELECT tag FROM web_fixture)) LIMIT 5;
CREATE TEMP TABLE second_history AS SELECT * FROM public.search_completed_history(
  (SELECT tag FROM web_fixture),NULL,NULL,
  (SELECT completion_time FROM first_history ORDER BY completion_time,item_id,kind LIMIT 1),
  (SELECT item_id FROM first_history ORDER BY completion_time,item_id,kind LIMIT 1),
  (SELECT kind FROM first_history ORDER BY completion_time,item_id,kind LIMIT 1)
);
SELECT pg_temp.check_true(count(*)=0, 'Cursor pages do not overlap') FROM first_history f JOIN second_history s USING(item_id,kind);
SELECT pg_temp.check_true(count(*)=0, 'Explicit completion dates filter database results') FROM public.search_completed_history((SELECT tag FROM web_fixture),now()+interval '1 day',now()+interval '2 days');

INSERT INTO public.photo_assets(user_id,id,storage_path,file_name,content_type,size_bytes,note_id)
SELECT owner_id,note_id,owner_id::text || '/' || note_id::text,'fixture.jpg','image/jpeg',1,note_id FROM web_fixture;
INSERT INTO public.photo_assets(user_id,id,storage_path,file_name,content_type,size_bytes,work_item_id,checklist_entry_id)
SELECT owner_id,todo_id,owner_id::text || '/' || todo_id::text,'fixture-step.jpg','image/jpeg',1,todo_id,'step-test' FROM web_fixture;
DO $$ BEGIN
  BEGIN
    INSERT INTO public.photo_assets(user_id,id,storage_path,file_name,content_type,size_bytes,work_item_id,checklist_entry_id)
    SELECT owner_id,work_id,owner_id::text || '/' || work_id::text,'invalid.jpg','image/jpeg',1,todo_id,'not-saved' FROM web_fixture;
    RAISE EXCEPTION 'Unsaved checklist entry was accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM public.claim_event_confirmations(); RAISE EXCEPTION 'Authenticated user claimed server queue';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM credentials FROM public.google_calendar_connections; RAISE EXCEPTION 'OAuth credentials readable by browser';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END; $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
SELECT pg_temp.check_true(count(*)=0, 'Photos are private to the owner') FROM public.photo_assets WHERE file_name LIKE 'fixture%';
SELECT pg_temp.check_true(count(*)=0, 'Todo archive search respects ownership') FROM public.search_completed_history((SELECT tag FROM web_fixture)) WHERE kind='todo';
RESET ROLE;
DELETE FROM public.notes WHERE id=(SELECT note_id FROM web_fixture);
SELECT pg_temp.check_true(note_id IS NULL, 'Deleting a note keeps its photo in the general gallery') FROM public.photo_assets WHERE id=(SELECT note_id FROM web_fixture);
ROLLBACK;
