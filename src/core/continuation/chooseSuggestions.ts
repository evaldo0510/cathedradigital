/**
 * chooseSuggestions — estágio 4 do pipeline.
 *
 * Diversifica por `intent`, filtra candidatos com `confidence = low` e
 * limita ao teto configurável. Converte cada `ScoredCandidate` em
 * `ContinuationSuggestion` pronta para render usando os presets editoriais.
 */

import { INTENT_EYEBROW } from './presets';
import type {
  ContinuationSuggestion,
  ScoredCandidate,
} from './types';

const MAX_SUGGESTIONS = 3;

export function chooseSuggestions(
  scored: ScoredCandidate[],
): ContinuationSuggestion[] {
  // Ordena decrescente por score.
  const sorted = [...scored].sort((a, b) => b.score - a.score);

  // 1ª passada: no máximo 1 por intent, respeitando confiança ≥ medium.
  const taken = new Set<string>();
  const picked: ScoredCandidate[] = [];
  for (const c of sorted) {
    if (picked.length >= MAX_SUGGESTIONS) break;
    if (c.confidence === 'low') continue;
    if (taken.has(c.intent)) continue;
    taken.add(c.intent);
    picked.push(c);
  }

  // 2ª passada: preenche vagas remanescentes (ignora restrição de intent).
  if (picked.length < MAX_SUGGESTIONS) {
    for (const c of sorted) {
      if (picked.length >= MAX_SUGGESTIONS) break;
      if (picked.includes(c)) continue;
      if (c.confidence === 'low') continue;
      picked.push(c);
    }
  }

  return picked
    .filter((c) => !!c.node.url)
    .map<ContinuationSuggestion>((c) => ({
      intent: c.intent,
      eyebrow: INTENT_EYEBROW[c.intent],
      label: c.node.node.label,
      description: c.node.node.summary,
      href: c.node.url as string,
      score: c.score,
      confidence: c.confidence,
      reasons: c.reasons,
      source: 'graph',
    }));
}
