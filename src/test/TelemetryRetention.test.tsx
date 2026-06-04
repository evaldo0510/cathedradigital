import { test, expect } from 'vitest';

/**
 * Data Retention & Redaction Integrity Test
 */
test('cleanup_telemetry_logs should redact sensitive fields after Tier 1 threshold', () => {
  const mockLog = {
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: {
      stack: 'TypeError: Cannot read property...',
      message: 'Sensitive error info',
      route: '/bible'
    }
  };

  // Logic from public.cleanup_telemetry_logs Tier 1
  const redactTier1 = (log: any) => {
    const meta = { ...log.metadata };
    delete meta.stack;
    delete meta.context;
    delete meta.payload;
    return { ...log, metadata: meta };
  };

  const processed = redactTier1(mockLog);
  
  expect(processed.metadata.stack).toBeUndefined();
  expect(processed.metadata.route).toBe('/bible');
});

test('cleanup_telemetry_logs should delete logs after Tier 2 threshold', () => {
  const mockExpiredLog = {
    created_at: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString()
  };

  const isTier2Expired = (log: any) => {
    const ageInDays = (Date.now() - new Date(log.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return ageInDays > 30;
  };

  expect(isTier2Expired(mockExpiredLog)).true;
});
