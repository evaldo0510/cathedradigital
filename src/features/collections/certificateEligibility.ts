/**
 * Certificate eligibility — lógica pura de status/critérios para trilhas
 * `certificate_eligible`. Extraída para permitir testes unitários sem
 * mocks pesados de react-query/supabase/router.
 *
 * Fluxo:
 *  1. computeItemLockState — respeita `is_locked_until_prev` em cascata.
 *  2. computeCertificateStatus — agrega progresso + bloqueios + critérios.
 *
 * Regras:
 *  - Se `collection.certificate_eligible !== true` → `eligible=false`.
 *  - Item bloqueado quando o anterior não foi concluído E marca
 *    `is_locked_until_prev`. Bloqueios se propagam em cascata.
 *  - `done` só é true quando TODOS os itens (bloqueados inclusive) estão
 *    `completed`.
 *  - `blockingItem` aponta o próximo item pendente relevante para orientar
 *    a UI ("Conclua X para desbloquear").
 */
import type {
  Collection,
  CollectionItem,
  CollectionProgressRow,
  CollectionProgressStatus,
} from './types';

export type ProgressMap = Record<string, Pick<CollectionProgressRow, 'status'>>;

export interface ItemLockState {
  item: CollectionItem;
  status: CollectionProgressStatus;
  locked: boolean;
  /** Slug/título do item que precisa ser concluído para liberar este. */
  blockingItemSlug?: string;
}

export interface CertificateCriterion {
  id:
    | 'complete_all_items'
    | 'register_reading'
    | 'respect_order'
    | 'has_prerequisites';
  label: string;
  met: boolean;
}

export interface CertificateStatus {
  eligible: boolean;
  total: number;
  completed: number;
  pct: number;
  done: boolean;
  itemStates: ItemLockState[];
  /** Próximo item pendente (ordem guiada), pulando bloqueados atrás. */
  nextActionable?: ItemLockState;
  criteria: CertificateCriterion[];
  /**
   * Motivo pelo qual o certificado ainda não foi concedido, quando aplicável.
   * `null` quando `done=true` ou quando a coleção não é elegível.
   */
  blockingReason:
    | null
    | 'not_eligible'
    | 'no_items'
    | 'items_pending'
    | 'items_locked';
}

export function getItemStatus(
  progress: ProgressMap,
  itemId: string,
): CollectionProgressStatus {
  return progress[itemId]?.status ?? 'not_started';
}

export function computeItemLockStates(
  items: CollectionItem[],
  progress: ProgressMap,
): ItemLockState[] {
  const out: ItemLockState[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const status = getItemStatus(progress, item.id);
    const prev = i > 0 ? items[i - 1] : undefined;
    const prevState = prev ? out[i - 1] : undefined;
    const prevCompleted = prev
      ? getItemStatus(progress, prev.id) === 'completed'
      : true;
    // Bloqueio propaga: se o anterior está bloqueado, este também fica.
    const locked =
      !!item.is_locked_until_prev && (!prevCompleted || !!prevState?.locked);
    out.push({
      item,
      status,
      locked,
      blockingItemSlug: locked ? prev?.item_slug : undefined,
    });
  }
  return out;
}

export function computeCertificateStatus(
  collection: Pick<Collection, 'certificate_eligible' | 'prerequisites'> | null | undefined,
  items: CollectionItem[],
  progress: ProgressMap,
): CertificateStatus {
  const eligible = collection?.certificate_eligible === true;
  const total = items.length;
  const itemStates = computeItemLockStates(items, progress);
  const completed = itemStates.filter((s) => s.status === 'completed').length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const done = total > 0 && completed === total;
  const hasLocked = itemStates.some((s) => s.locked);
  const hasPrereqs =
    Array.isArray(collection?.prerequisites) &&
    (collection?.prerequisites?.length ?? 0) > 0;

  const nextActionable = itemStates.find(
    (s) => s.status !== 'completed' && !s.locked,
  );

  const criteria: CertificateCriterion[] = [
    {
      id: 'complete_all_items',
      label: `Concluir todos os ${total} conteúdos da trilha`,
      met: done,
    },
    {
      id: 'register_reading',
      label:
        'Registrar leitura de cada capítulo (marcar como concluído)',
      met: completed > 0,
    },
    {
      id: 'respect_order',
      label:
        'Respeitar a ordem guiada (itens bloqueados desbloqueiam em cascata)',
      met: !hasLocked || done,
    },
  ];

  if (hasPrereqs) {
    criteria.push({
      id: 'has_prerequisites',
      label: 'Reconhecer os pré-requisitos recomendados antes de iniciar',
      met: completed > 0,
    });
  }

  let blockingReason: CertificateStatus['blockingReason'] = null;
  if (!eligible) blockingReason = 'not_eligible';
  else if (total === 0) blockingReason = 'no_items';
  else if (!done && hasLocked) blockingReason = 'items_locked';
  else if (!done) blockingReason = 'items_pending';

  return {
    eligible,
    total,
    completed,
    pct,
    done,
    itemStates,
    nextActionable,
    criteria,
    blockingReason,
  };
}
