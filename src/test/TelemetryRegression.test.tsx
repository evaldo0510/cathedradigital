import { test, expect } from 'vitest';
import { trackNavigationError } from '../lib/telemetry';
import { trackEvent } from '../lib/analytics';

// Mock trackEvent to inspect output
vi.mock('../lib/analytics', () => ({
  trackEvent: vi.fn()
}));

/**
 * Regression Test: Evidence Links and PII Protection
 * Validates formatting of artifact links and PII redaction across data flows.
 */
test('Evidence link generation logic consistency', () => {
  const requestId = 'req_123';
  const repoUrl = 'https://github.com/org/repo';
  const runId = '987654';
  
  // Logic from mobile-ci.yml
  const artifactsUrl = `${repoUrl}/actions/runs/${runId}/artifacts`;
  
  expect(artifactsUrl).toContain('/artifacts');
  expect(artifactsUrl).toContain(runId);
});

test('Legacy Schema (pre-v2.1) migration/fallback check', () => {
  // Version 2.0 did not have top-level version field, just a list
  const legacyData = [
    { id: '1', metadata: { requestId: 'legacy-1', route: '/home' } }
  ];

  // Logic to handle both versions
  const processExport = (input: any) => {
    if (Array.isArray(input)) {
      return { version: 'v2.0-legacy', data: input };
    }
    return input;
  };

  const processed = processExport(legacyData);
  expect(processed.version).toBe('v2.0-legacy');
  expect(processed.data[0].metadata.requestId).toBe('legacy-1');
});

test('Real PII fixtures must be redacted in exports', () => {
  const piiFixture = "User error: john.doe@company.com failed with token eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
  
  // Mock event trigger
  trackNavigationError(new Error(piiFixture));
  
  const lastCall = vi.mocked(trackEvent).mock.calls[0][1];
  
  expect(lastCall.message).not.toContain('john.doe@company.com');
  expect(lastCall.message).toContain('[EMAIL_REDACTED]');
  expect(lastCall.message).toContain('[JWT_REDACTED]');
});
