/**
 * Schemas Zod compartilhados do contrato `bible-text` para uso no FRONTEND.
 * Mesma fonte usada pela edge function (via factory replicada em
 * `supabase/functions/_shared/bibleTextSchema.factory.ts`).
 */
import { z } from "zod";
import { buildBibleTextSchemas, classifyError } from "./bibleTextSchema.factory";

const schemas = buildBibleTextSchemas(z);

export const BibleVerseSchema = schemas.BibleVerseSchema;
export const BibleTextMetadataSchema = schemas.BibleTextMetadataSchema;
export const BibleTextSuccessSchema = schemas.BibleTextSuccessSchema;
export const BibleTextErrorSchema = schemas.BibleTextErrorSchema;
export const BibleTextInvalidPayloadSchema = schemas.BibleTextInvalidPayloadSchema;
export const BibleTextResponseSchema = schemas.BibleTextResponseSchema;

export type BibleTextSuccess = z.infer<typeof BibleTextSuccessSchema>;
export type BibleTextError = z.infer<typeof BibleTextErrorSchema>;
export type BibleTextInvalidPayload = z.infer<typeof BibleTextInvalidPayloadSchema>;

export { classifyError };

/** Helper de uso no frontend: extrai a mensagem descritiva de um payload 404. */
export function describeBibleTextError(data: unknown): { title: string; description: string } | null {
  const parsed = BibleTextErrorSchema.safeParse(data);
  if (!parsed.success) return null;
  const { error, reason, received_abbrev } = parsed.data;
  return {
    title: error,
    description: `${reason} (abreviação recebida: "${received_abbrev}")`,
  };
}
