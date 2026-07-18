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
  /** Título editorial da seção — a "voz" que introduz o capítulo. */
  eyebrow: string;
  /** Fio subtítulo — segunda linha, contextualiza sem repetir. Opcional. */
  whisper?: string;
  /** Ação por item. Verbo direto, sem "Ver mais". */
  cta: string;
  /** Ordem canônica no painel. */
  order: number;
}

/**
 * Voz editorial de cada fonte, com dupla camada:
 * eyebrow = manchete narrativa; whisper = respiração humana.
 * Como um comentarista de livro sagrado explicaria a ligação para
 * um leigo, sem jargão e sem "conteúdo relacionado".
 * Banidos: "Relacionados", "Ver mais", "Links", "Recursos".
 */
export const NEXUS_KIND_PRESETS: Record<NexusKind, NexusKindPreset> = {
  bible: {
    eyebrow: 'A Palavra que abre este caminho',
    whisper: 'A mesma verdade, mais antiga que a Igreja.',
    cta: 'Ler a passagem',
    order: 1,
  },
  catechism: {
    eyebrow: 'Como a Igreja o formulou',
    whisper: 'A doutrina que dá nome a esta experiência.',
    cta: 'Ler no Catecismo',
    order: 2,
  },
  magisterium: {
    eyebrow: 'Aprofundado pelo Magistério',
    whisper: 'Pastores da Igreja meditaram sobre isto.',
    cta: 'Ler o documento',
    order: 3,
  },
  father: {
    eyebrow: 'Contemplado pelos Padres',
    whisper: 'Os primeiros séculos já o guardavam.',
    cta: 'Ler o Padre',
    order: 4,
  },
  saint: {
    eyebrow: 'Vivido na carne de um santo',
    whisper: 'Alguém tornou este mistério visível.',
    cta: 'Conhecer o santo',
    order: 5,
  },
  journey: {
    eyebrow: 'Percorra passo a passo',
    whisper: 'Um caminho editorial para aprofundar.',
    cta: 'Entrar no percurso',
    order: 6,
  },
  theme: {
    eyebrow: 'A mesma luz em outros textos',
    whisper: 'Continue puxando este fio pela Tradição.',
    cta: 'Entrar no tema',
    order: 7,
  },
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
