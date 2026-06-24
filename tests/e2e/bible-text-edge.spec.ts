import { test, expect, request } from '@playwright/test';
import 'dotenv/config';

/**
 * E2E contra a edge `bible-text` (rota usada pelo frontend via supabase.functions.invoke).
 * Valida que:
 *  - "1tm 3" responde 200 com o livro correto e schema completo.
 *  - Uma abreviação desconhecida retorna 404 com mensagem descritiva.
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

test('bible-text edge: "1tm 3" retorna 200 com texto correto', async () => {
  const { status, json } = await callBibleText({ abbrev: '1tm', chapter: 3 }, 'e2e-1tm-3');
  expect(status).toBe(200);
  expect(json.book).toBe('1 Timóteo');
  expect(json.chapter).toBe(3);
  expect(Array.isArray(json.verses)).toBe(true);
  expect(json.verses.length).toBeGreaterThan(10);
  expect(json.verses[0]).toMatchObject({ number: 1, text: expect.stringContaining('Fiel') });

  // Contrato de metadados: campos sempre presentes
  expect(json.metadata).toMatchObject({
    received_abbrev: '1tm',
    canonical_abbr: '1Tm',
    bollsId: 54,
    correlationId: 'e2e-1tm-3',
  });
});

test('bible-text edge: abreviação desconhecida → 404 com mensagem descritiva', async () => {
  const { status, json } = await callBibleText({ abbrev: 'xx', chapter: 1 }, 'e2e-xx-1');
  expect(status).toBe(404);
  expect(json.error).toBe('Texto não encontrado');
  expect(json.reason).toMatch(/Abreviação não reconhecida.*"xx"/);
  expect(json).toMatchObject({
    received_abbrev: 'xx',
    canonical_abbr: null,
    book_name: null,
    bollsId: null,
    chapter: 1,
    correlationId: 'e2e-xx-1',
  });
});

test('bible-text edge: payload inválido → 400 com correlationId e error não-vazio', async () => {
  // chapter ausente / abbrev vazio violam o schema de entrada
  const { status, json } = await callBibleText({ abbrev: '' }, 'e2e-invalid');
  expect([400, 422]).toContain(status);
  // Contrato BibleTextInvalidPayloadSchema: error (string) + correlationId
  expect(typeof json.error).toBe('string');
  expect(json.error.length).toBeGreaterThan(0);
  expect(json.correlationId).toBe('e2e-invalid');
  // Payload inválido NÃO deve vazar campos não previstos no schema enxuto
  expect(json).not.toHaveProperty('verses');
});

test('bible-text edge: capítulo indisponível → 404 com canonical_abbr/bollsId preenchidos', async () => {
  // Gn tem 50 capítulos — pedir 999 força "capítulo não disponível em nenhuma fonte"
  const { status, json } = await callBibleText({ abbrev: 'gn', chapter: 999 }, 'e2e-gn-999');
  expect(status).toBe(404);
  expect(json.error).toBe('Texto não encontrado');
  expect(json.reason).toMatch(/não foi encontrado em nenhuma fonte|não disponível/i);
  // Todos os campos obrigatórios do BibleTextErrorSchema devem estar presentes
  for (const field of ['received_abbrev', 'canonical_abbr', 'book_name', 'bollsId', 'chapter', 'correlationId']) {
    expect(json).toHaveProperty(field);
  }
  // Para chapter_unavailable o livro É reconhecido — canonical_abbr/bollsId NÃO podem ser null
  expect(json.canonical_abbr).toBe('Gn');
  expect(json.bollsId).toBe(1);
  expect(typeof json.book_name).toBe('string');
  expect(json.book_name.length).toBeGreaterThan(0);
  expect(json.chapter).toBe(999);
  expect(json.received_abbrev).toBe('gn');
  expect(json.correlationId).toBe('e2e-gn-999');
});

test('bible-text edge: invalid_payload ecoa exatamente o x-correlation-id enviado', async () => {
  // Garante o contrato: o correlationId no payload de erro é byte-idêntico ao header enviado.
  const sent = `e2e-echo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const { status, json } = await callBibleText({ abbrev: '' }, sent);
  expect([400, 422]).toContain(status);
  expect(json.correlationId).toBe(sent);
  expect(typeof json.correlationId).toBe('string');
  expect(json.correlationId.length).toBe(sent.length);
});
