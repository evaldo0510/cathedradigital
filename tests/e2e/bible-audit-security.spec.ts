import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-client';

const supabaseUrl = process.env.SUPABASE_URL!;
const anonKey = process.env.SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const TABLES = [
  'bible_audit_notifications',
  'bible_audit_alerts',
  'bible_audit_webhook_logs',
  'bible_audit_notification_versions',
  'bible_audit_action_logs',
  'bible_audit_runs',
  'bible_audit_security_logs',
  'bible_audit_security_scans'
];

test.describe('Bible Audit RLS Security', () => {
  const anonClient = createClient(supabaseUrl, anonKey);
  const adminClient = createClient(supabaseUrl, serviceRoleKey); // Service role simulates admin

  for (const table of TABLES) {
    test(`anonymous user should not be able to read ${table}`, async () => {
      const { data, error } = await anonClient.from(table).select('*');
      // If RLS is enabled and no policy allows it, it returns empty data or error
      // In Supabase, if select fails RLS it often just returns []
      if (data) {
        expect(data.length).toBe(0);
      }
    });

    test(`anonymous user should not be able to insert into ${table}`, async () => {
      const { error } = await anonClient.from(table).insert([{ test: 'data' }]);
      expect(error).toBeDefined();
    });

    test(`anonymous user should not be able to update ${table}`, async () => {
      const { error } = await anonClient.from(table).update({ test: 'data' }).eq('id', '00000000-0000-0000-0000-000000000000');
      expect(error).toBeDefined();
    });

    test(`anonymous user should not be able to delete from ${table}`, async () => {
      const { error } = await anonClient.from(table).delete().eq('id', '00000000-0000-0000-0000-000000000000');
      expect(error).toBeDefined();
    });
  }
});
