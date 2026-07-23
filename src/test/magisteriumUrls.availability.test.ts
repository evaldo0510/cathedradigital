/**
 * Valida que TODA URL configurada em `MAGISTERIUM_URLS` retorna 200 (ou 3xx→200).
 *
 * Custo: bate direto em vatican.va. Por isso o teste só roda quando
 * `CHECK_MAGISTERIUM_URLS=1` — ideal em CI antes do pipeline de deploy,
 * evitando lentidão em `vitest` local.
 *
 * Uso: `CHECK_MAGISTERIUM_URLS=1 vitest run src/test/magisteriumUrls.availability.test.ts`
 */
import { describe, it, expect } from 'vitest';
import { MAGISTERIUM_URLS } from '@/data/magisterium-urls';

const ENABLED = process.env.CHECK_MAGISTERIUM_URLS === '1';
const TIMEOUT_MS = 15_000;

// Deduplica URLs (várias chaves podem apontar ao mesmo documento).
const uniqueUrls = Array.from(new Set(Object.values(MAGISTERIUM_URLS)));

const check = async (url: string): Promise<{ status: number; finalUrl: string }> => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    // HEAD é mais rápido, mas vatican.va às vezes retorna 405/403 no HEAD.
    // Fazemos GET com Range mínimo para não baixar o body inteiro.
    const res = await fetch(url, {
      method: 'GET',
      signal: ctrl.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'CathedraDigital-CI/1.0',
        'Range': 'bytes=0-1023',
        'Accept': 'text/html,application/xhtml+xml,application/pdf',
      },
    });
    // Drena o body para evitar leaks.
    await res.arrayBuffer().catch(() => {});
    return { status: res.status, finalUrl: res.url };
  } finally {
    clearTimeout(timer);
  }
};

describe.skipIf(!ENABLED)('MAGISTERIUM_URLS · availability', () => {
  it('possui pelo menos uma URL para validar', () => {
    expect(uniqueUrls.length).toBeGreaterThan(0);
  });

  it.concurrent.each(uniqueUrls)(
    'responde 200/206 · %s',
    async (url) => {
      const { status, finalUrl } = await check(url);
      // 206 = Partial Content (aceita Range). 200 = OK.
      expect(
        [200, 206],
        `URL ${url} respondeu ${status} (final: ${finalUrl})`,
      ).toContain(status);
    },
    TIMEOUT_MS + 2_000,
  );
});

// Placeholder para quando desabilitado — evita "no tests found" em CI local.
describe.skipIf(ENABLED)('MAGISTERIUM_URLS · availability (skipped)', () => {
  it('define CHECK_MAGISTERIUM_URLS=1 para validar URLs', () => {
    expect(true).toBe(true);
  });
});
