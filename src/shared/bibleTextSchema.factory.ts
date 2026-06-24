/**
 * Fábrica de schemas Zod do contrato `bible-text`.
 *
 * Fonte ÚNICA de verdade. Recebe a instância do `z` para que o frontend
 * (zod via bare import) e a edge function Deno (zod via npm:) compartilhem
 * exatamente as mesmas definições.
 *
 * IMPORTANTE: o arquivo `supabase/functions/_shared/bibleTextSchema.factory.ts`
 * DEVE ser byte-idêntico a este. Um teste em `src/test/bibleTextSchema.sync.test.ts`
 * falha o build caso saiam de sincronia.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildBibleTextSchemas(z: any) {
  const BibleTextInputSchema = z.object({
    abbrev: z.string().trim().min(1, "abbrev é obrigatório").max(16, "abbrev muito longo"),
    chapter: z.number({ invalid_type_error: "chapter deve ser número" }).int().positive(),
    client_cache_version: z.union([z.string(), z.number()]).optional(),
  }).strict();

  const BibleVerseSchema = z.object({
    number: z.number().int().positive(),
    text: z.string().min(1),
    comment: z.string().nullable().optional(),
  });

  const BibleTextMetadataSchema = z.object({
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

  const BibleTextSuccessSchema = z.object({
    book: z.string().min(1),
    chapter: z.number().int().positive(),
    verses: z.array(BibleVerseSchema).min(1),
    metadata: BibleTextMetadataSchema,
  });

  const BibleTextErrorSchema = z.object({
    error: z.string().min(1),
    reason: z.string().min(1),
    received_abbrev: z.string(),
    canonical_abbr: z.string().nullable(),
    book_name: z.string().nullable(),
    bollsId: z.number().int().positive().nullable(),
    chapter: z.number().int().positive(),
    correlationId: z.string().min(1),
  });

  const BibleTextInvalidPayloadSchema = z.object({
    error: z.string().min(1),
    correlationId: z.string().min(1),
  });

  const BibleTextResponseSchema = z.union([
    BibleTextSuccessSchema,
    BibleTextErrorSchema,
    BibleTextInvalidPayloadSchema,
  ]);

  return {
    BibleVerseSchema,
    BibleTextMetadataSchema,
    BibleTextSuccessSchema,
    BibleTextErrorSchema,
    BibleTextInvalidPayloadSchema,
    BibleTextResponseSchema,
  };
}

/** Categoriza um payload de erro para o resumo CI. Sem dependência de zod. */
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
