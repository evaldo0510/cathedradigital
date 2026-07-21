/**
 * logAction — registra a "última ação" do usuário como breadcrumb no Sentry
 * e adiciona ao ring buffer do runtimeErrorLogger, para que qualquer exceção
 * subsequente traga o contexto do que o usuário estava fazendo.
 *
 * Uso:
 *   import { logAction } from '@/lib/observability/logAction';
 *   <Button onClick={() => { logAction('rosary.start', { mode: 'contemplativo' }); startRosary(); }}>
 *
 * Também acopla listeners globais que registram cliques em elementos com
 * `data-action="..."` — para instrumentação declarativa sem edição de handlers.
 */
import * as Sentry from '@sentry/react';

export interface ActionRecord {
  name: string;
  route: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

const KEY = 'cathedra:last-actions:v1';
const MAX = 20;

function readBuf(): ActionRecord[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ActionRecord[]) : [];
  } catch {
    return [];
  }
}

function writeBuf(list: ActionRecord[]) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* quota — ignora */
  }
}

export function logAction(name: string, data?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const rec: ActionRecord = {
    name,
    route: window.location.pathname + window.location.search,
    timestamp: new Date().toISOString(),
    data,
  };
  writeBuf([rec, ...readBuf()]);

  // Breadcrumb no Sentry — aparece cronologicamente antes do erro.
  try {
    Sentry.addBreadcrumb({
      category: 'user-action',
      message: name,
      level: 'info',
      data: { route: rec.route, ...(data ?? {}) },
    });
    Sentry.setTag('last_action', name);
  } catch {
    /* Sentry pode não estar iniciado */
  }

  // Console em dev
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug(`[action] ${name}`, rec.route, data ?? '');
  }
}

export function getLastActions(): ActionRecord[] {
  return readBuf();
}

let installed = false;
export function initActionLogger() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  // Captura declarativa: qualquer clique em elemento com data-action
  document.addEventListener(
    'click',
    (ev) => {
      const target = ev.target as HTMLElement | null;
      const el = target?.closest?.('[data-action]') as HTMLElement | null;
      if (!el) return;
      const name = el.getAttribute('data-action');
      if (!name) return;
      const dataAttrs: Record<string, string> = {};
      for (const attr of Array.from(el.attributes)) {
        if (attr.name.startsWith('data-action-')) {
          dataAttrs[attr.name.replace('data-action-', '')] = attr.value;
        }
      }
      logAction(name, Object.keys(dataAttrs).length ? dataAttrs : undefined);
    },
    { capture: true, passive: true },
  );

  // Expõe no window para debug e testes E2E
  (window as unknown as { __cathedraActions?: unknown }).__cathedraActions = {
    get: getLastActions,
    log: logAction,
  };
}
