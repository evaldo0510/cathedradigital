-- Enable pg_cron if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the intelligent notifications check every hour
-- We use a generic name for the function URL and key in the query, 
-- but in practice, we need to pass the actual URL and Service Role Key.
-- Since I can't easily get the URL/Key here, I'll provide the SQL structure
-- and the user can finalize it or I can use a vault/secret approach if available.
-- Actually, the standard way in Supabase is to use net.http_post within a cron job.

SELECT cron.schedule(
    'intelligent-notifications-hourly',
    '0 * * * *', -- Every hour at minute 0
    $$
    SELECT
      net.http_post(
        url := (SELECT value FROM next_public.vault WHERE name = 'SUPABASE_URL') || '/functions/v1/intelligent-notifications',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT value FROM next_public.vault WHERE name = 'SUPABASE_SERVICE_ROLE_KEY')
        ),
        body := '{}'
      );
    $$
);
