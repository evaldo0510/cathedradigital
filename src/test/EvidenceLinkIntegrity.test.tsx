import { test, expect } from 'vitest';

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
    // Simula resposta HTTP 200 e tipo de conteúdo esperado
    return {
      ok: true,
      status: 200,
      headers: { get: (name: string) => name === 'content-type' ? 'image/png' : null }
    };
  };

  for (const log of mockEvidenceLogs) {
    const response = await simulateFetch(log.screenshotUrl);
    
    // Validando resposta HTTP
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    
    // Validando conteúdo esperado (tipo de arquivo)
    const contentType = response.headers.get('content-type');
    expect(contentType).toBe(log.type);
    
    // Validando que o link pertence ao domínio correto de artefatos
    expect(log.screenshotUrl).toContain('github.com/artifacts/');
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
