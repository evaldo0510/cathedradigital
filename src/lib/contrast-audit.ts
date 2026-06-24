/**
 * Page-wide contrast audit + semantic-token suggestions.
 *
 * Used by the dev overlay's audit mode to list every text element on the
 * current page whose computed color/background combination falls below the
 * WCAG threshold the user has selected, and to propose a semantic Tailwind
 * token replacement for the most common hardcoded color classes.
 *
 * The auto-fix only mutates the live DOM element. The exported snippet lets
 * the developer apply the same change at the source.
 */

import { contrastConfig, requiredRatio, type WcagLevel, type LargeMode } from './contrast-config';

export type AuditSettings = {
  level: WcagLevel;
  largeMode: LargeMode;
  /** Maximum number of nodes to inspect to keep the audit responsive on large pages. */
  maxNodes?: number;
};

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

function hasOwnText(el: Element): boolean {
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE && (node.nodeValue || '').trim().length > 0) return true;
  }
  return false;
}

function shortSelector(el: Element): string {
  const tag = el.tagName.toLowerCase();
  if (el.id) return `${tag}#${el.id}`;
  const cls = (el.getAttribute('class') || '').trim().split(/\s+/).slice(0, 2).join('.');
  return cls ? `${tag}.${cls}` : tag;
}

// ---------- semantic-token suggestion engine ----------

/**
 * Map of hardcoded Tailwind utility classes (or arbitrary [#...]/rgb values)
 * to the recommended semantic token. The replacement is conservative: it only
 * rewrites a class when the offending one is clearly a hardcoded color.
 */
const CLASS_REPLACEMENTS: Array<{ test: RegExp; replacement: string; rationale: string }> = [
  // Foreground tokens
  { test: /^text-gray-(900|800|950)$/, replacement: 'text-foreground', rationale: 'Texto primário → token foreground' },
  { test: /^text-(black|slate-900|zinc-900|neutral-900|stone-900)$/, replacement: 'text-foreground', rationale: 'Texto preto → token foreground (cobre dark mode)' },
  { test: /^text-(white|gray-50|slate-50)$/, replacement: 'text-primary-foreground', rationale: 'Texto branco → primary-foreground se sobre primário' },
  { test: /^text-gray-(400|500|600|700)$/, replacement: 'text-muted-foreground', rationale: 'Cinza médio → token muted-foreground' },
  { test: /^text-(slate|zinc|neutral|stone)-(400|500|600|700)$/, replacement: 'text-muted-foreground', rationale: 'Escala cinza → token muted-foreground' },
  { test: /^text-gray-(100|200|300)$/, replacement: 'text-muted-foreground', rationale: 'Cinza claro tem contraste insuficiente em light mode' },
  // Arbitrary hex/rgb on text — always a violation of the system.
  { test: /^text-\[#?[0-9a-fA-F]{3,8}\]$/, replacement: 'text-foreground', rationale: 'Valor cru deve virar token semântico (foreground/muted-foreground/primary)' },
  { test: /^text-\[rgb/, replacement: 'text-foreground', rationale: 'rgb() arbitrário deve virar token semântico' },
  // Backgrounds
  { test: /^bg-(white|gray-50|slate-50)$/, replacement: 'bg-background', rationale: 'Branco → token background' },
  { test: /^bg-(black|slate-900|zinc-900)$/, replacement: 'bg-foreground', rationale: 'Preto → token foreground (inverte em dark)' },
  { test: /^bg-\[#?[0-9a-fA-F]{3,8}\]$/, replacement: 'bg-background', rationale: 'Hex cru → token background/muted/card' },
];

export type TokenSuggestion = {
  from: string;
  to: string;
  rationale: string;
};

export function suggestTokenReplacements(classNames: string): TokenSuggestion[] {
  const tokens = classNames.split(/\s+/).filter(Boolean);
  const out: TokenSuggestion[] = [];
  for (const t of tokens) {
    for (const rule of CLASS_REPLACEMENTS) {
      if (rule.test.test(t)) {
        out.push({ from: t, to: rule.replacement, rationale: rule.rationale });
        break;
      }
    }
  }
  return out;
}

export function applyTokenFixToElement(el: Element, suggestions: TokenSuggestion[]): { before: string; after: string } {
  const before = el.getAttribute('class') || '';
  const tokens = before.split(/\s+/).filter(Boolean);
  const next: string[] = [];
  const replaceMap = new Map(suggestions.map((s) => [s.from, s.to]));
  for (const t of tokens) {
    if (replaceMap.has(t)) {
      const r = replaceMap.get(t)!;
      if (r && !next.includes(r)) next.push(r);
    } else {
      next.push(t);
    }
  }
  const after = next.join(' ');
  el.setAttribute('class', after);
  return { before, after };
}

// ---------- violation scan ----------

export type ContrastViolation = {
  id: string;
  selector: string;
  tag: string;
  text: string;
  classes: string;
  color: string;
  background: string;
  ratio: number;
  required: number;
  isLarge: boolean;
  suggestions: TokenSuggestion[];
  ref: { deref(): Element | undefined };
};

export type AuditResult = {
  capturedAt: string;
  route: string;
  theme: 'light' | 'dark';
  level: WcagLevel;
  scanned: number;
  violations: ContrastViolation[];
};

const TEXT_HOSTS = 'h1,h2,h3,h4,h5,h6,p,span,a,button,li,dt,dd,label,small,strong,em,code,figcaption,th,td,blockquote,summary';

export function scanPageForContrastViolations(settings: AuditSettings): AuditResult {
  const maxNodes = settings.maxNodes ?? Math.max(200, contrastConfig.maxNodesPerSelector * 20);
  const denyClause = contrastConfig.denySelectors.map((s) => `:not(${s})`).join('');
  const all = Array.from(document.querySelectorAll(TEXT_HOSTS));
  const violations: ContrastViolation[] = [];
  let scanned = 0;
  for (const el of all) {
    if (scanned >= maxNodes) break;
    if (!hasOwnText(el)) continue;
    if (denyClause && !el.matches(`*${denyClause}`)) continue;
    if ((el as HTMLElement).closest('[data-contrast-inspector]')) continue;
    scanned++;

    const cs = getComputedStyle(el);
    const fg = parseColor(cs.color);
    if (!fg) continue;
    const bg = effectiveBackground(el);
    const ratio = Math.round(contrastRatio(fg, bg) * 100) / 100;
    const fontSize = parseFloat(cs.fontSize) || 16;
    const fontWeight = parseInt(cs.fontWeight, 10) || 400;
    const autoLarge = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
    const isLarge =
      settings.largeMode === 'large' ? true : settings.largeMode === 'normal' ? false : autoLarge;
    const required = requiredRatio(isLarge, settings.level);
    if (ratio >= required) continue;

    const classes = el.getAttribute('class') || '';
    violations.push({
      id: `${shortSelector(el)}#${violations.length}`,
      selector: shortSelector(el),
      tag: el.tagName.toLowerCase(),
      text: ((el as HTMLElement).innerText || '').slice(0, 80).replace(/\s+/g, ' ').trim(),
      classes,
      color: `rgb(${fg.r}, ${fg.g}, ${fg.b})`,
      background: `rgb(${bg.r}, ${bg.g}, ${bg.b})`,
      ratio,
      required,
      isLarge,
      suggestions: suggestTokenReplacements(classes),
      ref: (typeof (globalThis as { WeakRef?: unknown }).WeakRef === 'function'
        ? new (globalThis as unknown as { WeakRef: new (t: Element) => { deref(): Element | undefined } }).WeakRef(el)
        : { deref: () => el }),
    });
  }
  return {
    capturedAt: new Date().toISOString(),
    route: typeof window !== 'undefined' ? window.location.pathname : '/',
    theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    level: settings.level,
    scanned,
    violations,
  };
}
