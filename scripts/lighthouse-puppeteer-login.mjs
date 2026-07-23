/**
 * Login hook do Lighthouse CI (puppeteerScript).
 *
 * Se .lighthouseci/storage-state/session.json existir e contiver uma sessão,
 * restaura localStorage + cookies. Caso contrário (dev/PR sem credenciais),
 * segue sem autenticar — o Lighthouse mede a rota como visitante.
 */
import fs from 'node:fs';
import path from 'node:path';

/** @param {import('puppeteer').Browser} browser */
export default async (browser, context) => {
  const url = new URL(context.url);
  const origin = url.origin;
  const statePath = path.resolve('.lighthouseci/storage-state/session.json');
  if (!fs.existsSync(statePath)) {
    console.log('[LHCI login] Sem session.json — rodando não autenticado.');
    return;
  }
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  if (state.unauthenticated) {
    console.log(`[LHCI login] Sessão marcada não autenticada (${state.reason}) — pulando restore.`);
    return;
  }

  const page = await browser.newPage();
  await page.goto(origin, { waitUntil: 'domcontentloaded' });

  await page.evaluate((entries) => {
    for (const [key, value] of entries) window.localStorage.setItem(key, value);
  }, state.localStorage || []);

  if (state.cookies?.length) await page.setCookie(...state.cookies);
  await page.close();
};
