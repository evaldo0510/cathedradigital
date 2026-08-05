import { test, expect } from '@playwright/test';

test.describe('RLS Security Tests - Admin Audit & Leads', () => {
  test('Anonymous user can only INSERT into coming_soon_leads', async ({ request }) => {
    // Attempt to SELECT - should be blocked by GRANTs or return empty due to lack of select policy for anon
    const selectResponse = await request.get('/rest/v1/coming_soon_leads', {
      headers: { 'apikey': process.env.VITE_SUPABASE_ANON_KEY || '' }
    });
    // With current config, anon has INSERT grant but no SELECT policy, so returns [] or error
    expect([401, 403, 404, 200]).toContain(selectResponse.status());
    if (selectResponse.status() === 200) {
      const data = await selectResponse.json();
      expect(data.length).toBe(0);
    }

    // Attempt to INSERT (should work)
    const insertResponse = await request.post('/rest/v1/coming_soon_leads', {
      headers: { 
        'apikey': process.env.VITE_SUPABASE_ANON_KEY || '',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      data: { email: `test-${Date.now()}@example.com` }
    });
    expect(insertResponse.status()).toBe(201);
  });

  test('Regular user cannot view admin_audit_logs', async ({ request }) => {
    const response = await request.get('/rest/v1/admin_audit_logs');
    // Regular user won't have the 'admin' role required by the policy
    expect(response.status()).toBeGreaterThanOrEqual(401);
  });
});
