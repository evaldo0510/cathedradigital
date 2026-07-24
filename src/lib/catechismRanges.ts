// Faixas do Catecismo espelhando supabase/functions/catechism-import-worker/parser.ts.
// Duplicado propositalmente: Edge Functions (Deno) e frontend (Vite) não compartilham módulos.
// Mantenha as duas listas sincronizadas.

export type CatechismRange = {
  from: number;
  to: number;
  part: string;
  label: string;
};

export const CATECHISM_RANGES: CatechismRange[] = [
  { from: 1,    to: 25,   part: 'Prólogo',   label: 'Prólogo (1–25)' },
  { from: 26,   to: 49,   part: 'Parte I',   label: 'I · Fé (26–49)' },
  { from: 50,   to: 141,  part: 'Parte I',   label: 'I · Revelação (50–141)' },
  { from: 142,  to: 184,  part: 'Parte I',   label: 'I · Resposta da fé (142–184)' },
  { from: 185,  to: 197,  part: 'Parte I',   label: 'I · Credo (185–197)' },
  { from: 198,  to: 421,  part: 'Parte I',   label: 'I · Pai (198–421)' },
  { from: 422,  to: 682,  part: 'Parte I',   label: 'I · Filho (422–682)' },
  { from: 683,  to: 1065, part: 'Parte I',   label: 'I · Espírito Santo (683–1065)' },
  { from: 1066, to: 1134, part: 'Parte II',  label: 'II · Liturgia (1066–1134)' },
  { from: 1135, to: 1209, part: 'Parte II',  label: 'II · Celebração (1135–1209)' },
  { from: 1210, to: 1419, part: 'Parte II',  label: 'II · Iniciação (1210–1419)' },
  { from: 1420, to: 1532, part: 'Parte II',  label: 'II · Cura (1420–1532)' },
  { from: 1533, to: 1666, part: 'Parte II',  label: 'II · Serviço (1533–1666)' },
  { from: 1667, to: 1690, part: 'Parte II',  label: 'II · Sacramentais (1667–1690)' },
  { from: 1691, to: 1698, part: 'Parte III', label: 'III · Introdução (1691–1698)' },
  { from: 1699, to: 1876, part: 'Parte III', label: 'III · Vocação (1699–1876)' },
  { from: 1877, to: 1948, part: 'Parte III', label: 'III · Comunidade (1877–1948)' },
  { from: 1949, to: 2051, part: 'Parte III', label: 'III · Salvação (1949–2051)' },
  { from: 2052, to: 2082, part: 'Parte III', label: 'III · Decálogo (2052–2082)' },
  { from: 2083, to: 2195, part: 'Parte III', label: 'III · Amar a Deus (2083–2195)' },
  { from: 2196, to: 2557, part: 'Parte III', label: 'III · Amar o próximo (2196–2557)' },
  { from: 2558, to: 2565, part: 'Parte IV',  label: 'IV · Introdução (2558–2565)' },
  { from: 2566, to: 2649, part: 'Parte IV',  label: 'IV · Revelação da oração (2566–2649)' },
  { from: 2650, to: 2696, part: 'Parte IV',  label: 'IV · Tradição orante (2650–2696)' },
  { from: 2697, to: 2758, part: 'Parte IV',  label: 'IV · Vida de oração (2697–2758)' },
  { from: 2759, to: 2865, part: 'Parte IV',  label: 'IV · Pai-Nosso (2759–2865)' },
];

export function rangeForParagraph(n: number): CatechismRange | null {
  return CATECHISM_RANGES.find((r) => n >= r.from && n <= r.to) ?? null;
}

/** Normaliza mensagens de erro para agrupamento (remove números específicos). */
export function normalizeErrorKey(msg: string | null | undefined): string {
  if (!msg) return 'sem mensagem';
  return msg
    .replace(/paragraph\s+\d+/gi, 'paragraph N')
    .replace(/§\s*\d+/g, '§N')
    .replace(/\b\d{3,}\b/g, 'N')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
}
