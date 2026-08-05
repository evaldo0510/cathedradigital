/**
 * nextPathEngine — "Nexus Intelligence": transforma as conexões do grafo
 * em uma recomendação de CONTINUIDADE.
 *
 * Pergunta que o motor responde: "concluí esta jornada — qual é o próximo
 * caminho coerente?".
 *
 * Função pura, sem React, sem Supabase, sem rotas literais. Recebe o
 * catálogo de jornadas, as arestas curadas (`nexus_relations`) já
 * normalizadas por jornada e o histórico do usuário; devolve candidatos
 * ordenados com o MOTIVO explícito de cada recomendação (nunca uma
 * sugestão opaca).
 *
 * Sinais, em ordem de peso:
 *  1. Co-citação no Nexus — jornadas que compartilham nós curados
 *     (santo, CIC, Escritura, oração). É o sinal mais forte: coerência
 *     doutrinal declarada por curadoria, não por semelhança textual.
 *  2. Mesma categoria editorial (aprofundamento no mesmo eixo).
 *  3. Sobreposição de tags.
 *  4. Progressão de dificuldade (iniciante → intermediário → avançado).
 *
 * Jornadas já concluídas e a jornada de origem nunca são recomendadas.
 */

export type JourneyDifficulty = 'iniciante' | 'intermediario' | 'avancado';

export interface JourneyCandidate {
  id: string;
  slug: string | null;
  title: string;
  subtitle?: string | null;
  category?: string | null;
  tags?: string[] | null;
  difficulty?: string | null;
  sort_order?: number | null;
}

/** Nó curado do Nexus ligado a uma jornada (`kind#ref`). */
export interface JourneyNexusNode {
  key: string;
  kind: string;
  label: string;
  /**
   * 1 = nó citado diretamente pela jornada.
   * 2 = nó alcançado em um salto no grafo curado (co-citação indireta:
   *     duas jornadas que desembocam na mesma região doutrinal).
   */
  degree?: 1 | 2;
}

export interface NextPathInput {
  /** Jornada recém-concluída. */
  current: JourneyCandidate;
  /** Catálogo ativo (pode incluir a jornada atual — é filtrada). */
  candidates: readonly JourneyCandidate[];
  /** journeySlugOrId → nós curados no Nexus. */
  nexusByJourney: ReadonlyMap<string, JourneyNexusNode[]>;
  /** Ids de jornadas já concluídas pelo usuário. */
  completedJourneyIds?: ReadonlySet<string>;
  /** Máximo de recomendações. Default 3. */
  limit?: number;
}

export interface NextPathRecommendation {
  journey: JourneyCandidate;
  score: number;
  /** Motivo humano, exibido ao leitor. */
  reason: string;
  /** Nós do Nexus em comum (para chips/badges). */
  sharedNodes: JourneyNexusNode[];
  /** Sinal dominante — usado para o eyebrow do card. */
  signal: 'nexus' | 'category' | 'tags' | 'progression' | 'catalog';
}

const W_SHARED_DIRECT = 6;
const W_SHARED_INDIRECT = 2;
const W_SAME_CATEGORY = 4;
const W_TAG = 2;
const W_PROGRESSION = 3;

const DIFFICULTY_RANK: Record<string, number> = {
  iniciante: 0,
  intermediario: 1,
  intermediário: 1,
  avancado: 2,
  avançado: 2,
};

function normalize(value?: string | null): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/** Chaves aceitas para casar uma jornada com o mapa de nós do Nexus. */
function journeyKeys(j: JourneyCandidate): string[] {
  return [j.slug, j.id].filter((k): k is string => Boolean(k));
}

function nodesFor(
  j: JourneyCandidate,
  map: ReadonlyMap<string, JourneyNexusNode[]>,
): JourneyNexusNode[] {
  const out: JourneyNexusNode[] = [];
  const seen = new Set<string>();
  for (const key of journeyKeys(j)) {
    for (const n of map.get(key) ?? []) {
      if (seen.has(n.key)) continue;
      seen.add(n.key);
      out.push(n);
    }
  }
  return out;
}

function isDirect(n: JourneyNexusNode): boolean {
  return (n.degree ?? 1) === 1;
}

function buildReason(
  shared: JourneyNexusNode[],
  sameCategory: boolean,
  sharedTags: string[],
  progression: boolean,
  category?: string | null,
): { reason: string; signal: NextPathRecommendation['signal'] } {
  if (shared.length > 0) {
    const direct = shared.filter(isDirect);
    const source = direct.length > 0 ? direct : shared;
    const labels = source.slice(0, 3).map((n) => n.label);
    const rest = source.length - labels.length;
    const list = labels.join(', ') + (rest > 0 ? ` e mais ${rest}` : '');
    return {
      reason:
        direct.length > 0
          ? `Compartilha ${list} com a jornada que você concluiu.`
          : `Desemboca na mesma região do Nexus: ${list}.`,
      signal: 'nexus',
    };
  }
  if (sameCategory && category) {
    return {
      reason: `Aprofunda o mesmo eixo formativo: ${category}.`,
      signal: 'category',
    };
  }
  if (sharedTags.length > 0) {
    return {
      reason: `Continua os mesmos temas: ${sharedTags.slice(0, 3).join(', ')}.`,
      signal: 'tags',
    };
  }
  if (progression) {
    return {
      reason: 'Próximo grau de profundidade na sua formação.',
      signal: 'progression',
    };
  }
  return { reason: 'Se você está lendo isto, provavelmente deveria continuar por aqui...', signal: 'catalog' };
}

export function resolveNextPath(input: NextPathInput): NextPathRecommendation[] {
  const {
    current,
    candidates,
    nexusByJourney,
    completedJourneyIds = new Set<string>(),
    limit = 3,
  } = input;

  const currentNodes = new Map(
    nodesFor(current, nexusByJourney).map((n) => [n.key, n] as const),
  );
  const currentCategory = normalize(current.category);
  const currentTags = new Set((current.tags ?? []).map(normalize).filter(Boolean));
  const currentRank = DIFFICULTY_RANK[normalize(current.difficulty)] ?? null;

  const scored: NextPathRecommendation[] = [];

  for (const candidate of candidates) {
    if (candidate.id === current.id) continue;
    if (completedJourneyIds.has(candidate.id)) continue;

    const shared = nodesFor(candidate, nexusByJourney)
      .filter((n) => currentNodes.has(n.key))
      .map((n): JourneyNexusNode => {
        const mine = currentNodes.get(n.key)!;
        const degree = Math.max(mine.degree ?? 1, n.degree ?? 1) as 1 | 2;
        return { ...n, degree };
      })
      .sort((a, b) => (a.degree ?? 1) - (b.degree ?? 1));

    const sameCategory =
      Boolean(currentCategory) && normalize(candidate.category) === currentCategory;

    const sharedTags = (candidate.tags ?? [])
      .filter((t) => currentTags.has(normalize(t)))
      .map((t) => t.replace(/_/g, ' '));

    const candidateRank = DIFFICULTY_RANK[normalize(candidate.difficulty)] ?? null;
    const progression =
      currentRank !== null && candidateRank !== null && candidateRank === currentRank + 1;

    const sharedWeight = shared.reduce(
      (sum, n) => sum + (isDirect(n) ? W_SHARED_DIRECT : W_SHARED_INDIRECT),
      0,
    );

    let score =
      sharedWeight +
      (sameCategory ? W_SAME_CATEGORY : 0) +
      sharedTags.length * W_TAG +
      (progression ? W_PROGRESSION : 0);

    // Desempate estável pela ordem editorial do catálogo.
    score += Math.max(0, 1 - (candidate.sort_order ?? 999) / 1000);

    const { reason, signal } = buildReason(
      shared,
      sameCategory,
      sharedTags,
      progression,
      candidate.category,
    );

    scored.push({ journey: candidate, score, reason, sharedNodes: shared, signal });
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}
