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

const INTERACTIVE_SELECTOR = 'button, a[href], [role="button"], [role="link"], [role="menuitem"], [role="tab"], input[type="submit"], input[type="button"]';

function describeElement(el: HTMLElement): string {
  // Prioridade: data-action explícito > data-testid > aria-label > texto > tag
  const explicit = el.getAttribute('data-action');
  if (explicit) return explicit;
  const testid = el.getAttribute('data-testid');
  if (testid) return `${el.tagName.toLowerCase()}:${testid}`;
  const label = el.getAttribute('aria-label');
  if (label) return `${el.tagName.toLowerCase()}:${label.slice(0, 60)}`;
  const text = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ');
  if (text) return `${el.tagName.toLowerCase()}:"${text.slice(0, 60)}"`;
  const href = el.getAttribute('href');
  if (href) return `a:${href}`;
  return el.tagName.toLowerCase();
}

function collectDataAttrs(el: HTMLElement): Record<string, string> | undefined {
  const out: Record<string, string> = {};
  for (const attr of Array.from(el.attributes)) {
    if (attr.name.startsWith('data-action-')) {
      out[attr.name.replace('data-action-', '')] = attr.value;
    }
  }
  return Object.keys(out).length ? out : undefined;
}

let installed = false;
export function initActionLogger() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  // Cliques: prioriza [data-action]; se ausente, cai para o interativo mais próximo
  document.addEventListener(
    'click',
    (ev) => {
      const target = ev.target as HTMLElement | null;
      if (!target?.closest) return;
      const withAction = target.closest('[data-action]') as HTMLElement | null;
      const el = withAction ?? (target.closest(INTERACTIVE_SELECTOR) as HTMLElement | null);
      if (!el) return;
      const name = withAction
        ? withAction.getAttribute('data-action')!
        : `click:${describeElement(el)}`;
      logAction(name, collectDataAttrs(el));
    },
    { capture: true, passive: true },
  );

  // Submits de formulário — captura o form inteiro, não apenas o botão
  document.addEventListener(
    'submit',
    (ev) => {
      const form = ev.target as HTMLFormElement | null;
      if (!form || form.tagName !== 'FORM') return;
      const name = form.getAttribute('data-action') ?? `submit:${describeElement(form)}`;
      const method = (form.getAttribute('method') || 'get').toLowerCase();
      const action = form.getAttribute('action') || window.location.pathname;
      logAction(name, { method, action, ...(collectDataAttrs(form) ?? {}) });
    },
    { capture: true, passive: true },
  );

  // Expõe no window para debug e testes E2E
  (window as unknown as { __cathedraActions?: unknown }).__cathedraActions = {
    get: getLastActions,
    log: logAction,
  };
}

