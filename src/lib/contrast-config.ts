/**
 * Shared contrast configuration consumed by both the Playwright multi-route
 * spec (`tests/e2e/contrast-routes.spec.ts`) and the in-app dev overlay
 * (`src/components/dev/ContrastInspector.tsx`).
 *
 * Goals:
 *   - Single source of truth for routes, targets, allowlist/denylist and
 *     per-route WCAG thresholds.
 *   - The inspector can surface which CSS selectors / target names are being
 *     filtered out so QA understands why a node does not appear in the
 *     automated measurements.
 *   - Per-route thresholds let pages opt into AAA (or relax to AA) and pick a
 *     large/normal text override independently from the global default.
 */

export type WcagLevel = 'AA' | 'AAA';
export type LargeMode = 'auto' | 'normal' | 'large';

export type ContrastTarget = { name: string; selector: string };

export type ContrastRouteThreshold = {
  level?: WcagLevel;
  largeMode?: LargeMode;
};

export type ContrastRoute = {
  path: string;
  /** A regex that must be visible on the page before measuring. */
  ready?: RegExp;
  /** Targets specific to this route; merged with commonTargets unless `replaceCommon`. */
  targets?: ContrastTarget[];
  /** When true, ignore commonTargets for this route. */
  replaceCommon?: boolean;
  /** Optional per-route override for the WCAG threshold. */
  thresholds?: ContrastRouteThreshold;
};

export type ContrastRule = {
  /** Empty `route` matches any route. */
  route?: string;
  /** Substring match against target name, e.g. "muted-text". Empty matches any. */
  target?: string;
  /** Substring match against the CSS selector. Empty matches any. */
  selector?: string;
  /** Optional rationale surfaced in the inspector. */
  reason?: string;
};

export type ContrastConfig = {
  commonTargets: ContrastTarget[];
  routes: ContrastRoute[];
  allowlist: ContrastRule[];
  denylist: ContrastRule[];
  denySelectors: string[];
  maxNodesPerSelector: number;
  /** Global default applied when a route does not declare its own thresholds. */
  defaultThresholds: Required<ContrastRouteThreshold>;
};

export const contrastConfig: ContrastConfig = {
  defaultThresholds: { level: 'AA', largeMode: 'auto' },

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
      // Diagnostic surface — hold it to the stricter AAA bar.
      thresholds: { level: 'AAA', largeMode: 'auto' },
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

  allowlist: [],

  denylist: [
    { selector: '[data-sonner-toast]', reason: 'Toast surfaces sit over arbitrary backgrounds' },
    { selector: '.sr-only', reason: 'Visually hidden text should not gate WCAG' },
  ],

  denySelectors: ['.sr-only', '[aria-hidden="true"]', '[data-contrast-inspector] *'],

  maxNodesPerSelector: 20,
};

// ---------- helpers ----------

export function ruleMatches(rule: ContrastRule, route: string, target: string, selector: string): boolean {
  if (rule.route && rule.route !== route) return false;
  if (rule.target && !target.toLowerCase().includes(rule.target.toLowerCase())) return false;
  if (rule.selector && !selector.toLowerCase().includes(rule.selector.toLowerCase())) return false;
  return true;
}

export function isTargetEnabled(route: string, target: ContrastTarget, cfg: ContrastConfig = contrastConfig): boolean {
  if (cfg.denylist.some((r) => ruleMatches(r, route, target.name, target.selector))) return false;
  if (cfg.allowlist.length === 0) return true;
  return cfg.allowlist.some((r) => ruleMatches(r, route, target.name, target.selector));
}

export function effectiveSelector(target: ContrastTarget, cfg: ContrastConfig = contrastConfig): string {
  if (!cfg.denySelectors.length) return target.selector;
  const notClause = cfg.denySelectors.map((s) => `:not(${s})`).join('');
  return target.selector
    .split(',')
    .map((s) => `${s.trim()}${notClause}`)
    .join(', ');
}

export type ResolvedRoute = {
  path: string;
  ready?: RegExp;
  targets: ContrastTarget[];
  thresholds: Required<ContrastRouteThreshold>;
  /** Targets that exist in the merged list but were filtered out — surfaced in the overlay. */
  excludedTargets: Array<ContrastTarget & { reason: string }>;
};

export function getRouteThresholds(route: ContrastRoute, cfg: ContrastConfig = contrastConfig): Required<ContrastRouteThreshold> {
  return {
    level: route.thresholds?.level ?? cfg.defaultThresholds.level,
    largeMode: route.thresholds?.largeMode ?? cfg.defaultThresholds.largeMode,
  };
}

export function requiredRatio(isLarge: boolean, level: WcagLevel): number {
  if (level === 'AAA') return isLarge ? 4.5 : 7;
  return isLarge ? 3 : 4.5;
}

export function describeExclusion(
  route: string,
  target: ContrastTarget,
  cfg: ContrastConfig = contrastConfig,
): string | null {
  const denied = cfg.denylist.find((r) => ruleMatches(r, route, target.name, target.selector));
  if (denied) return `denylist: ${denied.reason ?? denied.selector ?? denied.target ?? 'matched rule'}`;
  if (cfg.allowlist.length > 0 && !cfg.allowlist.some((r) => ruleMatches(r, route, target.name, target.selector))) {
    return 'allowlist: not matched';
  }
  return null;
}

export function resolveRoutes(cfg: ContrastConfig = contrastConfig): ResolvedRoute[] {
  return cfg.routes.map((r) => {
    const merged = r.replaceCommon ? (r.targets ?? []) : [...cfg.commonTargets, ...(r.targets ?? [])];
    const targets: ContrastTarget[] = [];
    const excludedTargets: ResolvedRoute['excludedTargets'] = [];
    for (const t of merged) {
      const reason = describeExclusion(r.path, t, cfg);
      if (reason) excludedTargets.push({ ...t, reason });
      else targets.push(t);
    }
    return { path: r.path, ready: r.ready, targets, excludedTargets, thresholds: getRouteThresholds(r, cfg) };
  });
}

/** Serializable snapshot of the effective config (for "export current settings" in the overlay). */
export function getEffectiveConfigSnapshot(cfg: ContrastConfig = contrastConfig) {
  return {
    generatedAt: new Date().toISOString(),
    maxNodesPerSelector: cfg.maxNodesPerSelector,
    defaultThresholds: cfg.defaultThresholds,
    denySelectors: cfg.denySelectors,
    allowlist: cfg.allowlist,
    denylist: cfg.denylist,
    routes: resolveRoutes(cfg).map((r) => ({
      path: r.path,
      thresholds: r.thresholds,
      targets: r.targets,
      excludedTargets: r.excludedTargets,
    })),
  };
}
