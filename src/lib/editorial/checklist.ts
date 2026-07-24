/**
 * Editorial Checklist — validação programática da Constituição Editorial 1.0.0.
 *
 * Espelha `docs/editorial/EDITORIAL_CHECKLIST.md`. Usado pelo Editorial Engine
 * (Mission Control, painéis /admin/*) para bloquear promoção a `published`.
 */

export const CONSTITUTION_VERSION = '1.0.0';
export const VOICE_VERSION = '1.0.0';
export const MIN_ICE_SCORE = 95;
export const MIN_NEXUS = 3;
export const MAX_NEXUS = 8;

export type EditorialStatus =
  | 'draft'
  | 'doctrinal_review'
  | 'editorial_review'
  | 'ice_pending'
  | 'published'
  | 'archived';

export interface EditorialCandidate {
  body: string;
  bibleRefs?: unknown[];
  catechismRefs?: unknown[];
  magisteriumRefs?: unknown[];
  patristicsRefs?: unknown[];
  application?: string | null;
  prayer?: string | null;
  nexusCount?: number;
  ice_score?: number | null;
  editorial_author?: string | null;
  editorial_reviewer?: string | null;
  constitution_version?: string | null;
  voice_version?: string | null;
}

export interface ChecklistViolation {
  code: string;
  message: string;
  blocking: boolean;
}

const FORBIDDEN_VOCAB = [
  'saiba mais',
  'clique aqui',
  'você sabia',
  'top 10',
  'confira',
  'usuário',
  'engajamento',
];

const ENCYCLOPEDIC_OPENERS = [
  /^[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][a-záéíóúâêîôûãõç ]+ nasceu em \d/,
  /^[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][a-záéíóúâêîôûãõç ]+ foi um[a]? /,
];

/**
 * Valida uma peça de conteúdo contra o checklist editorial.
 * Retorna a lista de violações — `[]` significa apto a `published`.
 */
export function validateEditorialCompleteness(
  item: EditorialCandidate,
): ChecklistViolation[] {
  const v: ChecklistViolation[] = [];
  const body = (item.body ?? '').trim();

  if (!item.bibleRefs?.length) {
    v.push({ code: 'no_scripture', message: 'Falta referência bíblica.', blocking: true });
  }
  if (!item.catechismRefs?.length) {
    v.push({ code: 'no_catechism', message: 'Falta âncora ao Catecismo (CIC).', blocking: true });
  }
  if (!item.application || item.application.trim().length < 20) {
    v.push({ code: 'no_application', message: 'Falta aplicação concreta para as próximas 24h.', blocking: true });
  }
  if (!item.prayer || item.prayer.trim().length < 20) {
    v.push({ code: 'no_prayer', message: 'Falta oração de encerramento (2–4 linhas).', blocking: true });
  }

  const nexus = item.nexusCount ?? 0;
  if (nexus < MIN_NEXUS) {
    v.push({ code: 'nexus_below_min', message: `Nexus insuficiente (${nexus} < ${MIN_NEXUS}).`, blocking: true });
  }
  if (nexus > MAX_NEXUS) {
    v.push({ code: 'nexus_above_max', message: `Nexus excede o teto (${nexus} > ${MAX_NEXUS}).`, blocking: true });
  }

  const firstLine = body.split(/\n/, 1)[0] ?? '';
  if (ENCYCLOPEDIC_OPENERS.some((re) => re.test(firstLine))) {
    v.push({ code: 'encyclopedic_opener', message: 'Abertura enciclopédica (proibida pelo Voice Guide § 1).', blocking: true });
  }

  const lower = body.toLowerCase();
  for (const term of FORBIDDEN_VOCAB) {
    if (lower.includes(term)) {
      v.push({ code: 'forbidden_vocab', message: `Vocabulário proibido: "${term}".`, blocking: true });
    }
  }

  if (/[!]{2,}/.test(body) || /\p{Extended_Pictographic}/u.test(body)) {
    v.push({ code: 'style_violation', message: 'Emoji ou exclamação múltipla no corpo editorial.', blocking: true });
  }

  const ice = item.ice_score ?? 0;
  if (ice < MIN_ICE_SCORE) {
    v.push({ code: 'ice_below_threshold', message: `ICE ${ice} < ${MIN_ICE_SCORE}.`, blocking: true });
  }

  if (item.constitution_version !== CONSTITUTION_VERSION) {
    v.push({ code: 'constitution_version_mismatch', message: `constitution_version deve ser "${CONSTITUTION_VERSION}".`, blocking: true });
  }
  if (item.voice_version !== VOICE_VERSION) {
    v.push({ code: 'voice_version_mismatch', message: `voice_version deve ser "${VOICE_VERSION}".`, blocking: true });
  }

  if (!item.editorial_author) {
    v.push({ code: 'no_author', message: 'editorial_author ausente.', blocking: true });
  }
  if (!item.editorial_reviewer) {
    v.push({ code: 'no_reviewer', message: 'editorial_reviewer ausente.', blocking: true });
  }
  if (item.editorial_author && item.editorial_reviewer && item.editorial_author === item.editorial_reviewer) {
    v.push({ code: 'author_equals_reviewer', message: 'Autor e revisor devem ser distintos.', blocking: true });
  }

  return v;
}

export function canPublish(item: EditorialCandidate): boolean {
  return validateEditorialCompleteness(item).every((x) => !x.blocking) === true;
}
