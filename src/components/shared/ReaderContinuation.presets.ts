/**
 * ReaderContinuation.presets — copy e ícones por intent (Sprint 2).
 *
 * Trocar copy = editar apenas este arquivo. Zero lógica.
 */
import type React from 'react';
import { Icons } from '@/constants';
import type { ContinuationIntent } from '@/core/knowledge';

/** Ícone por intent. */
export const INTENT_ICON: Record<ContinuationIntent, React.ComponentType<{ className?: string }>> = {
  study: Icons.Book,
  deepen: Icons.Church,
  pray: Icons.Flame,
  apply: Icons.Map,
  meet: Icons.User,
};

/**
 * Título editorial por kind da leitura atual.
 * Usado quando o motor do grafo produz sugestões (variação por leitor).
 */
export const KIND_GRAPH_TITLE: Record<string, string> = {
  bible: 'Continue na Palavra',
  catechism: 'Aprofunde este ensinamento',
  magisterium: 'Continue este estudo',
  saint: 'Inspirado por este santo?',
  'journey-step': 'Seguir na formação',
};
