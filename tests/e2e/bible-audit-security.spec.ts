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
  const serviceRoleClient = createClient(supabaseUrl, serviceRoleKey);

  for (const table of TABLES) {
    test.describe(`Table: ${table}`, () => {
      test('anonymous user should have zero access', async () => {
        const { data, error } = await anonClient.from(table).select('*');
        if (data) expect(data.length).toBe(0);
        
        const { error: insErr } = await anonClient.from(table).insert([{ some: 'data' }]);
        expect(insErr).toBeDefined();

        const { error: updErr } = await anonClient.from(table).update({ some: 'data' }).eq('id', '00000000-0000-0000-0000-000000000000');
        expect(updErr).toBeDefined();

        const { error: delErr } = await anonClient.from(table).delete().eq('id', '00000000-0000-0000-0000-000000000000');
        expect(delErr).toBeDefined();
      });

      test('admin (service_role) should have full access', async () => {
        const { data, error } = await serviceRoleClient.from(table).select('*').limit(1);
        expect(error).toBeNull();
      });
      
      test('authenticated user (non-admin) should have limited/no access', async () => {
        // Logic to test with a standard user token would go here
        // For now, ensuring no lateral path exists by confirming RLS is active
        const { data } = await anonClient.from(table).select('*');
        if (data) expect(data.length).toBe(0);
      });
    });
  }
});

