/**
 * Dev-only DOM inspector.
 * Toggle with Ctrl/Cmd + Shift + I. ESC to exit.
 *
 * Features:
 *  - Hover: highlight element with border + dimension label
 *  - Click: open inspection panel with
 *      • CSS selector + classes
 *      • file:line do componente React (via _debugSource)
 *      • dimensões (W x H)
 *      • resumo de estilos computados (font-family, font-size, line-height, padding, margin, color)
 *      • botão "Copiar DOM path + source"
 *  - Log persistente em window.__cathedraInspector.logs (rota, componente, path, ts)
 *  - Botão "Exportar NDJSON" baixa todos os logs da sessão
 */

type FiberSource = { fileName?: string; lineNumber?: number; columnNumber?: number };
type LogEntry = {
  ts: string;
  route: string;
  component: string | null;
  source: string | null;
  selector: string;
  domPath: string;
  classes: string;
  size: { w: number; h: number };
  styles: Record<string, string>;
};

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
    if (cur.id) {
      parts.unshift(`${s}#${CSS.escape(cur.id)}`);
      break;
    }
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
  const keys = [
    "font-family",
    "font-size",
    "font-weight",
    "line-height",
    "letter-spacing",
    "color",
    "padding",
    "margin",
    "text-transform",
  ];
  const out: Record<string, string> = {};
  for (const k of keys) out[k] = cs.getPropertyValue(k).trim();
  return out;
}

export function initDevInspector() {
  if (typeof window === "undefined") return;

  const logs: LogEntry[] = [];
  let active = false;
  let highlight: HTMLDivElement | null = null;
  let hoverLabel: HTMLDivElement | null = null;
  let panel: HTMLDivElement | null = null;

  function ensureOverlay() {
    if (highlight) return;
    highlight = document.createElement("div");
    Object.assign(highlight.style, {
      position: "fixed",
      pointerEvents: "none",
      zIndex: "2147483645",
      border: "2px solid #C8A96A",
      background: "rgba(200,169,106,0.10)",
      borderRadius: "3px",
      transition: "all 60ms linear",
      display: "none",
      boxShadow: "0 0 0 1px rgba(11,31,58,0.6)",
    } as CSSStyleDeclaration);
    hoverLabel = document.createElement("div");
    Object.assign(hoverLabel.style, {
      position: "fixed",
      pointerEvents: "none",
      zIndex: "2147483646",
      background: "#0B1F3A",
      color: "#fff",
      font: "11px/1.4 ui-monospace,monospace",
      padding: "3px 7px",
      borderRadius: "3px",
      whiteSpace: "nowrap",
      display: "none",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
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
    hoverLabel!.style.display = "block";
    hoverLabel!.textContent = `${el.tagName.toLowerCase()} · ${Math.round(r.width)}×${Math.round(r.height)}`;
    const top = r.top - 22 < 4 ? r.bottom + 4 : r.top - 22;
    hoverLabel!.style.left = `${Math.max(4, r.left)}px`;
    hoverLabel!.style.top = `${top}px`;
  }

  function onMove(e: MouseEvent) {
    if (!active) return;
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
    return {
      ts: new Date().toISOString(),
      route: window.location.pathname,
      component: name,
      source: srcStr,
      selector: cssSelector(el),
      domPath: domPath(el),
      classes: (el.getAttribute("class") || "").trim(),
      size: { w: Math.round(r.width), h: Math.round(r.height) },
      styles: pickStyles(el),
    };
  }

  function renderPanel(entry: LogEntry, el: Element) {
    if (!panel) {
      panel = document.createElement("div");
      Object.assign(panel.style, {
        position: "fixed",
        right: "12px",
        top: "12px",
        width: "380px",
        maxHeight: "calc(100vh - 24px)",
        overflow: "auto",
        zIndex: "2147483647",
        background: "#0B1F3A",
        color: "#fff",
        font: "12px/1.45 ui-monospace,SFMono-Regular,monospace",
        padding: "12px 14px",
        borderRadius: "8px",
        boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
        border: "1px solid rgba(200,169,106,0.4)",
      } as CSSStyleDeclaration);
      document.body.appendChild(panel);
    }
    const stylesRows = Object.entries(entry.styles)
      .map(([k, v]) => `<tr><td style="opacity:.6;padding-right:8px">${k}</td><td>${escapeHtml(v)}</td></tr>`)
      .join("");
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:8px">
        <strong style="color:#C8A96A;font-size:11px;letter-spacing:.15em;text-transform:uppercase">Inspector</strong>
        <div style="display:flex;gap:6px">
          <button data-act="copy" style="${btn()}">Copiar</button>
          <button data-act="export" style="${btn()}">NDJSON</button>
          <button data-act="close" style="${btn()}">×</button>
        </div>
      </div>
      <div style="font-size:11px;opacity:.6">${escapeHtml(entry.route)} · ${entry.size.w}×${entry.size.h}px</div>
      <div style="margin-top:8px"><span style="color:#C8A96A">${escapeHtml(entry.component || el.tagName.toLowerCase())}</span></div>
      ${entry.source ? `<div style="opacity:.85;margin-top:2px">${escapeHtml(entry.source)}</div>` : '<div style="opacity:.5;margin-top:2px">sem _debugSource</div>'}
      <div style="margin-top:10px"><div style="opacity:.5;font-size:10px;text-transform:uppercase;letter-spacing:.1em">Seletor</div><div style="word-break:break-all">${escapeHtml(entry.selector)}</div></div>
      <div style="margin-top:8px"><div style="opacity:.5;font-size:10px;text-transform:uppercase;letter-spacing:.1em">Classes</div><div style="word-break:break-all">${escapeHtml(entry.classes || "(nenhuma)")}</div></div>
      <div style="margin-top:8px"><div style="opacity:.5;font-size:10px;text-transform:uppercase;letter-spacing:.1em">DOM path</div><div style="word-break:break-all">${escapeHtml(entry.domPath)}</div></div>
      <div style="margin-top:10px"><div style="opacity:.5;font-size:10px;text-transform:uppercase;letter-spacing:.1em">Estilos computados</div>
        <table style="width:100%;margin-top:4px;border-collapse:collapse">${stylesRows}</table>
      </div>
      <div style="margin-top:10px;opacity:.5;font-size:10px">logs: ${logs.length} · Ctrl/Cmd+Shift+I para alternar</div>
    `;
    panel.querySelector('[data-act="close"]')?.addEventListener("click", () => { panel?.remove(); panel = null; });
    panel.querySelector('[data-act="copy"]')?.addEventListener("click", () => copyEntry(entry));
    panel.querySelector('[data-act="export"]')?.addEventListener("click", exportNDJSON);
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
    try {
      await navigator.clipboard.writeText(text);
      flashPanel("Copiado ✓");
    } catch {
      flashPanel("Falha ao copiar");
    }
  }

  function flashPanel(msg: string) {
    if (!panel) return;
    const tip = document.createElement("div");
    Object.assign(tip.style, {
      position: "absolute",
      top: "8px",
      right: "12px",
      background: "#C8A96A",
      color: "#0B1F3A",
      padding: "2px 8px",
      borderRadius: "4px",
      fontSize: "10px",
      fontWeight: "700",
    } as CSSStyleDeclaration);
    tip.textContent = msg;
    panel.appendChild(tip);
    setTimeout(() => tip.remove(), 1200);
  }

  function exportNDJSON() {
    if (!logs.length) {
      flashPanel("Sem logs");
      return;
    }
    const blob = new Blob(logs.map((l) => JSON.stringify(l) + "\n"), { type: "application/x-ndjson" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inspector-${new Date().toISOString().replace(/[:.]/g, "-")}.ndjson`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function onClick(e: MouseEvent) {
    if (!active) return;
    if (panel && panel.contains(e.target as Node)) return;
    e.preventDefault();
    e.stopPropagation();
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el) return;
    const entry = buildEntry(el);
    logs.push(entry);
    moveHighlight(el);
    renderPanel(entry, el);
    // eslint-disable-next-line no-console
    console.log("[Inspector]", entry);
  }

  function toggle() {
    active = !active;
    document.body.style.cursor = active ? "crosshair" : "";
    if (!active) {
      hideHover();
      panel?.remove();
      panel = null;
    }
    // eslint-disable-next-line no-console
    console.log(`%c[Inspector] ${active ? "ATIVO" : "off"}`, "color:#C8A96A");
  }

  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "I" || e.key === "i")) {
      e.preventDefault();
      toggle();
    }
    if (e.key === "Escape" && active) toggle();
  });
  window.addEventListener("mousemove", onMove, true);
  window.addEventListener("click", onClick, true);

  (window as any).__cathedraInspector = { toggle, logs, exportNDJSON };
  // eslint-disable-next-line no-console
  console.log("%c[Inspector] pronto — Ctrl/Cmd+Shift+I", "color:#C8A96A");
}
