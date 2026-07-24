/**
 * resolveClosure — normaliza um row de conteúdo em props do EditorialClosure.
 *
 * Toda tabela editorial (glossary, saints, prayers, catechism_official,
 * saint_works) recebeu a coluna `editorial_closure JSONB` no formato:
 *   { reflection, application, prayer, next?: { label, href, kicker? } }
 *
 * Este helper aceita qualquer objeto (row de banco, DTO, mock) e devolve
 * as props tipadas — ou `null` quando a peça ainda não tem closure editorial.
 * Assim os leitores renderizam `<EditorialClosure>` apenas quando existe
 * conteúdo curado (nunca placeholders vazios ou genéricos de IA).
 */
import type { EditorialClosureProps } from '@/components/reader/EditorialClosure';

type ClosureLike = {
  editorial_closure?: unknown;
} & Record<string, unknown>;

export function resolveEditorialClosure(
  source: ClosureLike | null | undefined,
): EditorialClosureProps | null {
  const raw = source?.editorial_closure;
  if (!raw || typeof raw !== 'object') return null;

  const c = raw as Record<string, unknown>;
  const reflection = typeof c.reflection === 'string' ? c.reflection.trim() : '';
  const application = typeof c.application === 'string' ? c.application.trim() : '';
  const prayer = typeof c.prayer === 'string' ? c.prayer.trim() : '';

  if (!reflection || !application || !prayer) return null;

  const nextRaw = c.next as Record<string, unknown> | undefined;
  const next =
    nextRaw && typeof nextRaw.label === 'string' && typeof nextRaw.href === 'string'
      ? {
          label: nextRaw.label,
          href: nextRaw.href,
          kicker: typeof nextRaw.kicker === 'string' ? nextRaw.kicker : undefined,
        }
      : undefined;

  return { reflection, application, prayer, next };
}
