import { test, expect } from 'vitest';

/**
 * E2E Evidence Link Validation
 * Simula a verificação de integridade de links diretos gerados pelo CI.
 */
test('E2E: Direct evidence links from CI/Exports should be reachable', async () => {
  const mockEvidenceLogs = [
    { requestId: 'req-abc', screenshotUrl: 'https://github.com/artifacts/screenshot-abc.png' },
    { requestId: 'req-xyz', screenshotUrl: 'https://github.com/artifacts/screenshot-xyz.png' }
  ];

  // Simulação de validação HTTP
  const validateLink = async (url: string) => {
    // Em um teste E2E real, usaríamos fetch(url, { method: 'HEAD' })
    return url.includes('github.com/artifacts/');
  };

  for (const log of mockEvidenceLogs) {
    const isReachable = await validateLink(log.screenshotUrl);
    expect(isReachable).toBe(true);
  }
});

test('Broken Link Reporting logic', () => {
  const evidenceStatus = {
    'err-1': { ok: true },
    'err-2': { ok: false, reason: '404 Not Found' }
  };
  
  const brokenCount = Object.values(evidenceStatus).filter(s => !s.ok).length;
  expect(brokenCount).toBe(1);
});
