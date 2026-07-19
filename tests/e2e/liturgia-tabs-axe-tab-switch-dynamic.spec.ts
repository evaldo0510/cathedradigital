import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const AXE_REPORT_DIR = join('playwright-report', 'axe', 'liturgia-tabs');
mkdirSync(AXE_REPORT_DIR, { recursive: true });

/**
 * Executa axe-core no meio da alternância de abas da Liturgia
 * combinada com troca dinâmica de tema (dark↔light, sem reload),
 * cobrindo interação por clique e por teclado nos breakpoints
 * mobile e tablet (portrait/landscape).
 */

const VIEWPORTS = [
  { name: 'mobile-portrait-390x844', width: 390, height: 844 },
  { name: 'mobile-landscape-844x390', width: 844, height: 390 },
  { name: 'tablet-portrait-768x1024', width: 768, height: 1024 },
  { name: 'tablet-landscape-1024x768', width: 1024, height: 768 },
];

const INTERACTIONS: Array<'click' | 'keyboard'> = ['click', 'keyboard'];

async function setTheme(page, mode: 'dark' | 'light') {
  await page.evaluate((m) => {
    document.documentElement.classList.toggle('dark', m === 'dark');
    document.documentElement.setAttribute('data-theme', m);
    try {
      localStorage.setItem('theme', m);
      localStorage.setItem('vite-ui-theme', m);
    } catch {}
  }, mode);
}

async function runAxe(page) {
  return new AxeBuilder({ page })
    .include('[role="tablist"][aria-label*="Liturgia"]')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .options({
      runOnly: {
        type: 'rule',
        values: [
          'color-contrast',
          'button-name',
          'link-name',
          'aria-allowed-attr',
          'aria-required-attr',
          'aria-valid-attr',
          'aria-valid-attr-value',
          'aria-roles',
          'focus-order-semantics',
          'tabindex',
          'nested-interactive',
          'duplicate-id-aria',
        ],
      },
    })
    .analyze();
}

async function activateTab(page, mode: 'click' | 'keyboard', index: number) {
  const tabs = page.getByRole('tab');
  if (mode === 'click') {
    await tabs.nth(index).click();
  } else {
    // Foca a primeira aba e navega via setas do teclado (Radix Tabs pattern).
    await tabs.first().focus();
    for (let i = 0; i < index; i += 1) {
      await page.keyboard.press('ArrowRight');
    }
    await page.keyboard.press('Enter');
  }
  await expect(tabs.nth(index)).toHaveAttribute('aria-selected', 'true');
}

test.describe('Liturgia — axe durante alternância de abas (clique + teclado) com troca dinâmica de tema', () => {
  for (const vp of VIEWPORTS) {
    for (const interaction of INTERACTIONS) {
      test(`sem novas violações ARIA/contrast em ${vp.name} via ${interaction}`, async ({ browser }) => {
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          hasTouch: interaction === 'click',
        });
        const page = await context.newPage();
        await page.goto('/liturgia');
        await page.waitForLoadState('networkidle');

        const tablist = page.getByRole('tablist', { name: /Navegação da Liturgia/i });
        await expect(tablist).toBeVisible();
        await tablist.scrollIntoViewIfNeeded();

        const tabCount = await page.getByRole('tab').count();
        expect(tabCount).toBeGreaterThan(1);

        // Sequência intercalando aba e tema para maximizar variação de estados.
        const sequence: Array<{ theme: 'dark' | 'light'; tabIndex: number }> = [];
        const themes: Array<'dark' | 'light'> = ['dark', 'light', 'dark', 'light'];
        for (let i = 0; i < themes.length; i += 1) {
          sequence.push({ theme: themes[i], tabIndex: i % tabCount });
        }

        const allViolations: any[] = [];

        for (const step of sequence) {
          await setTheme(page, step.theme);
          await page.waitForTimeout(120);

          await activateTab(page, interaction, step.tabIndex);
          await page.waitForTimeout(150);

          const results = await runAxe(page);

          // Relatório detalhado como artefato do CI: um JSON por combinação.
          const filename =
            `${vp.name}__${step.theme}__tab-${step.tabIndex}__${interaction}.json`;
          const payload = {
            generated_at: new Date().toISOString(),
            viewport: vp.name,
            theme: step.theme,
            tab_index: step.tabIndex,
            interaction,
            url: page.url(),
            summary: {
              violations: results.violations.length,
              passes: results.passes.length,
              incomplete: results.incomplete.length,
              inapplicable: results.inapplicable.length,
            },
            violations: results.violations,
            incomplete: results.incomplete,
          };
          writeFileSync(join(AXE_REPORT_DIR, filename), JSON.stringify(payload, null, 2));

          if (results.violations.length) {
            allViolations.push(
              ...results.violations.map((v) => ({
                viewport: vp.name,
                interaction,
                theme: step.theme,
                tabIndex: step.tabIndex,
                id: v.id,
                impact: v.impact,
                help: v.help,
                nodes: v.nodes.length,
              })),
            );
          }
        }

        if (allViolations.length) {
          console.log(
            `[${vp.name}/${interaction}] axe violations durante alternância de abas:`,
            JSON.stringify(allViolations, null, 2),
          );
        }
        expect(
          allViolations,
          `violações axe durante alternância de abas (${interaction}) em ${vp.name}`,
        ).toEqual([]);

        await context.close();
      });
    }
  }
});
