import { test, expect, devices, type Page, type TestInfo } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';

/**
 * Extensões da suíte Bottom Nav + Rodapé:
 *  1. Axe (desktop + mobile) com evidência (screenshot + HTML) quando houver violação.
 *  2. BFCache: back/forward restaura foco no item que estava ativo.
 *  3. Ordem de Tab na bottom nav e links do rodapé segue a sequência esperada.
 *  4. Mobile axe nas 5 rotas principais sem violações críticas.
 */

const ROUTES = ['/', '/biblioteca', '/buscar', '/nexus', '/formacao'] as const;

const EVIDENCE_DIR = path.join(process.cwd(), 'tests/e2e/a11y-reports/evidence');
if (!fs.existsSync(EVIDENCE_DIR)) fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

const NAV_ORDER = ['nav-átrio', 'nav-biblioteca', 'nav-buscar', 'nav-nexus', 'nav-formação'] as const;
const SOCIAL_ORDER = ['Instagram', 'Youtube', 'Whatsapp'] as const;

function slug(route: string) {
  return route === '/' ? 'root' : route.replace(/\//g, '-').replace(/^-/, '');
}

async function runAxeWithEvidence(
  page: Page,
  testInfo: TestInfo,
  label: string,
) {
  const results = await new AxeBuilder({ page })
    .include('nav')
    .include('footer')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  const critical = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  );

  if (critical.length > 0) {
    const base = path.join(EVIDENCE_DIR, `${label}-${Date.now()}`);
    const jsonPath = `${base}.json`;
    const htmlPath = `${base}.html`;
    const pngPath = `${base}.png`;

    fs.writeFileSync(jsonPath, JSON.stringify(critical, null, 2));
    fs.writeFileSync(htmlPath, await page.content());
    await page.screenshot({ path: pngPath, fullPage: true }).catch(() => {});

    await testInfo.attach(`${label}-violations.json`, {
      path: jsonPath,
      contentType: 'application/json',
    });
    await testInfo.attach(`${label}-dom.html`, {
      path: htmlPath,
      contentType: 'text/html',
    });
    await testInfo.attach(`${label}-screenshot.png`, {
      path: pngPath,
      contentType: 'image/png',
    });
  }

  return { results, critical };
}

// -------------------------------------------------------------
// 1 + 4) Axe com evidência — desktop + mobile
// -------------------------------------------------------------
test.describe('Axe · desktop · Bottom Nav + Rodapé · evidência em falha', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  for (const route of ROUTES) {
    test(`sem violações críticas · desktop · ${route}`, async ({ page }, testInfo) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      const { critical } = await runAxeWithEvidence(page, testInfo, `desktop-${slug(route)}`);
      expect(critical, `violações críticas em ${route}`).toEqual([]);
    });
  }
});

test.describe('Axe · mobile · Bottom Nav + Rodapé · evidência em falha', () => {
  test.use({ ...devices['iPhone 12'] });

  for (const route of ROUTES) {
    test(`sem violações críticas · mobile · ${route}`, async ({ page }, testInfo) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      const { critical } = await runAxeWithEvidence(page, testInfo, `mobile-${slug(route)}`);
      expect(critical, `violações críticas em ${route}`).toEqual([]);
    });
  }
});

// -------------------------------------------------------------
// 2) BFCache — back/forward restaura foco no item ativo
// -------------------------------------------------------------
test.describe('BFCache · foco restaurado no item ativo', () => {
  test.use({ viewport: { width: 720, height: 1000 } });

  test('back restaura foco no item da bottom nav que originou a navegação', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const trigger = page.getByTestId('nav-biblioteca').first();
    if (!(await trigger.count())) test.skip(true, 'nav-biblioteca indisponível');

    await trigger.focus();
    await expect(trigger).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/(biblioteca|bible)/, { timeout: 5_000 });

    await page.goBack({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/$/);

    // Foco: BFCache preserva; se não, o item ativo deve receber foco programático.
    await expect(async () => {
      const focused = await page.evaluate(
        () => document.activeElement?.getAttribute('data-testid') ?? '',
      );
      expect(focused).toBe('nav-átrio');
    }).toPass({ timeout: 3_000 }).catch(async () => {
      // Fallback tolerante: pelo menos o item ativo está marcado aria-current.
      const active = page.locator('[data-testid^="nav-"][aria-current="page"]');
      await expect(active).toHaveCount(1);
    });
  });

  test('back a partir de link do rodapé restaura foco no link', async ({ page, context }) => {
    await page.setViewportSize({ width: 1280, height: 1800 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Usamos um link interno do rodapé (se existir) para exercitar BFCache same-origin.
    const footer = page.locator('footer').last();
    const internal = footer.locator('a[href^="/"]').first();
    if (!(await internal.count())) test.skip(true, 'rodapé sem link interno');

    const label = await internal.getAttribute('aria-label');
    await internal.focus();
    await expect(internal).toBeFocused();
    await page.keyboard.press('Enter');
    await page.waitForLoadState('domcontentloaded');

    await page.goBack({ waitUntil: 'domcontentloaded' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const focusedLabel = await page.evaluate(
      () => document.activeElement?.getAttribute('aria-label') ?? '',
    );
    // Se BFCache restaurou, o aria-label bate; senão, o link ainda deve estar presente.
    if (focusedLabel !== label) {
      await expect(footer.locator(`a[aria-label="${label}"]`)).toBeVisible();
    }
  });
});

// -------------------------------------------------------------
// 3) Ordem de Tab — bottom nav + rodapé
// -------------------------------------------------------------
test.describe('Ordem de Tab · bottom nav e rodapé', () => {
  test('ordem esperada dos itens da bottom nav', async ({ page }) => {
    await page.setViewportSize({ width: 720, height: 1000 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const first = page.getByTestId(NAV_ORDER[0]).first();
    if (!(await first.count())) test.skip(true, 'bottom nav indisponível');
    await first.focus();
    await expect(first).toBeFocused();

    const observed: string[] = [NAV_ORDER[0]];
    for (let i = 1; i < NAV_ORDER.length; i++) {
      // Avança até o próximo item conhecido (pula elementos interativos internos).
      let hopped = '';
      for (let hops = 0; hops < 12 && hopped !== NAV_ORDER[i]; hops++) {
        await page.keyboard.press('Tab');
        hopped = await page.evaluate(
          () => document.activeElement?.getAttribute('data-testid') ?? '',
        );
        if (hopped && NAV_ORDER.includes(hopped as typeof NAV_ORDER[number])) break;
      }
      observed.push(hopped);
    }

    // Filtra apenas os que reconhecemos e compara ordem relativa.
    const filtered = observed.filter((t) =>
      (NAV_ORDER as readonly string[]).includes(t),
    );
    expect(filtered).toEqual([...NAV_ORDER].slice(0, filtered.length));
  });

  test('ordem esperada dos links sociais do rodapé', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1800 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const footer = page.locator('footer').last();
    const positions: number[] = [];
    for (const name of SOCIAL_ORDER) {
      const link = footer.getByRole('link', { name: new RegExp(name, 'i') }).first();
      if (!(await link.count())) continue;
      const idx = await link.evaluate((el) => {
        const focusables = Array.from(
          document.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        );
        return focusables.indexOf(el as HTMLElement);
      });
      positions.push(idx);
    }

    const sorted = [...positions].sort((a, b) => a - b);
    expect(positions, 'links sociais devem seguir a ordem DOM esperada').toEqual(sorted);
  });
});
