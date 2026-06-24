import { describe, expect, it } from 'vitest';
import {
  applyConfigOverride,
  contrastConfig,
  describeExclusion,
  effectiveSelector,
  getEffectiveConfigSnapshot,
  getRouteThresholds,
  isTargetEnabled,
  normalizeImportedConfig,
  requiredRatio,
  resolveRoutes,
  ruleMatches,
  type ContrastConfig,
} from '../contrast-config';


const baseConfig = (): ContrastConfig => ({
  defaultThresholds: { level: 'AA', largeMode: 'auto' },
  commonTargets: [
    { name: 'paragraph', selector: 'p' },
    { name: 'muted-text', selector: '.text-muted-foreground' },
  ],
  routes: [
    { path: '/' },
    { path: '/secure', thresholds: { level: 'AAA' } },
  ],
  allowlist: [],
  denylist: [{ selector: '.text-muted-foreground', reason: 'muted is decorative' }],
  denySelectors: ['.sr-only', '[aria-hidden="true"]'],
  maxNodesPerSelector: 5,
});

describe('contrast config filtering', () => {
  it('ruleMatches scopes by route, target and selector', () => {
    expect(ruleMatches({ route: '/' }, '/', 'paragraph', 'p')).toBe(true);
    expect(ruleMatches({ route: '/other' }, '/', 'paragraph', 'p')).toBe(false);
    expect(ruleMatches({ target: 'muted' }, '/', 'muted-text', '.x')).toBe(true);
    expect(ruleMatches({ selector: '.foo' }, '/', 'x', '.foo .bar')).toBe(true);
    expect(ruleMatches({ selector: '.foo' }, '/', 'x', '.bar')).toBe(false);
  });

  it('denylist excludes targets and surfaces a reason', () => {
    const cfg = baseConfig();
    expect(isTargetEnabled('/', { name: 'muted-text', selector: '.text-muted-foreground' }, cfg)).toBe(false);
    expect(describeExclusion('/', { name: 'muted-text', selector: '.text-muted-foreground' }, cfg))
      .toMatch(/denylist/);
    expect(describeExclusion('/', { name: 'paragraph', selector: 'p' }, cfg)).toBeNull();
  });

  it('allowlist keeps only matching targets', () => {
    const cfg = baseConfig();
    cfg.allowlist = [{ target: 'paragraph' }];
    expect(isTargetEnabled('/', { name: 'paragraph', selector: 'p' }, cfg)).toBe(true);
    expect(isTargetEnabled('/', { name: 'link', selector: 'a' }, cfg)).toBe(false);
    expect(describeExclusion('/', { name: 'link', selector: 'a' }, cfg)).toMatch(/allowlist/);
  });

  it('effectiveSelector appends :not() clauses for every denySelector', () => {
    const cfg = baseConfig();
    const out = effectiveSelector({ name: 'paragraph', selector: 'p, div' }, cfg);
    expect(out).toContain('p:not(.sr-only):not([aria-hidden="true"])');
    expect(out).toContain('div:not(.sr-only):not([aria-hidden="true"])');
  });

  it('resolveRoutes filters denied targets and exposes excludedTargets with reasons', () => {
    const cfg = baseConfig();
    const [root] = resolveRoutes(cfg);
    expect(root.targets.map((t) => t.name)).toEqual(['paragraph']);
    expect(root.excludedTargets.map((t) => t.name)).toEqual(['muted-text']);
    expect(root.excludedTargets[0].reason).toMatch(/denylist/);
  });
});

describe('per-route thresholds', () => {
  it('returns defaults when route does not override', () => {
    const cfg = baseConfig();
    expect(getRouteThresholds({ path: '/' }, cfg)).toEqual({ level: 'AA', largeMode: 'auto' });
  });
  it('honors route-level overrides', () => {
    const cfg = baseConfig();
    expect(getRouteThresholds({ path: '/x', thresholds: { level: 'AAA' } }, cfg)).toEqual({
      level: 'AAA',
      largeMode: 'auto',
    });
  });
  it('requiredRatio matches WCAG matrix', () => {
    expect(requiredRatio(false, 'AA')).toBe(4.5);
    expect(requiredRatio(true, 'AA')).toBe(3);
    expect(requiredRatio(false, 'AAA')).toBe(7);
    expect(requiredRatio(true, 'AAA')).toBe(4.5);
  });
});

describe('config snapshot export', () => {
  it('serializes routes with thresholds and excluded targets', () => {
    const cfg = baseConfig();
    const snap = getEffectiveConfigSnapshot(cfg);
    expect(snap.routes.find((r) => r.path === '/secure')?.thresholds.level).toBe('AAA');
    expect(snap.denySelectors).toContain('.sr-only');
    const root = snap.routes.find((r) => r.path === '/');
    expect(root?.excludedTargets[0]?.name).toBe('muted-text');
  });

  it('production config wires real denylist entries', () => {
    const snap = getEffectiveConfigSnapshot(contrastConfig);
    expect(snap.denySelectors.length).toBeGreaterThan(0);
    expect(snap.routes.length).toBeGreaterThan(0);
  });
});

describe('import / override round-trip', () => {
  it('normalizes an exported snapshot and applies it to a config', () => {
    const source = baseConfig();
    const snapshot = { inspector: { level: 'AAA' }, contrast: getEffectiveConfigSnapshot(source) };
    const override = normalizeImportedConfig(snapshot);
    expect(override.denySelectors).toContain('.sr-only');
    expect(override.maxNodesPerSelector).toBe(5);

    const target: ContrastConfig = baseConfig();
    target.maxNodesPerSelector = 99;
    target.denySelectors = [];
    applyConfigOverride(override, target);
    expect(target.maxNodesPerSelector).toBe(5);
    expect(target.denySelectors).toContain('.sr-only');
  });

  it('rejects non-object payloads with a helpful error', () => {
    expect(() => normalizeImportedConfig(null)).toThrow(/Config inválido/);
    expect(() => normalizeImportedConfig('foo')).toThrow(/Config inválido/);
  });

  it('applies per-route threshold overrides to matching routes only', () => {
    const cfg = baseConfig();
    applyConfigOverride({ routeThresholds: { '/secure': { level: 'AA' }, '/missing': { level: 'AAA' } } }, cfg);
    expect(cfg.routes.find((r) => r.path === '/secure')?.thresholds?.level).toBe('AA');
    expect(cfg.routes.find((r) => r.path === '/')?.thresholds).toBeUndefined();
  });
});
