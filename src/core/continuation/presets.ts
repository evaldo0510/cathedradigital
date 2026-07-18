/**
 * Continuation presets — copy editorial por intent e por kind.
 *
 * Puro: strings + tokens. Sem React, sem ícones (ícones ficam na camada
 * visual, `src/components/shared/ReaderContinuation.presets.ts`).
 *
 * Trocar cópia = editar apenas este arquivo.
 */

import type { ContinuationIntent, ContinuationKind } from './types';

/** Sobrelinha curta exibida antes do rótulo da sugestão. */
export const INTENT_EYEBROW: Record<ContinuationIntent, string> = {
  study: 'Continuar estudando',
  deepen: 'Aprofundar',
  meet: 'Conheça',
  pray: 'Transformar em oração',
  apply: 'Colocar em prática',
  celebrate: 'Celebrar',
};

/** Título do bloco quando o grafo produz sugestões (variação por leitor). */
export const KIND_GRAPH_TITLE: Record<ContinuationKind, string> = {
  bible: 'Continue na Palavra',
  catechism: 'Aprofunde este ensinamento',
  magisterium: 'Continue este estudo',
  saint: 'Inspirado por este santo?',
  'journey-step': 'Seguir na formação',
};

/** Título do bloco quando o fallback editorial é usado. */
export const KIND_FALLBACK_TITLE: Record<ContinuationKind, string> = {
  bible: 'Continuar seu estudo',
  catechism: 'Próximo passo',
  magisterium: 'Aprofundar a contemplação',
  saint: 'Continuar pela comunhão dos santos',
  'journey-step': 'Seguir na formação',
};

/** Epígrafe editorial exibida abaixo do título. */
export const KIND_EPIGRAPH: Record<ContinuationKind, string> = {
  bible: '“A tua palavra é lâmpada para os meus pés.” — Sl 119,105',
  catechism: '“A leitura busca, a meditação encontra.” — Guigo, o Cartuxo',
  magisterium: '“Fides quaerens intellectum.” — Sto. Anselmo',
  saint: '“Ide, e fazei o mesmo.” — Lc 10,37',
  'journey-step': '“Corramos com perseverança a prova que nos está proposta.” — Hb 12,1',
};
