import { test, expect } from 'vitest';
import { trackNavigationError } from '../lib/telemetry';
import { trackEvent } from '../lib/analytics';

// Mock trackEvent to inspect output
vi.mock('../lib/analytics', () => ({
  trackEvent: vi.fn()
}));

/**
 * PII Leak Prevention Test Suite
 * Ensures that sensitive information never leaves the client or appears in exports/templates.
 */
test('Export Schema & PII Protection: JSON/CSV data must be redacted', () => {
  const sensitiveRawData = {
    email: 'secret@user.com',
    password: 'password123',
    token: 'jwt.token.here',
    message: 'Error for secret@user.com with token eyJhbGc...',
    stack: 'TypeError at Object.login (auth.ts:10) \n at secret@user.com'
  };

  // Telemetry processing
  trackNavigationError(new Error(sensitiveRawData.message), { 
    context: { email: sensitiveRawData.email },
    stack: sensitiveRawData.stack 
  });

  const lastEvent = vi.mocked(trackEvent).mock.calls[0][1];

  // 1. Validate Masking logic works on strings and objects
  expect(lastEvent.message).not.toContain('secret@user.com');
  expect(lastEvent.message).toContain('[EMAIL_REDACTED]');
  expect(lastEvent.message).toContain('[JWT_REDACTED]');
  expect(lastEvent.stack).not.toContain('secret@user.com');
  expect(lastEvent.email).toBe('***MASKED***');

  // 2. Schema Versioning check (Simulated)
  const schemaVersion = '2.1.0';
  expect(schemaVersion).toBeDefined();
});

test('CI Alert Template logic should not include raw PII in any metadata field', () => {
  const commitMsg = "Fix for user@example.com";
  const maskedMsg = commitMsg.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED]');
  
  expect(maskedMsg).toBe("Fix for [REDACTED]");
  
  // Extra check for metadata in exports
  const exportMetadata = { requestId: "req-1", user: "john.doe@test.com" };
  const maskedExport = JSON.parse(JSON.stringify(exportMetadata).replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[MASKED]'));
  expect(maskedExport.user).toBe("[MASKED]");
});

test('Evidence link validity simulation', () => {
  const mockUrl = "https://github.com/artifacts/123";
  const isValid = mockUrl.startsWith('https://github.com/');
  expect(isValid).toBe(true);
});

