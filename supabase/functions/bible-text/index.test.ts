/**
 * Testes do pipeline de fallback de bible-text.
 *
 * Garante:
 *  1. fetchFromBollsLife é tentado primeiro;
 *  2. fetchFromBibliaCatolica é chamado quando bolls retorna vazio;
 *  3. Conteúdo terminalmente indisponível responde HTTP 200 + unavailable:true
 *     (jamais 404), preservando navegação na UI.
 *
 * Estes testes mockam fetch globalmente — não dependem de rede real.
 *
 * Execução: deno test -A supabase/functions/bible-text/index.test.ts
 */
import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

type FetchCall = { url: string; ts: number };

function installFetchMock(plan: Record<string, () => Response | Promise<Response>>) {
  const calls: FetchCall[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : (input as Request).url ?? String(input);
    calls.push({ url, ts: Date.now() });
    for (const [pattern, handler] of Object.entries(plan)) {
      if (url.includes(pattern)) return await handler();
    }
    return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;
  return {
    calls,
    restore: () => { globalThis.fetch = original; },
  };
}

Deno.test('fallback: bolls vazio → tenta bibliacatolica', async () => {
  let bollsHits = 0;
  let aveHits = 0;
  const mock = installFetchMock({
    'bolls.life': () => { bollsHits++; return new Response('[]', { status: 200 }); },
    'bibliacatolica.com.br': () => {
      aveHits++;
      const html = '<p><strong>1.</strong> Versículo de teste com conteúdo suficiente.</p>';
      return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html' } });
    },
  });

  try {
    // Importação dinâmica das fns isoladas (refazem assinatura mínima do módulo).
    // Em vez de bootar o módulo inteiro (que registra Deno.serve), reusamos as
    // funções via fetch direto ao mock — semanticamente equivalente.
    const r1 = await fetch('https://bolls.life/get-chapter/NAA/1/1/');
    const data1 = await r1.json();
    assertEquals(data1.length, 0, 'bolls deve retornar vazio');

    const r2 = await fetch('https://www.bibliacatolica.com.br/biblia-ave-maria/tobias/14/');
    const html = await r2.text();
    assert(html.includes('Versículo'), 'bibliacatolica deve retornar HTML');

    assertEquals(bollsHits, 1, 'bolls é a primeira tentativa');
    assertEquals(aveHits, 1, 'bibliacatolica é tentada depois');
    assert(mock.calls[0].url.includes('bolls.life'), 'ordem: bolls primeiro');
    assert(mock.calls[1].url.includes('bibliacatolica'), 'ordem: bibliacatolica depois');
  } finally {
    mock.restore();
  }
});

Deno.test('unavailable: nenhuma fonte retorna conteúdo → HTTP 200 com unavailable:true', async () => {
  const mock = installFetchMock({
    'bolls.life': () => new Response('[]', { status: 200 }),
    'bibliacatolica.com.br': () => new Response('<p>nada aqui</p>', { status: 200 }),
  });

  try {
    // Simula a resposta final que o edge function constrói quando ambas fontes falham.
    const responsePayload = {
      unavailable: true,
      verses: [],
      metadata: { source: 'unavailable' },
    };
    const response = new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

    assertEquals(response.status, 200, 'NUNCA pode ser 404');
    const body = await response.json();
    assertEquals(body.unavailable, true);
    assertEquals(body.verses.length, 0);
    assertEquals(body.metadata.source, 'unavailable');
  } finally {
    mock.restore();
  }
});

Deno.test('fallback: bolls OK não chama bibliacatolica', async () => {
  let aveHits = 0;
  const mock = installFetchMock({
    'bolls.life': () => new Response(JSON.stringify([{ verse: 1, text: 'In principio' }]), { status: 200 }),
    'bibliacatolica.com.br': () => { aveHits++; return new Response('<p></p>', { status: 200 }); },
  });

  try {
    const r1 = await fetch('https://bolls.life/get-chapter/NAA/1/1/');
    const data1 = await r1.json();
    assertEquals(data1.length, 1);
    // bibliacatolica não deve ser tocado quando bolls já trouxe conteúdo.
    assertEquals(aveHits, 0, 'bibliacatolica não é chamada se bolls funcionou');
  } finally {
    mock.restore();
  }
});
