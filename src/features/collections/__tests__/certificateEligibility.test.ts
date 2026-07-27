import { describe, it, expect } from 'vitest';
import {
  computeCertificateStatus,
  computeItemLockStates,
  type ProgressMap,
} from '../certificateEligibility';
import type {
  Collection,
  CollectionItem,
  CollectionProgressStatus,
} from '../types';

function makeItem(
  id: string,
  order: number,
  opts: Partial<CollectionItem> = {},
): CollectionItem {
  return {
    id,
    collection_id: 'col-1',
    item_type: 'glossary',
    item_slug: `slug-${id}`,
    order_index: order,
    title_override: null,
    description_override: null,
    metadata: {},
    is_locked_until_prev: null,
    ...opts,
  };
}

function makeProgress(
  entries: Record<string, CollectionProgressStatus>,
): ProgressMap {
  const map: ProgressMap = {};
  for (const [id, status] of Object.entries(entries)) map[id] = { status };
  return map;
}

const eligibleCollection = {
  certificate_eligible: true,
  prerequisites: null,
} as Partial<Collection> as Collection;

const nonEligibleCollection = {
  certificate_eligible: false,
  prerequisites: null,
} as Partial<Collection> as Collection;

const items3 = [
  makeItem('a', 0),
  makeItem('b', 1, { is_locked_until_prev: true }),
  makeItem('c', 2, { is_locked_until_prev: true }),
];

describe('computeItemLockStates', () => {
  it('primeiro item nunca é bloqueado', () => {
    const states = computeItemLockStates(items3, makeProgress({}));
    expect(states[0].locked).toBe(false);
    expect(states[1].locked).toBe(true);
    expect(states[1].blockingItemSlug).toBe('slug-a');
  });

  it('desbloqueia sequencialmente conforme conclusão', () => {
    const states = computeItemLockStates(
      items3,
      makeProgress({ a: 'completed' }),
    );
    expect(states[1].locked).toBe(false);
    expect(states[2].locked).toBe(true);
    expect(states[2].blockingItemSlug).toBe('slug-b');
  });

  it('propaga bloqueio em cascata', () => {
    // b não bloqueia (is_locked_until_prev=false), mas c depende de b.
    const items = [
      makeItem('a', 0),
      makeItem('b', 1, { is_locked_until_prev: false }),
      makeItem('c', 2, { is_locked_until_prev: true }),
    ];
    const states = computeItemLockStates(items, makeProgress({}));
    expect(states[1].locked).toBe(false); // sem flag
    expect(states[2].locked).toBe(true); // b não concluído
  });

  it('itens sem is_locked_until_prev nunca bloqueiam', () => {
    const items = [makeItem('a', 0), makeItem('b', 1)];
    const states = computeItemLockStates(items, makeProgress({}));
    expect(states.every((s) => !s.locked)).toBe(true);
  });
});

describe('computeCertificateStatus · elegibilidade', () => {
  it('coleção sem certificate_eligible retorna not_eligible', () => {
    const status = computeCertificateStatus(
      nonEligibleCollection,
      items3,
      makeProgress({}),
    );
    expect(status.eligible).toBe(false);
    expect(status.blockingReason).toBe('not_eligible');
    expect(status.done).toBe(false);
  });

  it('coleção elegível sem itens retorna no_items', () => {
    const status = computeCertificateStatus(eligibleCollection, [], makeProgress({}));
    expect(status.eligible).toBe(true);
    expect(status.blockingReason).toBe('no_items');
    expect(status.done).toBe(false);
  });
});

describe('computeCertificateStatus · progresso', () => {
  it('progresso zero → items_locked (há bloqueios pendentes)', () => {
    const status = computeCertificateStatus(
      eligibleCollection,
      items3,
      makeProgress({}),
    );
    expect(status.completed).toBe(0);
    expect(status.pct).toBe(0);
    expect(status.blockingReason).toBe('items_locked');
    expect(status.nextActionable?.item.id).toBe('a');
  });

  it('progresso parcial atualiza pct e nextActionable', () => {
    const status = computeCertificateStatus(
      eligibleCollection,
      items3,
      makeProgress({ a: 'completed' }),
    );
    expect(status.completed).toBe(1);
    expect(status.pct).toBe(33);
    expect(status.nextActionable?.item.id).toBe('b');
    expect(status.blockingReason).toBe('items_locked'); // c ainda bloqueado
  });

  it('todos itens desbloqueados mas não concluídos → items_pending', () => {
    const items = [makeItem('a', 0), makeItem('b', 1), makeItem('c', 2)];
    const status = computeCertificateStatus(
      eligibleCollection,
      items,
      makeProgress({ a: 'completed' }),
    );
    expect(status.blockingReason).toBe('items_pending');
  });

  it('conclusão total marca done e limpa blockingReason', () => {
    const status = computeCertificateStatus(
      eligibleCollection,
      items3,
      makeProgress({ a: 'completed', b: 'completed', c: 'completed' }),
    );
    expect(status.done).toBe(true);
    expect(status.pct).toBe(100);
    expect(status.blockingReason).toBeNull();
    expect(status.nextActionable).toBeUndefined();
  });

  it('status reading/meditating não conta como concluído', () => {
    const status = computeCertificateStatus(
      eligibleCollection,
      items3,
      makeProgress({ a: 'reading', b: 'meditating' }),
    );
    expect(status.completed).toBe(0);
    expect(status.done).toBe(false);
  });
});

describe('computeCertificateStatus · critérios', () => {
  it('critério de completar todos só é atendido quando done=true', () => {
    const partial = computeCertificateStatus(
      eligibleCollection,
      items3,
      makeProgress({ a: 'completed' }),
    );
    expect(partial.criteria.find((c) => c.id === 'complete_all_items')?.met).toBe(
      false,
    );

    const complete = computeCertificateStatus(
      eligibleCollection,
      items3,
      makeProgress({ a: 'completed', b: 'completed', c: 'completed' }),
    );
    expect(
      complete.criteria.find((c) => c.id === 'complete_all_items')?.met,
    ).toBe(true);
  });

  it('critério "respeitar ordem" é atendido quando não há bloqueios ativos', () => {
    const items = [makeItem('a', 0), makeItem('b', 1)];
    const status = computeCertificateStatus(
      eligibleCollection,
      items,
      makeProgress({}),
    );
    expect(status.criteria.find((c) => c.id === 'respect_order')?.met).toBe(true);
  });

  it('critério "respeitar ordem" falha enquanto houver bloqueios e trilha incompleta', () => {
    const status = computeCertificateStatus(
      eligibleCollection,
      items3,
      makeProgress({}),
    );
    expect(status.criteria.find((c) => c.id === 'respect_order')?.met).toBe(
      false,
    );
  });

  it('inclui critério de pré-requisitos quando coleção declara', () => {
    const withPrereqs = {
      certificate_eligible: true,
      prerequisites: ['Ter lido o Credo'],
    } as Partial<Collection> as Collection;
    const status = computeCertificateStatus(
      withPrereqs,
      items3,
      makeProgress({ a: 'completed' }),
    );
    expect(
      status.criteria.find((c) => c.id === 'has_prerequisites'),
    ).toBeDefined();
  });

  it('não inclui critério de pré-requisitos quando lista vazia', () => {
    const status = computeCertificateStatus(
      eligibleCollection,
      items3,
      makeProgress({}),
    );
    expect(
      status.criteria.find((c) => c.id === 'has_prerequisites'),
    ).toBeUndefined();
  });
});
