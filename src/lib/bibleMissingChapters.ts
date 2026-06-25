/**
 * Capítulos cujo conteúdo NÃO é servido pela fonte pública (bolls.life NAA)
 * e ainda não foram importados ao banco. A UI desabilita o botão e mostra
 * tooltip explicando indisponibilidade na fonte, sem quebrar a navegação.
 *
 * Quando um dump for importado via scripts/import-bible-dump.ts, remova
 * a entrada correspondente desta lista.
 */
export const BIBLE_MISSING_CHAPTERS: Record<string, number[]> = {
  Tb: [14],
  Jdt: [16],
  Sb: [19],
  Eclo: [51],
  Br: [6],
  '1Mc': [16],
  '2Mc': [15],
  Dn: [13, 14],
  Sl: [151],
};

export function isChapterMissing(abbr: string, chapter: number): boolean {
  return (BIBLE_MISSING_CHAPTERS[abbr] || []).includes(chapter);
}

export const MISSING_CHAPTER_REASON =
  'Capítulo indisponível na fonte pública atual (bolls.life / NAA). Estamos buscando uma edição católica PT que o contenha.';
