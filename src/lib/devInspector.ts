/**
 * Dev-only DOM inspector.
 * Toggle with Ctrl/Cmd + Shift + I. ESC to exit.
 */

type FiberSource = { fileName?: string; lineNumber?: number; columnNumber?: number };
type MatchedRule = {
  selector: string;
  specificity: [number, number, number];
  origin: string;
  originKind: "inline" | "style-tag" | "stylesheet";
  selectorKind: "id" | "class" | "tag" | "mixed";
  cssText: string;
  declarations: Record<string, string>;
};
type Conflict = {
  prop: string;
  winner: MatchedRule;
  losers: MatchedRule[];
};
type LogEntry = {
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
  outerHTML: string;
};
type Filters = {
  origin: "all" | "inline" | "style-tag" | "stylesheet";
  selectorKind: "all" | "id" | "class" | "tag" | "mixed";
  file: string; // "all" or filename
};

const STORAGE_KEY = "cathedra_inspector_session_v1";

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

function domPath(el: Element): string {
  const parts: string[] = [];
  let cur: Element | null = el;
  while (cur && cur.nodeType === 1 && parts.length < 10) {
    let s = cur.tagName.toLowerCase();
    if (cur.id) s += `#${cur.id}`;
    else if (cur.className && typeof cur.className === "string")
      s += "." + cur.className.trim().split(/\s+/).slice(0, 2).join(".");
    parts.unshift(s);
    cur = cur.parentElement;
  }
  return parts.join(" > ");
}

function pickStyles(el: Element): Record<string, string> {
  const cs = window.getComputedStyle(el);
  const keys = ["font-family","font-size","font-weight","line-height","letter-spacing","color","padding","margin","text-transform"];
  const out: Record<string, string> = {};
  for (const k of keys) out[k] = cs.getPropertyValue(k).trim();
  return out;
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

function ruleOrigin(sheet: CSSStyleSheet): { label: string; kind: "style-tag" | "stylesheet" } {
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

function getMatchedRules(el: Element): MatchedRule[] {
  const out: MatchedRule[] = [];
  // inline style first
  const inline = (el as HTMLElement).style?.cssText;
  if (inline) {
    out.push({
      selector: "style=\"...\"",
      specificity: [1, 0, 0, 0] as any,
      origin: "inline",
      originKind: "inline",
      selectorKind: "id",
      cssText: inline,
      declarations: parseDeclarations(inline),
    });
  }
  const sheets = Array.from(document.styleSheets) as CSSStyleSheet[];
  for (const sheet of sheets) {
    let rules: CSSRuleList | null = null;
    try { rules = sheet.cssRules; } catch { continue; }
    if (!rules) continue;
    walkRules(rules, sheet, el, out);
    if (out.length > 300) break;
  }
  out.sort((a, b) => {
    for (let i = 0; i < 3; i++) if (b.specificity[i] !== a.specificity[i]) return b.specificity[i] - a.specificity[i];
    return 0;
  });
  return out.slice(0, 80);
}

function walkRules(rules: CSSRuleList, sheet: CSSStyleSheet, el: Element, out: MatchedRule[]) {
  const origin = ruleOrigin(sheet);
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
      walkRules((rule as CSSGroupingRule).cssRules, sheet, el, out);
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

export function initDevInspector() {
  if (typeof window === "undefined") return;

  // Restore previous session
  let saved: { logs: LogEntry[]; filters: Filters; locked: boolean } = { logs: [], filters: { origin: "all", selectorKind: "all", file: "all" }, locked: false };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) saved = { ...saved, ...JSON.parse(raw) };
  } catch { /* noop */ }

  const logs: LogEntry[] = Array.isArray(saved.logs) ? saved.logs : [];
  const filters: Filters = saved.filters || { origin: "all", selectorKind: "all", file: "all" };
  let locked = !!saved.locked;
  let lockedEntry: LogEntry | null = logs.length && locked ? logs[logs.length - 1] : null;
  let lockedEl: Element | null = null;

  let active = false;
  let highlight: HTMLDivElement | null = null;
  let hoverLabel: HTMLDivElement | null = null;
  let panel: HTMLDivElement | null = null;

  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ logs: logs.slice(-50), filters, locked })); }
    catch { /* noop */ }
  }

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
    highlight!.style.borderColor = locked ? "#ef4444" : "#C8A96A";
    hoverLabel!.style.display = "block";
    hoverLabel!.textContent = `${locked ? "🔒 " : ""}${el.tagName.toLowerCase()} · ${Math.round(r.width)}×${Math.round(r.height)}`;
    const top = r.top - 22 < 4 ? r.bottom + 4 : r.top - 22;
    hoverLabel!.style.left = `${Math.max(4, r.left)}px`;
    hoverLabel!.style.top = `${top}px`;
  }

  function onMove(e: MouseEvent) {
    if (!active) return;
    if (locked && lockedEl) { moveHighlight(lockedEl); return; }
    const el = document.elementFromPoint(e.clientX, e.clientY);
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
      outerHTML: el.outerHTML.slice(0, 50000),
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

  function renderPanel(entry: LogEntry, el: Element) {
    if (!panel) {
      panel = document.createElement("div");
      Object.assign(panel.style, {
        position: "fixed", right: "12px", top: "12px", width: "420px",
        maxHeight: "calc(100vh - 24px)", overflow: "auto", zIndex: "2147483647",
        background: "#0B1F3A", color: "#fff",
        font: "12px/1.45 ui-monospace,SFMono-Regular,monospace",
        padding: "12px 14px", borderRadius: "8px",
        boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
        border: "1px solid rgba(200,169,106,0.4)",
      } as CSSStyleDeclaration);
      document.body.appendChild(panel);
    }
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
    const sel = (val: string, opts: string[]) => `<select data-filter style="background:#0B1F3A;color:#fff;border:1px solid rgba(200,169,106,0.4);border-radius:4px;padding:2px 4px;font:10px ui-monospace,monospace">${opts.map((o) => `<option ${o === val ? "selected" : ""} value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join("")}</select>`;

    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:8px">
        <strong style="color:#C8A96A;font-size:11px;letter-spacing:.15em;text-transform:uppercase">Inspector ${locked ? "🔒" : ""}</strong>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button data-act="lock" style="${btn()}">${locked ? "Desafixar" : "Fixar"}</button>
          <button data-act="copy" style="${btn()}">Copiar</button>
          <button data-act="html" style="${btn()}">HTML</button>
          <button data-act="export" style="${btn()}">NDJSON</button>
          <button data-act="clear" style="${btn()}">Limpar</button>
          <button data-act="close" style="${btn()}">×</button>
        </div>
      </div>
      <div style="font-size:11px;opacity:.6">${escapeHtml(entry.route)} · elem ${entry.size.w}×${entry.size.h}px · vp ${vp.w}×${vp.h} · ${vp.breakpoint} · dpr ${vp.dpr}</div>
      <div style="margin-top:8px"><span style="color:#C8A96A">${escapeHtml(entry.component || el.tagName.toLowerCase())}</span></div>
      ${entry.source ? `<div style="opacity:.85;margin-top:2px">${escapeHtml(entry.source)}</div>` : '<div style="opacity:.5;margin-top:2px">sem _debugSource</div>'}
      <div style="margin-top:10px"><div style="opacity:.5;font-size:10px;text-transform:uppercase;letter-spacing:.1em">Seletor</div><div style="word-break:break-all">${escapeHtml(entry.selector)}</div></div>
      <div style="margin-top:8px"><div style="opacity:.5;font-size:10px;text-transform:uppercase;letter-spacing:.1em">DOM path</div><div style="word-break:break-all">${escapeHtml(entry.domPath)}</div></div>

      <div style="margin-top:10px"><div style="opacity:.5;font-size:10px;text-transform:uppercase;letter-spacing:.1em">Conflitos CSS</div>${conflictsBlock}</div>

      <div style="margin-top:10px"><div style="opacity:.5;font-size:10px;text-transform:uppercase;letter-spacing:.1em">Estilos computados</div>
        <table style="width:100%;margin-top:4px;border-collapse:collapse">${stylesRows}</table>
      </div>

      <div style="margin-top:10px">
        <div style="opacity:.5;font-size:10px;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px">Cascata CSS · filtros</div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px">
          <label style="font-size:10px;opacity:.7">origem ${sel(filters.origin, ["all","inline","style-tag","stylesheet"]).replace("data-filter", 'data-filter="origin"')}</label>
          <label style="font-size:10px;opacity:.7">tipo ${sel(filters.selectorKind, ["all","id","class","tag","mixed"]).replace("data-filter", 'data-filter="selectorKind"')}</label>
          <label style="font-size:10px;opacity:.7">arquivo ${sel(filters.file, ["all", ...files]).replace("data-filter", 'data-filter="file"')}</label>
        </div>
        ${cascadeRows}
      </div>
      <div style="margin-top:10px;opacity:.5;font-size:10px">logs: ${logs.length} · sessão salva em localStorage</div>
    `;

    panel.querySelectorAll("[data-filter]").forEach((s) => {
      s.addEventListener("change", (e) => {
        const t = e.target as HTMLSelectElement;
        const key = t.getAttribute("data-filter") as keyof Filters;
        (filters as any)[key] = t.value;
        persist();
        renderPanel(entry, el);
      });
    });
    panel.querySelector('[data-act="close"]')?.addEventListener("click", () => { panel?.remove(); panel = null; });
    panel.querySelector('[data-act="copy"]')?.addEventListener("click", () => copyEntry(entry));
    panel.querySelector('[data-act="export"]')?.addEventListener("click", exportNDJSON);
    panel.querySelector('[data-act="html"]')?.addEventListener("click", () => downloadHTML(entry));
    panel.querySelector('[data-act="lock"]')?.addEventListener("click", () => {
      locked = !locked;
      lockedEntry = locked ? entry : null;
      lockedEl = locked ? el : null;
      persist();
      renderPanel(entry, el);
      moveHighlight(el);
    });
    panel.querySelector('[data-act="clear"]')?.addEventListener("click", () => {
      logs.length = 0; locked = false; lockedEntry = null; lockedEl = null;
      persist(); panel?.remove(); panel = null; hideHover();
    });
  }

  function btn() {
    return "background:rgba(200,169,106,0.15);color:#fff;border:1px solid rgba(200,169,106,0.4);border-radius:4px;padding:3px 8px;font:11px ui-monospace,monospace;cursor:pointer";
  }

  function escapeHtml(s: string) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
  }

  async function copyEntry(entry: LogEntry) {
    const text = [
      `Component: ${entry.component ?? "(unknown)"}`,
      `Source:    ${entry.source ?? "(unavailable)"}`,
      `Route:     ${entry.route}`,
      `Selector:  ${entry.selector}`,
      `DOM path:  ${entry.domPath}`,
    ].join("\n");
    try { await navigator.clipboard.writeText(text); flashPanel("Copiado ✓"); }
    catch { flashPanel("Falha ao copiar"); }
  }

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
    triggerDownload(blob, `inspector-${new Date().toISOString().replace(/[:.]/g, "-")}.ndjson`);
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
    const blob = new Blob([doc], { type: "text/html" });
    triggerDownload(blob, `inspector-${new Date().toISOString().replace(/[:.]/g, "-")}.html`);
  }

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
    if (locked && lockedEntry && lockedEl) {
      renderPanel(lockedEntry, lockedEl);
      return;
    }
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el) return;
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

    // Restore locked entry panel automatically
    if (locked && lockedEntry) {
      try {
        const el = document.querySelector(lockedEntry.selector);
        if (el) { lockedEl = el; moveHighlight(el); renderPanel(lockedEntry, el); active = true; document.body.style.cursor = "crosshair"; updateDockState(); }
      } catch { /* ignore invalid selector */ }
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
    if (!active) { hideHover(); panel?.remove(); panel = null; }
    // eslint-disable-next-line no-console
    console.log(`%c[Inspector] ${active ? "ATIVO" : "off"}`, "color:#C8A96A");
  }

  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "I" || e.key === "i")) {
      e.preventDefault(); toggle();
    }
    if (e.key === "Escape" && active) toggle();
    // L to toggle lock when active
    if (active && (e.key === "l" || e.key === "L") && !e.ctrlKey && !e.metaKey && !e.altKey) {
      locked = !locked;
      if (!locked) { lockedEntry = null; lockedEl = null; }
      persist();
      if (lockedEntry && lockedEl) renderPanel(lockedEntry, lockedEl);
    }
  });
  window.addEventListener("mousemove", onMove, true);
  window.addEventListener("click", onClick, true);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderDock);
  } else {
    renderDock();
  }

  (window as any).__cathedraInspector = { toggle, logs, exportNDJSON, filters, get locked() { return locked; } };
  // eslint-disable-next-line no-console
  console.log("%c[Inspector] pronto — botão no canto, Ctrl/Cmd+Shift+I para alternar, L para fixar", "color:#C8A96A");
}
