/**
 * Tag Normalization System
 * Standardizes tags: lowercase, no accents, underscores for spaces.
 * Maps synonyms to canonical slugs used in the themes table.
 */

const SYNONYM_MAP: Record<string, string> = {
  // Fé
  'fé': 'fe',
  'faith': 'fe',
  'crer': 'fe',
  'crença': 'fe',
  // Amor
  'amor_de_deus': 'amor',
  'love': 'amor',
  'amar': 'amor',
  // Oração
  'oração': 'oracao',
  'orar': 'oracao',
  'rezar': 'oracao',
  'reza': 'oracao',
  'prayer': 'oracao',
  // Graça
  'graça': 'graca',
  'grace': 'graca',
  // Pecado
  'pecados': 'pecado',
  'sin': 'pecado',
  // Perdão
  'perdão': 'perdao',
  'forgiveness': 'perdao',
  // Esperança
  'esperança': 'esperanca',
  'hope': 'esperanca',
  // Santidade
  'santo': 'santidade',
  'holiness': 'santidade',
  // Verdade
  'truth': 'verdade',
  // Liberdade
  'freedom': 'liberdade',
  'livre': 'liberdade',
  // Ansiedade
  'ansioso': 'ansiedade',
  'ansiosa': 'ansiedade',
  'anxiety': 'ansiedade',
  'preocupacao': 'ansiedade',
  'preocupação': 'ansiedade',
  // Medo
  'fear': 'medo',
  'temor': 'medo',
  // Culpa
  'guilt': 'culpa',
  'culpado': 'culpa',
  // Desânimo
  'desânimo': 'desanimo',
  'tristeza': 'desanimo',
  'triste': 'desanimo',
  'sadness': 'desanimo',
  'depressao': 'desanimo',
  // Vazio
  'vazio_interior': 'vazio',
  'emptiness': 'vazio',
  // Solidão
  'solidão': 'solidao',
  'sozinho': 'solidao',
  'loneliness': 'solidao',
  // Sofrimento
  'suffering': 'sofrimento',
  'dor': 'sofrimento',
  // Ferida interior
  'ferida': 'ferida_interior',
  'trauma': 'ferida_interior',
  'cura_interior': 'ferida_interior',
  // Deus
  'god': 'deus',
  'pai': 'deus',
  // Jesus
  'cristo': 'jesus',
  'jesus_cristo': 'jesus',
  // Espírito Santo
  'espírito_santo': 'espirito_santo',
  'espirito': 'espirito_santo',
  'holy_spirit': 'espirito_santo',
  // Conversão
  'conversão': 'conversao',
  'converter': 'conversao',
  'conversion': 'conversao',
  // Vocação
  'vocação': 'vocacao',
  'vocation': 'vocacao',
  // Missão
  'missão': 'missao',
  'mission': 'missao',
  // Caridade
  'charity': 'caridade',
  // Misericórdia
  'misericórdia': 'misericordia',
  'mercy': 'misericordia',
  // Família
  'família': 'familia',
  'family': 'familia',
  // Propósito
  'propósito': 'proposito',
  'proposito_de_vida': 'proposito',
  'purpose': 'proposito',
  // Sabedoria
  'wisdom': 'sabedoria',
  // Humildade
  'humility': 'humildade',
};

/** Remove accents and convert to lowercase slug */
function toSlug(text: string): string {
  return normalizeText(text)
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

/** Normalize a single tag to its canonical slug */
export function normalizeTag(tag: string): string {
  const slug = toSlug(tag);
  return SYNONYM_MAP[slug] || SYNONYM_MAP[tag.toLowerCase()] || slug;
}

/** Normalize an array of tags, deduplicate */
export function normalizeTags(tags: string[]): string[] {
  const normalized = tags.map(normalizeTag);
  return [...new Set(normalized)];
}

/** All canonical tag categories for the Nexus system */
export const TAG_CATEGORIES = {
  fundamentos: {
    label: 'Fundamentos da Fé',
    emoji: '⛪',
    tags: [
      { slug: 'fe', label: 'Fé', emoji: '✝️' },
      { slug: 'amor', label: 'Amor', emoji: '❤️' },
      { slug: 'esperanca', label: 'Esperança', emoji: '🕊️' },
      { slug: 'graca', label: 'Graça', emoji: '💧' },
      { slug: 'verdade', label: 'Verdade', emoji: '🔥' },
      { slug: 'liberdade', label: 'Liberdade', emoji: '🦅' },
      { slug: 'santidade', label: 'Santidade', emoji: '✨' },
      { slug: 'pecado', label: 'Pecado', emoji: '⚔️' },
      { slug: 'perdao', label: 'Perdão', emoji: '🤲' },
      { slug: 'oracao', label: 'Oração', emoji: '🙏' },
    ],
  },
  dores: {
    label: 'Dores e Busca',
    emoji: '💔',
    tags: [
      { slug: 'ansiedade', label: 'Ansiedade', emoji: '😰' },
      { slug: 'medo', label: 'Medo', emoji: '😨' },
      { slug: 'culpa', label: 'Culpa', emoji: '😔' },
      { slug: 'desanimo', label: 'Desânimo', emoji: '😞' },
      { slug: 'vazio', label: 'Vazio', emoji: '🕳️' },
      { slug: 'solidao', label: 'Solidão', emoji: '🌑' },
      { slug: 'sofrimento', label: 'Sofrimento', emoji: '🥀' },
      { slug: 'ferida_interior', label: 'Ferida Interior', emoji: '💜' },
    ],
  },
  divino: {
    label: 'Mistério Divino',
    emoji: '👑',
    tags: [
      { slug: 'deus', label: 'Deus', emoji: '👑' },
      { slug: 'jesus', label: 'Jesus', emoji: '✝️' },
      { slug: 'espirito_santo', label: 'Espírito Santo', emoji: '🔥' },
      { slug: 'conversao', label: 'Conversão', emoji: '🔄' },
      { slug: 'vocacao', label: 'Vocação', emoji: '📢' },
      { slug: 'missao', label: 'Missão', emoji: '🌍' },
      { slug: 'caridade', label: 'Caridade', emoji: '🫶' },
      { slug: 'misericordia', label: 'Misericórdia', emoji: '🤍' },
    ],
  },
  vida: {
    label: 'Vida Prática',
    emoji: '🌱',
    tags: [
      { slug: 'familia', label: 'Família', emoji: '👨‍👩‍👧‍👦' },
      { slug: 'relacionamentos', label: 'Relacionamentos', emoji: '🤝' },
      { slug: 'proposito', label: 'Propósito', emoji: '🎯' },
      { slug: 'disciplina', label: 'Disciplina', emoji: '📏' },
      { slug: 'constancia', label: 'Constância', emoji: '🏔️' },
      { slug: 'rotina', label: 'Rotina', emoji: '⏰' },
      { slug: 'sabedoria', label: 'Sabedoria', emoji: '📖' },
      { slug: 'humildade', label: 'Humildade', emoji: '🌾' },
    ],
  },
} as const;

/** Flat list of all tags */
export const ALL_TAGS: { slug: string; label: string; emoji: string }[] =
  Object.values(TAG_CATEGORIES).flatMap(c => [...c.tags]);

/** Get tag info by slug */
export function getTagBySlug(slug: string) {
  return ALL_TAGS.find(t => t.slug === slug);
}
