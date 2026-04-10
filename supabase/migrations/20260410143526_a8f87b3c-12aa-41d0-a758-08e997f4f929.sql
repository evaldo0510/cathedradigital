-- Enable pg_cron if not enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the intelligent-notifications edge function to run every morning at 9:00 AM UTC
-- We use net_http to call the edge function
SELECT cron.schedule(
  'intelligent-notifications-daily',
  '0 9 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://gpwrpmoniglarqwfyryp.supabase.co/functions/v1/intelligent-notifications',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);
