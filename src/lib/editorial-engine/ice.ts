/**
 * ICE Calculator — puro. Reproduz a fórmula usada em `EditorialAudit.tsx`
 * (ICE global = média(editorial, nexus), tiers Ouro ≥ 95 · Prata ≥ 85 · Bronze ≥ 70).
 *
 * Fica isolado aqui para que Santos, Orações, Coleções e Jornadas
 * calculem o mesmo score sem duplicar código.
 */

import type { EntityTotals } from "./types";

export type IceTier = "gold" | "silver" | "bronze" | "review";

export function iceTier(score: number): IceTier {
  if (score >= 95) return "gold";
  if (score >= 85) return "silver";
  if (score >= 70) return "bronze";
  return "review";
}

export function iceTierLabel(tier: IceTier): string {
  return tier === "gold" ? "Ouro"
    : tier === "silver" ? "Prata"
    : tier === "bronze" ? "Bronze"
    : "Revisão";
}

/** Média ponderada pelo `doctrinal_weight` do registro. */
export function weightedAverage(
  items: Array<{ score: number; doctrinal_weight?: number | null }>,
): number {
  if (items.length === 0) return 0;
  const sumW = items.reduce((s, r) => s + (r.doctrinal_weight || 1), 0);
  if (sumW === 0) return 0;
  return Math.round(
    items.reduce((s, r) => s + r.score * (r.doctrinal_weight || 1), 0) / sumW,
  );
}

export function aggregateTotals(rows: Array<{
  score: number;
  editorial_score: number;
  nexus_score: number;
  status: string;
  doctrinal_weight?: number | null;
}>): EntityTotals {
  const total = rows.length;
  const published = rows.filter(r => r.status === "published").length;
  const drafts = total - published;
  const gold = rows.filter(r => iceTier(r.score) === "gold").length;
  const silver = rows.filter(r => iceTier(r.score) === "silver").length;
  const bronze = rows.filter(r => iceTier(r.score) === "bronze").length;
  const needs_review = rows.filter(r => iceTier(r.score) === "review").length;
  const avg = total ? Math.round(rows.reduce((s, r) => s + r.score, 0) / total) : 0;
  const avg_editorial = total ? Math.round(rows.reduce((s, r) => s + r.editorial_score, 0) / total) : 0;
  const avg_nexus = total ? Math.round(rows.reduce((s, r) => s + r.nexus_score, 0) / total) : 0;
  const avg_weighted = weightedAverage(rows);
  return { total, published, drafts, gold, silver, bronze, needs_review, avg, avg_editorial, avg_nexus, avg_weighted };
}
