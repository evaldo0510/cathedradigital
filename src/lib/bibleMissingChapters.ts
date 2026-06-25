/**
 * Capítulos cujo conteúdo NÃO é servido pela fonte pública (bolls.life NAA)
 * E ainda não foram importados ao banco local. Quando todas as fontes falham,
 * a UI desabilita o botão e mostra tooltip explicando indisponibilidade.
 *
 * Histórico de importações:
 *   2026-06-25 — Tb 14, Jdt 16, Dn 13, Dn 14, Sl 151 importados via
 *                bible-import-deutero (scrape BibliaCatolica / Ave-Maria).
 *
 * Restantes ainda sem fonte pública confirmada:
 *   Sb 19, Eclo 51, Br 6, 1Mc 16, 2Mc 15
 *   (BibliaCatolica usa numeração diferente nesses livros; precisa dump dedicado.)
 */
export const BIBLE_MISSING_CHAPTERS: Record<string, number[]> = {
  Sb: [19],
  Eclo: [51],
  Br: [6],
  '1Mc': [16],
  '2Mc': [15],
};

export function isChapterMissing(abbr: string, chapter: number): boolean {
  return (BIBLE_MISSING_CHAPTERS[abbr] || []).includes(chapter);
}

export const MISSING_CHAPTER_REASON =
  'Capítulo indisponível na fonte pública atual (bolls.life / NAA). Estamos buscando uma edição católica PT que o contenha.';
