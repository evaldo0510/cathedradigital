/**
 * resolveClosure — normaliza um row com `editorial_closure` em props
 * consumíveis pelo componente <EditorialClosure/>.
 *
 * Delega toda a validação para o schema Zod em `closureSchema.ts`,
 * que aplica estratégia de retries (strict → aliases → string fallback).
 *
 * Nunca lança — em caso de falha crítica retorna null.
 */
import type {
  EditorialClosureProps,
} from '@/components/reader/EditorialClosure';
import {
  validateEditorialClosure,
  type ClosureValidationReport,
} from './closureSchema';

type ClosureLike = {
  editorial_closure?: unknown;
} & Record<string, unknown>;

export function resolveEditorialClosure(
  source: ClosureLike | null | undefined,
): EditorialClosureProps | null {
  const report = validateEditorialClosure(source?.editorial_closure);
  if (!report.ok || !report.data) {
    if (report.warnings.length && typeof console !== 'undefined') {
      // Silencioso em prod — apenas debug.
      // console.debug('[resolveEditorialClosure]', report.warnings);
    }
    return null;
  }
  const d = report.data;
  return {
    reflection: d.reflection || undefined,
    application: d.application || undefined,
    prayer: d.prayer || undefined,
    next: d.next as EditorialClosureProps['next'],
    nexus: d.nexus as EditorialClosureProps['nexus'],
    source: d.source,
  };
}

/** Variante que devolve também o relatório — usada pelo admin validator. */
export function resolveEditorialClosureWithReport(
  source: ClosureLike | null | undefined,
): { props: EditorialClosureProps | null; report: ClosureValidationReport } {
  const report = validateEditorialClosure(source?.editorial_closure);
  const props = resolveEditorialClosure(source);
  return { props, report };
}
