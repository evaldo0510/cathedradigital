import { test, expect, devices, type Page } from '@playwright/test';
import {
  bubbleLocator,
  openBubble,
  waitForBubbleClosed,
  assertAnchored,
  assertInViewport,
  dumpBubbleArtifacts,
} from './utils/popover-bubble';

/**
 * E2E — Popover ancorado ao chip em viewport MOBILE.
 *
 * Valida que, ao rolar e aplicar filtros em telas pequenas
 * (iPhone 12 / Pixel 5), a bolha do chip:
 *  - continua ancorada ao chip clicado
 *  - permanece totalmente dentro do viewport (sem cortar conteúdo)
 *  - fecha automaticamente ao trocar de filtro/página
 *
 * Reforça captura de vídeo + trace: `video: 'retain-on-failure'` e
 * `trace: 'retain-on-failure'` (herdados de `playwright.config.ts`) —
 * os helpers em `utils/popover-bubble.ts` já anexam screenshot + HTML
 * do PopoverContent quando qualquer assert de ancoragem/viewport falha.
 */

const ROUTE = '/magisterium';

async function openExplorer(page: Page, query = ''): Promise<void> {
  await page.goto(`${ROUTE}${query}`);
  await page.getByPlaceholder('Buscar documento, autor ou tema...').waitFor();
}

// Força trace + vídeo neste arquivo mesmo em execução local (não só CI).
test.use({
  trace: 'retain-on-failure',
  video: 'retain-on-failure',
  screenshot: 'only-on-failure',
});

const MOBILE_VIEWPORTS = [
  { label: 'iphone-12', device: devices['iPhone 12'] },
  { label: 'pixel-5', device: devices['Pixel 5'] },
] as const;

for (const { label, device } of MOBILE_VIEWPORTS) {
  test.describe(`Popover mobile (${label}) — ancoragem e viewport`, () => {
    test.use({ ...device });

    test('após rolar, bolha ancora ao chip e não corta no viewport mobile', async ({
      page,
    }, testInfo) => {
      await openExplorer(page, '?theme=Maria');

      // Rola a página para simular leitura antes de interagir com o chip.
      await page.mouse.wheel(0, 400);
      await page.waitForTimeout(150);

      const chip = page.getByRole('button', { name: 'Maria', exact: true }).first();
      await chip.scrollIntoViewIfNeeded();

      await openBubble(page, chip, /Maria/);
      await assertAnchored(page, testInfo, chip, /Maria/);
      await assertInViewport(page, testInfo, bubbleLocator(page, /Maria/));

      // Legibilidade mínima: fonte >= 12px e largura razoável no mobile.
      const bubble = bubbleLocator(page, /Maria/).first();
      const metrics = await bubble.evaluate((el) => {
        const cs = getComputedStyle(el as HTMLElement);
        const rect = (el as HTMLElement).getBoundingClientRect();
        return {
          fontSize: parseFloat(cs.fontSize),
          width: rect.width,
          text: (el as HTMLElement).innerText.trim().length,
        };
      });
      try {
        expect(metrics.fontSize, 'texto da bolha deve ser legível no mobile').toBeGreaterThanOrEqual(12);
        expect(metrics.width, 'bolha não pode ter largura ~0 no mobile').toBeGreaterThan(80);
        expect(metrics.text, 'bolha deve conter texto').toBeGreaterThan(0);
      } catch (err) {
        await dumpBubbleArtifacts(page, testInfo, `mobile-readability-${label}`);
        throw err;
      }
    });

    test('ao aplicar novo filtro em mobile, bolha antiga fecha (sem órfã) e nova ancora', async ({
      page,
    }, testInfo) => {
      await openExplorer(page, '?theme=Maria');

      const chip = page.getByRole('button', { name: 'Maria', exact: true }).first();
      await openBubble(page, chip, /Maria/);
      await assertInViewport(page, testInfo, bubbleLocator(page, /Maria/));

      // Aplica novo filtro (categoria) — troca de estado deve limpar bolha.
      const catChip = page
        .getByRole('button', { name: /Enc[íi]clicas/i })
        .first();
      await catChip.scrollIntoViewIfNeeded();
      await catChip.click();

      // Não pode restar bolha órfã depois da mudança de filtro.
      await waitForBubbleClosed(page, 3000);

      // Reabre no chip de categoria e valida ancoragem + viewport em mobile.
      await openBubble(page, catChip, /Enc[íi]clicas/);
      await assertAnchored(page, testInfo, catChip, /Enc[íi]clicas/);
      await assertInViewport(page, testInfo, bubbleLocator(page, /Enc[íi]clicas/));
    });
  });
}
