import { test, expect, request } from '@playwright/test';
import { z } from 'zod';
import 'dotenv/config';
import { BibleTextErrorSchema, BibleTextInvalidPayloadSchema } from '../../src/shared/bibleTextSchema';

/**
 * E2E de contrato: garante que a edge `bible-text` retorna em 404
 * EXATAMENTE a forma definida por BibleTextErrorSchema (campos + tipos)
 * e que o `correlationId` enviado no header é preservado.
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

test.skip(!SUPABASE_URL || !SUPABASE_ANON_KEY, 'Supabase env not configured');

async function callBibleText(body: Record<string, unknown>, correlationId: string) {
  const ctx = await request.newContext({
    baseURL: SUPABASE_URL!,
    extraHTTPHeaders: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY!}`,
      apikey: SUPABASE_ANON_KEY!,
      'Content-Type': 'application/json',
      'x-correlation-id': correlationId,
    },
  });
  const res = await ctx.post('/functions/v1/bible-text', { data: body });
  const json = await res.json();
  await ctx.dispose();
  return { status: res.status(), json };
}

// Versão estrita: NÃO admite campos extras (verses/book/metadata não podem vazar no 404).
const StrictErrorSchema = (BibleTextErrorSchema as unknown as z.ZodObject<z.ZodRawShape>).strict();

test('404 unknown_abbrev: shape estrita do BibleTextErrorSchema + correlationId preservado', async () => {
  const cid = `e2e-shape-unknown-${Date.now()}`;
  const { status, json } = await callBibleText({ abbrev: 'xx', chapter: 1 }, cid);
  expect(status).toBe(404);
  const parsed = StrictErrorSchema.parse(json);
  expect(parsed.correlationId).toBe(cid);
  expect(parsed.received_abbrev).toBe('xx');
  expect(parsed.canonical_abbr).toBeNull();
  expect(parsed.book_name).toBeNull();
  expect(parsed.bollsId).toBeNull();
  expect(parsed.chapter).toBe(1);
  // Garante ausência de campos do schema de sucesso
  expect(json).not.toHaveProperty('verses');
  expect(json).not.toHaveProperty('book');
  expect(json).not.toHaveProperty('metadata');
});

test('404 chapter_unavailable: shape estrita + correlationId preservado', async () => {
  const cid = `e2e-shape-chapter-${Date.now()}`;
  const { status, json } = await callBibleText({ abbrev: 'gn', chapter: 999 }, cid);
  expect(status).toBe(404);
  const parsed = StrictErrorSchema.parse(json);
  expect(parsed.correlationId).toBe(cid);
  expect(parsed.canonical_abbr).toBe('Gn');
  expect(parsed.bollsId).toBe(1);
  expect(typeof parsed.book_name).toBe('string');
  expect(parsed.chapter).toBe(999);
});

test('400 invalid_payload: shape estrita do BibleTextInvalidPayloadSchema + correlationId byte-idêntico', async () => {
  // Contrato: payload inválido (abbrev vazio) usa BibleTextInvalidPayloadSchema
  // — apenas `error` e `correlationId`, sem campos extras vazando do sucesso/erro de domínio.
  const StrictInvalidPayload = (BibleTextInvalidPayloadSchema as unknown as z.ZodObject<z.ZodRawShape>).strict();
  const cid = `e2e-shape-invalid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const { status, json } = await callBibleText({ abbrev: '' }, cid);

  expect([400, 422]).toContain(status);
  const parsed = StrictInvalidPayload.parse(json);
  expect(parsed.correlationId).toBe(cid);
  expect(parsed.correlationId.length).toBe(cid.length);
  expect(typeof parsed.error).toBe('string');
  expect(parsed.error.length).toBeGreaterThan(0);

  // Nenhum campo do sucesso/erro de domínio pode vazar no 400
  for (const leak of ['verses', 'book', 'metadata', 'received_abbrev', 'canonical_abbr', 'bollsId', 'book_name', 'chapter', 'reason']) {
    expect(json, `campo "${leak}" não deveria estar presente em invalid_payload`).not.toHaveProperty(leak);
  }
});
