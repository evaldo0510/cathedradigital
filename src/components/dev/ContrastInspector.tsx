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
import { contrastConfig, getEffectiveConfigSnapshot } from '@/lib/contrast-config';

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
  const lastTargetRef = useRef<Element | null>(null);
  const settingsRef = useRef<InspectorSettings>(settings);
  settingsRef.current = settings;

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

          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button
              type="button"
              onClick={() => { setSettingsState(DEFAULT_SETTINGS); writeSettings(DEFAULT_SETTINGS); }}
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
    </>
  );
}
