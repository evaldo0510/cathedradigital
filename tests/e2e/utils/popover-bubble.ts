import { expect, type Page, type Locator, type TestInfo } from '@playwright/test';

/**
 * Helpers para testar as "bolhas" (Popover) ancoradas em chips do
 * Magistério Explorer. Centralizam esperas por estado, validação de
 * ancoragem, permanência no viewport e captura de artefatos de
 * depuração quando algum assert falha.
 */

export const BUBBLE_SELECTOR = '[data-tip-kind]';
export const HORIZONTAL_TOLERANCE_PX = 120; // align="center" + collision
export const VERTICAL_MAX_GAP_PX = 40; // "colada" acima/abaixo do chip

/** Locator único da bolha aberta (opcionalmente filtrado por texto). */
export function bubbleLocator(page: Page, textRegex?: RegExp): Locator {
  const loc = page.locator(BUBBLE_SELECTOR);
  return textRegex ? loc.filter({ hasText: textRegex }) : loc;
}

/** Aguarda a bolha ficar aberta (com contagem 1) e o chip com aria-expanded=true. */
export async function waitForBubbleOpen(
  page: Page,
  chip: Locator,
  textRegex?: RegExp,
  timeoutMs = 2000,
): Promise<Locator> {
  await expect(chip).toHaveAttribute('aria-expanded', 'true', { timeout: timeoutMs });
  const bubble = bubbleLocator(page, textRegex);
  await expect(bubble).toHaveCount(1, { timeout: timeoutMs });
  await expect(bubble).toBeVisible({ timeout: timeoutMs });
  return bubble;
}

/** Aguarda todas as bolhas fecharem (0 no DOM) — cobre auto-close e navegação. */
export async function waitForBubbleClosed(page: Page, timeoutMs = 2500): Promise<void> {
  await expect(bubbleLocator(page)).toHaveCount(0, { timeout: timeoutMs });
}

/** Clica no chip e espera a bolha abrir com retries (mitiga flakiness). */
export async function openBubble(
  page: Page,
  chip: Locator,
  textRegex?: RegExp,
  attempts = 2,
): Promise<Locator> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      await chip.scrollIntoViewIfNeeded();
      await chip.click();
      return await waitForBubbleOpen(page, chip, textRegex);
    } catch (err) {
      lastErr = err;
      // Fecha qualquer bolha remanescente antes de tentar novamente.
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(150);
    }
  }
  throw lastErr;
}

/** Captura screenshot + HTML do PopoverContent para depuração. */
export async function dumpBubbleArtifacts(
  page: Page,
  testInfo: TestInfo,
  label: string,
): Promise<void> {
  const safeLabel = label.replace(/[^a-z0-9-_]/gi, '_').slice(0, 60);
  try {
    const shot = await page.screenshot();
    await testInfo.attach(`bubble-${safeLabel}-page.png`, {
      body: shot,
      contentType: 'image/png',
    });
    const bubble = bubbleLocator(page);
    const count = await bubble.count();
    if (count > 0) {
      const bshot = await bubble.first().screenshot().catch(() => null);
      if (bshot) {
        await testInfo.attach(`bubble-${safeLabel}-content.png`, {
          body: bshot,
          contentType: 'image/png',
        });
      }
      const html = await bubble.first().evaluate((el) => el.outerHTML).catch(() => '');
      if (html) {
        await testInfo.attach(`bubble-${safeLabel}-content.html`, {
          body: Buffer.from(html, 'utf-8'),
          contentType: 'text/html',
        });
      }
    }
  } catch {
    // artefatos são best-effort — nunca mascarar falha do assert original
  }
}

/**
 * Valida ancoragem da bolha ao chip clicado (horizontal + vertical).
 * Em caso de falha, anexa screenshots/HTML antes de propagar o erro.
 */
export async function assertAnchored(
  page: Page,
  testInfo: TestInfo,
  chip: Locator,
  textRegex: RegExp,
): Promise<void> {
  const bubble = bubbleLocator(page, textRegex);
  try {
    await expect(bubble).toHaveCount(1);
    const cb = await chip.boundingBox();
    const bb = await bubble.boundingBox();
    expect(cb, 'chip deve ter boundingBox').not.toBeNull();
    expect(bb, 'bolha deve ter boundingBox').not.toBeNull();

    const cx = cb!.x + cb!.width / 2;
    const bx = bb!.x + bb!.width / 2;
    expect(
      Math.abs(bx - cx),
      `bolha desalinhada horizontalmente do chip (Δ=${Math.abs(bx - cx).toFixed(1)}px)`,
    ).toBeLessThanOrEqual(HORIZONTAL_TOLERANCE_PX);

    const gapAbove = cb!.y - (bb!.y + bb!.height);
    const gapBelow = bb!.y - (cb!.y + cb!.height);
    const gap = Math.min(
      gapAbove >= 0 ? gapAbove : Infinity,
      gapBelow >= 0 ? gapBelow : Infinity,
    );
    expect(
      gap,
      `bolha longe do chip verticalmente (gap=${gap === Infinity ? 'sobrepondo' : gap.toFixed(1)}px)`,
    ).toBeLessThanOrEqual(VERTICAL_MAX_GAP_PX);
  } catch (err) {
    await dumpBubbleArtifacts(page, testInfo, `anchor-${testInfo.title}`);
    throw err;
  }
}

/** Valida que a bolha inteira está dentro do viewport visível. */
export async function assertInViewport(
  page: Page,
  testInfo: TestInfo,
  bubble: Locator,
): Promise<void> {
  try {
    const bb = await bubble.boundingBox();
    const vp = page.viewportSize()!;
    expect(bb).not.toBeNull();
    expect(bb!.x, 'bolha corta à esquerda').toBeGreaterThanOrEqual(0);
    expect(bb!.y, 'bolha corta acima').toBeGreaterThanOrEqual(0);
    expect(bb!.x + bb!.width, 'bolha corta à direita').toBeLessThanOrEqual(vp.width);
    expect(bb!.y + bb!.height, 'bolha corta abaixo').toBeLessThanOrEqual(vp.height);
  } catch (err) {
    await dumpBubbleArtifacts(page, testInfo, `viewport-${testInfo.title}`);
    throw err;
  }
}
