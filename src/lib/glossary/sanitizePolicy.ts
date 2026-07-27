/**
 * Política de sanitização por ambiente para o pipeline de FAQ do glossário.
 *
 * A rejeição dos campos obrigatórios do `FAQPage` (question/answer não vazios,
 * `@type` corretos) é **sempre** garantida — a política controla apenas a
 * severidade dos avisos e do comportamento em anomalias não fatais.
 *
 * - `dev`  → `warn`  · loga stack, expõe painéis de inspeção, mantém badge.
 * - `prod` → `strict` · silencioso, rejeita e emite métrica; nada em console.
 * - `test` → `throw` · dev pipeline agressivo (fail-fast em CI de unidade).
 */

export type SanitizeSeverity = 'warn' | 'strict' | 'throw';

/**
 * Versão da política de sanitização. Bump obrigatório sempre que:
 *  - as regras de descarte (schema Zod, sanitizers) mudarem;
 *  - o mapeamento env → severity mudar;
 *  - novos flags forem adicionados/removidos de `SanitizePolicy`.
 * Registrada no JSON-LD preview e nos exports para auditoria/reprodutibilidade.
 */
export const SANITIZE_POLICY_VERSION = '1.1.0';

export interface SanitizePolicy {
  /** Versão da política aplicada (semver). */
  version: string;
  env: 'dev' | 'prod' | 'test';
  severity: SanitizeSeverity;
  /** Loga descartes/normalizações no console. */
  verboseLogs: boolean;
  /** Expõe painéis de inspeção (raw/diff/jsonld) na UI. */
  exposeDevPanels: boolean;
  /** Envia métricas (`faq_sanitization`) para GA/Sentry. */
  emitMetrics: boolean;
}

function detectEnv(): 'dev' | 'prod' | 'test' {
  // Vitest
  if (typeof process !== 'undefined' && process.env?.VITEST) return 'test';
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') return 'test';
  // Vite
  try {
    const meta: any = (import.meta as any);
    if (meta?.env?.DEV) return 'dev';
    if (meta?.env?.PROD) return 'prod';
  } catch {
    // fallthrough
  }
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') return 'prod';
  return 'dev';
}

let cached: SanitizePolicy | null = null;

export function getSanitizePolicy(): SanitizePolicy {
  if (cached) return cached;
  const env = detectEnv();
  const base = { version: SANITIZE_POLICY_VERSION } as const;
  cached =
    env === 'prod'
      ? {
          ...base,
          env,
          severity: 'strict',
          verboseLogs: false,
          exposeDevPanels: false,
          emitMetrics: true,
        }
      : env === 'test'
        ? {
            ...base,
            env,
            severity: 'throw',
            verboseLogs: false,
            exposeDevPanels: false,
            emitMetrics: false,
          }
        : {
            ...base,
            env,
            severity: 'warn',
            verboseLogs: true,
            exposeDevPanels: true,
            emitMetrics: true,
          };
  return cached;
}

/** Reseta o cache — utilitário para testes. */
export function __resetSanitizePolicyForTests(override?: Partial<SanitizePolicy>) {
  if (!override) {
    cached = null;
    return;
  }
  const base = getSanitizePolicy();
  cached = { ...base, ...override };
}

/**
 * Reporta uma anomalia respeitando a severidade configurada.
 * Nunca lança em `warn`/`strict`; só lança em `throw` (usado em test).
 */
export function reportSanitizationIssue(
  scope: string,
  message: string,
  extra?: Record<string, unknown>,
) {
  const policy = getSanitizePolicy();
  const payload = { scope, message, ...extra };
  if (policy.severity === 'throw') {
    throw new Error(`[${scope}] ${message} :: ${JSON.stringify(extra ?? {})}`);
  }
  if (policy.severity === 'warn') {
    console.warn(`[${scope}]`, message, payload);
    return;
  }
  // strict: apenas error estruturado (interceptado por Sentry em prod).
  console.error(`[${scope}]`, message, payload);
}
