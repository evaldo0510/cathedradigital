/**
 * Schemas Zod do contrato `bible-text` para a EDGE (Deno).
 * Wrapper fino sobre `./bibleTextSchema.factory.ts` — a fábrica é a fonte
 * única de verdade e DEVE permanecer byte-idêntica a
 * `src/shared/bibleTextSchema.factory.ts` (validado em CI).
 */
import { z } from "https://esm.sh/zod@3.23.8";
import { buildBibleTextSchemas, classifyError } from "./bibleTextSchema.factory.ts";

const schemas = buildBibleTextSchemas(z);

export const BibleVerseSchema = schemas.BibleVerseSchema;
export const BibleTextMetadataSchema = schemas.BibleTextMetadataSchema;
export const BibleTextSuccessSchema = schemas.BibleTextSuccessSchema;
export const BibleTextErrorSchema = schemas.BibleTextErrorSchema;
export const BibleTextInvalidPayloadSchema = schemas.BibleTextInvalidPayloadSchema;
export const BibleTextResponseSchema = schemas.BibleTextResponseSchema;

export type BibleTextSuccess = z.infer<typeof BibleTextSuccessSchema>;
export type BibleTextError = z.infer<typeof BibleTextErrorSchema>;

export { classifyError };
