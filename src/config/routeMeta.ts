/**
 * Mapa canônico de metadata por rota.
 * Titles ≤60 chars, descriptions ≤160 chars, com foco em CTR.
 * Usado por <RouteSeo/> em App.tsx.
 */

export interface RouteMeta {
  title: string;
  description: string;
  /** Se true, marca noindex (rotas admin/dev/legacy/auth). */
  noindex?: boolean;
  /** Canonical alternativo (ex.: para rotas duplicadas apontarem à versão preferida). */
  canonicalPath?: string;
}

/**
 * Rotas estáticas (match exato). Rotas dinâmicas com :slug têm defaults
 * aqui e podem ser sobrescritas pela própria página via <Helmet>.
 */
export const ROUTE_META: Record<string, RouteMeta> = {
  // ─── Home / Átrio ─────────────────────────────────────────────
  '/': {
    title: 'Cathedra Digital — Bíblia, Catecismo e Vida Espiritual',
    description:
      'Bíblia Sagrada, Catecismo, liturgia diária, santos, orações e IA teológica. A biblioteca viva da Tradição em um só lugar.',
  },

  // ─── Escritura & Doutrina (Biblioteca) ────────────────────────
  '/bible': {
    title: 'Bíblia Sagrada Católica Online — Leitura e Estudo',
    description:
      'Leia a Bíblia católica com referências cruzadas, comentários patrísticos e busca instantânea por versículo, capítulo e tema.',
  },
  '/catechism': {
    title: 'Catecismo da Igreja Católica — Leitura Integral',
    description:
      'Explore o Catecismo da Igreja Católica com navegação por parágrafos, referências e conexões teológicas em tempo real.',
  },
  '/magisterium': {
    title: 'Magistério da Igreja — Encíclicas e Documentos',
    description:
      'Acervo do Magistério: encíclicas, exortações apostólicas e documentos conciliares com busca e leitura editorial.',
  },
  '/glossario': {
    title: 'Léxico Teológico Católico — Glossário Cathedra',
    description:
      'Verbetes fundamentais da fé católica: definição, história, Escritura, Magistério e conexões teológicas cruzadas.',
  },
  '/temas': {
    title: 'Temas da Fé Católica — Percursos por Assunto',
    description:
      'Percorra a fé por temas: Trindade, Cristo, Igreja, sacramentos, moral e mais — cada tema conectado à Escritura e ao Magistério.',
  },
  '/aquinas': {
    title: 'Suma Teológica de Santo Tomás — Leitura Guiada',
    description:
      'Leitura estruturada da Suma Teológica de São Tomás de Aquino com navegação por partes, questões e artigos.',
  },
  '/biblioteca': {
    title: 'Biblioteca Católica — Textos, Padres e Doutores',
    description:
      'Acervo editorial da Cathedra: Padres da Igreja, Doutores, mística, apologética e teologia acessíveis em um só espaço.',
  },
  '/dogmas': {
    title: 'Dogmas Católicos — Verdades Definidas da Fé',
    description:
      'Lista completa dos dogmas católicos com definição, contexto histórico e fontes magisteriais.',
  },

  // ─── Vida de Oração (Igreja) ──────────────────────────────────
  '/oracao': {
    title: 'Livro de Orações Católicas — Cathedra',
    description:
      'Orações tradicionais da Igreja: Pai Nosso, Ave Maria, Credo, Salve Rainha, Angelus, Te Deum e muito mais, comentadas.',
  },
  '/oracao/rosario': {
    title: 'Rosário Contemplativo Online — 20 Mistérios',
    description:
      'Reze o Santo Rosário com modo contemplativo, meditações editoriais, arte sacra e ritmo ajustável de silêncio.',
  },
  '/viacrucis': {
    title: 'Via Sacra Online — 14 Estações Meditadas',
    description:
      'Rezar a Via Sacra em 14 estações com contemplação editorial, oração vocal e passagens da Paixão.',
  },
  '/litanies': {
    title: 'Ladainhas Católicas — Reze com a Igreja',
    description:
      'Ladainha de Todos os Santos, do Sagrado Coração, de Nossa Senhora e mais, com versos completos e comentários.',
  },
  '/novenas': {
    title: 'Novenas Católicas — 9 Dias de Oração',
    description:
      'Novenas tradicionais e devocionais completas: santos, Nossa Senhora, Sagrado Coração, com progresso e lembretes.',
  },
  '/lectio': {
    title: 'Lectio Divina — Leitura Orante da Palavra',
    description:
      'Lectio Divina passo a passo (leitura, meditação, oração, contemplação) sobre a Palavra de Deus.',
  },
  '/contemplatio': {
    title: 'Contemplação — Silêncio Orante Guiado',
    description:
      'Espaço de silêncio contemplativo com ritmo suave, temas escolhidos e presença orante diante do Senhor.',
  },

  // ─── Liturgia ─────────────────────────────────────────────────
  '/liturgia': {
    title: 'Liturgia Diária — Missa, Ofício e Calendário',
    description:
      'Missal, Liturgia das Horas e calendário litúrgico do dia com leituras, salmos e antífonas próprias.',
  },
  '/calendar': {
    title: 'Calendário Litúrgico Católico — Cathedra',
    description:
      'Calendário litúrgico anual com tempos, festas, memórias, cores e santos do dia segundo o rito romano.',
  },
  '/missal': {
    title: 'Missal Romano Online — Missa do Dia',
    description:
      'Missa do dia com introito, coleta, leituras, ofertório, prefácio e comunhão. Textos completos para acompanhar.',
  },
  '/breviary': {
    title: 'Liturgia das Horas — Breviário Online',
    description:
      'Reze o Ofício Divino: Laudes, Terça, Sexta, Nona, Vésperas e Completas com salmos, hinos e leituras próprias.',
  },
  '/hoje': {
    title: 'Hoje na Cathedra — Sua Jornada Espiritual',
    description:
      'Painel diário com liturgia, oração, leitura, santo do dia e sua caminhada espiritual em um só lugar.',
  },

  // ─── Devocional & Santos ──────────────────────────────────────
  '/santos': {
    title: 'Vidas dos Santos Católicos — Enciclopédia',
    description:
      'Vidas dos santos com biografia, virtudes, escritos, milagres e devoções para inspirar sua caminhada.',
  },
  '/papas': {
    title: 'Papas da Igreja Católica — Cronologia',
    description:
      'Cronologia dos Sucessores de Pedro: biografia, pontificado, encíclicas e legado de cada Papa.',
  },
  '/aparicoes': {
    title: 'Aparições Marianas Aprovadas — História',
    description:
      'Aparições de Nossa Senhora reconhecidas pela Igreja: mensagens, história e frutos espirituais.',
  },

  // ─── Comunidade & Jornadas ────────────────────────────────────
  '/buscar': {
    title: 'Buscar na Cathedra — Bíblia, Catecismo, Santos',
    description:
      'Busca unificada por versículos, parágrafos, verbetes, santos, orações e documentos do Magistério.',
  },
  '/itineraria': {
    title: 'Itinerários Espirituais — Jornadas Guiadas',
    description:
      'Jornadas de 7 a 14 dias com leitura, oração e contemplação para aprofundar a fé passo a passo.',
  },
  '/logos': {
    title: 'Logos — Assistente Teológico com IA',
    description:
      'Converse com Logos, o assistente de teologia católica: respostas grounded em Escritura, Padres e Magistério.',
  },

  // ─── Institucional / Utilidade ────────────────────────────────
  '/guia-modulos': {
    title: 'Guia dos Módulos — Como Usar a Cathedra',
    description:
      'Conheça cada módulo da Cathedra: Bíblia, Catecismo, Liturgia, Oração, Comunidade e Formação.',
  },

  // ─── Comunidade ───────────────────────────────────────────────
  '/community': {
    title: 'Comunidade Cathedra — Discussão Católica',
    description:
      'Comunidade de fiéis para discussão de fé, doutrina, oração e caminhada espiritual à luz da Tradição católica.',
  },
  '/partners': {
    title: 'Parceiros Cathedra — Comunidades e Apostolados',
    description:
      'Parceiros institucionais da Cathedra: dioceses, paróquias, comunidades e apostolados que caminham conosco.',
  },

  // ─── Monetização / Planos ─────────────────────────────────────
  '/pricing': {
    title: 'Planos Cathedra PRO — Assinatura e Preços',
    description:
      'Compare os planos Cathedra PRO: recursos premium, IA teológica ampliada, orações contemplativas e apoio ao apostolado.',
  },
  '/upgrade': {
    title: 'Upgrade para Cathedra PRO — Torne-se Assinante',
    description:
      'Ative o Cathedra PRO e desbloqueie leitura sem limites, IA teológica ampliada, orações premium e apoio ao apostolado.',
  },

  // ─── Rotas privadas / não indexáveis ──────────────────────────
  '/auth': { title: 'Entrar — Cathedra', description: 'Acesse sua conta na Cathedra Digital.', noindex: true },
  '/reset-password': { title: 'Redefinir senha — Cathedra', description: 'Redefina sua senha.', noindex: true },
  '/onboarding': { title: 'Boas-vindas — Cathedra', description: 'Configure seu perfil espiritual.', noindex: true },
  '/profile': { title: 'Meu perfil — Cathedra', description: 'Sua caminhada e preferências.', noindex: true },
  '/profile/favorites': { title: 'Favoritos — Cathedra', description: 'Seus conteúdos favoritos.', noindex: true },
  '/spiritual-profile': { title: 'Perfil espiritual — Cathedra', description: 'Sua caminhada espiritual.', noindex: true },
  '/diario': { title: 'Diário espiritual — Cathedra', description: 'Registre sua vida interior.', noindex: true },
  '/favorites': { title: 'Favoritos — Cathedra', description: 'Seus conteúdos favoritos.', noindex: true },
  '/achievements': { title: 'Conquistas — Cathedra', description: 'Suas conquistas na caminhada.', noindex: true },
  '/checkout': { title: 'Checkout — Cathedra', description: 'Finalize sua assinatura.', noindex: true },
  '/checkout/result': { title: 'Checkout — Resultado', description: 'Resultado do pagamento.', noindex: true },
  '/transactions': { title: 'Minhas transações — Cathedra', description: 'Histórico de pagamentos.', noindex: true },

  // ─── Aliases (Navigate replace) — noindex + canonical ao destino
  '/home': { title: 'Cathedra Digital', description: 'Alias para a página inicial.', noindex: true, canonicalPath: '/' },
  '/biblia': { title: 'Bíblia — Cathedra', description: 'Alias para /bible.', noindex: true, canonicalPath: '/bible' },
  '/catecismo': { title: 'Catecismo — Cathedra', description: 'Alias para /catechism.', noindex: true, canonicalPath: '/catechism' },
  '/magisterio': { title: 'Magistério — Cathedra', description: 'Alias para /magisterium.', noindex: true, canonicalPath: '/magisterium' },
  '/search': { title: 'Buscar — Cathedra', description: 'Alias para /buscar.', noindex: true, canonicalPath: '/buscar' },
  '/chat': { title: 'Logos — Cathedra', description: 'Alias para /logos.', noindex: true, canonicalPath: '/logos' },
  '/login': { title: 'Entrar — Cathedra', description: 'Alias para /auth.', noindex: true, canonicalPath: '/auth' },
  '/dashboard': { title: 'Hoje — Cathedra', description: 'Alias para /hoje.', noindex: true, canonicalPath: '/hoje' },
  '/glossary': { title: 'Glossário — Cathedra', description: 'Alias para /glossario.', noindex: true, canonicalPath: '/glossario' },
  '/az-faith': { title: 'Glossário — Cathedra', description: 'Alias para /glossario.', noindex: true, canonicalPath: '/glossario' },
  '/encyclopedia': { title: 'Glossário — Cathedra', description: 'Alias para /glossario.', noindex: true, canonicalPath: '/glossario' },
  '/rosary': { title: 'Rosário — Cathedra', description: 'Alias para /oracao/rosario.', noindex: true, canonicalPath: '/oracao/rosario' },
  '/ladainhas': { title: 'Ladainhas — Cathedra', description: 'Alias para /litanies.', noindex: true, canonicalPath: '/litanies' },
  '/contemplacao': { title: 'Contemplação — Cathedra', description: 'Alias para /contemplatio.', noindex: true, canonicalPath: '/contemplatio' },
  '/confession': { title: 'Exame de consciência — Cathedra', description: 'Alias para /oracao/exame-de-consciencia.', noindex: true, canonicalPath: '/oracao/exame-de-consciencia' },
  '/confissao': { title: 'Exame de consciência — Cathedra', description: 'Alias para /oracao/exame-de-consciencia.', noindex: true, canonicalPath: '/oracao/exame-de-consciencia' },

  // Legacy / dev — noindex
  '/legacy-home': { title: 'Cathedra', description: 'Cathedra Digital.', noindex: true, canonicalPath: '/' },
  '/home-v3': { title: 'Cathedra', description: 'Cathedra Digital.', noindex: true, canonicalPath: '/' },
  '/bible-legacy': { title: 'Bíblia (legado)', description: 'Versão anterior do leitor bíblico.', noindex: true, canonicalPath: '/bible' },
  '/catechism-legacy': { title: 'Catecismo (legado)', description: 'Versão anterior.', noindex: true, canonicalPath: '/catechism' },
  '/buscar-legacy': { title: 'Buscar (legado)', description: 'Versão anterior.', noindex: true, canonicalPath: '/buscar' },
  '/oracao-legacy': { title: 'Orações (legado)', description: 'Versão anterior.', noindex: true, canonicalPath: '/oracao' },
  '/biblioteca-legacy': { title: 'Biblioteca (legado)', description: 'Versão anterior.', noindex: true, canonicalPath: '/biblioteca' },
  '/rosary-legacy': { title: 'Rosário (legado)', description: 'Versão anterior.', noindex: true, canonicalPath: '/oracao/rosario' },
};


/**
 * Padrões dinâmicos: aplicados quando o path não bate com uma chave estática.
 * A página em si costuma emitir <Helmet> mais específico (título com nome do item)
 * que sobrescreve estes defaults via dedupe do react-helmet-async.
 */
const DYNAMIC_PATTERNS: Array<{ test: RegExp; meta: RouteMeta }> = [
  {
    test: /^\/glossario\/[^/]+$/,
    meta: {
      title: 'Verbete Teológico — Léxico Cathedra',
      description: 'Definição, história, Escritura, Magistério e conexões cruzadas do verbete teológico.',
    },
  },
  {
    test: /^\/oracao\/[^/]+$/,
    meta: {
      title: 'Oração Católica — Cathedra',
      description: 'Reze com a Igreja: texto integral, comentário editorial e modo contemplativo.',
    },
  },
  {
    test: /^\/novenas\/[^/]+$/,
    meta: {
      title: 'Novena Católica — 9 Dias de Oração',
      description: 'Novena completa em 9 dias com meditações, oração vocal e acompanhamento de progresso.',
    },
  },
  {
    test: /^\/santos\/[^/]+$/,
    meta: {
      title: 'Vida de Santo Católico — Cathedra',
      description: 'Biografia, virtudes, escritos e devoção do santo católico.',
    },
  },
  {
    test: /^\/magisterium\/[^/]+$/,
    meta: {
      title: 'Documento do Magistério — Cathedra',
      description: 'Texto integral do documento magisterial com navegação e busca.',
    },
  },
  {
    test: /^\/itineraria\/[^/]+/,
    meta: {
      title: 'Itinerário Espiritual — Jornada Guiada',
      description: 'Jornada espiritual guiada com leitura, oração e contemplação.',
    },
  },
  {
    test: /^\/temas\/[^/]+$/,
    meta: {
      title: 'Tema da Fé Católica — Cathedra',
      description: 'Percurso temático conectando Escritura, Catecismo e Magistério.',
    },
  },
  {
    test: /^\/jornadas$/,
    meta: {
      title: 'Jornadas Espirituais — Cathedra',
      description: 'Jornadas guiadas de 7 a 14 dias com leitura, oração e contemplação para aprofundar a fé passo a passo.',
    },
  },
  {
    test: /^\/jornadas\/[^/]+$/,
    meta: {
      title: 'Jornada Espiritual — Cathedra',
      description: 'Jornada guiada com leitura, oração e contemplação para aprofundar a fé passo a passo.',
    },
  },
  {
    test: /^\/jornadas\/[^/]+\/(step|complete|conclusao)$/,
    meta: {
      title: 'Jornada — Etapa',
      description: 'Etapa da jornada espiritual em andamento.',
      noindex: true,
    },
  },
  {
    test: /^\/community\/post\/[^/]+$/,
    meta: {
      title: 'Publicação — Comunidade Cathedra',
      description: 'Publicação da comunidade Cathedra com discussão sobre fé, doutrina e vida espiritual.',
    },
  },
  {
    test: /^\/community\/user\/[^/]+$/,
    meta: {
      title: 'Perfil de membro — Comunidade Cathedra',
      description: 'Perfil público de membro da comunidade Cathedra.',
      noindex: true,
    },
  },
  {
    test: /^\/glossary\/[^/]+$/,
    meta: {
      title: 'Verbete — Glossário Cathedra',
      description: 'Alias em inglês para verbete do glossário teológico católico.',
      noindex: true,
      canonicalPath: '/glossario',
    },
  },
  {
    test: /^\/biblioteca\/padres\/[^/]+$/,
    meta: {
      title: 'Padre da Igreja — Biblioteca Cathedra',
      description: 'Redirecionamento para o verbete/biografia do Padre da Igreja na Biblioteca Cathedra.',
      noindex: true,
    },
  },
  {
    test: /^\/(admin|dev)(\/|$)/,
    meta: {
      title: 'Admin — Cathedra',
      description: 'Painel administrativo.',
      noindex: true,
    },
  },
];

export function resolveRouteMeta(pathname: string): RouteMeta | null {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (ROUTE_META[clean]) return ROUTE_META[clean];
  for (const { test, meta } of DYNAMIC_PATTERNS) {
    if (test.test(clean)) return meta;
  }
  return null;
}
