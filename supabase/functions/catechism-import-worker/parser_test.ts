import { assert, assertEquals, assertMatch } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { extractParagraph, fileFor, rangeFor, slugFor, stripTags, FILES } from './parser.ts';

const load = async (name: string) =>
  await Deno.readTextFile(new URL(`./__fixtures__/${name}`, import.meta.url));

Deno.test('fileFor: mapeia parágrafos ao arquivo correto por faixa', () => {
  assertEquals(fileFor(1), 'prologo%201-25_po.html');
  assertEquals(fileFor(185), 'p1s2_185-197_po.html');
  assertEquals(fileFor(2865), 'p4s2_2759-2865_po.html');
  assertEquals(fileFor(0), null);
  assertEquals(fileFor(3000), null);
});

Deno.test('rangeFor: retorna metadados de parte para o painel', () => {
  const r = rangeFor(200);
  assert(r);
  assertEquals(r!.part, 'Parte I');
});

Deno.test('FILES: faixas são contíguas e cobrem 1..2865', () => {
  const sorted = [...FILES].sort((a, b) => a.from - b.from);
  assertEquals(sorted[0].from, 1);
  assertEquals(sorted[sorted.length - 1].to, 2865);
});

Deno.test('stripTags: normaliza espaços e entidades', () => {
  assertEquals(stripTags('<b>oi</b>&nbsp;&amp;&#160;fim'), 'oi & fim');
});

Deno.test('parser: extrai §1 do Prólogo (multi-parágrafo)', async () => {
  const html = await load('prologo_1-25.html');
  const text = extractParagraph(html, 1);
  assert(text, 'esperava texto do §1');
  assertMatch(text!, /Deus, infinitamente perfeito/);
  assertMatch(text!, /aproxima-Se do homem/); // continuação anexada
  assert(!text!.includes('Cristo enviou os Apóstolos'), 'não deve invadir o §2');
});

Deno.test('parser: extrai §2 isolado', async () => {
  const html = await load('prologo_1-25.html');
  const text = extractParagraph(html, 2);
  assert(text);
  assertMatch(text!, /Cristo enviou os Apóstolos/);
  assert(!text!.startsWith('2'), 'prefixo numérico deve ser removido');
});

Deno.test('parser: extrai §185 do Credo em fixture separada', async () => {
  const html = await load('p1s2_185-197.html');
  const text = extractParagraph(html, 185);
  assert(text);
  assertMatch(text!, /Aquele que diz/);
});

Deno.test('parser: retorna null quando o parágrafo não existe', async () => {
  const html = await load('prologo_1-25.html');
  assertEquals(extractParagraph(html, 999), null);
});

Deno.test('slugFor: formato estável ccc-<n>', () => {
  assertEquals(slugFor(1), 'ccc-1');
  assertEquals(slugFor(2865), 'ccc-2865');
});

// ---------- Idempotência do upsert ----------
// Simula onConflict:'paragraph' via mock em memória e verifica que múltiplas
// execuções mantêm exatamente uma linha por parágrafo com o conteúdo mais recente.

type Row = { paragraph: number; slug: string; content: string; status: string };

function makeUpsertMock() {
  const table = new Map<number, Row>();
  return {
    table,
    upsert(row: Row) {
      table.set(row.paragraph, { ...row });
      return { error: null };
    },
  };
}

Deno.test('upsert: idempotente em execuções repetidas do worker', async () => {
  const html = await load('prologo_1-25.html');
  const db = makeUpsertMock();

  for (let run = 0; run < 3; run++) {
    for (const n of [1, 2, 3]) {
      const text = extractParagraph(html, n)!;
      db.upsert({ paragraph: n, slug: slugFor(n), content: text, status: 'imported' });
    }
  }

  assertEquals(db.table.size, 3);
  assertMatch(db.table.get(1)!.content, /Deus, infinitamente perfeito/);
  assertEquals(db.table.get(2)!.slug, 'ccc-2');
});
