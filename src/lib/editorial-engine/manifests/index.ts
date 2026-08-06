/**
 * Editorial Engine · Registry de entidades.
 *
 * Registry versionado em código. Todo manifesto passa por `validateManifest`
 * antes de ser exposto — um manifesto inválido derruba o registry na inicialização
 * (fail-fast), impedindo que entidades incompletas entrem em produção.
 */

import type { EntityManifest } from "../types";
import { glossaryManifest } from "./glossary.manifest";
import { saintsManifest } from "./saints.manifest";
import { journeysManifest } from "./journeys.manifest";
import { collectionsManifest } from "./collections.manifest";
import { prayersManifest } from "./prayers.manifest";
import { catechismManifest } from "./catechism.manifest";
import { bibleManifest } from "./bible.manifest";
import { liturgyManifest } from "./liturgy.manifest";
import { patristicManifest } from "./patristic.manifest";
import { magisteriumManifest } from "./magisterium.manifest";
import { popesManifest } from "./popes.manifest";
import { dogmasManifest } from "./dogmas.manifest";
import { historyManifest } from "./history.manifest";
import { assertValidManifest, validateManifest } from "../validate-manifest";

/** Placeholder para entidades ainda não plugadas (`ready: false`). */
const placeholder = (id: string, label: string, shortLabel: string, icon: string, weight: number): EntityManifest => ({
  id, label, shortLabel, icon, weight,
  table: "", slugField: "", titleField: "", statusField: "",
  auditRoute: `/admin/editorial-audit?entity=${id}`,
  ready: false,
  fields: [],
  lifecycle: { version: "0.0", status: "placeholder", certification: false, migration: 0 },
});

const rawRegistry: EntityManifest[] = [
  glossaryManifest,
  saintsManifest,
  journeysManifest,
  collectionsManifest,
  prayersManifest,
  catechismManifest,
  bibleManifest,
  liturgyManifest,
  patristicManifest,
  magisteriumManifest,
  popesManifest,
  dogmasManifest,
  historyManifest,
];

// Fail-fast: qualquer manifesto inválido derruba o boot do módulo.
for (const m of rawRegistry) assertValidManifest(m);

export const editorialRegistry: EntityManifest[] = rawRegistry;

export function getManifest(id: string): EntityManifest | undefined {
  return editorialRegistry.find(m => m.id === id);
}

export function requireManifest(id: string): EntityManifest {
  const m = getManifest(id);
  if (!m) throw new Error(`[editorial-engine] manifest não registrado: ${id}`);
  assertValidManifest(m);
  return m;
}

/** Diagnóstico usado pelo Mission Control para exibir avisos. */
export function auditRegistry() {
  return editorialRegistry.map(m => ({ id: m.id, ...validateManifest(m) }));
}

export { 
  glossaryManifest, 
  saintsManifest, 
  journeysManifest, 
  collectionsManifest, 
  prayersManifest, 
  catechismManifest,
  bibleManifest,
  liturgyManifest,
  patristicManifest,
  magisteriumManifest,
  popesManifest,
  dogmasManifest,
  historyManifest
};

