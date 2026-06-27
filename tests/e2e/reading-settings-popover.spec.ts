/**
 * E2E (Playwright) — Popover de configurações de leitura no módulo da Bíblia.
 *
 * Como rodar localmente:
 *   bunx playwright install
 *   bunx playwright test tests/e2e/reading-settings-popover.spec.ts \
 *     --project=mobile-safari --project=tablet-safari --project=chromium
 *
 * Variáveis opcionais:
 *   E2E_BIBLE_URL — URL da rota que renderiza <ReadingSettingsPopover />
 *                   (default: ${baseURL}/bible).
 */
import { test, expect } from '@playwright/test';

const PATH = process.env.E2E_BIBLE_PATH || '/bible';

async function openAndAssertPopover(page: import('@playwright/test').Page) {
  const trigger = page.getByRole('button', { name: /Configurações de Leitura/i });
  await expect(trigger).toBeVisible();
  // Usa tap quando suportado, fallback para click em desktop.
  if (test.info().project.use.hasTouch) {
    await trigger.tap();
  } else {
    await trigger.click();
  }
  const popover = page.getByTestId('reading-settings-popover');
  await expect(popover).toBeVisible();
  // Assert determinístico: estrutura ARIA está correta.
  await expect(popover).toHaveAttribute('role', 'dialog');
  await expect(popover).toHaveAttribute('aria-labelledby', 'reading-settings-title');
  await expect(popover).toHaveAttribute('aria-describedby', 'reading-settings-desc');
  return { trigger, popover };
}

test.describe('ReadingSettingsPopover · mobile / tablet / desktop', () => {
  test.beforeEach(async ({ page }) => {
    // Reduz flakiness desabilitando animações via CSS.
    await page.addInitScript(() => {
      const style = document.createElement('style');
      style.textContent = `*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }`;
      document.documentElement.appendChild(style);
    });
    await page.goto(PATH, { waitUntil: 'domcontentloaded' });
  });

  test('abre/fecha pela letra T e preserva Modo Imersivo', async ({ page }) => {
    const { trigger, popover } = await openAndAssertPopover(page);

    // Ativa "Modo Imersivo".
    const immersive = popover.getByRole('button', { name: /Modo Imersivo/i });
    await immersive.click();
    await expect(immersive).toHaveClass(/bg-primary\/10/);

    // Fecha tocando fora — Radix detecta pointerDownOutside.
    await page.mouse.click(2, 2);
    await expect(popover).toBeHidden();

    // Reabre e confirma que "Modo Imersivo" permanece ativo (estado preservado).
    if (test.info().project.use.hasTouch) {
      await trigger.tap();
    } else {
      await trigger.click();
    }
    const popover2 = page.getByTestId('reading-settings-popover');
    await expect(popover2).toBeVisible();
    await expect(popover2.getByRole('button', { name: /Modo Imersivo/i })).toHaveClass(/bg-primary\/10/);

    // Esc fecha e devolve foco ao gatilho.
    await page.keyboard.press('Escape');
    await expect(popover2).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('renderiza todas as seções com nomes acessíveis', async ({ page }) => {
    const { popover } = await openAndAssertPopover(page);

    await expect(popover.getByRole('radiogroup', { name: /Temas de leitura/i })).toBeVisible();
    await expect(popover.getByRole('radiogroup', { name: /Tamanho do Texto/i })).toBeVisible();
    await expect(popover.getByRole('radiogroup', { name: /Acessibilidade/i })).toBeVisible();
    await expect(popover.getByRole('radiogroup', { name: /Espaçamento/i })).toBeVisible();
  });
});
