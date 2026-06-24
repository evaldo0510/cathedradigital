/**
 * Zod schemas para o contrato da edge `bible-text`.
 * Compartilhado entre a edge function e os testes (Deno) para garantir
 * que received_abbrev, canonical_abbr, bollsId e chapter sempre apareçam
 * no formato esperado.
 */
import { z } from "https://esm.sh/zod@3.23.8";

export const BibleVerseSchema = z.object({
  number: z.number().int().positive(),
  text: z.string().min(1),
  comment: z.string().nullable().optional(),
});

export const BibleTextMetadataSchema = z.object({
  source: z.string().min(1),
  correlationId: z.string().min(1),
  cache_version: z.string().optional(),
  logic_version: z.number().optional(),
  current_version: z.number().optional(),
  contentHash: z.string().optional(),
  ttl_hours: z.number().optional(),
  shouldInvalidateL1: z.boolean().optional(),
  stale: z.boolean().optional(),
  received_abbrev: z.string().min(1),
  canonical_abbr: z.string().nullable(),
  bollsId: z.number().int().positive().nullable(),
}).passthrough();

export const BibleTextSuccessSchema = z.object({
  book: z.string().min(1),
  chapter: z.number().int().positive(),
  verses: z.array(BibleVerseSchema).min(1),
  metadata: BibleTextMetadataSchema,
});

export const BibleTextErrorSchema = z.object({
  error: z.string().min(1),
  reason: z.string().min(1),
  received_abbrev: z.string(),
  canonical_abbr: z.string().nullable(),
  book_name: z.string().nullable(),
  bollsId: z.number().int().positive().nullable(),
  chapter: z.number().int().positive(),
  correlationId: z.string().min(1),
});

export const BibleTextInvalidPayloadSchema = z.object({
  error: z.string().min(1),
  correlationId: z.string().min(1),
});

export const BibleTextResponseSchema = z.union([
  BibleTextSuccessSchema,
  BibleTextErrorSchema,
  BibleTextInvalidPayloadSchema,
]);

export type BibleTextSuccess = z.infer<typeof BibleTextSuccessSchema>;
export type BibleTextError = z.infer<typeof BibleTextErrorSchema>;

/** Categoriza um payload de erro para o resumo CI. */
export function classifyError(reason: string | undefined | null):
  | "unknown_abbrev"
  | "chapter_unavailable"
  | "invalid_payload"
  | "other" {
  if (!reason) return "other";
  if (/Abreviação não reconhecida/i.test(reason)) return "unknown_abbrev";
  if (/não foi encontrado em nenhuma fonte/i.test(reason)) return "chapter_unavailable";
  if (/Parâmetros inválidos/i.test(reason)) return "invalid_payload";
  return "other";
}
