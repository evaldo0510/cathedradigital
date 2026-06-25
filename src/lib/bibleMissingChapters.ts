/**
 * Capítulos cujo conteúdo NÃO é servido por nenhuma fonte (bolls.life,
 * BibliaCatolica) e ainda não foram importados ao banco local.
 *
 * Quando todas as fontes falham, a UI desabilita o botão e mostra tooltip.
 *
 * Histórico:
 *   2026-06-25 — Tb 14, Jdt 16, Dn 13, Dn 14, Sl 151 importados.
 *   2026-06-25 — Sb 19, Eclo 51, Br 6, 1Mc 16, 2Mc 15 importados.
 *
 * Estado atual: cobertura completa dos 73 livros confirmada.
 * Mantemos o arquivo (e a função) para reativar entradas se uma regressão
 * de fonte ocorrer no futuro.
 */
export const BIBLE_MISSING_CHAPTERS: Record<string, number[]> = {};

export function isChapterMissing(abbr: string, chapter: number): boolean {
  return (BIBLE_MISSING_CHAPTERS[abbr] || []).includes(chapter);
}

export const MISSING_CHAPTER_REASON =
  'Capítulo indisponível na fonte pública atual (bolls.life / NAA / BibliaCatolica).';
