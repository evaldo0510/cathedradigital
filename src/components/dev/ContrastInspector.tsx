/**
 * ContrastInspector — dev-only overlay (gated by import.meta.env.DEV).
 *
 * Hotkeys:
 *   Alt+Shift+C — toggle inspector
 *   Alt+Click  — export the clicked element's outerHTML + computed styles +
 *                effective background + contrast ratio as a JSON download.
 *
 * While active, hovering an element shows a floating panel with:
 *   - WCAG contrast ratio (vs. effective background, honoring transparency)
 *   - AA / AAA pass markers (for normal vs. large text)
 *   - Tailwind utility classes detected on the element and its closest token-bearing ancestor
 *   - Resolved fg / bg colors
 *
 * Renders nothing in production builds.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  applyConfigOverride,
  clearConfigOverride,
  contrastConfig,
  getEffectiveConfigSnapshot,
  normalizeImportedConfig,
  persistConfigOverride,
} from '@/lib/contrast-config';
import {
  applyTokenFixToElement,
  scanPageForContrastViolations,
  type AuditResult,
  type ContrastViolation,
} from '@/lib/contrast-audit';

type RGBA = { r: number; g: number; b: number; a: number };

function parseColor(str: string): RGBA | null {
  if (!str) return null;
  const m = str.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(',').map((v) => parseFloat(v.trim()));
  const [r, g, b, a = 1] = parts;
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  return { r, g, b, a };
}

function relLum({ r, g, b }: RGBA) {
  const ch = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

function contrastRatio(fg: RGBA, bg: RGBA) {
  const L1 = relLum(fg);
  const L2 = relLum(bg);
  const [a, b] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (a + 0.05) / (b + 0.05);
}

function effectiveBackground(el: Element): RGBA {
  let node: Element | null = el;
  while (node && node !== document.documentElement) {
    const cs = getComputedStyle(node);
    const c = parseColor(cs.backgroundColor);
    if (c && c.a > 0.01) return c;
    node = node.parentElement;
  }
  const bodyBg = parseColor(getComputedStyle(document.body).backgroundColor);
  if (bodyBg && bodyBg.a > 0) return bodyBg;
  return document.documentElement.classList.contains('dark')
    ? { r: 10, g: 10, b: 12, a: 1 }
    : { r: 255, g: 255, b: 255, a: 1 };
}

function tailwindClassesOf(el: Element): string[] {
  const list = (el.getAttribute('class') || '').split(/\s+/).filter(Boolean);
  return list.filter((c) =>
    /^(text-|bg-|border-|from-|via-|to-|placeholder:|fill-|stroke-|ring-|shadow-|decoration-|outline-)/.test(c),
  );
}

function rgbaString({ r, g, b, a }: RGBA) {
  return a >= 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
}

type WcagLevel = 'AA' | 'AAA';
type LargeMode = 'auto' | 'normal' | 'large';

export type InspectorSettings = {
  level: WcagLevel;
  largeMode: LargeMode;
  /** Persisted preference, mirrored into the exported JSON for the spec to read. */
  maxNodesPerSelector: number;
};

const DEFAULT_SETTINGS: InspectorSettings = {
  level: 'AA',
  largeMode: 'auto',
  maxNodesPerSelector: 20,
};

const SETTINGS_KEY = 'cathedra:contrast-inspector:settings';

function readSettings(): InspectorSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      level: parsed.level === 'AAA' ? 'AAA' : 'AA',
      largeMode: parsed.largeMode === 'normal' || parsed.largeMode === 'large' ? parsed.largeMode : 'auto',
      maxNodesPerSelector:
        Number.isFinite(parsed.maxNodesPerSelector) && parsed.maxNodesPerSelector > 0
          ? Math.min(200, Math.floor(parsed.maxNodesPerSelector))
          : DEFAULT_SETTINGS.maxNodesPerSelector,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function writeSettings(s: InspectorSettings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

function rateRatio(r: number, fontSize: number, fontWeight: number, settings: InspectorSettings) {
  const autoLarge = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
  const isLarge = settings.largeMode === 'large' ? true : settings.largeMode === 'normal' ? false : autoLarge;
  const aaMin = isLarge ? 3 : 4.5;
  const aaaMin = isLarge ? 4.5 : 7;
  return {
    isLarge,
    aa: r >= aaMin,
    aaa: r >= aaaMin,
    aaMin,
    aaaMin,
    required: settings.level === 'AAA' ? aaaMin : aaMin,
    passes: r >= (settings.level === 'AAA' ? aaaMin : aaMin),
  };
}

function inspectElement(el: Element, settings: InspectorSettings) {
  const cs = getComputedStyle(el);
  const fg = parseColor(cs.color) ?? { r: 0, g: 0, b: 0, a: 1 };
  const bg = effectiveBackground(el);
  const ratio = contrastRatio(fg, bg);
  const fontSize = parseFloat(cs.fontSize) || 16;
  const fontWeight = parseInt(cs.fontWeight, 10) || 400;
  const rating = rateRatio(ratio, fontSize, fontWeight, settings);
  return {
    tag: el.tagName.toLowerCase(),
    classes: tailwindClassesOf(el),
    color: rgbaString(fg),
    backgroundColor: rgbaString(bg),
    ratio: Math.round(ratio * 100) / 100,
    fontSize,
    fontWeight,
    ...rating,
  };
}

type Inspection = ReturnType<typeof inspectElement>;


function exportElement(el: Element, settings: InspectorSettings) {
  const info = inspectElement(el, settings);
  const payload = {
    capturedAt: new Date().toISOString(),
    url: window.location.href,
    selector: cssPath(el),
    inspection: info,
    outerHTML: (el as HTMLElement).outerHTML,
    computedStyles: collectKeyStyles(el),
    theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    viewport: { w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio },
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  a.href = url;
  a.download = `contrast-${info.tag}-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  // Also push to clipboard for easy pasting.
  try {
    navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
  } catch {
    /* ignore */
  }
}

function cssPath(el: Element): string {
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node.nodeType === 1 && parts.length < 6) {
    let s = node.tagName.toLowerCase();
    if (node.id) {
      s += `#${node.id}`;
      parts.unshift(s);
      break;
    }
    const cls = (node.getAttribute('class') || '').trim().split(/\s+/).slice(0, 2).join('.');
    if (cls) s += `.${cls}`;
    const parent = node.parentElement;
    if (parent) {
      const same = Array.from(parent.children).filter((c) => c.tagName === node!.tagName);
      if (same.length > 1) s += `:nth-of-type(${same.indexOf(node) + 1})`;
    }
    parts.unshift(s);
    node = parent;
  }
  return parts.join(' > ');
}

function collectKeyStyles(el: Element): Record<string, string> {
  const cs = getComputedStyle(el);
  const keys = [
    'color',
    'backgroundColor',
    'backgroundImage',
    'fontSize',
    'fontWeight',
    'fontFamily',
    'lineHeight',
    'letterSpacing',
    'opacity',
    'mixBlendMode',
    'textShadow',
    'borderColor',
    'borderWidth',
  ];
  return Object.fromEntries(keys.map((k) => [k, cs.getPropertyValue(k as keyof CSSStyleDeclaration as string) || (cs as unknown as Record<string, string>)[k]]));
}

const STORAGE_KEY = 'cathedra:contrast-inspector:on';

/**
 * The inspector is available in every build, but only renders UI when *enabled*:
 *   - automatically in `vite dev` (import.meta.env.DEV)
 *   - opt-in elsewhere via `?contrast=1` query param (sticky in localStorage)
 *   - opt-in via `localStorage.setItem('cathedra:contrast-inspector:enabled','1')`
 *
 * Once enabled, Alt+Shift+C toggles the hover overlay on/off; the launcher
 * chip is always visible while enabled.
 */
const ENABLED_KEY = 'cathedra:contrast-inspector:enabled';

function readEnabled(): boolean {
  if (import.meta.env.DEV) return true;
  if (typeof window === 'undefined') return false;
  try {
    const url = new URL(window.location.href);
    const q = url.searchParams.get('contrast');
    if (q === '1' || q === 'true') {
      localStorage.setItem(ENABLED_KEY, '1');
      return true;
    }
    if (q === '0' || q === 'false') {
      localStorage.setItem(ENABLED_KEY, '0');
      return false;
    }
    return localStorage.getItem(ENABLED_KEY) === '1';
  } catch {
    return false;
  }
}

/** Download the active inspector settings + the effective allow/denylist as JSON for versioning. */
function exportEffectiveConfig(settings: InspectorSettings) {
  const snapshot = getEffectiveConfigSnapshot(contrastConfig);
  const payload = {
    capturedAt: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : null,
    inspector: settings,
    contrast: snapshot,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `contrast-config-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  try { navigator.clipboard?.writeText(JSON.stringify(payload, null, 2)); } catch { /* ignore */ }
}

/** Surfaces the denySelectors + per-route excluded targets so QA can see why a node is missing. */
function FiltersSection() {
  const snapshot = useMemo(() => getEffectiveConfigSnapshot(contrastConfig), []);
  const excluded = snapshot.routes.flatMap((r) =>
    r.excludedTargets.map((t) => ({ route: r.path, name: t.name, selector: t.selector, reason: t.reason })),
  );
  return (
    <div style={{ marginTop: 4, marginBottom: 8, padding: 8, borderRadius: 6, background: 'rgba(30,41,59,0.5)' }}>
      <div style={{ fontWeight: 700, opacity: 0.85, marginBottom: 4 }}>Filtros aplicados</div>
      <div style={{ opacity: 0.7, marginBottom: 2 }}>denySelectors (globais):</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
        {snapshot.denySelectors.map((s) => (
          <code key={s} style={{ padding: '1px 5px', background: 'rgba(148,163,184,0.18)', borderRadius: 4, fontSize: 10 }}>
            {s}
          </code>
        ))}
      </div>
      <div style={{ opacity: 0.7, marginBottom: 2 }}>
        Alvos excluídos por allow/denylist ({excluded.length}):
      </div>
      <div style={{ maxHeight: 96, overflow: 'auto', fontSize: 10, lineHeight: 1.4 }}>
        {excluded.length === 0 ? (
          <span style={{ opacity: 0.6 }}>— nenhum —</span>
        ) : (
          excluded.map((e, i) => (
            <div key={i} style={{ marginBottom: 2 }}>
              <span style={{ color: 'rgb(248,113,113)' }}>✕</span> <strong>{e.route}</strong> · {e.name}
              <span style={{ opacity: 0.6 }}> — {e.reason}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


export default function ContrastInspector() {
  const enabled = readEnabled();
  const [active, setActive] = useState<boolean>(() => {
    if (!enabled) return false;
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  const [info, setInfo] = useState<Inspection | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 16, y: 16 });
  const [settings, setSettingsState] = useState<InspectorSettings>(() => readSettings());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [, forceRerender] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastTargetRef = useRef<Element | null>(null);
  const settingsRef = useRef<InspectorSettings>(settings);
  settingsRef.current = settings;

  const runAudit = useCallback(() => {
    setAudit(scanPageForContrastViolations({ level: settings.level, largeMode: settings.largeMode }));
  }, [settings.level, settings.largeMode]);

  const openAudit = useCallback(() => {
    setAuditOpen(true);
    setAudit(scanPageForContrastViolations({ level: settings.level, largeMode: settings.largeMode }));
  }, [settings.level, settings.largeMode]);

  const applyFix = useCallback((v: ContrastViolation) => {
    const el = v.ref.deref();
    if (!el) return;
    const { before, after } = applyTokenFixToElement(el, v.suggestions);
    try {
      navigator.clipboard?.writeText(
        `// ${v.selector} — substituir className\n- ${before}\n+ ${after}\n`,
      );
    } catch { /* ignore */ }
    runAudit();
  }, [runAudit]);




  const handleImportFile = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (json?.inspector && typeof json.inspector === 'object') {
        const next: InspectorSettings = {
          level: json.inspector.level === 'AAA' ? 'AAA' : 'AA',
          largeMode: ['auto', 'normal', 'large'].includes(json.inspector.largeMode) ? json.inspector.largeMode : 'auto',
          maxNodesPerSelector:
            Number.isFinite(json.inspector.maxNodesPerSelector) && json.inspector.maxNodesPerSelector > 0
              ? Math.min(200, Math.floor(json.inspector.maxNodesPerSelector))
              : DEFAULT_SETTINGS.maxNodesPerSelector,
        };
        setSettingsState(next);
        writeSettings(next);
      }
      const override = normalizeImportedConfig(json);
      applyConfigOverride(override);
      persistConfigOverride(override);
      forceRerender((n) => n + 1);
      setImportStatus({ kind: 'ok', msg: 'Config aplicada e persistida.' });
    } catch (e) {
      setImportStatus({ kind: 'err', msg: `Falha ao importar: ${(e as Error).message}` });
    }
  }, []);


  const updateSettings = useCallback((patch: Partial<InspectorSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch };
      writeSettings(next);
      return next;
    });
  }, []);

  const persistActive = useCallback((next: boolean) => {
    setActive(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, []);

  // Re-evaluate the last hovered element whenever settings change so badges update.
  useEffect(() => {
    if (lastTargetRef.current) setInfo(inspectElement(lastTargetRef.current, settings));
  }, [settings]);

  // Hotkey toggle: Alt+Shift+C
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        persistActive(!active);
      }
      if (e.key === 'Escape' && (active || settingsOpen)) {
        setSettingsOpen(false);
        persistActive(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled, active, settingsOpen, persistActive]);

  // Hover tracking + Alt+Click export
  useEffect(() => {
    if (!enabled || !active) return;
    const onMove = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (!t || (t as HTMLElement).closest?.('[data-contrast-inspector]')) return;
      lastTargetRef.current = t;
      setInfo(inspectElement(t, settingsRef.current));
      const pad = 16;
      const panelW = 360;
      const panelH = 260;
      let x = e.clientX + pad;
      let y = e.clientY + pad;
      if (x + panelW > window.innerWidth) x = e.clientX - panelW - pad;
      if (y + panelH > window.innerHeight) y = e.clientY - panelH - pad;
      setPos({ x: Math.max(8, x), y: Math.max(8, y) });
    };
    const onClick = (e: MouseEvent) => {
      if (!e.altKey) return;
      const t = e.target as Element | null;
      if (!t || (t as HTMLElement).closest?.('[data-contrast-inspector]')) return;
      e.preventDefault();
      e.stopPropagation();
      exportElement(t, settingsRef.current);
    };
    window.addEventListener('mousemove', onMove, true);
    window.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('mousemove', onMove, true);
      window.removeEventListener('click', onClick, true);
    };
  }, [enabled, active]);


  const badge = useMemo(() => {
    if (!info) return null;
    // Pass/fail honors the user-chosen WCAG level; we still surface AAA when reached.
    const passes = settings.level === 'AAA' ? info.aaa : info.aa;
    const tone = info.aaa ? 'aaa' : passes ? 'aa' : 'fail';
    return { tone, text: tone === 'aaa' ? 'AAA' : tone === 'aa' ? 'AA' : 'FAIL' };
  }, [info, settings.level]);


  if (!enabled) return null;

  return (
    <>
      {/* Launcher chip + settings cog */}
      <div
        data-contrast-inspector="launcher"
        style={{
          position: 'fixed',
          bottom: 12,
          right: 12,
          zIndex: 2147483646,
          display: 'flex',
          gap: 6,
          alignItems: 'center',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 11,
        }}
      >
        <button
          type="button"
          onClick={() => persistActive(!active)}
          title="Contrast Inspector (Alt+Shift+C). Alt+Click to export."
          style={{
            padding: '6px 10px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.15)',
            background: active ? 'rgb(220, 38, 38)' : 'rgba(15,23,42,0.85)',
            color: 'white',
            cursor: 'pointer',
            boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
          }}
        >
          {active ? `◉ ${settings.level}` : `◎ Contrast · ${settings.level}`}
        </button>
        <button
          type="button"
          onClick={() => setSettingsOpen((v) => !v)}
          title="Inspector settings"
          aria-label="Inspector settings"
          aria-expanded={settingsOpen}
          style={{
            padding: '6px 8px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.15)',
            background: settingsOpen ? 'rgba(59,130,246,0.95)' : 'rgba(15,23,42,0.85)',
            color: 'white',
            cursor: 'pointer',
            boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
          }}
        >
          ⚙
        </button>
        <button
          type="button"
          onClick={openAudit}
          title="Auditar contraste da página inteira"
          aria-label="Auditar contraste"
          aria-expanded={auditOpen}
          style={{
            padding: '6px 10px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.15)',
            background: auditOpen ? 'rgba(168,85,247,0.95)' : 'rgba(15,23,42,0.85)',
            color: 'white',
            cursor: 'pointer',
            boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
          }}
        >
          ⚠ Audit{audit ? ` · ${audit.violations.length}` : ''}
        </button>
      </div>


      {settingsOpen && (
        <div
          data-contrast-inspector="settings"
          role="dialog"
          aria-label="Contrast inspector settings"
          style={{
            position: 'fixed',
            bottom: 56,
            right: 12,
            zIndex: 2147483647,
            width: 280,
            background: 'rgba(15,23,42,0.97)',
            color: 'rgb(241,245,249)',
            border: '1px solid rgba(148,163,184,0.3)',
            borderRadius: 12,
            padding: 12,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 12,
            lineHeight: 1.5,
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Inspector settings</div>

          <label style={{ display: 'block', marginBottom: 8 }}>
            <span style={{ opacity: 0.7, display: 'block', marginBottom: 4 }}>WCAG level</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['AA', 'AAA'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => updateSettings({ level: lvl })}
                  style={{
                    flex: 1, padding: '6px 8px', borderRadius: 6,
                    border: '1px solid rgba(148,163,184,0.3)',
                    background: settings.level === lvl ? 'rgb(59,130,246)' : 'rgba(30,41,59,0.6)',
                    color: 'white', cursor: 'pointer', fontWeight: 600,
                  }}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </label>

          <label style={{ display: 'block', marginBottom: 8 }}>
            <span style={{ opacity: 0.7, display: 'block', marginBottom: 4 }}>Text size mode</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['auto', 'normal', 'large'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => updateSettings({ largeMode: m })}
                  style={{
                    flex: 1, padding: '6px 4px', borderRadius: 6,
                    border: '1px solid rgba(148,163,184,0.3)',
                    background: settings.largeMode === m ? 'rgb(59,130,246)' : 'rgba(30,41,59,0.6)',
                    color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 11,
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
            <div style={{ opacity: 0.55, fontSize: 10, marginTop: 4 }}>
              auto = WCAG default (≥24px or ≥18.66px bold = large)
            </div>
          </label>

          <label style={{ display: 'block', marginBottom: 8 }}>
            <span style={{ opacity: 0.7, display: 'block', marginBottom: 4 }}>
              Max nodes per selector (spec): <strong>{settings.maxNodesPerSelector}</strong>
            </span>
            <input
              type="range"
              min={1}
              max={100}
              step={1}
              value={settings.maxNodesPerSelector}
              onChange={(e) => updateSettings({ maxNodesPerSelector: Number(e.target.value) })}
              style={{ width: '100%' }}
              aria-label="Max nodes per selector"
            />
            <div style={{ opacity: 0.55, fontSize: 10, marginTop: 2 }}>
              Persisted for the Playwright spec to read via export.
            </div>
          </label>

          <FiltersSection />

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            aria-label="Importar config JSON"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleImportFile(f);
              e.target.value = '';
            }}
          />

          {importStatus && (
            <div
              role="status"
              style={{
                marginTop: 6, padding: '4px 8px', borderRadius: 6, fontSize: 11,
                background: importStatus.kind === 'ok' ? 'rgba(16,185,129,0.18)' : 'rgba(220,38,38,0.18)',
                color: importStatus.kind === 'ok' ? 'rgb(110,231,183)' : 'rgb(252,165,165)',
                border: `1px solid ${importStatus.kind === 'ok' ? 'rgba(16,185,129,0.4)' : 'rgba(220,38,38,0.4)'}`,
              }}
            >
              {importStatus.msg}
            </div>
          )}

          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button
              type="button"
              onClick={() => exportEffectiveConfig(settings)}
              title="Baixar level, text size mode, maxNodes e allow/denylist efetivos"
              style={{
                flex: 1, padding: '6px 8px', borderRadius: 6, cursor: 'pointer',
                border: '1px solid rgba(148,163,184,0.3)', background: 'rgb(16,185,129)', color: 'white', fontWeight: 600,
              }}
            >
              Export
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Importar JSON exportado e reaplicar level, text size mode, maxNodes e allow/denylist"
              style={{
                flex: 1, padding: '6px 8px', borderRadius: 6, cursor: 'pointer',
                border: '1px solid rgba(148,163,184,0.3)', background: 'rgb(168,85,247)', color: 'white', fontWeight: 600,
              }}
            >
              Import
            </button>
            <button
              type="button"
              onClick={() => {
                setSettingsState(DEFAULT_SETTINGS);
                writeSettings(DEFAULT_SETTINGS);
                clearConfigOverride();
                setImportStatus({ kind: 'ok', msg: 'Override removido. Recarregue para aplicar.' });
              }}
              style={{
                flex: 1, padding: '6px 8px', borderRadius: 6, cursor: 'pointer',
                border: '1px solid rgba(148,163,184,0.3)', background: 'rgba(30,41,59,0.6)', color: 'white',
              }}
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen(false)}
              style={{
                flex: 1, padding: '6px 8px', borderRadius: 6, cursor: 'pointer',
                border: '1px solid rgba(148,163,184,0.3)', background: 'rgb(59,130,246)', color: 'white', fontWeight: 600,
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}




      {active && info && (
        <div
          data-contrast-inspector="panel"
          style={{
            position: 'fixed',
            left: pos.x,
            top: pos.y,
            zIndex: 2147483647,
            width: 360,
            maxHeight: 280,
            overflow: 'auto',
            background: 'rgba(15,23,42,0.96)',
            color: 'rgb(241,245,249)',
            border: '1px solid rgba(148,163,184,0.3)',
            borderRadius: 10,
            padding: '10px 12px',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 11,
            lineHeight: 1.45,
            pointerEvents: 'none',
            boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontWeight: 700 }}>{info.tag}</span>
            {badge && (
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 999,
                  fontWeight: 700,
                  background:
                    badge.tone === 'aaa'
                      ? 'rgb(16,185,129)'
                      : badge.tone === 'aa'
                        ? 'rgb(234,179,8)'
                        : 'rgb(220,38,38)',
                  color: 'white',
                }}
              >
                {info.ratio}:1 · {badge.text}
              </span>
            )}
          </div>
          <div>
            <span style={{ opacity: 0.65 }}>level:</span> <strong>{settings.level}</strong> ·{' '}
            <span style={{ opacity: 0.65 }}>required:</span> {info.required}:1 ·{' '}
            <span style={{ opacity: 0.65 }}>AA:</span> {info.aaMin}:1 ·{' '}
            <span style={{ opacity: 0.65 }}>AAA:</span> {info.aaaMin}:1
            {info.isLarge && <span style={{ opacity: 0.65 }}> · large</span>}
          </div>

          <div style={{ marginTop: 4 }}>
            <span style={{ opacity: 0.65 }}>font:</span> {Math.round(info.fontSize)}px / {info.fontWeight}
          </div>
          <div style={{ marginTop: 4 }}>
            <span style={{ opacity: 0.65 }}>fg:</span>{' '}
            <span style={{ display: 'inline-block', width: 10, height: 10, background: info.color, border: '1px solid #888', verticalAlign: 'middle', marginRight: 4 }} />
            {info.color}
          </div>
          <div>
            <span style={{ opacity: 0.65 }}>bg:</span>{' '}
            <span style={{ display: 'inline-block', width: 10, height: 10, background: info.backgroundColor, border: '1px solid #888', verticalAlign: 'middle', marginRight: 4 }} />
            {info.backgroundColor}
          </div>
          <div style={{ marginTop: 6 }}>
            <div style={{ opacity: 0.65, marginBottom: 2 }}>tailwind classes:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {info.classes.length === 0 ? (
                <span style={{ opacity: 0.5 }}>—</span>
              ) : (
                info.classes.map((c) => (
                  <span key={c} style={{ padding: '1px 6px', background: 'rgba(148,163,184,0.18)', borderRadius: 4 }}>
                    {c}
                  </span>
                ))
              )}
            </div>
          </div>
          <div style={{ marginTop: 8, opacity: 0.6 }}>
            Alt+Click → export JSON · Alt+Shift+C → toggle · Esc → close
          </div>
        </div>
      )}

      {auditOpen && (
        <AuditPanel
          audit={audit}
          onRescan={runAudit}
          onClose={() => setAuditOpen(false)}
          onApplyFix={applyFix}
          onHighlight={(v) => {
            const el = v.ref.deref();
            if (!el) return;
            (el as HTMLElement).scrollIntoView({ block: 'center', behavior: 'smooth' });
            const prev = (el as HTMLElement).style.outline;
            (el as HTMLElement).style.outline = '2px solid rgb(168,85,247)';
            setTimeout(() => { (el as HTMLElement).style.outline = prev; }, 1500);
          }}
        />
      )}
    </>

  );
}

/** Floating audit panel — lists violations, switches to detail view with persistent highlight. */
function AuditPanel({
  audit,
  onRescan,
  onClose,
  onApplyFix,
}: {
  audit: AuditResult | null;
  onRescan: () => void;
  onClose: () => void;
  onApplyFix: (v: ContrastViolation) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const highlightedRef = useRef<{ el: HTMLElement; prevOutline: string; prevOffset: string } | null>(null);

  const clearHighlight = useCallback(() => {
    const cur = highlightedRef.current;
    if (cur) {
      cur.el.style.outline = cur.prevOutline;
      cur.el.style.outlineOffset = cur.prevOffset;
      highlightedRef.current = null;
    }
  }, []);

  useEffect(() => () => clearHighlight(), [clearHighlight]);

  const selected = audit?.violations.find((v) => v.id === selectedId) ?? null;

  useEffect(() => {
    clearHighlight();
    if (!selected) return;
    const el = selected.ref.deref() as HTMLElement | undefined;
    if (!el) return;
    highlightedRef.current = { el, prevOutline: el.style.outline, prevOffset: el.style.outlineOffset };
    el.style.outline = '3px solid rgb(168,85,247)';
    el.style.outlineOffset = '2px';
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [selected, clearHighlight]);

  const exportAudit = () => {
    if (!audit) return;
    const payload = { ...audit, violations: audit.violations.map(({ ref: _ref, ...rest }) => rest) };
    triggerDownload(
      new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
      `contrast-audit-${safe(audit.route)}-${audit.theme}-${audit.level}.json`,
    );
  };

  const exportReport = () => {
    if (!audit) return;
    const md = renderReportMarkdown(audit);
    try { navigator.clipboard?.writeText(md); } catch { /* ignore */ }
    triggerDownload(
      new Blob([md], { type: 'text/markdown' }),
      `contrast-report-${safe(audit.route)}-${audit.theme}-${audit.level}.md`,
    );
  };

  return (
    <div
      data-contrast-inspector="audit"
      role="dialog"
      aria-label="Auditoria de contraste"
      style={{
        position: 'fixed', top: 12, right: 12, zIndex: 2147483647,
        width: 480, maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        background: 'rgba(15,23,42,0.97)', color: 'rgb(241,245,249)',
        border: '1px solid rgba(148,163,184,0.3)', borderRadius: 12,
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 11, lineHeight: 1.45,
      }}
    >
      <header style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: '1px solid rgba(148,163,184,0.2)' }}>
        {selected && (
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            style={panelBtn('rgba(168,85,247,0.9)')}
            aria-label="Voltar à lista"
          >
            ← Lista
          </button>
        )}
        <strong style={{ flex: 1 }}>
          {selected ? `Detalhe · ${selected.selector}` : `Audit${audit ? ` · ${audit.route} · ${audit.theme} · ${audit.level}` : ''}`}
        </strong>
        {!selected && <button type="button" onClick={onRescan} style={panelBtn('rgb(59,130,246)')}>Rescan</button>}
        {!selected && <button type="button" onClick={exportReport} style={panelBtn('rgb(168,85,247)')} title="Baixar relatório Markdown (rota, seletor, cor, token)">Report</button>}
        {!selected && <button type="button" onClick={exportAudit} style={panelBtn('rgb(16,185,129)')}>JSON</button>}
        <button type="button" onClick={() => { clearHighlight(); onClose(); }} style={panelBtn('rgba(30,41,59,0.6)')} aria-label="Fechar auditoria">✕</button>
      </header>

      {!audit ? (
        <div style={{ padding: 16, opacity: 0.7 }}>Escaneando…</div>
      ) : audit.violations.length === 0 ? (
        <div style={{ padding: 16 }}>✅ Nenhuma violação em <strong>{audit.scanned}</strong> elementos de texto.</div>
      ) : selected ? (
        <ViolationDetail v={selected} onApplyFix={onApplyFix} />
      ) : (
        <ListView audit={audit} onSelect={setSelectedId} />
      )}
    </div>
  );
}

function ListView({ audit, onSelect }: { audit: AuditResult; onSelect: (id: string) => void }) {
  return (
    <div style={{ overflow: 'auto', padding: '6px 8px' }}>
      <div style={{ opacity: 0.7, margin: '4px 6px 8px' }}>
        {audit.violations.length} violações em {audit.scanned} elementos · clique numa linha para detalhar
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
        <thead style={{ position: 'sticky', top: 0, background: 'rgba(15,23,42,0.95)' }}>
          <tr style={{ textAlign: 'left', opacity: 0.7 }}>
            <th style={th}>Seletor</th>
            <th style={th}>Cor → BG</th>
            <th style={th}>Token sugerido</th>
            <th style={{ ...th, textAlign: 'right' }}>Razão</th>
          </tr>
        </thead>
        <tbody>
          {audit.violations.map((v) => (
            <tr
              key={v.id}
              onClick={() => onSelect(v.id)}
              style={{ cursor: 'pointer', borderTop: '1px solid rgba(148,163,184,0.15)' }}
            >
              <td style={td}>
                <strong>{v.selector}</strong>
                <div style={{ opacity: 0.6, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {v.text || '(sem texto)'}
                </div>
              </td>
              <td style={td}>
                <span style={{ display: 'inline-block', width: 8, height: 8, background: v.color, border: '1px solid #888', marginRight: 3 }} />
                <span style={{ display: 'inline-block', width: 8, height: 8, background: v.background, border: '1px solid #888', marginRight: 4 }} />
                <span style={{ opacity: 0.7 }}>{shortColor(v.color)}/{shortColor(v.background)}</span>
              </td>
              <td style={td}>
                {v.suggestions[0] ? (
                  <strong style={{ color: 'rgb(110,231,183)' }}>{v.suggestions[0].to}</strong>
                ) : (
                  <span style={{ opacity: 0.5 }}>—</span>
                )}
              </td>
              <td style={{ ...td, textAlign: 'right' }}>
                <span style={{ padding: '1px 5px', borderRadius: 3, background: 'rgb(220,38,38)', color: 'white', fontWeight: 700 }}>
                  {v.ratio}/{v.required}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ViolationDetail({ v, onApplyFix }: { v: ContrastViolation; onApplyFix: (v: ContrastViolation) => void }) {
  return (
    <div style={{ overflow: 'auto', padding: 12 }}>
      <div style={{ marginBottom: 8, padding: 8, borderRadius: 6, background: 'rgba(168,85,247,0.18)', border: '1px solid rgba(168,85,247,0.4)' }}>
        <strong>Elemento destacado na página</strong> · highlight persistente até clicar <em>← Lista</em>.
      </div>
      <div style={{ marginBottom: 6 }}>
        <span style={{ padding: '2px 6px', borderRadius: 4, background: 'rgb(220,38,38)', color: 'white', fontWeight: 700 }}>
          {v.ratio}:1 / requer {v.required}:1{v.isLarge ? ' · large' : ''}
        </span>
      </div>
      <Row label="Seletor"><code>{v.selector}</code></Row>
      <Row label="Texto">{v.text || '(sem texto)'}</Row>
      <Row label="Cor atual">
        <span style={{ display: 'inline-block', width: 10, height: 10, background: v.color, border: '1px solid #888', marginRight: 4 }} />
        {v.color}
      </Row>
      <Row label="Background">
        <span style={{ display: 'inline-block', width: 10, height: 10, background: v.background, border: '1px solid #888', marginRight: 4 }} />
        {v.background}
      </Row>
      <Row label="Classes">
        <code style={{ background: 'rgba(148,163,184,0.18)', padding: '0 4px', borderRadius: 3, wordBreak: 'break-all' }}>{v.classes || '—'}</code>
      </Row>
      {v.suggestions.length > 0 ? (
        <div style={{ marginTop: 8, padding: 8, borderRadius: 6, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)' }}>
          <div style={{ opacity: 0.85, marginBottom: 4 }}>Sugestões de token semântico:</div>
          {v.suggestions.map((s, i) => (
            <div key={i} style={{ marginBottom: 4 }}>
              <code>{s.from}</code> → <strong>{s.to}</strong>
              <div style={{ opacity: 0.65, fontSize: 10 }}>{s.rationale}</div>
            </div>
          ))}
          <button type="button" onClick={() => onApplyFix(v)} style={{ ...panelBtn('rgb(16,185,129)'), marginTop: 6, width: '100%' }}>
            Aplicar fix · copiar patch
          </button>
        </div>
      ) : (
        <div style={{ marginTop: 8, opacity: 0.7 }}>
          Sem sugestão automática — a cor pode vir de CSS global, gradient ou inline style.
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 4 }}>
      <span style={{ opacity: 0.6 }}>{label}:</span> {children}
    </div>
  );
}

function renderReportMarkdown(a: AuditResult): string {
  const lines: string[] = [];
  lines.push(`# Contrast report — ${a.route} · ${a.theme} · ${a.level}`);
  lines.push(`Generated at ${a.capturedAt} · ${a.violations.length} violações em ${a.scanned} elementos`);
  lines.push('');
  lines.push('| Rota | Seletor | Cor atual | Background | Token recomendado | Razão | Texto |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- |');
  for (const v of a.violations) {
    const token = v.suggestions[0]?.to ?? '—';
    const text = (v.text || '').replace(/\|/g, '\\|').slice(0, 60);
    lines.push(`| ${a.route} | \`${v.selector}\` | ${v.color} | ${v.background} | **${token}** | ${v.ratio}:1 / ${v.required}:1 | ${text} |`);
  }
  return lines.join('\n');
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

const th: React.CSSProperties = { padding: '4px 6px', fontWeight: 600 };
const td: React.CSSProperties = { padding: '6px', verticalAlign: 'top' };
function safe(s: string) { return s.replace(/[^a-z0-9]+/gi, '_') || 'root'; }
function shortColor(c: string) { return c.replace(/^rgba?\(/, '').replace(/\)$/, '').replace(/\s/g, ''); }


function panelBtn(bg: string): React.CSSProperties {
  return {
    padding: '4px 8px',
    borderRadius: 6,
    border: '1px solid rgba(148,163,184,0.3)',
    background: bg,
    color: 'white',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 11,
    fontWeight: 600,
  };
}

