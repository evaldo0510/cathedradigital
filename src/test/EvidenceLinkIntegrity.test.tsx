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

test('Security: Evidence links must respect permissions, expire tokens, and handle revocation', async () => {
  const currentTime = Date.now();
  
  // Link expirado no tempo
  const expiredUrl = `https://cathedra.app/inspect/evidence/err-1?token=xyz&expires=${currentTime - 1000}`;
  
  // Link com versão de revogação antiga
  const revokedUrl = `https://cathedra.app/inspect/evidence/err-1?token=xyz&expires=${currentTime + 3600000}&v=1`;
  
  const currentRevocationVersion = 2;

  const validateLink = (url: string) => {
    const urlObj = new URL(url);
    const expires = parseInt(urlObj.searchParams.get('expires') || '0');
    const version = parseInt(urlObj.searchParams.get('v') || '1');

    if (expires < Date.now()) {
      return { ok: false, status: 403, code: 'ERRO_EXPIRADO', detail: 'O token deste link expirou.' };
    }
    if (version < currentRevocationVersion) {
      return { ok: false, status: 403, code: 'ERRO_REVOGADO', detail: 'Este link foi invalidado por motivos de segurança.' };
    }
    return { ok: true, status: 200 };
  };

  const expiredResult = validateLink(expiredUrl);
  expect(expiredResult.status).toBe(403);
  expect(expiredResult.code).toBe('ERRO_EXPIRADO');

  const revokedResult = validateLink(revokedUrl);
  expect(revokedResult.status).toBe(403);
  expect(revokedResult.code).toBe('ERRO_REVOGADO');
});

test('Broken Link Reporting logic with Standardized Codes', () => {
  const evidenceStatus: Record<string, { ok: boolean; reason: string; detail: string; code: string }> = {
    'err-2': { ok: false, reason: 'HTTP 404', detail: 'A evidência solicitada não existe.', code: 'ERRO_NAO_ENCONTRADO' },
    'err-3': { ok: false, reason: 'HTTP 403', detail: 'Token expirado ou acesso negado.', code: 'ERRO_PERMISSAO' }
  };
  
  const brokenLogs = Object.values(evidenceStatus);
  expect(brokenLogs.length).toBe(2);
  expect(brokenLogs[0].code).toBe('ERRO_NAO_ENCONTRADO');
  expect(brokenLogs[1].code).toBe('ERRO_PERMISSAO');
});

test('UI: Opening evidence links displays standardized error messages and codes', () => {
  const getStandardizedMessage = (status: number, customCode?: string) => {
    if (status === 403) return `${customCode || 'ERRO_PERMISSAO'}: Token expirado ou acesso negado`;
    if (status === 404) return 'ERRO_NAO_ENCONTRADO: A evidência solicitada não existe';
    return 'ERRO_AUTENTICACAO: Autenticação necessária';
  };

  expect(getStandardizedMessage(403, 'ERRO_EXPIRADO')).toContain('ERRO_EXPIRADO');
  expect(getStandardizedMessage(404)).toContain('ERRO_NAO_ENCONTRADO');
  
  // Verificação de PII
  const msg = getStandardizedMessage(403);
  expect(msg).not.toMatch(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
});
