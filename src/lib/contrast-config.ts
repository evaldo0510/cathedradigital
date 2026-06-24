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

// ---------- runtime overrides (browser only) ----------
// The overlay can import a previously exported JSON. We mutate the shared
// `contrastConfig` object in place so every consumer (snapshot, resolver,
// inspector panel) sees the same effective state, and we persist the override
// in localStorage so a reload keeps it active.

const CONFIG_OVERRIDE_KEY = 'cathedra:contrast-inspector:config-override';

export type ContrastConfigOverride = Partial<
  Pick<ContrastConfig, 'maxNodesPerSelector' | 'defaultThresholds' | 'denySelectors' | 'allowlist' | 'denylist'>
> & {
  /** Per-route threshold overrides keyed by route path; merged into matching routes. */
  routeThresholds?: Record<string, ContrastRouteThreshold>;
};

/** Accepts either a raw override or a snapshot produced by getEffectiveConfigSnapshot. */
export function normalizeImportedConfig(input: unknown): ContrastConfigOverride {
  if (!input || typeof input !== 'object') throw new Error('Config inválido: esperado objeto JSON.');
  const obj = input as Record<string, unknown>;
  // Snapshots wrap the contrast block under `contrast`.
  const src = (obj.contrast && typeof obj.contrast === 'object' ? (obj.contrast as Record<string, unknown>) : obj);
  const out: ContrastConfigOverride = {};
  if (typeof src.maxNodesPerSelector === 'number' && src.maxNodesPerSelector > 0) {
    out.maxNodesPerSelector = Math.min(200, Math.floor(src.maxNodesPerSelector));
  }
  if (src.defaultThresholds && typeof src.defaultThresholds === 'object') {
    const d = src.defaultThresholds as Partial<Required<ContrastRouteThreshold>>;
    out.defaultThresholds = {
      level: d.level === 'AAA' ? 'AAA' : 'AA',
      largeMode: d.largeMode === 'normal' || d.largeMode === 'large' ? d.largeMode : 'auto',
    };
  }
  if (Array.isArray(src.denySelectors)) out.denySelectors = src.denySelectors.filter((s): s is string => typeof s === 'string');
  if (Array.isArray(src.allowlist)) out.allowlist = src.allowlist as ContrastRule[];
  if (Array.isArray(src.denylist)) out.denylist = src.denylist as ContrastRule[];
  if (Array.isArray(src.routes)) {
    out.routeThresholds = {};
    for (const r of src.routes as Array<{ path?: string; thresholds?: ContrastRouteThreshold }>) {
      if (r?.path && r.thresholds) out.routeThresholds[r.path] = r.thresholds;
    }
  }
  return out;
}

export function applyConfigOverride(override: ContrastConfigOverride, cfg: ContrastConfig = contrastConfig): void {
  if (override.maxNodesPerSelector !== undefined) cfg.maxNodesPerSelector = override.maxNodesPerSelector;
  if (override.defaultThresholds) cfg.defaultThresholds = { ...cfg.defaultThresholds, ...override.defaultThresholds };
  if (override.denySelectors) cfg.denySelectors = [...override.denySelectors];
  if (override.allowlist) cfg.allowlist = [...override.allowlist];
  if (override.denylist) cfg.denylist = [...override.denylist];
  if (override.routeThresholds) {
    for (const r of cfg.routes) {
      const t = override.routeThresholds[r.path];
      if (t) r.thresholds = { ...r.thresholds, ...t };
    }
  }
}

export function persistConfigOverride(override: ContrastConfigOverride): void {
  try { localStorage.setItem(CONFIG_OVERRIDE_KEY, JSON.stringify(override)); } catch { /* ignore */ }
}

export function clearConfigOverride(): void {
  try { localStorage.removeItem(CONFIG_OVERRIDE_KEY); } catch { /* ignore */ }
}

export function loadPersistedConfigOverride(cfg: ContrastConfig = contrastConfig): ContrastConfigOverride | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONFIG_OVERRIDE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ContrastConfigOverride;
    applyConfigOverride(parsed, cfg);
    return parsed;
  } catch {
    return null;
  }
}

// Auto-apply persisted override on module load (browser only). The Playwright
// spec runs in Node, where localStorage is undefined, so this is a no-op there.
if (typeof window !== 'undefined') loadPersistedConfigOverride();

