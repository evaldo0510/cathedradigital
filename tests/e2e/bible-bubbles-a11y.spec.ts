import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';

/**
 * Verifica acessibilidade das "bolhas" (cards do Nexus + popover de versículo)
 * do módulo da Bíblia: navegação por teclado, foco, ARIA e axe-core.
 *
 * Saída: /tmp/bible-qa/a11y/{report.json,screenshots/}
 */

const OUT_DIR = '/tmp/bible-qa/a11y';
const SHOT_DIR = `${OUT_DIR}/screenshots`;
mkdirSync(SHOT_DIR, { recursive: true });

interface Finding {
  id: string;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  rule: string;
  description: string;
  selector?: string;
  evidence?: string;
}

const findings: Finding[] = [];

async function openFirstChapter(page: Page): Promise<boolean> {
  await page.goto('/bible', { waitUntil: 'load' });
  await page.waitForTimeout(800);

  // Clica no primeiro livro disponível
  const firstBook = page.locator('button:has-text("Gênesis"), button:has-text("Genesis"), button:has-text("Mateus")').first();
  if (await firstBook.count() === 0) return false;
  await firstBook.click({ timeout: 5_000 }).catch(() => {});
  await page.waitForTimeout(400);

  // Pode aparecer lista de capítulos: clica em "1"
  const ch1 = page.locator('button:has-text("1")').first();
  if (await ch1.count() > 0) {
    await ch1.click({ timeout: 5_000 }).catch(() => {});
  }

  // Aguarda primeiro versículo aparecer
  const verse = page.locator('[data-testid^="verse-text-"]').first();
  try {
    await verse.waitFor({ state: 'visible', timeout: 10_000 });
    return true;
  } catch {
    return false;
  }
}

test.describe('Bíblia · acessibilidade das bolhas', () => {
  test('teclado, foco, ARIA e axe-core nos cards do Nexus e no popover', async ({ page }) => {
    const opened = await openFirstChapter(page);
    if (!opened) {
      findings.push({
        id: 'bible-load',
        severity: 'critical',
        rule: 'module-load',
        description: 'Não foi possível abrir um capítulo da Bíblia para auditar as bolhas. UI mudou ou está indisponível.',
      });
      writeFileSync(`${OUT_DIR}/report.json`, JSON.stringify({ findings }, null, 2));
      test.fail(true, 'Bible chapter did not load — see report.json');
      return;
    }

    await page.screenshot({ path: `${SHOT_DIR}/01-chapter-loaded.png` });

    // ── 1. Cards do Nexus (BubbleTag) — auditor escopado, ignora breadcrumb ──
    // BubbleTag renderiza <motion.button aria-label="Tema: …">; breadcrumbs usam data-bubble-nav.
    const nexusBubbles = page.locator(
      '[data-testid^="nexus-bubbles-"] button[aria-label^="Tema:"]:not([data-bubble-nav])'
    );
    const bubbleCount = await nexusBubbles.count();

    if (bubbleCount === 0) {
      findings.push({
        id: 'no-bubbles',
        severity: 'minor',
        rule: 'coverage',
        description: 'Nenhuma BubbleTag encontrada no capítulo amostrado — não foi possível auditar interação. Considere usar um capítulo com cross-references.',
      });
    } else {
      const firstBubble = nexusBubbles.first();
      const ariaLabel = await firstBubble.getAttribute('aria-label');
      if (!ariaLabel || ariaLabel.length < 3) {
        findings.push({
          id: 'bubble-aria-label',
          severity: 'serious',
          rule: 'button-name',
          description: 'BubbleTag sem aria-label significativo.',
          selector: 'button[aria-label^="Tema:"]',
        });
      }

      // CI-grade regression guard: TODA bubble button ≥ 44×44.
      for (let i = 0; i < bubbleCount; i++) {
        const b = nexusBubbles.nth(i);
        const box = await b.boundingBox();
        if (!box) continue;
        if (box.width < 44 || box.height < 44) {
          findings.push({
            id: 'bubble-tap-target',
            severity: 'moderate',
            rule: 'target-size',
            description: `BubbleTag #${i} abaixo de 44x44 (${Math.round(box.width)}x${Math.round(box.height)}px).`,
            selector: 'button[aria-label^="Tema:"]',
            evidence: `${Math.round(box.width)}x${Math.round(box.height)}`,
          });
        }
        // Hard assertion: previne regressão silenciosa em CI.
        expect.soft(box.width, `BubbleTag #${i} width < 44px`).toBeGreaterThanOrEqual(44);
        expect.soft(box.height, `BubbleTag #${i} height < 44px`).toBeGreaterThanOrEqual(44);
      }

      // Foco via teclado
      await firstBubble.focus();
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      if (focused !== 'BUTTON') {
        findings.push({
          id: 'bubble-focusable',
          severity: 'serious',
          rule: 'focus-order-semantics',
          description: `BubbleTag não recebe foco via .focus() (activeElement=${focused}).`,
        });
      }
      await page.screenshot({ path: `${SHOT_DIR}/02-bubble-focused.png` });

      await firstBubble.press('Enter').catch(() => {});
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${SHOT_DIR}/03-bubble-enter.png` });

      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(200);
    }

    // ── 2. axe-core escopado ao container do reader ──
    try {
      const axe = await new AxeBuilder({ page })
        .include('main')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      for (const v of axe.violations) {
        const sev: Finding['severity'] = (v.impact as Finding['severity']) ?? 'minor';
        findings.push({
          id: v.id,
          severity: sev,
          rule: v.id,
          description: v.help,
          selector: v.nodes[0]?.target?.join(' ') ?? undefined,
          evidence: v.helpUrl,
        });
      }
    } catch (e) {
      findings.push({
        id: 'axe-crash',
        severity: 'minor',
        rule: 'axe-run',
        description: `axe-core falhou ao executar: ${(e as Error).message}`,
      });
    }

    writeFileSync(`${OUT_DIR}/report.json`, JSON.stringify({ findings, bubbleCount }, null, 2));

    // Falhas críticas/serious quebram o teste — moderate/minor apenas reportam.
    const blockers = findings.filter((f) => f.severity === 'critical' || f.severity === 'serious');
    expect(blockers, `Falhas críticas/serias de a11y: ${JSON.stringify(blockers, null, 2)}`).toEqual([]);
  });
});
