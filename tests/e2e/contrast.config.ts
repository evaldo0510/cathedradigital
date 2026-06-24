/**
 * Central config for the multi-route contrast spec.
 *
 * - `routes`: which routes to cover and which targets to measure on each.
 * - `commonTargets`: targets applied to every route unless overridden.
 * - `allowlist`: ONLY these (route, target, selector) tuples are kept. Leave
 *   empty to keep everything not denied.
 * - `denylist`: tuples to exclude from measurement. Matches by exact route
 *   and substring on target/selector. CSS selectors may be added under
 *   `denySelectors` and apply globally.
 * - `maxNodesPerSelector`: cap per `document.querySelectorAll(selector)`.
 *
 * Edit this file to reduce false positives (e.g. exclude `.text-muted-foreground`
 * inside marketing hero overlays, or focus a route on a single component).
 */

export type ContrastTarget = { name: string; selector: string };

export type ContrastRoute = {
  path: string;
  /** A regex that must be visible on the page before measuring. */
  ready?: RegExp;
  /** Targets specific to this route; merged with commonTargets unless `replaceCommon`. */
  targets?: ContrastTarget[];
  /** When true, ignore commonTargets for this route. */
  replaceCommon?: boolean;
};

export type ContrastRule = {
  /** Empty `route` matches any route. */
  route?: string;
  /** Substring match against target name, e.g. "muted-text". Empty matches any. */
  target?: string;
  /** Substring match against the CSS selector. Empty matches any. */
  selector?: string;
};

export type ContrastConfig = {
  commonTargets: ContrastTarget[];
  routes: ContrastRoute[];
  allowlist: ContrastRule[];
  denylist: ContrastRule[];
  denySelectors: string[];
  maxNodesPerSelector: number;
};

export const contrastConfig: ContrastConfig = {
  commonTargets: [
    { name: 'h1', selector: 'main h1, h1' },
    { name: 'h2', selector: 'main h2, h2' },
    { name: 'paragraph', selector: 'main p, p' },
    { name: 'link', selector: 'main a, nav a' },
    { name: 'primary-button', selector: 'button:not([disabled])' },
    { name: 'muted-text', selector: '.text-muted-foreground' },
  ],

  routes: [
    { path: '/' },
    {
      path: '/bible-abbr-validate',
      ready: /resolvido|aguardando entrada/i,
      targets: [
        { name: 'canonical_abbr value', selector: 'dd:has(button[aria-label*="canonical_abbr"]) span.font-mono' },
        { name: 'bollsId value', selector: 'dd:has(button[aria-label*="bollsId"]) span.font-mono' },
        { name: 'copy button label', selector: 'button[aria-label*="canonical_abbr"] span, button[aria-label*="bollsId"] span' },
      ],
    },
    { path: '/glossary' },
    { path: '/hoje' },
    { path: '/temas' },
    { path: '/santos' },
    { path: '/encyclopedia' },
  ],

  // Empty allowlist = keep everything not denied. Add tuples to scope down.
  allowlist: [],

  denylist: [
    // Sonner toasts overlay arbitrary backgrounds; measure their internals separately.
    { selector: '[data-sonner-toast]' },
    // Skip aria-live regions: visually hidden text shouldn't gate WCAG.
    { selector: '.sr-only' },
  ],

  // CSS selectors removed from EVERY measurement (applied via :not()).
  denySelectors: ['.sr-only', '[aria-hidden="true"]', '[data-contrast-inspector] *'],

  maxNodesPerSelector: 20,
};

export function ruleMatches(rule: ContrastRule, route: string, target: string, selector: string): boolean {
  if (rule.route && rule.route !== route) return false;
  if (rule.target && !target.toLowerCase().includes(rule.target.toLowerCase())) return false;
  if (rule.selector && !selector.toLowerCase().includes(rule.selector.toLowerCase())) return false;
  return true;
}

export function isTargetEnabled(route: string, target: ContrastTarget, cfg = contrastConfig): boolean {
  if (cfg.denylist.some((r) => ruleMatches(r, route, target.name, target.selector))) return false;
  if (cfg.allowlist.length === 0) return true;
  return cfg.allowlist.some((r) => ruleMatches(r, route, target.name, target.selector));
}

export function effectiveSelector(target: ContrastTarget, cfg = contrastConfig): string {
  if (!cfg.denySelectors.length) return target.selector;
  const notClause = cfg.denySelectors.map((s) => `:not(${s})`).join('');
  return target.selector
    .split(',')
    .map((s) => `${s.trim()}${notClause}`)
    .join(', ');
}

export function resolveRoutes(cfg = contrastConfig): Array<{ path: string; ready?: RegExp; targets: ContrastTarget[] }> {
  return cfg.routes.map((r) => {
    const merged = r.replaceCommon ? (r.targets ?? []) : [...cfg.commonTargets, ...(r.targets ?? [])];
    const filtered = merged.filter((t) => isTargetEnabled(r.path, t, cfg));
    return { path: r.path, ready: r.ready, targets: filtered };
  });
}
