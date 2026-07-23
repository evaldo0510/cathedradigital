/**
 * Autentica um usuário de teste via Playwright e salva a sessão em
 * .lighthouseci/storage-state/session.json no formato consumido pelo
 * puppeteerScript do Lighthouse CI.
 *
 * Requer variáveis de ambiente:
 *   TEST_USER_EMAIL
 *   TEST_USER_PASSWORD
 *   LH_BASE_URL (default http://localhost:8080)
 *
 * O usuário de teste precisa existir no Cloud (sign-up manual, uma vez).
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.LH_BASE_URL || 'http://localhost:8080';
const EMAIL = process.env.TEST_USER_EMAIL;
const PASSWORD = process.env.TEST_USER_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error('❌ TEST_USER_EMAIL e TEST_USER_PASSWORD são obrigatórios.');
  process.exit(1);
}

const OUT_DIR = path.resolve('.lighthouseci/storage-state');
const OUT_FILE = path.join(OUT_DIR, 'session.json');
fs.mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();

console.log(`[auth] navegando para ${BASE_URL}/auth`);
await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded' });

// Preenche login por e-mail (adapta se a rota expor outro nome de campo)
await page.getByLabel(/e-?mail/i).first().fill(EMAIL);
await page.getByLabel(/senha|password/i).first().fill(PASSWORD);
await page.getByRole('button', { name: /entrar|sign in|login/i }).first().click();

// Aguarda a sessão hidratar (Supabase escreve no localStorage)
await page.waitForFunction(
  () => Object.keys(window.localStorage).some((k) => k.startsWith('sb-') && k.endsWith('-auth-token')),
  { timeout: 15000 },
);

// Extrai localStorage + cookies
const localStorage = await page.evaluate(() =>
  Object.keys(window.localStorage).map((k) => [k, window.localStorage.getItem(k)]),
);
const cookies = await context.cookies();

fs.writeFileSync(
  OUT_FILE,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      baseUrl: BASE_URL,
      email: EMAIL,
      localStorage,
      cookies,
    },
    null,
    2,
  ),
);

console.log(`✅ sessão salva em ${OUT_FILE}`);
await browser.close();
