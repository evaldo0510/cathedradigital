/**
 * Freeze Manager — critérios de congelamento e hash de certificação por entidade.
 * Puro. Reproduz `freezeCriteria` + hash usados hoje em `EditorialAudit.tsx`.
 */

import type { EntityTotals } from "./types";

export interface FreezeCriterion {
  key: string;
  label: string;
  ok: boolean;
}

export function computeFreezeCriteria(totals: EntityTotals): FreezeCriterion[] {
  const totalPublished = totals.published === totals.total && totals.total > 0;
  return [
    { key: "gold",       label: "100% ICE Ouro",           ok: totals.total > 0 && totals.gold === totals.total },
    { key: "editorial",  label: "Média Editorial ≥ 95",    ok: totals.avg_editorial >= 95 },
    { key: "nexus",      label: "Média Nexus ≥ 95",        ok: totals.avg_nexus >= 95 },
    { key: "no_review",  label: "Zero verbetes em Revisão", ok: totals.needs_review === 0 },
    { key: "published",  label: "Todos publicados",         ok: totalPublished },
  ];
}

export function isFrozen(totals: EntityTotals): boolean {
  return computeFreezeCriteria(totals).every(c => c.ok);
}

/** Hash determinístico da certificação (curto, imutável para o mesmo snapshot). */
export function certificationHash(input: {
  entity: string;
  version: string;
  total: number;
  weighted_ice: number;
  relation_count: number;
  captured_at: string | null | undefined;
}): string {
  const raw = `${input.entity}|${input.version}|${input.total}|${input.weighted_ice}|${input.relation_count}|${input.captured_at ?? ""}`;
  // btoa é o mesmo usado no painel atual; browser + Deno o expõem globalmente.
  return btoa(raw).replace(/[+/=]/g, "").slice(0, 16).toUpperCase();
}
