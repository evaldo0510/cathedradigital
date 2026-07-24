/**
 * Sprint B.1 · Onda B.1.2 — Ranking composto.
 *
 * Score final = relevância textual + peso doutrinal + ICE + nexus.
 * Nada de heurísticas escondidas nos searchers — a fusão vive aqui.
 */
import type { LibraryIce, LibraryModule } from '../types';
import { LIBRARY_MODULE_META } from './moduleMeta';

const normalize = (v: string) =>
  v.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

/** 0-100 baseado em posição/inclusão do termo no título e no excerpt. */
export function textRelevance(query: string, title: string, excerpt?: string): number {
  const q = normalize(query);
  if (!q) return 0;
  const t = normalize(title);
  const e = excerpt ? normalize(excerpt) : '';

  if (t === q) return 100;
  if (t.startsWith(q)) return 85;
  if (t.includes(` ${q}`) || t.includes(`${q} `)) return 72;
  if (t.includes(q)) return 60;
  if (e.startsWith(q)) return 45;
  if (e.includes(q)) return 32;
  return 5;
}

export function iceWeight(status?: LibraryIce): number {
  if (status === 'complete') return 10;
  if (status === 'review') return 6;
  if (status === 'draft') return 2;
  return 0;
}

export function nexusWeight(total?: number): number {
  if (!total) return 0;
  return Math.min(total * 1.5, 15);
}

export function doctrinalWeight(module: LibraryModule): number {
  return LIBRARY_MODULE_META[module].doctrinalWeight;
}

export interface ComposeScoreInput {
  query: string;
  module: LibraryModule;
  title: string;
  excerpt?: string;
  editorialStatus?: LibraryIce;
  nexusTotal?: number;
}

export function composeScore(input: ComposeScoreInput): { score: number; textRelevance: number } {
  const t = textRelevance(input.query, input.title, input.excerpt);
  const score =
    t +
    doctrinalWeight(input.module) +
    iceWeight(input.editorialStatus) +
    nexusWeight(input.nexusTotal);
  return { score: Math.round(score * 10) / 10, textRelevance: t };
}
