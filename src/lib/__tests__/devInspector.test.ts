import { describe, it, expect, beforeEach } from "vitest";
import {
  loadSession,
  saveSession,
  STORAGE_KEY,
  DEFAULT_FILTERS,
  domPath,
  type LogEntry,
  type SessionState,
} from "@/lib/devInspector";

function makeEntry(selector: string): LogEntry {
  return {
    ts: "2026-06-26T12:00:00.000Z",
    route: "/admin/test",
    component: "TestT",
    source: "src/components/T.tsx:10:5",
    selector,
    domPath: `body > main > ${selector}`,
    classes: "text-xl font-bold",
    size: { w: 24, h: 32 },
    viewport: { w: 1280, h: 800, dpr: 1, breakpoint: "lg" },
    styles: { "font-size": "24px", "line-height": "32px" },
    matchedRules: [],
    conflicts: [],
    cssVars: [],
    outerHTML: `<${selector}>T</${selector}>`,
    inShadow: false,
  };
}

describe("devInspector — persistência de sessão (localStorage)", () => {
  beforeEach(() => localStorage.clear());

  it("retorna estado padrão quando não há sessão salva", () => {
    const s = loadSession();
    expect(s.logs).toEqual([]);
    expect(s.filters).toEqual(DEFAULT_FILTERS);
    expect(s.locked).toBe(false);
  });

  it("faz round-trip: salva logs + filtros + locked e restaura idêntico", () => {
    const entry = makeEntry("h1");
    const state: SessionState = {
      logs: [entry, makeEntry("p")],
      filters: { origin: "stylesheet", selectorKind: "class", file: "index.css" },
      locked: true,
    };
    saveSession(state);
    const restored = loadSession();
    expect(restored.logs).toHaveLength(2);
    expect(restored.logs[0].selector).toBe("h1");
    expect(restored.logs[1].selector).toBe("p");
    expect(restored.filters).toEqual(state.filters);
    expect(restored.locked).toBe(true);
  });

  it("simulação de recarregar: novo loadSession() vê os mesmos dados após saveSession()", () => {
    saveSession({ logs: [makeEntry("span")], filters: { ...DEFAULT_FILTERS, origin: "inline" }, locked: true });
    // simula recarregamento — função pura lê do mesmo storage
    const after = loadSession();
    expect(after.locked).toBe(true);
    expect(after.filters.origin).toBe("inline");
    expect(after.logs[0].selector).toBe("span");
  });

  it("é tolerante a JSON inválido no storage", () => {
    localStorage.setItem(STORAGE_KEY, "{ not-json");
    const s = loadSession();
    expect(s.locked).toBe(false);
    expect(s.logs).toEqual([]);
  });

  it("trunca histórico a 50 logs ao salvar", () => {
    const many = Array.from({ length: 70 }, (_, i) => makeEntry(`el-${i}`));
    saveSession({ logs: many, filters: { ...DEFAULT_FILTERS }, locked: false });
    const restored = loadSession();
    expect(restored.logs).toHaveLength(50);
    // mantém os mais recentes
    expect(restored.logs[restored.logs.length - 1].selector).toBe("el-69");
  });
});

describe("devInspector — modo Fixar (locked) sobrevive a recarregamento", () => {
  beforeEach(() => localStorage.clear());

  it("locked=true persiste e é restaurado com a última entry como referência", () => {
    const entry = makeEntry("button.lock-me");
    saveSession({ logs: [entry], filters: { ...DEFAULT_FILTERS }, locked: true });

    // simula novo load (como faria initDevInspector ao recarregar)
    const restored = loadSession();
    expect(restored.locked).toBe(true);
    const lockedEntry = restored.logs.length && restored.locked ? restored.logs[restored.logs.length - 1] : null;
    expect(lockedEntry).not.toBeNull();
    expect(lockedEntry!.selector).toBe("button.lock-me");
  });

  it("desfixar (locked=false) é persistido e não recupera entry travada", () => {
    saveSession({ logs: [makeEntry("a")], filters: { ...DEFAULT_FILTERS }, locked: true });
    // usuário desfixa
    const cur = loadSession();
    saveSession({ ...cur, locked: false });

    const after = loadSession();
    expect(after.locked).toBe(false);
    const lockedEntry = after.logs.length && after.locked ? after.logs[after.logs.length - 1] : null;
    expect(lockedEntry).toBeNull();
  });
});

describe("devInspector — domPath com Shadow DOM", () => {
  it("inclui marcador ::shadow ao atravessar ShadowRoot", () => {
    const host = document.createElement("div");
    host.id = "host";
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: "open" });
    const inner = document.createElement("span");
    inner.className = "t-letter";
    shadow.appendChild(inner);

    const path = domPath(inner);
    expect(path).toContain("::shadow");
    expect(path).toMatch(/div#host/);
    expect(path).toMatch(/span/);
    document.body.removeChild(host);
  });

  it("funciona normalmente para elementos fora de Shadow DOM", () => {
    const el = document.createElement("p");
    el.className = "foo";
    document.body.appendChild(el);
    const path = domPath(el);
    expect(path).not.toContain("::shadow");
    expect(path).toMatch(/p\.foo/);
    document.body.removeChild(el);
  });
});
