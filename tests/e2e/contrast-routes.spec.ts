import { test, expect, type Page, type TestInfo } from '@playwright/test';

/**
 * Data-driven WCAG contrast regression across the main public routes.
 * Runs per route × theme (light/dark). Each (route, target) measurement honors
 * per-route thresholds declared in contrast.config.ts (AA/AAA · large/normal
 * override). On failure we attach the page screenshot, the offending element's
 * outerHTML, computed-style snapshot and an element screenshot so the CI
 * aggregator can link them in the PR comment.
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

// ---------- coverage matrix (resolved from contrast.config.ts) ----------
import { contrastConfig, effectiveSelector, requiredRatio, resolveRoutes } from './contrast.config';

const ROUTES = resolveRoutes();

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
      info.annotations.push({ type: 'contrast-level', description: route.thresholds.level });

      await page.emulateMedia({ colorScheme: theme });
      await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      await setTheme(page, theme);
      if (route.ready) {
        await expect(page.getByText(route.ready).first()).toBeVisible({ timeout: 15000 });
      } else {
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      }

      const measurements: Array<{ target: string; selector: string; rows: Measurement[] }> = [];
      const failures: FailureRow[] = [];
      const { level, largeMode } = route.thresholds;

      for (const t of route.targets) {
        const sel = effectiveSelector(t);
        const rows = await measureAll(page, sel, contrastConfig.maxNodesPerSelector);
        measurements.push({ target: t.name, selector: sel, rows });
        for (const m of rows) {
          if (!m.found || m.ratio === undefined) continue;
          const autoLarge = !!m.isLarge;
          const isLarge = largeMode === 'large' ? true : largeMode === 'normal' ? false : autoLarge;
          const required = requiredRatio(isLarge, level);
          if (m.ratio < required) {
            failures.push({
              route: route.path,
              theme,
              target: t.name,
              selector: sel,
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
        body: JSON.stringify(
          {
            route: route.path,
            theme,
            url: page.url(),
            thresholds: route.thresholds,
            excludedTargets: route.excludedTargets,
            measurements,
            failures,
          },
          null,
          2,
        ),
        contentType: 'application/json',
      });

      await attachFailureDiagnostics(info, page, failures, theme, route.path);

      expect(
        failures,
        failures.map((f) => `${f.target} ${f.ratio}:1 < ${f.required}:1 — "${f.text}"`).join('\n'),
      ).toEqual([]);
    });
  }
}
