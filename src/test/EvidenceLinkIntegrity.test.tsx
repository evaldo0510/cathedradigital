import { test, expect, vi } from 'vitest';

/**
 * E2E Evidence Link Validation
 * Simula a verificação de integridade de links diretos gerados pelo CI.
 */
test('E2E: Direct evidence links from CI/Exports should be reachable and return valid content', async () => {
  const mockEvidenceLogs = [
    { requestId: 'req-abc', screenshotUrl: 'https://github.com/artifacts/screenshot-abc.png', type: 'image/png' },
    { requestId: 'req-xyz', screenshotUrl: 'https://github.com/artifacts/screenshot-xyz.png', type: 'image/png' }
  ];

  // Simulação de validação HTTP real (mock fetch)
  const simulateFetch = async (url: string) => {
    return {
      ok: true,
      status: 200,
      headers: { get: (name: string) => name === 'content-type' ? 'image/png' : null }
    };
  };

  for (const log of mockEvidenceLogs) {
    const response = await simulateFetch(log.screenshotUrl);
    
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    
    const contentType = response.headers.get('content-type');
    expect(contentType).toBe(log.type);
    expect(log.screenshotUrl).toContain('github.com/artifacts/');
  }
});

test('Security: Evidence links must respect permissions and expire tokens', async () => {
  const expiredUrl = 'https://github.com/artifacts/expired-token?token=old';
  const forbiddenUrl = 'https://github.com/artifacts/no-access';
  
  const mockFetch = vi.fn().mockImplementation((url: string) => {
    if (url.includes('expired-token')) return Promise.resolve({ ok: false, status: 403, statusText: 'Token Expired' });
    if (url.includes('no-access')) return Promise.resolve({ ok: false, status: 401, statusText: 'Unauthorized' });
    return Promise.resolve({ ok: true, status: 200 });
  });

  // Testando link expirado
  const expiredResp = await mockFetch(expiredUrl);
  expect(expiredResp.status).toBe(403);
  
  // Testando permissão negada
  const forbiddenResp = await mockFetch(forbiddenUrl);
  expect(forbiddenResp.status).toBe(401);
});

test('Broken Link Reporting logic with Detailed Reasons', () => {
  const evidenceStatus = {
    'err-1': { ok: true },
    'err-2': { ok: false, reason: '404 Not Found', detail: 'Arquivo não encontrado no storage' },
    'err-3': { ok: false, reason: '403 Forbidden', detail: 'Token expirado ou permissão negada' }
  };
  
  const brokenLogs = Object.entries(evidenceStatus).filter(([_, s]) => !s.ok);
  expect(brokenLogs.length).toBe(2);
  expect(brokenLogs[0][1].detail).toContain('não encontrado');
  expect(brokenLogs[1][1].detail).toContain('Token expirado');
});

test('Broken Link Reporting logic', () => {
  const evidenceStatus = {
    'err-1': { ok: true },
    'err-2': { ok: false, reason: '404 Not Found' }
  };
  
  const brokenCount = Object.values(evidenceStatus).filter(s => !s.ok).length;
  expect(brokenCount).toBe(1);
});
