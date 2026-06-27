/**
 * E2E (Playwright) — Popover de configurações de leitura no módulo da Bíblia.
 *
 * Como rodar localmente:
 *   npx playwright install chromium
 *   npx playwright test tests/e2e/reading-settings-popover.spec.ts
 *
 * O teste presume um dev server em http://localhost:8080 e uma rota da
 * Bíblia que renderize <ReadingSettingsPopover />. Ajuste BIBLE_URL se
 * necessário via variável de ambiente E2E_BIBLE_URL.
 */
import { test, expect, devices } from '@playwright/test';

const BIBLE_URL = process.env.E2E_BIBLE_URL || 'http://localhost:8080/bible';

test.use({ ...devices['iPhone 12'] });

test.describe('ReadingSettingsPopover · mobile', () => {
  test('abre/fecha pelo tap na letra T e preserva Modo Imersivo', async ({ page }) => {
    await page.goto(BIBLE_URL, { waitUntil: 'domcontentloaded' });

    const trigger = page.getByRole('button', { name: /Configurações de Leitura/i });
    await expect(trigger).toBeVisible();

    // 1) Tap abre o popover.
    await trigger.tap();
    const popover = page.getByTestId('reading-settings-popover');
    await expect(popover).toBeVisible();

    // 2) Ativa "Modo Imersivo".
    const immersive = popover.getByRole('button', { name: /Modo Imersivo/i });
    await immersive.tap();

    // 3) Fecha tocando fora do popover.
    await page.mouse.click(10, 10);
    await expect(popover).toBeHidden();

    // 4) Reabre e confirma que "Modo Imersivo" permanece ativo (estado preservado).
    await trigger.tap();
    await expect(page.getByTestId('reading-settings-popover')).toBeVisible();
    const immersiveAgain = page
      .getByTestId('reading-settings-popover')
      .getByRole('button', { name: /Modo Imersivo/i });
    await expect(immersiveAgain).toHaveClass(/bg-primary\/10/);

    // 5) Esc fecha e devolve foco ao gatilho.
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('reading-settings-popover')).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});
