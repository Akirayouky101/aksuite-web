-- Apply separately, only after the production endpoints and Vault secret exist.
-- Store the same CRON_SECRET as aksuite_web_cron_secret in Supabase Vault.
CREATE EXTENSION IF NOT EXISTS pg_net;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'aksuite_web_cron_secret') THEN
    RAISE EXCEPTION 'Configure aksuite_web_cron_secret in Vault before enabling web integration jobs';
  END IF;
END; $$;
SELECT cron.schedule('aksuite-web-event-confirmations', '* * * * *', $job$
  SELECT net.http_post(
    url := 'https://aksuite.app/api/web-push/send',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization',
      'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'aksuite_web_cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
$job$);
-- Enable this second job only after Google OAuth is configured and verified.
SELECT cron.schedule('aksuite-google-calendar-sync', '* * * * *', $job$
  SELECT net.http_post(
    url := 'https://aksuite.app/api/google-calendar/worker',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization',
      'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'aksuite_web_cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
$job$);
