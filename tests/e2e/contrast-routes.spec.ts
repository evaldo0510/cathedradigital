import { test, expect, type Page, type TestInfo } from '@playwright/test';

/**
 * Data-driven WCAG contrast regression across the main public routes.
 * Runs per route × theme (light/dark). For each (route, target) it:
 *   1. measures the WCAG contrast ratio of the text against the effective
 *      background (walking ancestors so transparent layers resolve correctly),
 *   2. attaches a JSON report,
 *   3. on failure, attaches a page screenshot + per-element outerHTML +
 *      computed-styles + element screenshot.
 *
 * The aggregated attachments are post-processed by
 *   scripts/contrast-report.ts → playwright-report/contrast-summary.{md,json}
 * which the CI workflow uploads as a build artifact.
 */

// ---------- in-page helpers ----------
const CONTRAST_HELPERS = `
  function parseColor(str) {
    const m = str.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const parts = m[1].split(',').map(v => parseFloat(v.trim()));
    const [r,g,b,a=1] = parts;
    return { r, g, b, a };
  }
  function relLum({r,g,b}) {
    const ch = c => { const s = c/255; return s <= 0.03928 ? s/12.92 : Math.pow((s+0.055)/1.055, 2.4); };
    return 0.2126*ch(r) + 0.7152*ch(g) + 0.0722*ch(b);
  }
  function ratio(fg, bg) {
    const L1 = relLum(fg), L2 = relLum(bg);
    const [a,b] = L1 > L2 ? [L1, L2] : [L2, L1];
    return (a + 0.05) / (b + 0.05);
  }
  function effBg(el) {
    let n = el;
    while (n && n !== document.documentElement) {
      const c = parseColor(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0.01) return c;
      n = n.parentElement;
    }
    const body = parseColor(getComputedStyle(document.body).backgroundColor);
    if (body && body.a > 0) return body;
    return document.documentElement.classList.contains('dark')
      ? { r: 10, g: 10, b: 12, a: 1 }
      : { r: 255, g: 255, b: 255, a: 1 };
  }
`;

type Measurement = {
  found: boolean;
  ratio?: number;
  fontSize?: number;
  fontWeight?: number;
  isLarge?: boolean;
  color?: string;
  background?: string;
  text?: string;
  classes?: string;
};

async function measureAll(page: Page, selector: string, maxNodes: number): Promise<Measurement[]> {
  return page.evaluate(
    ({ sel, helpers, max }) => {
      // eslint-disable-next-line no-eval
      eval(helpers);
      const out: Measurement[] = [];
      const nodes = Array.from(document.querySelectorAll(sel)).slice(0, max);
      for (const el of nodes) {
        const cs = getComputedStyle(el as Element);
        // @ts-expect-error injected
        const fg = parseColor(cs.color);
        // @ts-expect-error injected
        const bg = effBg(el);
        if (!fg) continue;
        // @ts-expect-error injected
        const r = ratio(fg, bg);
        const fontSize = parseFloat(cs.fontSize) || 16;
        const fontWeight = parseInt(cs.fontWeight, 10) || 400;
        const isLarge = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
        out.push({
          found: true,
          ratio: Math.round(r * 100) / 100,
          fontSize,
          fontWeight,
          isLarge,
          color: `rgba(${fg.r},${fg.g},${fg.b},${fg.a})`,
          background: `rgba(${bg.r},${bg.g},${bg.b},${bg.a})`,
          text: ((el as HTMLElement).innerText || '').slice(0, 80).replace(/\s+/g, ' ').trim(),
          classes: (el as HTMLElement).className?.toString?.().slice(0, 200),
        });
      }
      if (out.length === 0) return [{ found: false }] as Measurement[];
      return out;
    },
    { sel: selector, helpers: CONTRAST_HELPERS, max: maxNodes },
  );
}

async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.evaluate((t) => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(t);
    root.style.colorScheme = t;
    try { localStorage.setItem('theme', t); } catch { /* noop */ }
  }, theme);
  await page.waitForTimeout(120);
}

// ---------- coverage matrix ----------
type Target = { name: string; selector: string };
type RouteSpec = { path: string; ready: RegExp | null; targets: Target[] };

const COMMON_TARGETS: Target[] = [
  { name: 'h1', selector: 'main h1, h1' },
  { name: 'h2', selector: 'main h2, h2' },
  { name: 'paragraph', selector: 'main p, p' },
  { name: 'link', selector: 'main a, nav a' },
  { name: 'primary-button', selector: 'button:not([disabled])' },
  { name: 'muted-text', selector: '.text-muted-foreground' },
];

const ROUTES: RouteSpec[] = [
  { path: '/', ready: null, targets: COMMON_TARGETS },
  { path: '/bible-abbr-validate', ready: /resolvido|aguardando entrada/i, targets: [
    ...COMMON_TARGETS,
    { name: 'canonical_abbr value', selector: 'dd:has(button[aria-label*="canonical_abbr"]) span.font-mono' },
    { name: 'bollsId value', selector: 'dd:has(button[aria-label*="bollsId"]) span.font-mono' },
    { name: 'copy button label', selector: 'button[aria-label*="canonical_abbr"] span, button[aria-label*="bollsId"] span' },
  ] },
  { path: '/glossary', ready: null, targets: COMMON_TARGETS },
  { path: '/hoje', ready: null, targets: COMMON_TARGETS },
  { path: '/temas', ready: null, targets: COMMON_TARGETS },
  { path: '/santos', ready: null, targets: COMMON_TARGETS },
  { path: '/encyclopedia', ready: null, targets: COMMON_TARGETS },
];

// ---------- artifact helpers ----------
type FailureRow = {
  route: string;
  theme: string;
  target: string;
  selector: string;
  ratio: number;
  required: number;
  text: string;
  classes?: string;
  color?: string;
  background?: string;
};

async function attachFailureDiagnostics(
  info: TestInfo,
  page: Page,
  failures: FailureRow[],
  theme: string,
  routePath: string,
) {
  if (failures.length === 0) return;
  const safeRoute = routePath.replace(/[^a-z0-9]+/gi, '_') || 'root';
  await info.attach(`page-${safeRoute}-${theme}.png`, {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
  for (const f of failures) {
    const handle = await page.$(f.selector);
    if (!handle) continue;
    try {
      const html = await handle.evaluate((el) => (el as HTMLElement).outerHTML.slice(0, 4000));
      const png = await handle.screenshot();
      const safe = f.target.replace(/[^a-z0-9]+/gi, '-');
      await info.attach(`element-${safeRoute}-${safe}-${theme}.html`, { body: html, contentType: 'text/html' });
      await info.attach(`element-${safeRoute}-${safe}-${theme}.png`, { body: png, contentType: 'image/png' });
    } catch {
      /* element may have detached; skip */
    }
  }
}

// ---------- tests ----------
for (const theme of ['light', 'dark'] as const) {
  for (const route of ROUTES) {
    test(`contrast WCAG · ${route.path} · ${theme}`, async ({ page }, info) => {
      info.annotations.push({ type: 'contrast-route', description: route.path });
      info.annotations.push({ type: 'contrast-theme', description: theme });

      await page.emulateMedia({ colorScheme: theme });
      await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      await setTheme(page, theme);
      if (route.ready) {
        await expect(page.getByText(route.ready).first()).toBeVisible({ timeout: 15000 });
      } else {
        // Best-effort: wait for the page to render some content.
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      }

      const measurements: Array<{ target: string; selector: string; rows: Measurement[] }> = [];
      const failures: FailureRow[] = [];

      for (const t of route.targets) {
        const rows = await measureAll(page, t.selector);
        measurements.push({ target: t.name, selector: t.selector, rows });
        for (const m of rows) {
          if (!m.found || m.ratio === undefined) continue;
          const required = m.isLarge ? 3 : 4.5;
          if (m.ratio < required) {
            failures.push({
              route: route.path,
              theme,
              target: t.name,
              selector: t.selector,
              ratio: m.ratio,
              required,
              text: m.text ?? '',
              classes: m.classes,
              color: m.color,
              background: m.background,
            });
          }
        }
      }

      await info.attach(`contrast-${route.path.replace(/[^a-z0-9]+/gi, '_') || 'root'}-${theme}.json`, {
        body: JSON.stringify({ route: route.path, theme, url: page.url(), measurements, failures }, null, 2),
        contentType: 'application/json',
      });

      await attachFailureDiagnostics(info, page, failures, theme, route.path);

      // Soft assertion: route-level summary; the CI report aggregates per-failure detail.
      expect(
        failures,
        failures.map((f) => `${f.target} ${f.ratio}:1 < ${f.required}:1 — "${f.text}"`).join('\n'),
      ).toEqual([]);
    });
  }
}
