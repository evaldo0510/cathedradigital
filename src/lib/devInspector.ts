/**
 * Dev-only DOM inspector.
 * Toggle with Ctrl/Cmd + Shift + I.
 * Hover highlights elements; click prints + shows React source (file:line).
 */

type FiberSource = { fileName?: string; lineNumber?: number; columnNumber?: number };

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

export function initDevInspector() {
  if (typeof window === "undefined") return;

  let active = false;
  let highlight: HTMLDivElement | null = null;
  let label: HTMLDivElement | null = null;

  function ensureOverlay() {
    if (highlight) return;
    highlight = document.createElement("div");
    Object.assign(highlight.style, {
      position: "fixed",
      pointerEvents: "none",
      zIndex: "2147483646",
      border: "2px solid #C8A96A",
      background: "rgba(200,169,106,0.12)",
      borderRadius: "4px",
      transition: "all 60ms linear",
      display: "none",
    } as CSSStyleDeclaration);
    label = document.createElement("div");
    Object.assign(label.style, {
      position: "fixed",
      pointerEvents: "none",
      zIndex: "2147483647",
      background: "#0B1F3A",
      color: "#fff",
      font: "11px/1.4 ui-monospace,monospace",
      padding: "4px 8px",
      borderRadius: "4px",
      maxWidth: "70vw",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      display: "none",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    } as CSSStyleDeclaration);
    document.body.appendChild(highlight);
    document.body.appendChild(label);
  }

  function hideOverlay() {
    if (highlight) highlight.style.display = "none";
    if (label) label.style.display = "none";
  }

  function describe(el: Element) {
    const fiber = getFiberFromNode(el);
    const { source, name } = fiber ? findSource(fiber) : { source: null, name: null };
    return { source, name };
  }

  function onMove(e: MouseEvent) {
    if (!active) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || el === highlight || el === label) return;
    ensureOverlay();
    const r = el.getBoundingClientRect();
    highlight!.style.display = "block";
    highlight!.style.left = `${r.left}px`;
    highlight!.style.top = `${r.top}px`;
    highlight!.style.width = `${r.width}px`;
    highlight!.style.height = `${r.height}px`;

    const { source, name } = describe(el);
    const text = source
      ? `<${name || el.tagName.toLowerCase()}>  ${source.fileName?.split("/src/").pop() ?? source.fileName}:${source.lineNumber}`
      : `<${el.tagName.toLowerCase()}> (sem source — componente sem _debugSource)`;
    label!.textContent = text;
    label!.style.display = "block";
    const top = r.top - 24 < 4 ? r.bottom + 4 : r.top - 24;
    label!.style.left = `${Math.max(4, r.left)}px`;
    label!.style.top = `${top}px`;
  }

  function onClick(e: MouseEvent) {
    if (!active) return;
    e.preventDefault();
    e.stopPropagation();
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el) return;
    const { source, name } = describe(el);
    const route = window.location.pathname;
    // eslint-disable-next-line no-console
    console.group(`%c[Inspector] ${name || el.tagName}`, "color:#C8A96A;font-weight:bold");
    console.log("Rota:", route);
    console.log("Elemento:", el);
    if (source) {
      const rel = source.fileName?.split("/src/").pop();
      console.log(`Source: src/${rel}:${source.lineNumber}:${source.columnNumber}`);
    } else {
      console.log("Source: não disponível (provavelmente build sem _debugSource)");
    }
    console.log("DOM path:", domPath(el));
    console.groupEnd();
  }

  function domPath(el: Element): string {
    const parts: string[] = [];
    let cur: Element | null = el;
    while (cur && cur.nodeType === 1 && parts.length < 8) {
      let s = cur.tagName.toLowerCase();
      if (cur.id) s += `#${cur.id}`;
      else if (cur.className && typeof cur.className === "string")
        s += "." + cur.className.trim().split(/\s+/).slice(0, 2).join(".");
      parts.unshift(s);
      cur = cur.parentElement;
    }
    return parts.join(" > ");
  }

  function toggle() {
    active = !active;
    document.body.style.cursor = active ? "crosshair" : "";
    if (!active) hideOverlay();
    // eslint-disable-next-line no-console
    console.log(`%c[Inspector] ${active ? "ATIVO" : "desligado"}`, "color:#C8A96A");
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

  (window as any).__cathedraInspector = { toggle };
  // eslint-disable-next-line no-console
  console.log(
    "%c[Inspector] pronto — Ctrl/Cmd+Shift+I para ativar, ESC para sair",
    "color:#C8A96A",
  );
}
