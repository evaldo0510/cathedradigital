// Sprint A / CAT-002 — Wrapper padronizado de validação (Zod)
// Uso:
//   const parsed = await parseJson(req, BodySchema);
//   if (!parsed.ok) return R.error(400, 'invalid_body', parsed.issues);
//   const { foo } = parsed.data;
//
//   const q = parseQuery(url, QuerySchema);
//   if (!q.ok) return R.error(400, 'invalid_query', q.issues);
//
// Motivação: eliminar validação ad-hoc, garantir mensagens uniformes e
// permitir auditoria estática (grep por `parseJson(` / `parseQuery(`).

import type { z } from 'https://esm.sh/zod@3.23.8';

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; issues: unknown };

export async function parseJson<T>(
  req: Request,
  schema: z.ZodType<T>,
): Promise<ParseResult<T>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { ok: false, issues: { _root: ['invalid_json'] } };
  }
  const r = schema.safeParse(raw);
  if (!r.success) return { ok: false, issues: r.error.flatten() };
  return { ok: true, data: r.data };
}

export function parseQuery<T>(
  url: URL,
  schema: z.ZodType<T>,
): ParseResult<T> {
  const r = schema.safeParse(Object.fromEntries(url.searchParams));
  if (!r.success) return { ok: false, issues: r.error.flatten() };
  return { ok: true, data: r.data };
}
