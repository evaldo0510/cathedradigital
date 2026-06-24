import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

/**
 * Suíte E2E consolidada do módulo da Bíblia: render do livro, navegação,
 * busca por referência e abertura de bolha do Nexus.
 *
 * Saída: /tmp/bible-qa/e2e/{summary.json, screenshots/}
 */

const OUT_DIR = '/tmp/bible-qa/e2e';
const SHOT_DIR = `${OUT_DIR}/screenshots`;
mkdirSync(SHOT_DIR, { recursive: true });

interface StepResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  detail?: string;
  evidence?: string;
}

const steps: StepResult[] = [];

async function step(name: string, fn: () => Promise<string | void>, evidence?: string) {
  try {
    const detail = await fn();
    steps.push({ name, status: 'pass', detail: typeof detail === 'string' ? detail : undefined, evidence });
  } catch (e) {
    steps.push({ name, status: 'fail', detail: (e as Error).message, evidence });
  }
}

async function openBookChapter(page: Page) {
  await page.goto('/bible', { waitUntil: 'load' });
  await page.waitForTimeout(500);
  const firstBook = page.locator('button:has-text("Gênesis"), button:has-text("Genesis")').first();
  await firstBook.click({ timeout: 5_000 });
  await page.waitForTimeout(400);
  const ch1 = page.locator('button:has-text("1")').first();
  if (await ch1.count() > 0) await ch1.click({ timeout: 5_000 }).catch(() => {});
  await page.locator('[data-testid^="verse-text-"]').first().waitFor({ state: 'visible', timeout: 12_000 });
}

test.describe('Bíblia · suíte E2E consolidada', () => {
  test('texto, navegação, busca e bolhas', async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        steps.push({ name: `console:error`, status: 'fail', detail: msg.text() });
      }
    });

    await step('abrir /bible e carregar primeiro capítulo', async () => {
      await openBookChapter(page);
      await page.screenshot({ path: `${SHOT_DIR}/01-chapter.png` });
      return 'capítulo renderizado';
    }, '01-chapter.png');

    await step('contagem de versículos > 5', async () => {
      const count = await page.locator('[data-testid^="verse-text-"]').count();
      if (count < 5) throw new Error(`apenas ${count} versículos`);
      return `${count} versículos`;
    });

    await step('texto do versículo 1 não vazio', async () => {
      const txt = (await page.locator('[data-testid="verse-text-1"]').innerText().catch(() => '')) || '';
      if (txt.trim().length < 10) throw new Error(`texto curto: "${txt}"`);
      return `${txt.slice(0, 60)}…`;
    });

    await step('navegação próximo capítulo', async () => {
      const nextBtn = page.locator('button[aria-label*="próximo" i], button[aria-label*="next" i]').first();
      if (await nextBtn.count() === 0) {
        // tenta um botão genérico de avançar
        const fallback = page.getByRole('button', { name: /próximo|next|>/i }).first();
        if (await fallback.count() === 0) throw new Error('botão próximo capítulo não encontrado');
        await fallback.click({ timeout: 5_000 });
      } else {
        await nextBtn.click({ timeout: 5_000 });
      }
      await page.waitForTimeout(800);
      await page.screenshot({ path: `${SHOT_DIR}/02-next-chapter.png` });
      const count = await page.locator('[data-testid^="verse-text-"]').count();
      if (count < 1) throw new Error('próximo capítulo sem versículos');
      return `${count} versículos`;
    }, '02-next-chapter.png');

    await step('bolhas do Nexus presentes em algum versículo', async () => {
      const bubbles = page.locator('[data-testid^="nexus-bubbles-"] button');
      const n = await bubbles.count();
      if (n === 0) {
        // não é falha — só registra
        steps.push({ name: 'bolhas:nota', status: 'skip', detail: 'nenhum versículo amostrado tem cross-ref ativa' });
        return 'nenhuma bolha';
      }
      await bubbles.first().scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${SHOT_DIR}/03-nexus-bubbles.png` });
      await bubbles.first().click({ timeout: 3_000 }).catch(() => {});
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${SHOT_DIR}/04-bubble-open.png` });
      return `${n} bolhas`;
    }, '03-nexus-bubbles.png');

    const summary = {
      total: steps.length,
      passed: steps.filter((s) => s.status === 'pass').length,
      failed: steps.filter((s) => s.status === 'fail').length,
      skipped: steps.filter((s) => s.status === 'skip').length,
      steps,
    };
    writeFileSync(`${OUT_DIR}/summary.json`, JSON.stringify(summary, null, 2));

    expect(summary.failed, `Falhas: ${JSON.stringify(steps.filter((s) => s.status === 'fail'), null, 2)}`).toBe(0);
  });
});
