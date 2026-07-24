/**
 * Sprint B.1 · Onda B.1.4 — Ranking híbrido (lexical + semântico).
 *
 * Regra de ouro (definida no plano B.1.4):
 *   Final Score =
 *     40% relevância textual
 *   + 25% semanticScore (0-1 → 0-100)
 *   + 20% doctrinalWeight
 *   + 15% (Nexus + ICE)
 *
 * A Cathedra não é Google: um conteúdo doutrinariamente mais denso deve
 * aparecer mesmo com relevância textual moderada. O semantic adapter (MCP)
 * enriquece, nunca controla.
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

/** Escala peso doutrinal (catálogo usa 5-15) para 0-100. */
function doctrinalScore(module: LibraryModule): number {
  const w = doctrinalWeight(module);
  return Math.min(100, (w / 15) * 100);
}

/** ICE + Nexus combinados em uma escala 0-100. */
function nexusIceScore(status?: LibraryIce, nexusTotal?: number): number {
  const ice = (iceWeight(status) / 10) * 100; // 0-100
  const nex = (nexusWeight(nexusTotal) / 15) * 100; // 0-100
  return ice * 0.5 + nex * 0.5;
}

export interface HybridScoreInput {
  query: string;
  module: LibraryModule;
  title: string;
  excerpt?: string;
  editorialStatus?: LibraryIce;
  nexusTotal?: number;
  /** 0-1 vindo do adapter semântico (MCP). */
  semanticScore?: number;
}

export interface HybridScoreBreakdown {
  score: number;
  textRelevance: number;
  semanticScore: number;
  doctrinal: number;
  nexusIce: number;
}

/**
 * Composição híbrida oficial da Biblioteca (B.1.4).
 * Retorna score 0-100 + breakdown para diagnóstico e futuro Mission Control.
 */
export function composeHybridScore(input: HybridScoreInput): HybridScoreBreakdown {
  const t = textRelevance(input.query, input.title, input.excerpt);
  const sem = Math.max(0, Math.min(1, input.semanticScore ?? 0)) * 100;
  const doc = doctrinalScore(input.module);
  const nix = nexusIceScore(input.editorialStatus, input.nexusTotal);

  const score = t * 0.4 + sem * 0.25 + doc * 0.2 + nix * 0.15;
  return {
    score: Math.round(score * 10) / 10,
    textRelevance: t,
    semanticScore: sem,
    doctrinal: doc,
    nexusIce: nix,
  };
}

// ── Compat B.1.2 — mantido para chamadas antigas até migração completa. ──
export interface ComposeScoreInput {
  query: string;
  module: LibraryModule;
  title: string;
  excerpt?: string;
  editorialStatus?: LibraryIce;
  nexusTotal?: number;
}

export function composeScore(input: ComposeScoreInput): { score: number; textRelevance: number } {
  const h = composeHybridScore(input);
  return { score: h.score, textRelevance: h.textRelevance };
}
