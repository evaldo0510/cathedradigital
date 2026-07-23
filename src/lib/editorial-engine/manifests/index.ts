/**
 * Editorial Engine · Registry de entidades.
 *
 * O registry é código versionado (não uma tabela): decisões de campos, pesos e
 * gate viajam com o repositório. Novas entidades são adicionadas registrando
 * seu manifesto aqui.
 */

import type { EntityManifest } from "../types";
import { glossaryManifest } from "./glossary.manifest";

/** Placeholder para entidades ainda não plugadas (`ready: false`). Serão preenchidos nas próximas sprints. */
const placeholder = (id: string, label: string, shortLabel: string, icon: string, weight: number): EntityManifest => ({
  id, label, shortLabel, icon, weight,
  table: "", slugField: "", titleField: "", statusField: "",
  auditRoute: `/admin/editorial-audit?entity=${id}`,
  ready: false,
  fields: [],
});

export const editorialRegistry: EntityManifest[] = [
  glossaryManifest,
  placeholder("saints",      "Santos",            "Santos",     "Users",      9),
  placeholder("prayers",     "Orações",           "Orações",    "Heart",      8),
  placeholder("collections", "Coleções",          "Coleções",   "Library",    7),
  placeholder("journeys",    "Jornadas",          "Jornadas",   "Compass",    7),
];

export function getManifest(id: string): EntityManifest | undefined {
  return editorialRegistry.find(m => m.id === id);
}

export function requireManifest(id: string): EntityManifest {
  const m = getManifest(id);
  if (!m) throw new Error(`[editorial-engine] manifest não registrado: ${id}`);
  return m;
}

export { glossaryManifest };
