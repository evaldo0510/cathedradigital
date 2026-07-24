// Parser puro (sem I/O nem Supabase) para permitir testes com fixtures.
// Toda a lógica de mapeamento arquivo→faixa e extração de parágrafo vive aqui.

export type FileRange = { from: number; to: number; file: string; part: string; label: string };

// Faixas verificadas contra o arquivo PT do vatican.va.
// `part`/`label` são usados no painel admin para agrupar contagens.
export const FILES: FileRange[] = [
  { from: 1,    to: 25,   file: 'prologo%201-25_po.html',       part: 'Prólogo',  label: 'Prólogo (1–25)' },
  { from: 26,   to: 49,   file: 'p1s1c1_26-49_po.html',         part: 'Parte I',  label: 'I · Fé (26–49)' },
  { from: 50,   to: 141,  file: 'p1s1c2_50-141_po.html',        part: 'Parte I',  label: 'I · Revelação (50–141)' },
  { from: 142,  to: 184,  file: 'p1s1c3_142-184_po.html',       part: 'Parte I',  label: 'I · Resposta da fé (142–184)' },
  { from: 185,  to: 197,  file: 'p1s2_185-197_po.html',         part: 'Parte I',  label: 'I · Credo (185–197)' },
  { from: 198,  to: 421,  file: 'p1s2c1_198-421_po.html',       part: 'Parte I',  label: 'I · Pai (198–421)' },
  { from: 422,  to: 682,  file: 'p1s2cap2_422-682_po.html',     part: 'Parte I',  label: 'I · Filho (422–682)' },
  { from: 683,  to: 1065, file: 'p1s2cap3_683-1065_po.html',    part: 'Parte I',  label: 'I · Espírito Santo (683–1065)' },
  { from: 1066, to: 1134, file: 'p2s1cap1_1076-1134_po.html',   part: 'Parte II', label: 'II · Liturgia (1066–1134)' },
  { from: 1135, to: 1209, file: 'p2s1cap2_1135-1209_po.html',   part: 'Parte II', label: 'II · Celebração (1135–1209)' },
  { from: 1210, to: 1419, file: 'p2s2cap1_1210-1419_po.html',   part: 'Parte II', label: 'II · Iniciação (1210–1419)' },
  { from: 1420, to: 1532, file: 'p2s2cap1_1420-1532_po.html',   part: 'Parte II', label: 'II · Cura (1420–1532)' },
  { from: 1533, to: 1666, file: 'p2s2cap3_1533-1666_po.html',   part: 'Parte II', label: 'II · Serviço (1533–1666)' },
  { from: 1667, to: 1690, file: 'p2s2cap4_1667-1690_po.html',   part: 'Parte II', label: 'II · Sacramentais (1667–1690)' },
  { from: 1691, to: 1698, file: 'p3-intr_1691-1698_po.html',    part: 'Parte III',label: 'III · Introdução (1691–1698)' },
  { from: 1699, to: 1876, file: 'p3s1cap1_1699-1876_po.html',   part: 'Parte III',label: 'III · Vocação (1699–1876)' },
  { from: 1877, to: 1948, file: 'p3s1cap2_1877-1948_po.html',   part: 'Parte III',label: 'III · Comunidade (1877–1948)' },
  { from: 1949, to: 2051, file: 'p3s1cap3_1949-2051_po.html',   part: 'Parte III',label: 'III · Salvação (1949–2051)' },
  { from: 2052, to: 2082, file: 'p3s2-intr_2052-2082_po.html',  part: 'Parte III',label: 'III · Decálogo (2052–2082)' },
  { from: 2083, to: 2195, file: 'p3s2cap1_2083-2195_po.html',   part: 'Parte III',label: 'III · Amar a Deus (2083–2195)' },
  { from: 2196, to: 2557, file: 'p3s2cap2_2196-2557_po.html',   part: 'Parte III',label: 'III · Amar o próximo (2196–2557)' },
  { from: 2558, to: 2565, file: 'p4-intr_2558-2565_po.html',    part: 'Parte IV', label: 'IV · Introdução (2558–2565)' },
  { from: 2566, to: 2649, file: 'p4s1cap1_2566-2649_po.html',   part: 'Parte IV', label: 'IV · Revelação da oração (2566–2649)' },
  { from: 2650, to: 2696, file: 'p4s1cap2_2650-2696_po.html',   part: 'Parte IV', label: 'IV · Tradição orante (2650–2696)' },
  { from: 2697, to: 2758, file: 'p4s1cap3_2697-2758_po.html',   part: 'Parte IV', label: 'IV · Vida de oração (2697–2758)' },
  { from: 2759, to: 2865, file: 'p4s2_2759-2865_po.html',       part: 'Parte IV', label: 'IV · Pai-Nosso (2759–2865)' },
];

export function fileFor(paragraph: number): string | null {
  const hit = FILES.find((r) => paragraph >= r.from && paragraph <= r.to);
  return hit ? hit.file : null;
}

export function rangeFor(paragraph: number): FileRange | null {
  return FILES.find((r) => paragraph >= r.from && paragraph <= r.to) ?? null;
}

export function stripTags(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractParagraph(html: string, n: number): string | null {
  const blocks = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => m[1]);
  const startRe = new RegExp(`^\\s*(?:<[^>]+>\\s*)*<b>\\s*${n}\\s*\\.?\\s*<\\/b>`, 'i');
  const anyStartRe = /^\s*(?:<[^>]+>\s*)*<b>\s*\d+\s*\.?\s*<\/b>/i;

  let startIdx = -1;
  for (let i = 0; i < blocks.length; i++) {
    if (startRe.test(blocks[i])) { startIdx = i; break; }
  }
  if (startIdx < 0) return null;

  const parts: string[] = [];
  for (let i = startIdx; i < blocks.length; i++) {
    if (i > startIdx && anyStartRe.test(blocks[i])) break;
    const clean = stripTags(blocks[i]);
    if (i === startIdx) parts.push(clean.replace(new RegExp(`^${n}\\s*\\.?\\s*`), ''));
    else if (clean) parts.push(clean);
  }
  const out = parts.join('\n\n').trim();
  return out.length > 10 ? out : null;
}

export const slugFor = (n: number) => `ccc-${n}`;
