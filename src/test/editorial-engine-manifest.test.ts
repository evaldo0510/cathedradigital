/**
 * Sprint 6.2.1 — Manifest Validation.
 *
 * Cobre os 6 critérios canônicos de um manifesto do Editorial Engine.
 * Falha aqui = registry inválido em runtime; não deixar passar por review.
 */
import { describe, it, expect } from "vitest";
import { validateManifest, assertValidManifest } from "@/lib/editorial-engine/validate-manifest";
import { glossaryManifest } from "@/lib/editorial-engine/manifests/glossary.manifest";
import { editorialRegistry, auditRegistry } from "@/lib/editorial-engine/manifests";
import type { EntityManifest } from "@/lib/editorial-engine/types";

const baseValid: EntityManifest = { ...glossaryManifest };

describe("Editorial Engine · Manifest Validation", () => {
  it("registry oficial: nenhum manifesto inválido", () => {
    const report = auditRegistry();
    for (const r of report) {
      expect(r.errors, `${r.id}: ${JSON.stringify(r.errors)}`).toEqual([]);
    }
  });

  it("Glossário passa em todos os critérios", () => {
    const r = validateManifest(glossaryManifest);
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it("critério 1 — id inválido", () => {
    const r = validateManifest({ ...baseValid, id: "1invalid!" });
    expect(r.errors.some(e => e.code === "invalid_id")).toBe(true);
  });

  it("critério 2 — ready sem campos editoriais", () => {
    const r = validateManifest({ ...baseValid, fields: baseValid.fields.filter(f => f.group !== "editorial") });
    expect(r.errors.some(e => e.code === "no_editorial_fields")).toBe(true);
  });

  it("critério 2 — ready sem campos nexus", () => {
    const r = validateManifest({ ...baseValid, fields: baseValid.fields.filter(f => f.group !== "nexus") });
    expect(r.errors.some(e => e.code === "no_nexus_fields")).toBe(true);
  });

  it("critério 3 — pesos inválidos são detectados", () => {
    const r = validateManifest({
      ...baseValid,
      fields: [{ key: "x", label: "X", group: "editorial", required: true, weight: 0 }, ...baseValid.fields],
    });
    expect(r.errors.some(e => e.code === "field_invalid_weight")).toBe(true);
  });

  it("critério 3 — chaves duplicadas são detectadas", () => {
    const dup = { ...baseValid.fields[0] };
    const r = validateManifest({ ...baseValid, fields: [...baseValid.fields, dup] });
    expect(r.errors.some(e => e.code === "field_duplicate_key")).toBe(true);
  });

  it("critério 4 — weight do módulo deve ser > 0", () => {
    const r = validateManifest({ ...baseValid, weight: 0 });
    expect(r.errors.some(e => e.code === "invalid_module_weight")).toBe(true);
  });

  it("critério 5 — lifecycle com migration fora de [0,1] é erro", () => {
    const r = validateManifest({
      ...baseValid,
      lifecycle: { version: "1.0", status: "developing", certification: false, migration: 1.5 },
    });
    expect(r.errors.some(e => e.code === "lifecycle_invalid_migration")).toBe(true);
  });

  it("critério 6 — ready sem generator registrado é erro", () => {
    // Entidade ready cujo id não está em REGISTERED_GENERATORS.
    const r = validateManifest({ ...baseValid, id: "saints" });
    expect(r.errors.some(e => e.code === "generator_not_registered")).toBe(true);
  });

  it("assertValidManifest lança em manifesto inválido", () => {
    expect(() => assertValidManifest({ ...baseValid, weight: -1 })).toThrow(/manifesto inválido/);
  });

  it("registry tem exatamente 1 entidade ready hoje (Glossário)", () => {
    // Sanity check: se alguém marcar Santos ready sem generator, o teste critério-6 já quebra;
    // este teste documenta o estado atual e força atualização consciente.
    const ready = editorialRegistry.filter(m => m.ready);
    expect(ready.map(m => m.id)).toEqual(["glossary"]);
  });
});
