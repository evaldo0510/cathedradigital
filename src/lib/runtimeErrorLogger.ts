/**
 * runtimeErrorLogger — captura window.onerror e unhandledrejection,
 * mantém ring buffer local (últimas 50) em memória + localStorage,
 * enriquece Sentry com rota/tema/navegador/elemento em foco/viewport,
 * e expõe API para inspeção via /admin/runtime-errors.
 *
 * Não substitui o AppErrorBoundary — complementa capturando erros
 * fora do ciclo de render do React (event handlers async, promises,
 * scripts globais).
 */
import * as Sentry from "@sentry/react";

export interface RuntimeErrorRecord {
  id: string;
  timestamp: string; // ISO
  type: "error" | "unhandledrejection";
  message: string;
  stack?: string;
  route: string;
  userAgent: string;
  theme: "light" | "dark" | "unknown";
  viewport: { w: number; h: number; dpr: number };
  focused?: {
    tag: string;
    id?: string;
    role?: string;
    ariaLabel?: string;
    testid?: string;
  } | null;
  source?: string;
  lineno?: number;
  colno?: number;
}

const BUFFER_KEY = "cathedra:runtime-errors:v1";
const MAX_ITEMS = 50;

type Listener = (records: RuntimeErrorRecord[]) => void;
const listeners = new Set<Listener>();

function readBuffer(): RuntimeErrorRecord[] {
  try {
    const raw = localStorage.getItem(BUFFER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeBuffer(records: RuntimeErrorRecord[]) {
  try {
    localStorage.setItem(BUFFER_KEY, JSON.stringify(records.slice(0, MAX_ITEMS)));
  } catch {
    /* quota — ignora */
  }
}

function detectTheme(): "light" | "dark" | "unknown" {
  if (typeof document === "undefined") return "unknown";
  const root = document.documentElement;
  if (root.classList.contains("dark")) return "dark";
  if (root.classList.contains("light")) return "light";
  // fallback: media query
  try {
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
      ? "dark"
      : "light";
  } catch {
    return "unknown";
  }
}

function snapshotFocused(): RuntimeErrorRecord["focused"] {
  if (typeof document === "undefined") return null;
  const el = document.activeElement as HTMLElement | null;
  if (!el || el === document.body) return null;
  return {
    tag: el.tagName.toLowerCase(),
    id: el.id || undefined,
    role: el.getAttribute("role") || undefined,
    ariaLabel: el.getAttribute("aria-label") || undefined,
    testid: el.getAttribute("data-testid") || undefined,
  };
}

function currentRoute(): string {
  if (typeof window === "undefined") return "";
  return window.location.pathname + window.location.search + window.location.hash;
}

function record(entry: Omit<RuntimeErrorRecord, "id" | "timestamp" | "route" | "userAgent" | "theme" | "viewport" | "focused">) {
  const full: RuntimeErrorRecord = {
    id: `rt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    route: currentRoute(),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    theme: detectTheme(),
    viewport: {
      w: typeof window !== "undefined" ? window.innerWidth : 0,
      h: typeof window !== "undefined" ? window.innerHeight : 0,
      dpr: typeof window !== "undefined" ? window.devicePixelRatio : 1,
    },
    focused: snapshotFocused(),
    ...entry,
  };

  const buf = [full, ...readBuffer()].slice(0, MAX_ITEMS);
  writeBuffer(buf);
  listeners.forEach((fn) => {
    try {
      fn(buf);
    } catch {
      /* noop */
    }
  });

  // Enriquecer Sentry com contexto do runtime
  try {
    Sentry.withScope((scope) => {
      scope.setTag("route", full.route);
      scope.setTag("theme", full.theme);
      scope.setContext("runtime", {
        route: full.route,
        theme: full.theme,
        viewport: full.viewport,
        focused: full.focused,
        userAgent: full.userAgent,
        type: full.type,
      });
      const err = new Error(full.message);
      err.stack = full.stack ?? err.stack;
      Sentry.captureException(err);
    });
  } catch {
    /* Sentry pode não estar iniciado */
  }

  // Console para debug local — nunca mascarar
  // eslint-disable-next-line no-console
  console.error(
    `[runtime-error] ${full.type} @ ${full.route}\n${full.message}`,
    full.stack ?? "",
  );

  return full;
}

let installed = false;

export function initRuntimeErrorLogger() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (ev: ErrorEvent) => {
    record({
      type: "error",
      message: ev.message || String(ev.error?.message ?? "unknown error"),
      stack: ev.error?.stack,
      source: ev.filename,
      lineno: ev.lineno,
      colno: ev.colno,
    });
  });

  window.addEventListener("unhandledrejection", (ev: PromiseRejectionEvent) => {
    const reason: any = ev.reason;
    const message =
      typeof reason === "string"
        ? reason
        : reason?.message ?? "Unhandled promise rejection";
    record({
      type: "unhandledrejection",
      message,
      stack: reason?.stack,
    });
  });
}

export function getRuntimeErrors(): RuntimeErrorRecord[] {
  return readBuffer();
}

export function clearRuntimeErrors() {
  writeBuffer([]);
  listeners.forEach((fn) => fn([]));
}

export function subscribeRuntimeErrors(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Exposição global para inspeção rápida em DevTools / testes E2E
if (typeof window !== "undefined") {
  (window as any).__cathedraRuntimeErrors = {
    get: getRuntimeErrors,
    clear: clearRuntimeErrors,
    subscribe: subscribeRuntimeErrors,
  };
}
