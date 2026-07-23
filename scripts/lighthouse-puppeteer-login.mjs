/**
 * Login hook do Lighthouse CI (puppeteerScript).
 *
 * Executa antes de cada run: navega ao app, injeta a sessão Supabase
 * salva em .lighthouseci/storage-state/session.json pelo lighthouse-run.mjs.
 *
 * A geração da sessão é feita fora do LHCI (Playwright), pois o LHCI
 * mede a página final, não o fluxo de login.
 */
import fs from 'node:fs';
import path from 'node:path';

/** @param {import('puppeteer').Browser} browser */
export default async (browser, context) => {
  const url = new URL(context.url);
  const origin = url.origin;
  const statePath = path.resolve('.lighthouseci/storage-state/session.json');
  if (!fs.existsSync(statePath)) {
    throw new Error(
      `[LHCI login] Sessão não encontrada em ${statePath}. Rode scripts/lighthouse-authenticate.ts primeiro.`,
    );
  }
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));

  const page = await browser.newPage();
  await page.goto(origin, { waitUntil: 'domcontentloaded' });

  // Restaura localStorage (Supabase JS SPA lê a sessão daqui)
  await page.evaluate((entries) => {
    for (const [key, value] of entries) {
      window.localStorage.setItem(key, value);
    }
  }, state.localStorage || []);

  // Restaura cookies (Supabase SSR)
  if (state.cookies?.length) {
    await page.setCookie(...state.cookies);
  }

  await page.close();
};
