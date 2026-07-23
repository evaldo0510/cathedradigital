/**
 * Manifest Validation (Sprint 6.2.1) — gate defensivo do Editorial Engine.
 *
 * Um manifesto inválido nunca deve entrar em produção. Este validador é puro
 * (sem I/O) e cobre os 6 critérios canônicos:
 *   1. Manifest válido (campos-chave presentes)
 *   2. Campos obrigatórios (pelo menos 1 editorial + 1 nexus)
 *   3. Pesos somando corretamente (todos > 0, sem NaN)
 *   4. Gate consistente (referências às colunas existem)
 *   5. Freeze configurado (weight > 0, lifecycle definido para módulos ready)
 *   6. Generator registrado (só para entidades `ready`)
 *
 * `assertValidManifest` é chamado dentro de `requireManifest` para blindar o registry.
 */

import type { EntityManifest } from "./types";

export interface ManifestValidationIssue {
  code: string;
  level: "error" | "warn";
  message: string;
}

export interface ManifestValidationResult {
  valid: boolean;
  errors: ManifestValidationIssue[];
  warnings: ManifestValidationIssue[];
}

/** Geradores registrados no Editorial Engine. Sincronizar com `supabase/functions/editorial-generate/index.ts`. */
export const REGISTERED_GENERATORS = new Set<string>(["glossary", "saints", "journeys", "collections", "prayers", "catechism"]);

const ID_PATTERN = /^[a-z][a-z0-9_-]{1,40}$/;

export function validateManifest(m: EntityManifest): ManifestValidationResult {
  const errors: ManifestValidationIssue[] = [];
  const warnings: ManifestValidationIssue[] = [];
  const err = (code: string, message: string) => errors.push({ code, level: "error", message });
  const warn = (code: string, message: string) => warnings.push({ code, level: "warn", message });

  // 1. Manifest válido — chaves obrigatórias
  if (!m.id || !ID_PATTERN.test(m.id)) {
    err("invalid_id", `id inválido: "${m.id}" (deve casar ${ID_PATTERN}).`);
  }
  if (!m.label?.trim()) err("missing_label", "label é obrigatório.");
  if (!m.shortLabel?.trim()) err("missing_short_label", "shortLabel é obrigatório.");
  if (!m.auditRoute?.startsWith("/")) err("invalid_audit_route", "auditRoute deve ser rota absoluta.");
  if (!m.icon?.trim()) warn("missing_icon", "icon vazio — Mission Control usará fallback.");

  // Entidades ready precisam de tabela + campos-chave; placeholders podem ficar sem eles.
  if (m.ready) {
    if (!m.table?.trim())       err("missing_table",  "table é obrigatório para entidades ready.");
    if (!m.slugField?.trim())   err("missing_slug",   "slugField é obrigatório para entidades ready.");
    if (!m.titleField?.trim())  err("missing_title",  "titleField é obrigatório para entidades ready.");
    if (!m.statusField?.trim()) err("missing_status", "statusField é obrigatório para entidades ready.");
  }

  // 2. Campos obrigatórios — pelo menos 1 editorial + 1 nexus quando ready
  if (m.ready) {
    const editorial = m.fields.filter(f => f.group === "editorial");
    const nexus = m.fields.filter(f => f.group === "nexus");
    if (editorial.length === 0) err("no_editorial_fields", "manifest ready precisa de ao menos 1 campo editorial.");
    if (nexus.length === 0) err("no_nexus_fields", "manifest ready precisa de ao menos 1 campo nexus.");
    if (editorial.filter(f => f.required).length === 0) {
      warn("no_required_editorial", "nenhum campo editorial marcado como required.");
    }
  }

  // 3. Pesos — todos numéricos, > 0, sem NaN; keys únicas
  const seen = new Set<string>();
  for (const f of m.fields) {
    if (!f.key?.trim()) { err("field_missing_key", "campo sem key."); continue; }
    if (seen.has(f.key)) err("field_duplicate_key", `campo duplicado: "${f.key}".`);
    seen.add(f.key);
    const w = f.weight ?? 1;
    if (typeof w !== "number" || !Number.isFinite(w) || w <= 0) {
      err("field_invalid_weight", `campo "${f.key}" tem weight inválido (${w}).`);
    }
    if (!["editorial", "nexus", "meta"].includes(f.group)) {
      err("field_invalid_group", `campo "${f.key}" tem group inválido: ${f.group}.`);
    }
  }

  // Soma total dos pesos > 0 por grupo relevante
  if (m.ready) {
    const sum = (g: string) => m.fields.filter(f => f.group === g).reduce((s, f) => s + (f.weight ?? 1), 0);
    if (sum("editorial") <= 0) err("weights_editorial_zero", "soma de pesos editoriais deve ser > 0.");
    if (sum("nexus") <= 0)     err("weights_nexus_zero",     "soma de pesos nexus deve ser > 0.");
  }

  // 4. Gate consistente — peso doutrinário válido
  if (typeof m.weight !== "number" || !Number.isFinite(m.weight) || m.weight <= 0) {
    err("invalid_module_weight", `weight do módulo deve ser > 0 (recebido ${m.weight}).`);
  } else if (m.weight > 10) {
    warn("module_weight_out_of_range", "weight > 10 é incomum; convencionamos 1–10.");
  }

  // 5. Freeze / lifecycle — ready deve declarar lifecycle
  if (m.ready) {
    if (!m.lifecycle) {
      warn("missing_lifecycle", "entidade ready sem lifecycle — Mission Control mostrará defaults.");
    } else {
      const { version, status, migration } = m.lifecycle;
      if (!version?.trim()) err("lifecycle_missing_version", "lifecycle.version obrigatório.");
      if (!["placeholder", "developing", "consolidating", "certified"].includes(status)) {
        err("lifecycle_invalid_status", `lifecycle.status inválido: ${status}.`);
      }
      if (typeof migration !== "number" || migration < 0 || migration > 1) {
        err("lifecycle_invalid_migration", `lifecycle.migration deve estar em [0,1] (recebido ${migration}).`);
      }
    }
  }

  // 6. Generator registrado (só entidades ready produzem geração via IA)
  if (m.ready && !REGISTERED_GENERATORS.has(m.id)) {
    err("generator_not_registered",
      `nenhum generator registrado para "${m.id}" em REGISTERED_GENERATORS / editorial-generate.`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

/** Lança se inválido. Usado por `requireManifest`. */
export function assertValidManifest(m: EntityManifest): void {
  const result = validateManifest(m);
  if (!result.valid) {
    const details = result.errors.map(e => `  - [${e.code}] ${e.message}`).join("\n");
    throw new Error(`[editorial-engine] manifesto inválido: ${m.id}\n${details}`);
  }
}
