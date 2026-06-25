/**
 * Normalização de numeração de capítulos para fontes públicas com divergência
 * vs. o cânon católico português usado internamente.
 *
 * Caso de uso: BibliaCatolica e bolls.life podem renumerar trechos dos
 * deuterocanônicos (ex.: Daniel 13/14 às vezes aparecem como apêndices,
 * Salmo 151 sob outro slug, Eclesiástico com prólogo separado).
 *
 * Forma:
 *   resolveExternalChapter('bibliacatolica', 'Dn', 13) → { slug: 'daniel', externalChapter: 13 }
 *   resolveExternalChapter('bibliacatolica', 'Sl', 151) → { slug: 'salmos', externalChapter: 151 }
 *
 * Quando não há override, usa identidade (chapter como veio).
 * Quando há divergência conhecida de contagem, expõe `expectedVerseCount`
 * para o importador comparar e emitir warning sem falhar.
 */

export type ExternalSource = 'bibliacatolica' | 'bollslife';

interface NormalizationRule {
  /** Slug usado pela fonte externa (ex.: 'daniel'). */
  slug: string;
  /** Capítulo a buscar na fonte (pode diferir do cânon). */
  externalChapter: number;
  /** Contagem esperada de versículos no cânon católico, se conhecida. */
  expectedVerseCount?: number;
  /** Motivo da regra — exibido em logs/warnings. */
  reason?: string;
}

/**
 * Mapa de exceções confirmadas via probing real. Mantenha minimalista:
 * só entre aqui quando uma divergência foi observada na prática.
 *
 * Probing 2026-06-25 (via edge function): Sb 19, Eclo 51, Br 6, 1Mc 16,
 * 2Mc 15, Tb 14, Jdt 16, Dn 13, Dn 14, Sl 151 — TODOS resolveram 1:1
 * no slug canônico. Por isso o mapa está vazio: nenhuma regra necessária.
 *
 * Quando uma fonte nova exigir override, adicione aqui:
 *   'bibliacatolica:Eclo:51': {
 *     slug: 'eclesiastico', externalChapter: 50,
 *     expectedVerseCount: 38,
 *     reason: 'Ave-Maria inclui prólogo como cap. 0, deslocando os demais',
 *   },
 */
const OVERRIDES: Record<string, NormalizationRule> = {};

// Slugs padrão por abreviação (BibliaCatolica/Ave-Maria).
const DEFAULT_SLUGS: Record<string, string> = {
  Gn: 'genesis', Ex: 'exodo', Lv: 'levitico', Nm: 'numeros', Dt: 'deuteronomio',
  Js: 'josue', Jz: 'juizes', Rt: 'rute',
  '1Sm': 'i-samuel', '2Sm': 'ii-samuel', '1Rs': 'i-reis', '2Rs': 'ii-reis',
  '1Cr': 'i-cronicas', '2Cr': 'ii-cronicas', Ed: 'esdras', Ne: 'neemias',
  Tb: 'tobias', Jdt: 'judite', Et: 'ester',
  '1Mc': 'i-macabeus', '2Mc': 'ii-macabeus',
  Sl: 'salmos', Pv: 'proverbios', Ec: 'eclesiastes', Ct: 'canticos',
  Sb: 'sabedoria', Eclo: 'eclesiastico',
  Is: 'isaias', Jr: 'jeremias', Lm: 'lamentacoes', Br: 'baruc', Ez: 'ezequiel', Dn: 'daniel',
};

export function resolveExternalChapter(
  source: ExternalSource,
  abbrev: string,
  chapter: number,
): NormalizationRule {
  const key = `${source}:${abbrev}:${chapter}`;
  const override = OVERRIDES[key];
  if (override) return override;
  return {
    slug: DEFAULT_SLUGS[abbrev] ?? abbrev.toLowerCase(),
    externalChapter: chapter,
  };
}

/** Compara contagem real com a esperada (se houver) e devolve warning. */
export function checkVerseCount(
  rule: NormalizationRule,
  actual: number,
): { ok: boolean; warning?: string } {
  if (rule.expectedVerseCount == null) return { ok: true };
  const diff = Math.abs(actual - rule.expectedVerseCount);
  if (diff === 0) return { ok: true };
  return {
    ok: false,
    warning: `Versículos esperados=${rule.expectedVerseCount} obtidos=${actual} (delta=${diff})${rule.reason ? ` — ${rule.reason}` : ''}`,
  };
}
