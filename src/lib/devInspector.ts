/**
 * Dev-only DOM inspector.
 * Toggle with Ctrl/Cmd + Shift + I. ESC to exit. L to fixar.
 */

export type FiberSource = { fileName?: string; lineNumber?: number; columnNumber?: number };
export type MatchedRule = {
  selector: string;
  specificity: [number, number, number];
  origin: string;
  originKind: "inline" | "style-tag" | "stylesheet" | "shadow";
  selectorKind: "id" | "class" | "tag" | "mixed";
  cssText: string;
  declarations: Record<string, string>;
};
export type Conflict = {
  prop: string;
  winner: MatchedRule;
  losers: MatchedRule[];
};
export type CssVarUsage = {
  name: string;            // --foo
  resolved: string;        // computed value
  usedIn: string[];        // CSS props in winners that reference it
  fromSelector: string | null;   // selector that defines the var
  fromOrigin: string | null;     // origin label
  fromElement: string | null;    // tag/path of ancestor providing it
};
export type LogEntry = {
  ts: string;
  route: string;
  component: string | null;
  source: string | null;
  selector: string;
  domPath: string;
  classes: string;
  size: { w: number; h: number };
  viewport: { w: number; h: number; dpr: number; breakpoint: string };
  styles: Record<string, string>;
  matchedRules: MatchedRule[];
  conflicts: Conflict[];
  cssVars: CssVarUsage[];
  outerHTML: string;
  inShadow: boolean;
};
export type Filters = {
  origin: "all" | "inline" | "style-tag" | "stylesheet" | "shadow";
  selectorKind: "all" | "id" | "class" | "tag" | "mixed";
  file: string;
};
export type SessionState = {
  logs: LogEntry[];
  filters: Filters;
  locked: boolean;
};

export const STORAGE_KEY = "cathedra_inspector_session_v1";

export const DEFAULT_FILTERS: Filters = { origin: "all", selectorKind: "all", file: "all" };

export function loadSession(storage: Storage = localStorage): SessionState {
  const fallback: SessionState = { logs: [], filters: { ...DEFAULT_FILTERS }, locked: false };
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
      filters: { ...DEFAULT_FILTERS, ...(parsed.filters || {}) },
      locked: !!parsed.locked,
    };
  } catch {
    return fallback;
  }
}

export function saveSession(state: SessionState, storage: Storage = localStorage): void {
  try {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ logs: state.logs.slice(-50), filters: state.filters, locked: state.locked }),
    );
  } catch {
    /* noop */
  }
}

function getFiberFromNode(node: Element): any | null {
  const key = Object.keys(node).find(
    (k) => k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$"),
  );
  return key ? (node as any)[key] : null;
}

function findSource(fiber: any): { source: FiberSource | null; name: string | null } {
  let current = fiber;
  while (current) {
    const src: FiberSource | undefined = current._debugSource;
    const owner = current._debugOwner;
    if (src) {
      const name =
        typeof current.type === "string"
          ? current.type
          : current.type?.displayName || current.type?.name || owner?.type?.name || null;
      return { source: src, name };
    }
    current = current.return;
  }
  return { source: null, name: null };
}

function cssSelector(el: Element): string {
  if (el.id) return `#${CSS.escape(el.id)}`;
  const parts: string[] = [];
  let cur: Element | null = el;
  while (cur && cur.nodeType === 1 && parts.length < 5) {
    let s = cur.tagName.toLowerCase();
    if (cur.id) { parts.unshift(`${s}#${CSS.escape(cur.id)}`); break; }
    if (cur.className && typeof cur.className === "string") {
      const cls = cur.className.trim().split(/\s+/).slice(0, 2).map((c) => CSS.escape(c)).join(".");
      if (cls) s += "." + cls;
    }
    const parent = cur.parentElement;
    if (parent) {
      const idx = Array.from(parent.children).indexOf(cur) + 1;
      s += `:nth-child(${idx})`;
    }
    parts.unshift(s);
    cur = cur.parentElement;
  }
  return parts.join(" > ");
}

/**
 * DOM path with Shadow DOM awareness — when we cross a ShadowRoot boundary we
 * mark it as `::shadow` and continue from the shadow host.
 */
export function domPath(el: Element): string {
  const parts: string[] = [];
  let cur: Node | null = el;
  let safety = 0;
  while (cur && cur.nodeType === 1 && safety++ < 20) {
    const e = cur as Element;
    let s = e.tagName.toLowerCase();
    if (e.id) s += `#${e.id}`;
    else if (e.className && typeof e.className === "string")
      s += "." + e.className.trim().split(/\s+/).slice(0, 2).join(".");
    parts.unshift(s);
    if (e.parentElement) {
      cur = e.parentElement;
    } else {
      const root = e.getRootNode();
      if (root instanceof ShadowRoot) {
        parts.unshift("::shadow");
        cur = root.host;
      } else {
        cur = null;
      }
    }
  }
  return parts.join(" > ");
}

function pickStyles(el: Element): Record<string, string> {
  const cs = window.getComputedStyle(el);
  const keys = ["font-family","font-size","font-weight","line-height","letter-spacing","color","padding","margin","text-transform","border-top-width","border-top-style","border-top-color"];
  const out: Record<string, string> = {};
  for (const k of keys) out[k] = cs.getPropertyValue(k).trim();
  return out;
}

/** Scans matched-rule cssText for var(--x) refs and walks ancestors to find the declarer. */
export function extractCssVars(el: Element, rules: MatchedRule[]): CssVarUsage[] {
  const usage = new Map<string, Set<string>>(); // varName -> set of props using it
  const re = /var\(\s*(--[\w-]+)/g;
  for (const r of rules) {
    for (const [prop, val] of Object.entries(r.declarations)) {
      let m: RegExpExecArray | null;
      const local = new RegExp(re.source, "g");
      while ((m = local.exec(val))) {
        if (!usage.has(m[1])) usage.set(m[1], new Set());
        usage.get(m[1])!.add(prop);
      }
    }
  }
  if (!usage.size) return [];
  const out: CssVarUsage[] = [];
  for (const [name, props] of usage) {
    const resolved = window.getComputedStyle(el).getPropertyValue(name).trim();
    let fromSelector: string | null = null;
    let fromOrigin: string | null = null;
    let fromElement: string | null = null;
    // Walk ancestors (including el) looking for a matched rule that declares the var
    let cur: Element | null = el;
    outer: while (cur) {
      const ruleSet = getMatchedRules(cur);
      for (const r of ruleSet) {
        if (name in r.declarations) {
          fromSelector = r.selector;
          fromOrigin = r.origin;
          fromElement = cur.tagName.toLowerCase() + (cur.id ? `#${cur.id}` : cur.className && typeof cur.className === "string" ? "." + cur.className.trim().split(/\s+/)[0] : "");
          break outer;
        }
      }
      cur = cur.parentElement;
    }
    if (!fromSelector) {
      // Fallback: :root via documentElement computed style
      const rootVal = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      if (rootVal) { fromSelector = ":root"; fromOrigin = "computed"; fromElement = "html"; }
    }
    out.push({ name, resolved, usedIn: Array.from(props), fromSelector, fromOrigin, fromElement });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

function specificity(selector: string): [number, number, number] {
  const s = selector.replace(/\/\*.*?\*\//g, "").trim();
  const ids = (s.match(/#[\w-]+/g) || []).length;
  const classes = (s.match(/\.[\w-]+/g) || []).length;
  const attrs = (s.match(/\[[^\]]+\]/g) || []).length;
  const pseudoClasses = (s.match(/:(?!:)[\w-]+(\([^)]*\))?/g) || []).length;
  const pseudoElements = (s.match(/::[\w-]+/g) || []).length;
  const tags = (s.match(/(^|[\s>+~])([a-zA-Z][\w-]*)/g) || []).length;
  return [ids, classes + attrs + pseudoClasses, tags + pseudoElements];
}

function classifySelector(sel: string): "id" | "class" | "tag" | "mixed" {
  const hasId = /#[\w-]+/.test(sel);
  const hasClass = /\.[\w-]+/.test(sel);
  const hasTag = /(^|[\s>+~])[a-zA-Z]/.test(sel);
  const types = [hasId, hasClass, hasTag].filter(Boolean).length;
  if (types > 1) return "mixed";
  if (hasId) return "id";
  if (hasClass) return "class";
  return "tag";
}

function ruleOrigin(sheet: CSSStyleSheet, fromShadow: boolean): { label: string; kind: MatchedRule["originKind"] } {
  if (fromShadow) return { label: "shadow-root", kind: "shadow" };
  if (sheet.href) {
    try { return { label: new URL(sheet.href).pathname.split("/").pop() || sheet.href, kind: "stylesheet" }; }
    catch { return { label: sheet.href, kind: "stylesheet" }; }
  }
  return { label: "<style>", kind: "style-tag" };
}

function parseDeclarations(cssText: string): Record<string, string> {
  const out: Record<string, string> = {};
  cssText.split(";").forEach((d) => {
    const idx = d.indexOf(":");
    if (idx === -1) return;
    const k = d.slice(0, idx).trim();
    const v = d.slice(idx + 1).trim();
    if (k) out[k] = v;
  });
  return out;
}

function collectSheetsFor(el: Element): Array<{ sheet: CSSStyleSheet; fromShadow: boolean }> {
  const sheets: Array<{ sheet: CSSStyleSheet; fromShadow: boolean }> = [];
  for (const s of Array.from(document.styleSheets) as CSSStyleSheet[]) sheets.push({ sheet: s, fromShadow: false });
  const root = el.getRootNode();
  if (root instanceof ShadowRoot) {
    for (const s of Array.from(root.styleSheets) as CSSStyleSheet[]) sheets.push({ sheet: s, fromShadow: true });
    // adoptedStyleSheets (Constructable)
    const adopted = (root as any).adoptedStyleSheets as CSSStyleSheet[] | undefined;
    if (Array.isArray(adopted)) for (const s of adopted) sheets.push({ sheet: s, fromShadow: true });
  }
  return sheets;
}

function getMatchedRules(el: Element): MatchedRule[] {
  const out: MatchedRule[] = [];
  const inline = (el as HTMLElement).style?.cssText;
  if (inline) {
    out.push({
      selector: 'style="..."',
      specificity: [1, 0, 0],
      origin: "inline",
      originKind: "inline",
      selectorKind: "id",
      cssText: inline,
      declarations: parseDeclarations(inline),
    });
  }
  for (const { sheet, fromShadow } of collectSheetsFor(el)) {
    let rules: CSSRuleList | null = null;
    try { rules = sheet.cssRules; } catch { continue; }
    if (!rules) continue;
    walkRules(rules, sheet, el, out, fromShadow);
    if (out.length > 300) break;
  }
  out.sort((a, b) => {
    for (let i = 0; i < 3; i++) if (b.specificity[i] !== a.specificity[i]) return b.specificity[i] - a.specificity[i];
    return 0;
  });
  return out.slice(0, 80);
}

function walkRules(rules: CSSRuleList, sheet: CSSStyleSheet, el: Element, out: MatchedRule[], fromShadow: boolean) {
  const origin = ruleOrigin(sheet, fromShadow);
  for (const rule of Array.from(rules)) {
    if (rule instanceof CSSStyleRule) {
      const selectorText = rule.selectorText;
      for (const sel of selectorText.split(",").map((s) => s.trim())) {
        const cleaned = sel.replace(/::[\w-]+$/, "").trim() || "*";
        try {
          if (el.matches(cleaned)) {
            out.push({
              selector: sel,
              specificity: specificity(sel),
              origin: origin.label,
              originKind: origin.kind,
              selectorKind: classifySelector(sel),
              cssText: rule.style.cssText,
              declarations: parseDeclarations(rule.style.cssText),
            });
            break;
          }
        } catch { /* invalid selector */ }
      }
    } else if ((rule as CSSGroupingRule).cssRules) {
      walkRules((rule as CSSGroupingRule).cssRules, sheet, el, out, fromShadow);
    }
  }
}

function detectConflicts(rules: MatchedRule[]): Conflict[] {
  const props = ["font-size", "line-height", "padding", "padding-top", "padding-right", "padding-bottom", "padding-left", "margin", "color", "font-weight", "font-family"];
  const conflicts: Conflict[] = [];
  for (const prop of props) {
    const declarers = rules.filter((r) => prop in r.declarations);
    if (declarers.length < 2) continue;
    const uniqueValues = new Set(declarers.map((r) => r.declarations[prop]));
    if (uniqueValues.size < 2) continue;
    conflicts.push({ prop, winner: declarers[0], losers: declarers.slice(1) });
  }
  return conflicts;
}

function getViewportInfo() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const bp = w < 640 ? "xs" : w < 768 ? "sm" : w < 1024 ? "md" : w < 1280 ? "lg" : w < 1536 ? "xl" : "2xl";
  return { w, h, dpr: window.devicePixelRatio || 1, breakpoint: bp };
}

/** Pierces shadow boundaries using composedPath() to find deepest element under the pointer. */
function elementFromEvent(e: MouseEvent): Element | null {
  const path = (e.composedPath?.() ?? []) as EventTarget[];
  for (const t of path) {
    if (t instanceof Element) return t;
  }
  return document.elementFromPoint(e.clientX, e.clientY);
}

export function initDevInspector() {
  if (typeof window === "undefined") return;

  const saved = loadSession();
  const logs: LogEntry[] = saved.logs;
  const filters: Filters = saved.filters;
  let locked = saved.locked;
  let lockedEntry: LogEntry | null = logs.length && locked ? logs[logs.length - 1] : null;
  let lockedEl: Element | null = null;

  let active = false;
  let highlight: HTMLDivElement | null = null;
  let hoverLabel: HTMLDivElement | null = null;
  let panel: HTMLDivElement | null = null;

  // Compare mode
  let compareMode = false;
  let compareA: { entry: LogEntry; el: Element } | null = null;
  let compareB: { entry: LogEntry; el: Element } | null = null;

  // Winners panel UI state (search + category)
  type WinnerCat = "all" | "typography" | "cssvars" | "color" | "border";
  let winnersQuery = "";
  let winnersCategory: WinnerCat = "all";

  function categoryOf(prop: string): Exclude<WinnerCat, "all" | "cssvars"> | "other" {
    if (/^(font|line-height|letter-spacing|text-|white-space|word-|writing-)/.test(prop)) return "typography";
    if (/(^color$|background|fill|stroke|caret-color|accent-color)/.test(prop)) return "color";
    if (/^(border|outline|box-shadow|border-radius)/.test(prop)) return "border";
    return "other";
  }

  function computeWinners(rules: MatchedRule[]) {
    const seen = new Set<string>();
    const winners: Array<{ prop: string; value: string; selector: string; origin: string; cat: ReturnType<typeof categoryOf> }> = [];
    for (const r of rules) {
      for (const prop of Object.keys(r.declarations)) {
        if (seen.has(prop)) continue;
        seen.add(prop);
        winners.push({ prop, value: r.declarations[prop], selector: r.selector, origin: r.origin, cat: categoryOf(prop) });
      }
    }
    return winners;
  }


  function persist() { saveSession({ logs, filters, locked }); }

  function ensureOverlay() {
    if (highlight) return;
    highlight = document.createElement("div");
    Object.assign(highlight.style, {
      position: "fixed", pointerEvents: "none", zIndex: "2147483645",
      border: "2px solid #C8A96A", background: "rgba(200,169,106,0.10)",
      borderRadius: "3px", transition: "all 60ms linear", display: "none",
      boxShadow: "0 0 0 1px rgba(11,31,58,0.6)",
    } as CSSStyleDeclaration);
    hoverLabel = document.createElement("div");
    Object.assign(hoverLabel.style, {
      position: "fixed", pointerEvents: "none", zIndex: "2147483646",
      background: "#0B1F3A", color: "#fff", font: "11px/1.4 ui-monospace,monospace",
      padding: "3px 7px", borderRadius: "3px", whiteSpace: "nowrap",
      display: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    } as CSSStyleDeclaration);
    document.body.appendChild(highlight);
    document.body.appendChild(hoverLabel);
  }

  function hideHover() {
    if (highlight) highlight.style.display = "none";
    if (hoverLabel) hoverLabel.style.display = "none";
  }

  function moveHighlight(el: Element) {
    ensureOverlay();
    const r = el.getBoundingClientRect();
    highlight!.style.display = "block";
    highlight!.style.left = `${r.left}px`;
    highlight!.style.top = `${r.top}px`;
    highlight!.style.width = `${r.width}px`;
    highlight!.style.height = `${r.height}px`;
    highlight!.style.borderColor = locked ? "#ef4444" : compareMode ? "#3b82f6" : "#C8A96A";
    hoverLabel!.style.display = "block";
    const tag = el.tagName.toLowerCase();
    const prefix = locked ? "🔒 " : compareMode ? `⇄ ${compareA ? "B" : "A"} · ` : "";
    hoverLabel!.textContent = `${prefix}${tag} · ${Math.round(r.width)}×${Math.round(r.height)}`;
    const top = r.top - 22 < 4 ? r.bottom + 4 : r.top - 22;
    hoverLabel!.style.left = `${Math.max(4, r.left)}px`;
    hoverLabel!.style.top = `${top}px`;
  }

  function onMove(e: MouseEvent) {
    if (!active) return;
    if (locked && lockedEl) { moveHighlight(lockedEl); return; }
    const el = elementFromEvent(e);
    if (!el || el === highlight || el === hoverLabel || (panel && panel.contains(el))) return;
    moveHighlight(el);
  }

  function buildEntry(el: Element): LogEntry {
    const fiber = getFiberFromNode(el);
    const { source, name } = fiber ? findSource(fiber) : { source: null, name: null };
    const r = el.getBoundingClientRect();
    const srcStr = source
      ? `src/${source.fileName?.split("/src/").pop() ?? source.fileName}:${source.lineNumber}:${source.columnNumber ?? 0}`
      : null;
    const matchedRules = getMatchedRules(el);
    return {
      ts: new Date().toISOString(),
      route: window.location.pathname,
      component: name,
      source: srcStr,
      selector: cssSelector(el),
      domPath: domPath(el),
      classes: (el.getAttribute("class") || "").trim(),
      size: { w: Math.round(r.width), h: Math.round(r.height) },
      viewport: getViewportInfo(),
      styles: pickStyles(el),
      matchedRules,
      conflicts: detectConflicts(matchedRules),
      cssVars: extractCssVars(el, matchedRules),
      outerHTML: el.outerHTML.slice(0, 50000),
      inShadow: el.getRootNode() instanceof ShadowRoot,
    };
  }

  function applyFilters(rules: MatchedRule[]): MatchedRule[] {
    return rules.filter((r) => {
      if (filters.origin !== "all" && r.originKind !== filters.origin) return false;
      if (filters.selectorKind !== "all" && r.selectorKind !== filters.selectorKind) return false;
      if (filters.file !== "all" && r.origin !== filters.file) return false;
      return true;
    });
  }

  function ensurePanel() {
    if (panel) return;
    panel = document.createElement("div");
    Object.assign(panel.style, {
      position: "fixed", right: "12px", top: "12px", width: "440px",
      maxHeight: "calc(100vh - 24px)", overflow: "auto", zIndex: "2147483647",
      background: "#0B1F3A", color: "#fff",
      font: "12px/1.45 ui-monospace,SFMono-Regular,monospace",
      padding: "12px 14px", borderRadius: "8px",
      boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
      border: "1px solid rgba(200,169,106,0.4)",
    } as CSSStyleDeclaration);
    document.body.appendChild(panel);
  }

  function renderPanel(entry: LogEntry, el: Element) {
    ensurePanel();
    const filteredRules = applyFilters(entry.matchedRules);
    const files = Array.from(new Set(entry.matchedRules.map((r) => r.origin)));
    const stylesRows = Object.entries(entry.styles)
      .map(([k, v]) => `<tr><td style="opacity:.6;padding-right:8px">${k}</td><td>${escapeHtml(v)}</td></tr>`)
      .join("");
    const conflictsBlock = entry.conflicts.length
      ? entry.conflicts.map((c) => `
        <div style="margin-top:6px;padding:6px 8px;background:rgba(239,68,68,0.10);border-left:2px solid #ef4444;border-radius:0 4px 4px 0">
          <div style="font-size:11px;color:#fca5a5"><strong>${escapeHtml(c.prop)}</strong> · ${c.losers.length + 1} regras conflitantes</div>
          <div style="margin-top:4px;font-size:11px"><span style="color:#86efac">✓ winner</span> <code style="color:#C8A96A">${escapeHtml(c.winner.selector)}</code> → ${escapeHtml(c.winner.declarations[c.prop])} <span style="opacity:.6">(${escapeHtml(c.winner.origin)})</span></div>
          ${c.losers.map((l) => `<div style="font-size:11px;opacity:.75"><span style="color:#fca5a5">✗ loser</span> <code>${escapeHtml(l.selector)}</code> → ${escapeHtml(l.declarations[c.prop])} <span style="opacity:.6">(${escapeHtml(l.origin)})</span></div>`).join("")}
        </div>`).join("")
      : '<div style="opacity:.5;font-size:11px">Nenhum conflito detectado nas propriedades comuns.</div>';

    const cascadeRows = filteredRules.length
      ? filteredRules.map((r, i) => `
          <div style="margin-top:6px;padding:6px 8px;border-left:2px solid #C8A96A;background:rgba(255,255,255,0.04);border-radius:0 4px 4px 0">
            <div style="display:flex;justify-content:space-between;gap:8px;font-size:10px;opacity:.7">
              <span>#${i + 1} · spec ${r.specificity.join(",")} · ${r.originKind} · ${r.selectorKind}</span>
              <span>${escapeHtml(r.origin)}</span>
            </div>
            <div style="color:#C8A96A;word-break:break-all">${escapeHtml(r.selector)}</div>
            <div style="opacity:.85;word-break:break-all;font-size:11px">${escapeHtml(r.cssText)}</div>
          </div>`).join("")
      : '<div style="opacity:.5;font-size:11px">Nenhuma regra com os filtros atuais.</div>';

    const vp = entry.viewport;
    const sel = (val: string, opts: string[], key: string) =>
      `<select data-filter="${key}" style="background:#0B1F3A;color:#fff;border:1px solid rgba(200,169,106,0.4);border-radius:4px;padding:2px 4px;font:10px ui-monospace,monospace">${opts.map((o) => `<option ${o === val ? "selected" : ""} value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join("")}</select>`;

    panel!.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:8px">
        <strong style="color:#C8A96A;font-size:11px;letter-spacing:.15em;text-transform:uppercase">Inspector ${locked ? "🔒" : ""}${entry.inShadow ? " · shadow" : ""}</strong>
        <div style="display:flex;gap:4px;flex-wrap:wrap">
          <button data-act="lock" style="${btn()}">${locked ? "Desafixar" : "Fixar"}</button>
          <button data-act="compare" style="${btn()}">${compareMode ? "Sair cmp" : "Comparar"}</button>
          <button data-act="package" style="${btn(true)}" title="P">📎 Pacote</button>
          <button data-act="copy" style="${btn()}">Copiar</button>
          <button data-act="html" style="${btn()}">HTML</button>
          <button data-act="winners" style="${btn()}">Winners</button>
          <button data-act="cascade" style="${btn()}" title="Cascata completa">Cascade</button>
          <button data-act="export" style="${btn()}">NDJSON</button>
          <button data-act="clear" style="${btn()}">Limpar</button>
          <button data-act="close" style="${btn()}">×</button>
        </div>
      </div>
      <div style="font-size:11px;opacity:.6">${escapeHtml(entry.route)} · elem ${entry.size.w}×${entry.size.h}px · vp ${vp.w}×${vp.h} · ${vp.breakpoint} · dpr ${vp.dpr}</div>

      <div style="margin-top:6px;padding:5px 7px;background:rgba(200,169,106,0.08);border:1px dashed rgba(200,169,106,0.35);border-radius:4px;font-size:10px;opacity:.9;display:flex;gap:8px;flex-wrap:wrap">
        <span><kbd style="${kbd()}">F</kbd> Fixar</span>
        <span><kbd style="${kbd()}">C</kbd> Comparar</span>
        <span><kbd style="${kbd()}">P</kbd> Pacote</span>
        <span><kbd style="${kbd()}">Esc</kbd> Sair / cancelar Comparar</span>
        <span style="opacity:.7"><kbd style="${kbd()}">Ctrl/Cmd</kbd>+<kbd style="${kbd()}">Shift</kbd>+<kbd style="${kbd()}">I</kbd> liga/desliga</span>
      </div>

      <div style="margin-top:8px"><span style="color:#C8A96A">${escapeHtml(entry.component || el.tagName.toLowerCase())}</span></div>
      ${entry.source ? `<div style="opacity:.85;margin-top:2px">${escapeHtml(entry.source)}</div>` : '<div style="opacity:.5;margin-top:2px">sem _debugSource</div>'}
      <div style="margin-top:10px"><div style="opacity:.5;font-size:10px;text-transform:uppercase;letter-spacing:.1em">Seletor</div><div style="word-break:break-all">${escapeHtml(entry.selector)}</div></div>
      <div style="margin-top:8px"><div style="opacity:.5;font-size:10px;text-transform:uppercase;letter-spacing:.1em">DOM path</div><div style="word-break:break-all">${escapeHtml(entry.domPath)}</div></div>

      <div style="margin-top:10px"><div style="opacity:.5;font-size:10px;text-transform:uppercase;letter-spacing:.1em">Conflitos CSS</div>${conflictsBlock}</div>

      <div style="margin-top:10px"><div style="opacity:.5;font-size:10px;text-transform:uppercase;letter-spacing:.1em">Estilos computados</div>
        <table style="width:100%;margin-top:4px;border-collapse:collapse">${stylesRows}</table>
      </div>

      <div style="margin-top:10px"><div style="opacity:.5;font-size:10px;text-transform:uppercase;letter-spacing:.1em">CSS Variables (var(--…))</div>
        ${entry.cssVars.length ? entry.cssVars.map((v) => `
          <div style="margin-top:4px;padding:5px 7px;background:rgba(255,255,255,0.04);border-left:2px solid #3b82f6;border-radius:0 4px 4px 0;font-size:11px">
            <div><code style="color:#93c5fd">${escapeHtml(v.name)}</code> → <span style="color:#C8A96A">${escapeHtml(v.resolved || "(vazio)")}</span></div>
            <div style="opacity:.65;font-size:10px">usada em: ${v.usedIn.map(escapeHtml).join(", ")}</div>
            <div style="opacity:.65;font-size:10px">origem: <code>${escapeHtml(v.fromSelector || "?")}</code> @ ${escapeHtml(v.fromOrigin || "?")} (${escapeHtml(v.fromElement || "?")})</div>
          </div>`).join("") : '<div style="opacity:.5;font-size:11px">Nenhuma var(--…) usada pelas regras vencedoras.</div>'}
      </div>

      ${renderWinnersBlock(entry)}

      <div style="margin-top:10px">
        <div style="opacity:.5;font-size:10px;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px">Cascata CSS · filtros</div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px">
          <label style="font-size:10px;opacity:.7">origem ${sel(filters.origin, ["all","inline","style-tag","stylesheet","shadow"], "origin")}</label>
          <label style="font-size:10px;opacity:.7">tipo ${sel(filters.selectorKind, ["all","id","class","tag","mixed"], "selectorKind")}</label>
          <label style="font-size:10px;opacity:.7">arquivo ${sel(filters.file, ["all", ...files], "file")}</label>
        </div>
        ${cascadeRows}
      </div>
      <div style="margin-top:10px;opacity:.5;font-size:10px">logs: ${logs.length} · sessão salva em localStorage</div>
    `;


    panel!.querySelectorAll("[data-filter]").forEach((s) => {
      s.addEventListener("change", (e) => {
        const t = e.target as HTMLSelectElement;
        const key = t.getAttribute("data-filter") as keyof Filters;
        (filters as any)[key] = t.value;
        persist();
        renderPanel(entry, el);
      });
    });
    panel!.querySelector('[data-act="close"]')?.addEventListener("click", () => { panel?.remove(); panel = null; });
    panel!.querySelector('[data-act="copy"]')?.addEventListener("click", () => copyEntry(entry));
    panel!.querySelector('[data-act="package"]')?.addEventListener("click", () => copyPackage(entry));
    panel!.querySelector('[data-act="export"]')?.addEventListener("click", exportNDJSON);
    panel!.querySelector('[data-act="html"]')?.addEventListener("click", () => downloadHTML(entry));
    panel!.querySelector('[data-act="winners"]')?.addEventListener("click", () => downloadWinners(entry));
    panel!.querySelector('[data-act="cascade"]')?.addEventListener("click", () => downloadCascade(entry));
    panel!.querySelector('[data-act="compare"]')?.addEventListener("click", () => toggleCompareMode());
    panel!.querySelector('[data-act="lock"]')?.addEventListener("click", () => {
      locked = !locked;
      lockedEntry = locked ? entry : null;
      lockedEl = locked ? el : null;
      persist();
      renderPanel(entry, el);
      moveHighlight(el);
    });
    panel!.querySelector('[data-act="clear"]')?.addEventListener("click", () => {
      logs.length = 0; locked = false; lockedEntry = null; lockedEl = null;
      persist(); panel?.remove(); panel = null; hideHover();
    });
  }

  function renderComparePanel() {
    ensurePanel();
    if (!compareA || !compareB) {
      panel!.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <strong style="color:#3b82f6;font-size:11px;letter-spacing:.15em;text-transform:uppercase">Comparar — selecione ${compareA ? "B" : "A"}</strong>
          <button data-act="cancel-cmp" style="${btn()}">Cancelar</button>
        </div>
        <div style="font-size:11px;opacity:.7">Clique em ${compareA ? "outro" : "um"} elemento para definir <strong>${compareA ? "B" : "A"}</strong>.${compareA ? `<br/>A: ${escapeHtml(compareA.entry.selector)}` : ""}</div>
      `;
      panel!.querySelector('[data-act="cancel-cmp"]')?.addEventListener("click", () => exitCompareMode());
      return;
    }
    const a = compareA.entry, b = compareB.entry;
    const winners = (e: LogEntry) => {
      const seen = new Set<string>();
      return e.matchedRules.filter((r) => {
        const k = Object.keys(r.declarations).find((p) => !seen.has(p));
        if (k) { Object.keys(r.declarations).forEach((p) => seen.add(p)); return true; }
        return false;
      }).slice(0, 10);
    };
    const renderSide = (e: LogEntry, label: string) => `
      <div style="flex:1;min-width:0">
        <div style="color:#3b82f6;font-size:11px;text-transform:uppercase;letter-spacing:.1em">${label}</div>
        <div style="font-size:11px;word-break:break-all">${escapeHtml(e.selector)}</div>
        <div style="opacity:.6;font-size:10px;margin-top:2px">${e.size.w}×${e.size.h}px${e.inShadow ? " · shadow" : ""}</div>
        <div style="margin-top:6px">
          ${winners(e).map((r) => `
            <div style="margin-top:4px;padding:4px 6px;border-left:2px solid #C8A96A;background:rgba(255,255,255,0.04);font-size:11px">
              <div style="color:#C8A96A;word-break:break-all">${escapeHtml(r.selector)}</div>
              <div style="opacity:.8;word-break:break-all">${escapeHtml(r.cssText)}</div>
              <div style="opacity:.5;font-size:10px">${escapeHtml(r.origin)} · spec ${r.specificity.join(",")}</div>
            </div>`).join("")}
        </div>
      </div>`;
    const diffRows = ["font-family","font-size","font-weight","line-height","letter-spacing","color","padding","margin","text-transform"].map((k) => {
      const va = a.styles[k] ?? "—", vb = b.styles[k] ?? "—";
      const diff = va !== vb;
      return `<tr style="${diff ? "background:rgba(239,68,68,0.10)" : ""}"><td style="opacity:.6;padding:2px 6px">${k}</td><td style="padding:2px 6px">${escapeHtml(va)}</td><td style="padding:2px 6px">${escapeHtml(vb)}</td></tr>`;
    }).join("");
    const dW = b.size.w - a.size.w, dH = b.size.h - a.size.h;
    panel!.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:8px">
        <strong style="color:#3b82f6;font-size:11px;letter-spacing:.15em;text-transform:uppercase">Comparar A ⇄ B</strong>
        <div style="display:flex;gap:4px">
          <button data-act="cmp-reset" style="${btn()}">Resetar</button>
          <button data-act="cmp-exit" style="${btn()}">Sair</button>
        </div>
      </div>
      <div style="display:flex;gap:10px">${renderSide(a, "A")}${renderSide(b, "B")}</div>
      <div style="margin-top:10px;padding:6px 8px;background:rgba(59,130,246,0.10);border-radius:4px;font-size:11px">
        Caixa: A ${a.size.w}×${a.size.h} · B ${b.size.w}×${b.size.h} · Δ ${dW >= 0 ? "+" : ""}${dW}w · ${dH >= 0 ? "+" : ""}${dH}h
      </div>
      <div style="margin-top:10px"><div style="opacity:.5;font-size:10px;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px">Diferenças de estilo</div>
        <table style="width:100%;border-collapse:collapse;font-size:11px"><thead><tr><th></th><th style="text-align:left;color:#3b82f6">A</th><th style="text-align:left;color:#3b82f6">B</th></tr></thead><tbody>${diffRows}</tbody></table>
      </div>
    `;
    panel!.querySelector('[data-act="cmp-exit"]')?.addEventListener("click", () => exitCompareMode());
    panel!.querySelector('[data-act="cmp-reset"]')?.addEventListener("click", () => { compareA = null; compareB = null; renderComparePanel(); });
  }

  function toggleCompareMode() {
    compareMode = !compareMode;
    compareA = null; compareB = null;
    if (compareMode) renderComparePanel();
    else if (lockedEntry && lockedEl) renderPanel(lockedEntry, lockedEl);
  }
  function exitCompareMode() {
    compareMode = false; compareA = null; compareB = null;
    panel?.remove(); panel = null;
  }

  function btn(primary = false) {
    return `background:${primary ? "#C8A96A" : "rgba(200,169,106,0.15)"};color:${primary ? "#0B1F3A" : "#fff"};border:1px solid rgba(200,169,106,0.4);border-radius:4px;padding:3px 8px;font:11px ui-monospace,monospace;cursor:pointer`;
  }

  function escapeHtml(s: string) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
  }

  async function copyToClipboard(text: string, okMsg = "Copiado ✓") {
    try { await navigator.clipboard.writeText(text); flashPanel(okMsg); }
    catch { flashPanel("Falha ao copiar"); }
  }

  async function copyEntry(entry: LogEntry) {
    await copyToClipboard([
      `Component: ${entry.component ?? "(unknown)"}`,
      `Source:    ${entry.source ?? "(unavailable)"}`,
      `Route:     ${entry.route}`,
      `Selector:  ${entry.selector}`,
      `DOM path:  ${entry.domPath}`,
    ].join("\n"));
  }

  /** "Pacote" = bloco markdown pronto para ticket/issue. */
  function buildPackage(entry: LogEntry): string {
    return [
      "### Inspector capture",
      "",
      `- **Timestamp:** ${entry.ts}`,
      `- **Rota:** \`${entry.route}\``,
      `- **Componente:** ${entry.component ?? "(desconhecido)"}`,
      `- **Arquivo:linha:** \`${entry.source ?? "(indisponível)"}\``,
      `- **Selector:** \`${entry.selector}\``,
      `- **DOM path:** \`${entry.domPath}\``,
      `- **Viewport:** ${entry.viewport.w}×${entry.viewport.h} · ${entry.viewport.breakpoint} · dpr ${entry.viewport.dpr}`,
      `- **Box:** ${entry.size.w}×${entry.size.h}px${entry.inShadow ? " · em Shadow DOM" : ""}`,
      "",
    ].join("\n");
  }
  async function copyPackage(entry: LogEntry) { await copyToClipboard(buildPackage(entry), "Pacote copiado ✓"); }

  function flashPanel(msg: string) {
    if (!panel) return;
    const tip = document.createElement("div");
    Object.assign(tip.style, {
      position: "absolute", top: "8px", right: "12px",
      background: "#C8A96A", color: "#0B1F3A",
      padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: "700",
    } as CSSStyleDeclaration);
    tip.textContent = msg;
    panel.appendChild(tip);
    setTimeout(() => tip.remove(), 1200);
  }

  function exportNDJSON() {
    if (!logs.length) { flashPanel("Sem logs"); return; }
    const blob = new Blob(logs.map((l) => JSON.stringify(l) + "\n"), { type: "application/x-ndjson" });
    triggerDownload(blob, `inspector-${stamp()}.ndjson`);
  }

  function downloadHTML(entry: LogEntry) {
    const doc = `<!doctype html>
<html><head><meta charset="utf-8"><title>Inspector capture · ${escapeHtml(entry.selector)}</title></head>
<body>
<!--
  Route:    ${entry.route}
  Selector: ${entry.selector}
  DOM path: ${entry.domPath}
  Source:   ${entry.source ?? "(n/a)"}
  Captured: ${entry.ts}
-->
${entry.outerHTML}
</body></html>`;
    triggerDownload(new Blob([doc], { type: "text/html" }), `inspector-${stamp()}.html`);
  }

  /** Resumo das regras vencedoras para tipografia, cor, peso e bordas — inclui var() resolvidas e source. */
  function downloadWinners(entry: LogEntry) {
    const target = [
      "font-size","line-height","font-family","font-weight","color",
      "padding","padding-top","padding-right","padding-bottom","padding-left",
      "border","border-width","border-style","border-color",
      "border-top","border-top-width","border-top-style","border-top-color",
      "border-right","border-right-width","border-right-style","border-right-color",
      "border-bottom","border-bottom-width","border-bottom-style","border-bottom-color",
      "border-left","border-left-width","border-left-style","border-left-color",
    ];
    const winners: Array<{ prop: string; value: string; selector: string; origin: string; source: string | null; cssText: string }> = [];
    for (const prop of target) {
      const r = entry.matchedRules.find((m) => prop in m.declarations);
      if (r) winners.push({ prop, value: r.declarations[prop], selector: r.selector, origin: r.origin, source: entry.source, cssText: r.cssText });
    }
    const payload = {
      ts: entry.ts, route: entry.route, selector: entry.selector, domPath: entry.domPath,
      source: entry.source, component: entry.component, computed: entry.styles,
      cssVars: entry.cssVars, winners,
    };
    triggerDownload(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }), `inspector-winners-${stamp()}.json`);
  }

  /** Exporta a cascata CSS completa (matchedRules na ordem de especificidade). */
  function downloadCascade(entry: LogEntry) {
    const meta = { ts: entry.ts, route: entry.route, selector: entry.selector, domPath: entry.domPath, source: entry.source, component: entry.component, inShadow: entry.inShadow };
    const lines = [JSON.stringify({ kind: "meta", ...meta })];
    entry.matchedRules.forEach((r, i) => lines.push(JSON.stringify({ kind: "rule", order: i + 1, ...r })));
    triggerDownload(new Blob([lines.join("\n") + "\n"], { type: "application/x-ndjson" }), `inspector-cascade-${stamp()}.ndjson`);
  }

  function stamp() { return new Date().toISOString().replace(/[:.]/g, "-"); }

  function triggerDownload(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function onClick(e: MouseEvent) {
    if (!active) return;
    if (panel && panel.contains(e.target as Node)) return;
    e.preventDefault();
    e.stopPropagation();
    const el = elementFromEvent(e);
    if (!el) return;

    if (compareMode) {
      const entry = buildEntry(el);
      if (!compareA) compareA = { entry, el };
      else if (!compareB) compareB = { entry, el };
      else { compareA = { entry, el }; compareB = null; }
      moveHighlight(el);
      renderComparePanel();
      return;
    }

    if (locked && lockedEntry && lockedEl) {
      renderPanel(lockedEntry, lockedEl);
      return;
    }
    const entry = buildEntry(el);
    logs.push(entry);
    persist();
    moveHighlight(el);
    renderPanel(entry, el);
    // eslint-disable-next-line no-console
    console.log("[Inspector]", entry);
  }

  let dockToggleBtn: HTMLButtonElement | null = null;
  function renderDock() {
    const dock = document.createElement("div");
    Object.assign(dock.style, {
      position: "fixed", bottom: "12px", right: "12px", zIndex: "2147483647",
      display: "flex", gap: "6px", padding: "6px", background: "#0B1F3A",
      borderRadius: "999px", boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
      border: "1px solid rgba(200,169,106,0.4)",
    } as CSSStyleDeclaration);
    dockToggleBtn = document.createElement("button");
    dockToggleBtn.style.cssText = btn() + ";border-radius:999px;padding:4px 10px";
    dockToggleBtn.textContent = "🔍 Inspect";
    dockToggleBtn.onclick = () => toggle();
    const exportBtn = document.createElement("button");
    exportBtn.style.cssText = btn() + ";border-radius:999px;padding:4px 10px";
    exportBtn.textContent = "⬇ NDJSON";
    exportBtn.onclick = exportNDJSON;
    dock.append(dockToggleBtn, exportBtn);
    document.body.appendChild(dock);

    if (locked && lockedEntry) {
      try {
        const el = document.querySelector(lockedEntry.selector);
        if (el) { lockedEl = el; moveHighlight(el); renderPanel(lockedEntry, el); active = true; document.body.style.cursor = "crosshair"; updateDockState(); }
      } catch { /* ignore */ }
    }
  }

  function updateDockState() {
    if (!dockToggleBtn) return;
    dockToggleBtn.style.background = active ? "#C8A96A" : "rgba(200,169,106,0.15)";
    dockToggleBtn.style.color = active ? "#0B1F3A" : "#fff";
  }

  function toggle() {
    active = !active;
    document.body.style.cursor = active ? "crosshair" : "";
    updateDockState();
    if (!active) { hideHover(); panel?.remove(); panel = null; compareMode = false; compareA = null; compareB = null; }
    // eslint-disable-next-line no-console
    console.log(`%c[Inspector] ${active ? "ATIVO" : "off"}`, "color:#C8A96A");
  }

  function isTypingTarget(t: EventTarget | null): boolean {
    const el = t as HTMLElement | null;
    if (!el) return false;
    const tag = el.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (el as HTMLElement).isContentEditable;
  }

  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "I" || e.key === "i")) {
      e.preventDefault(); toggle(); return;
    }
    if (e.key === "Escape" && active) { toggle(); return; }
    if (!active) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (isTypingTarget(e.target)) return;
    const k = e.key.toLowerCase();
    const lastEntry = logs[logs.length - 1];
    if (k === "l" || k === "f") {
      // L (legado) ou F = alternar Fixar usando última seleção
      e.preventDefault();
      if (locked) { locked = false; lockedEntry = null; lockedEl = null; }
      else if (lastEntry) { locked = true; lockedEntry = lastEntry; /* lockedEl: tenta resolver */
        try { lockedEl = document.querySelector(lastEntry.selector); } catch { lockedEl = null; } }
      persist();
      if (lockedEntry && lockedEl) renderPanel(lockedEntry, lockedEl);
    } else if (k === "c") {
      e.preventDefault();
      toggleCompareMode();
    } else if (k === "p") {
      if (!lastEntry) return;
      e.preventDefault();
      copyPackage(lastEntry);
    }
  });
  window.addEventListener("mousemove", onMove, true);
  window.addEventListener("click", onClick, true);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderDock);
  } else {
    renderDock();
  }

  (window as any).__cathedraInspector = {
    toggle, logs, exportNDJSON, filters,
    get locked() { return locked; },
    get compareMode() { return compareMode; },
    buildPackage,
  };
  // eslint-disable-next-line no-console
  console.log("%c[Inspector] pronto — Ctrl/Cmd+Shift+I alterna · F fixar · C comparar · P pacote · Esc sai", "color:#C8A96A");
}
