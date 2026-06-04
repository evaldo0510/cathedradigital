import { test, expect } from 'vitest';
import { trackNavigationError } from '../lib/telemetry';
import { trackEvent } from '../lib/analytics';

// Mock trackEvent to inspect what is being sent
vi.mock('../lib/analytics', () => ({
  trackEvent: vi.fn()
}));

test('Telemetry should mask sensitive data (PII) before sending', () => {
  const error = new Error('Test Error');
  const context = {
    email: 'user@example.com',
    password: 'supersecretpassword',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    safeData: 'This is public'
  };

  trackNavigationError(error, context);

  const calls = vi.mocked(trackEvent).mock.calls;
  const lastCallProps = calls[calls.length - 1][1];

  expect(lastCallProps.email).toBe('***MASKED***');
  expect(lastCallProps.password).toBe('***MASKED***');
  expect(lastCallProps.token).toBe('***MASKED***');
  expect(lastCallProps.safeData).toBe('This is public');
});
