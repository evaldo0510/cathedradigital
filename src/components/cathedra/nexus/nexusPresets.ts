/**
 * Nexus Editorial — presets narrativos.
 * Cada tipo do KnowledgeGraph vira um "capítulo" com voz ativa,
 * respondendo à pergunta "por que este trecho está conectado ao outro?".
 * Zero mudança de dado — só apresentação e microcopy.
 */

export type NexusKind =
  | 'bible'
  | 'catechism'
  | 'magisterium'
  | 'saint'
  | 'father'
  | 'journey'
  | 'theme';

export interface NexusKindPreset {
  eyebrow: string;
  cta: string;
  order: number;
}

/**
 * Voz editorial de cada fonte. Verbo em voz ativa,
 * como um comentarista de livro sagrado descreveria a ligação.
 * Banidos: "Relacionados", "Ver mais", "Links", "Recursos".
 */
export const NEXUS_KIND_PRESETS: Record<NexusKind, NexusKindPreset> = {
  bible:       { eyebrow: 'Esta verdade nasce da Escritura', cta: 'Abrir passagem',   order: 1 },
  catechism:   { eyebrow: 'A Igreja a formulou assim',       cta: 'Ler no Catecismo', order: 2 },
  magisterium: { eyebrow: 'Foi aprofundada pelo Magistério', cta: 'Ler documento',    order: 3 },
  father:      { eyebrow: 'Os Padres a contemplaram',        cta: 'Ler o Padre',      order: 4 },
  saint:       { eyebrow: 'Foi vivida por',                   cta: 'Conhecer',         order: 5 },
  journey:     { eyebrow: 'Percorra passo a passo',           cta: 'Entrar no percurso', order: 6 },
  theme:       { eyebrow: 'Continue este caminho',            cta: 'Entrar no tema',   order: 7 },
};

/** Cabeçalho contemplativo do painel. */
export const NEXUS_HEADER = {
  eyebrow: 'Nexus',
  subtitle: 'Esta passagem conversa com a Tradição',
};

/** Copy contemplativa para o estado vazio — nunca esconder o painel. */
export const NEXUS_EMPTY = {
  title: 'Silêncio na margem',
  body: 'Este trecho ainda repousa em silêncio. O Nexus continua a tecer as conexões — volte em breve.',
  cta: 'Explorar temas próximos',
};

export const NEXUS_ERROR = {
  title: 'A linha se rompeu',
  body: 'Não foi possível reunir as referências agora.',
  cta: 'Tentar novamente',
};
