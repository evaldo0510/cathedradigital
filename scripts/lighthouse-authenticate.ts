/**
 * Autentica um usuário de teste via Playwright e salva a sessão em
 * .lighthouseci/storage-state/session.json no formato consumido pelo
 * puppeteerScript do Lighthouse CI.
 *
 * Variáveis (opcionais em dev):
 *   TEST_USER_EMAIL, TEST_USER_PASSWORD
 *   LH_BASE_URL (default http://localhost:8080)
 *   LH_ALLOW_UNAUTH=1 → não falha se credenciais ausentes; grava sentinela.
 *
 * Em caso de falha, gera um dossiê em .lighthouseci/auth-failure/:
 *   - form-before.png / form-after.png
 *   - page.html
 *   - report.json (URL, timings, seletores tentados, erros)
 */
import { chromium, type Page, type BrowserContext } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.LH_BASE_URL || 'http://localhost:8080';
const EMAIL = process.env.TEST_USER_EMAIL;
const PASSWORD = process.env.TEST_USER_PASSWORD;
const ALLOW_UNAUTH = process.env.LH_ALLOW_UNAUTH === '1';

const OUT_DIR = path.resolve('.lighthouseci/storage-state');
const OUT_FILE = path.join(OUT_DIR, 'session.json');
const FAIL_DIR = path.resolve('.lighthouseci/auth-failure');
fs.mkdirSync(OUT_DIR, { recursive: true });

if (!EMAIL || !PASSWORD) {
  if (ALLOW_UNAUTH) {
    fs.writeFileSync(
      OUT_FILE,
      JSON.stringify({ unauthenticated: true, reason: 'no-credentials', baseUrl: BASE_URL }, null, 2),
    );
    console.log('⚠️  TEST_USER_EMAIL/TEST_USER_PASSWORD ausentes — modo não autenticado (LH_ALLOW_UNAUTH=1).');
    process.exit(0);
  }
  console.error('❌ TEST_USER_EMAIL e TEST_USER_PASSWORD são obrigatórios (use LH_ALLOW_UNAUTH=1 para dev).');
  process.exit(1);
}

async function dumpFailure(page: Page, context: BrowserContext, report: Record<string, unknown>) {
  fs.mkdirSync(FAIL_DIR, { recursive: true });
  try { await page.screenshot({ path: path.join(FAIL_DIR, 'form-after.png'), fullPage: true }); } catch {}
  try { fs.writeFileSync(path.join(FAIL_DIR, 'page.html'), await page.content()); } catch {}
  try {
    const cookies = await context.cookies();
    fs.writeFileSync(path.join(FAIL_DIR, 'cookies.json'), JSON.stringify(cookies, null, 2));
  } catch {}
  fs.writeFileSync(path.join(FAIL_DIR, 'report.json'), JSON.stringify(report, null, 2));
  console.error(`❌ Falha no login. Dossiê em ${FAIL_DIR}`);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();

const consoleErrors: string[] = [];
const networkErrors: string[] = [];
page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
page.on('requestfailed', (r) => networkErrors.push(`${r.method()} ${r.url()} — ${r.failure()?.errorText}`));

const attempts: Array<{ step: string; ok: boolean; error?: string; ms: number }> = [];
const track = async (step: string, fn: () => Promise<void>) => {
  const t0 = Date.now();
  try { await fn(); attempts.push({ step, ok: true, ms: Date.now() - t0 }); }
  catch (e) { attempts.push({ step, ok: false, error: (e as Error).message, ms: Date.now() - t0 }); throw e; }
};

try {
  console.log(`[auth] navegando para ${BASE_URL}/auth`);
  await track('goto /auth', () => page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 20000 }).then(() => {}));

  fs.mkdirSync(FAIL_DIR, { recursive: true });
  await page.screenshot({ path: path.join(FAIL_DIR, 'form-before.png'), fullPage: true }).catch(() => {});

  await track('fill email', () => page.getByLabel(/e-?mail/i).first().fill(EMAIL));
  await track('fill password', () => page.getByLabel(/senha|password/i).first().fill(PASSWORD));
  await track('click submit', () => page.getByRole('button', { name: /entrar|sign in|login/i }).first().click());

  await track('wait session', () =>
    page.waitForFunction(
      () => Object.keys(window.localStorage).some((k) => k.startsWith('sb-') && k.endsWith('-auth-token')),
      { timeout: 15000 },
    ).then(() => {}),
  );

  const localStorage = await page.evaluate(() =>
    Object.keys(window.localStorage).map((k) => [k, window.localStorage.getItem(k)]),
  );
  const cookies = await context.cookies();

  fs.writeFileSync(
    OUT_FILE,
    JSON.stringify({ generatedAt: new Date().toISOString(), baseUrl: BASE_URL, email: EMAIL, localStorage, cookies }, null, 2),
  );
  // limpa dossiê de falha anterior
  fs.rmSync(FAIL_DIR, { recursive: true, force: true });
  console.log(`✅ sessão salva em ${OUT_FILE}`);
} catch (err) {
  await dumpFailure(page, context, {
    baseUrl: BASE_URL,
    finalUrl: page.url(),
    error: (err as Error).message,
    attempts,
    consoleErrors,
    networkErrors,
    selectors: {
      email: 'getByLabel(/e-?mail/i)',
      password: 'getByLabel(/senha|password/i)',
      submit: "getByRole('button', { name: /entrar|sign in|login/i })",
    },
  });
  await browser.close();
  process.exit(1);
} finally {
  await browser.close().catch(() => {});
}
