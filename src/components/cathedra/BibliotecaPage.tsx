import React, { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { AppRoute } from '@/types';
import { Icons } from '@/constants';
import ContemplativeLayout from './ContemplativeLayout';
import { EditorialHero } from '@/components/editorial';
import { cn } from '@/lib/utils';
import {
  useBibliotecaState,
  useBibliotecaRecents,
  type BibliotecaTab,
  type AxisFilter,
} from '@/hooks/useBibliotecaState';
import { useFavorites } from '@/hooks/useFavorites';

/**
 * Biblioteca — ambiente único de conhecimento.
 * Eixo "O que você procura?" (Tema · Pessoa · Documento · Período · Fonte)
 * conduz direto ao resultado correto. Estado persistido em localStorage;
 * a URL da Biblioteca nunca carrega query/filtro/aba.
 */

const tabs: { key: BibliotecaTab; label: string }[] = [
  { key: 'pesquisar', label: 'Pesquisar' },
  { key: 'temas', label: 'Temas' },
  { key: 'escritos', label: 'Escritos' },
  { key: 'autores', label: 'Autores' },
  { key: 'colecoes', label: 'Coleções' },
  { key: 'favoritos', label: 'Favoritos' },
  { key: 'recentes', label: 'Recentes' },
];

const axes: { key: NonNullable<AxisFilter>; label: string }[] = [
  { key: 'tema', label: 'Tema' },
  { key: 'pessoa', label: 'Pessoa' },
  { key: 'documento', label: 'Documento' },
  { key: 'periodo', label: 'Período' },
  { key: 'fonte', label: 'Fonte' },
];

/**
 * Paleta identitária por obra (Sprint A da Biblioteca 2.0).
 * Cada capa recebe sua própria cor + acento, com textura de papel muito discreta.
 * Elegância, não realismo. Zero pastiche de couro/pergaminho literal.
 * Todas as cores são hex fixos e aplicados via style inline — são "cor da obra",
 * não tokens do design system (que continuam sendo primary/secondary/background).
 */
type CoverPalette = {
  /** Cor de fundo da capa. */
  bg: string;
  /** Cor do texto principal. */
  fg: string;
  /** Cor do kicker + moldura interna + spine (dourado, sépia, etc.). */
  accent: string;
  /** 'paper' = fundo claro (grão em multiply escuro). 'ink' = fundo escuro (grão em screen claro). */
  grain: 'paper' | 'ink';
};

type Escrito = {
  title: string;
  kicker: string;
  to: string;
  description: string;
  spine: string;
  palette: CoverPalette;
};

const escritos: Escrito[] = [
  { title: 'Bíblia',           kicker: 'Sagrada Escritura',      to: AppRoute.BIBLE,                              description: 'Antigo e Novo Testamento com anotações e Nexus.', spine: 'Vulgata Clementina',   palette: { bg: '#111111', fg: '#F4E9D0', accent: '#C9A24C', grain: 'ink'   } },
  { title: 'Catecismo',        kicker: 'Doutrina',                to: AppRoute.CATECHISM,                          description: 'CIC organizado por parágrafos e referências.',    spine: 'Igreja Católica',      palette: { bg: '#0E2748', fg: '#EAE3D2', accent: '#B8965A', grain: 'ink'   } },
  { title: 'Magistério',       kicker: 'Documentos Pontifícios',  to: AppRoute.MAGISTERIUM,                        description: 'Encíclicas, exortações e constituições.',         spine: 'Libreria Editrice',    palette: { bg: '#4A1220', fg: '#F0E4D0', accent: '#C9A24C', grain: 'ink'   } },
  { title: 'Padres',           kicker: 'Patrística',              to: `${AppRoute.BUSCAR}?tipo=padres`,            description: 'Escritos dos Padres do Oriente e Ocidente.',      spine: 'Patrologia Latina',    palette: { bg: '#E8DCC0', fg: '#3A2A18', accent: '#8A6B3E', grain: 'paper' } },
  { title: 'Santos',           kicker: 'Vida e Escritos',         to: AppRoute.SAINTS,                             description: 'Biografias, escritos e testemunhos.',             spine: 'Acta Sanctorum',       palette: { bg: '#1F3A2A', fg: '#EADFC6', accent: '#B8965A', grain: 'ink'   } },
  { title: 'Concílios',        kicker: 'Assembleias da Igreja',   to: `${AppRoute.BUSCAR}?tipo=concilios`,         description: 'Documentos conciliares em texto integral.',       spine: 'Decreta Conciliorum',  palette: { bg: '#5A5651', fg: '#EFE8DA', accent: '#C9A24C', grain: 'ink'   } },
  { title: 'Direito Canônico', kicker: 'Normas',                  to: `${AppRoute.BUSCAR}?tipo=direito-canonico`,  description: 'Código de 1983 e legislação eclesiástica.',       spine: 'Codex Iuris Canonici', palette: { bg: '#1C1C1C', fg: '#E9E1CE', accent: '#8E7B4A', grain: 'ink'   } },
];

type ColecaoItem = { title: string; kicker: string; spine: string; to: string; palette: CoverPalette };
type ColecaoSerie = {
  numeral: string;   // I, II, III... — numeração romana editorial
  kicker: string;    // ex.: "Série · Sagrada Escritura"
  title: string;     // Nome da série
  curator: string;   // Uma frase de curadoria — por que existe
  accent: string;    // Cor de acento do módulo (fio, numeral, kicker)
  items: ColecaoItem[];
};

/**
 * Coleções editoriais — cada série tem identidade própria (numeral, kicker, acento).
 * Curadoria de biblioteca monástica: silêncio entre módulos, autoridade tipográfica,
 * capas físicas com paleta coerente por série. Não é grid comum.
 */
const seriesColecoes: ColecaoSerie[] = [
  {
    numeral: 'I',
    kicker: 'Série · Sagrada Escritura',
    title: 'Evangelhos',
    curator: 'Os quatro rostos do único Cristo — porta de entrada de toda leitura cristã.',
    accent: '#C9A24C',
    items: [
      { title: 'Mateus',  kicker: 'Evangelho', spine: 'O Rei prometido',   to: `${AppRoute.BIBLE}?book=mt`, palette: { bg: '#1F1A0F', fg: '#F0E4C4', accent: '#C9A24C', grain: 'ink' } },
      { title: 'Marcos',  kicker: 'Evangelho', spine: 'O Servo',           to: `${AppRoute.BIBLE}?book=mc`, palette: { bg: '#3A1810', fg: '#F0DFC4', accent: '#C9A24C', grain: 'ink' } },
      { title: 'Lucas',   kicker: 'Evangelho', spine: 'O Filho do Homem',  to: `${AppRoute.BIBLE}?book=lc`, palette: { bg: '#E8DCC0', fg: '#3A2A18', accent: '#8A6B3E', grain: 'paper' } },
      { title: 'João',    kicker: 'Evangelho', spine: 'O Verbo eterno',    to: `${AppRoute.BIBLE}?book=jo`, palette: { bg: '#0E2748', fg: '#EAE3D2', accent: '#B8965A', grain: 'ink' } },
    ],
  },
  {
    numeral: 'II',
    kicker: 'Série · Corpus Paulinum',
    title: 'Cartas Paulinas',
    curator: 'A palavra do Apóstolo às primeiras comunidades — teologia que nasce da missão.',
    accent: '#B8965A',
    items: [
      { title: 'Romanos',        kicker: 'Epístola', spine: 'A justiça pela fé',    to: `${AppRoute.BIBLE}?book=rm`,  palette: { bg: '#4A1220', fg: '#F0E4D0', accent: '#C9A24C', grain: 'ink' } },
      { title: '1 Coríntios',    kicker: 'Epístola', spine: 'A caridade',           to: `${AppRoute.BIBLE}?book=1co`, palette: { bg: '#2C3E50', fg: '#EEE6D0', accent: '#C9A24C', grain: 'ink' } },
      { title: 'Gálatas',        kicker: 'Epístola', spine: 'Liberdade em Cristo',  to: `${AppRoute.BIBLE}?book=gl`,  palette: { bg: '#1F3A2A', fg: '#EADFC6', accent: '#B8965A', grain: 'ink' } },
      { title: 'Efésios',        kicker: 'Epístola', spine: 'O mistério da Igreja', to: `${AppRoute.BIBLE}?book=ef`,  palette: { bg: '#DDE4E8', fg: '#1A2E3E', accent: '#8A6B3E', grain: 'paper' } },
      { title: 'Filipenses',     kicker: 'Epístola', spine: 'A alegria em Cristo',  to: `${AppRoute.BIBLE}?book=fp`,  palette: { bg: '#3E2A18', fg: '#EFE0C4', accent: '#C9A24C', grain: 'ink' } },
    ],
  },
  {
    numeral: 'III',
    kicker: 'Série · Doutrina',
    title: 'Catecismo Essencial',
    curator: 'Quatro pilares para começar: fé, sacramentos, vida em Cristo e oração.',
    accent: '#B8965A',
    items: [
      { title: 'Profissão da Fé',    kicker: 'CIC · I',   spine: '§§ 26 – 1065',   to: `${AppRoute.CATECHISM}?p=26`,   palette: { bg: '#0E2748', fg: '#EAE3D2', accent: '#B8965A', grain: 'ink' } },
      { title: 'Sacramentos',        kicker: 'CIC · II',  spine: '§§ 1066 – 1690', to: `${AppRoute.CATECHISM}?p=1066`, palette: { bg: '#3A0E1A', fg: '#F0E4D0', accent: '#C9A24C', grain: 'ink' } },
      { title: 'Vida em Cristo',     kicker: 'CIC · III', spine: '§§ 1691 – 2557', to: `${AppRoute.CATECHISM}?p=1691`, palette: { bg: '#1F3A2A', fg: '#EADFC6', accent: '#B8965A', grain: 'ink' } },
      { title: 'Oração Cristã',      kicker: 'CIC · IV',  spine: '§§ 2558 – 2865', to: `${AppRoute.CATECHISM}?p=2558`, palette: { bg: '#E8DCC0', fg: '#3A2A18', accent: '#8A6B3E', grain: 'paper' } },
    ],
  },
  {
    numeral: 'IV',
    kicker: 'Série · Santoral',
    title: 'Santos da Igreja',
    curator: 'Testemunhas de que o Evangelho ainda é possível — de cada século, uma voz.',
    accent: '#C9A24C',
    items: [
      { title: 'Agostinho',      kicker: 'Padre e Doutor',   spine: 'Séc. IV–V',  to: `${AppRoute.SAINTS}?q=agostinho`,       palette: { bg: '#3E2A18', fg: '#EFE0C4', accent: '#C9A24C', grain: 'ink' } },
      { title: 'Francisco',      kicker: 'Fundador',         spine: 'Séc. XII–XIII', to: `${AppRoute.SAINTS}?q=francisco-de-assis`, palette: { bg: '#4A2A10', fg: '#F0DFC4', accent: '#C9A24C', grain: 'ink' } },
      { title: 'Teresa de Ávila',kicker: 'Doutora',          spine: 'Séc. XVI',   to: `${AppRoute.SAINTS}?q=teresa-de-avila`, palette: { bg: '#DDE4E8', fg: '#1A2E3E', accent: '#8A6B3E', grain: 'paper' } },
      { title: 'Teresinha',      kicker: 'Doutora',          spine: 'Séc. XIX',   to: `${AppRoute.SAINTS}?q=teresinha`,       palette: { bg: '#2C3E50', fg: '#EEE6D0', accent: '#C9A24C', grain: 'ink' } },
    ],
  },
  {
    numeral: 'V',
    kicker: 'Série · Patrística',
    title: 'Padres da Igreja',
    curator: 'A Igreja pensando em voz alta nos primeiros séculos — a Tradição em sua fonte.',
    accent: '#8A6B3E',
    items: [
      { title: 'Inácio de Antioquia', kicker: 'Padre Apostólico', spine: 'Séc. I–II',   to: `${AppRoute.BUSCAR}?tipo=padres&q=inacio-antioquia`, palette: { bg: '#1C1C1C', fg: '#E9E1CE', accent: '#8E7B4A', grain: 'ink' } },
      { title: 'Ireneu de Lyon',      kicker: 'Padre Grego',      spine: 'Séc. II',     to: `${AppRoute.BUSCAR}?tipo=padres&q=ireneu`,           palette: { bg: '#1F3A2A', fg: '#EADFC6', accent: '#B8965A', grain: 'ink' } },
      { title: 'Atanásio',            kicker: 'Padre Grego',      spine: 'Séc. IV',     to: `${AppRoute.BUSCAR}?tipo=padres&q=atanasio`,         palette: { bg: '#4A1220', fg: '#F0E4D0', accent: '#C9A24C', grain: 'ink' } },
      { title: 'João Crisóstomo',     kicker: 'Padre Grego',      spine: 'Séc. IV–V',   to: `${AppRoute.BUSCAR}?tipo=padres&q=crisostomo`,       palette: { bg: '#E8DCC0', fg: '#3A2A18', accent: '#8A6B3E', grain: 'paper' } },
      { title: 'Gregório Magno',      kicker: 'Padre Latino',     spine: 'Séc. VI–VII', to: `${AppRoute.BUSCAR}?tipo=padres&q=gregorio-magno`,   palette: { bg: '#0E2748', fg: '#EAE3D2', accent: '#B8965A', grain: 'ink' } },
    ],
  },
  {
    numeral: 'VI',
    kicker: 'Série · Magistério',
    title: 'Concílios',
    curator: 'Quando a Igreja inteira se reúne para escutar o Espírito e responder ao seu tempo.',
    accent: '#B8965A',
    items: [
      { title: 'Niceia I',      kicker: 'Concílio', spine: '325 · Trindade',      to: `${AppRoute.BUSCAR}?tipo=concilios&q=niceia`,      palette: { bg: '#5A5651', fg: '#EFE8DA', accent: '#C9A24C', grain: 'ink' } },
      { title: 'Calcedônia',    kicker: 'Concílio', spine: '451 · Cristologia',   to: `${AppRoute.BUSCAR}?tipo=concilios&q=calcedonia`,  palette: { bg: '#3E2A18', fg: '#EFE0C4', accent: '#C9A24C', grain: 'ink' } },
      { title: 'Trento',        kicker: 'Concílio', spine: '1545–1563',           to: `${AppRoute.BUSCAR}?tipo=concilios&q=trento`,      palette: { bg: '#4A1220', fg: '#F0E4D0', accent: '#C9A24C', grain: 'ink' } },
      { title: 'Vaticano II',   kicker: 'Concílio', spine: '1962–1965',           to: `${AppRoute.BUSCAR}?tipo=concilios&q=vaticano-ii`, palette: { bg: '#0E2748', fg: '#EAE3D2', accent: '#B8965A', grain: 'ink' } },
    ],
  },
  {
    numeral: 'VII',
    kicker: 'Série · Magistério Pontifício',
    title: 'Encíclicas',
    curator: 'A voz do Sucessor de Pedro na história — de Rerum Novarum a Fratelli Tutti.',
    accent: '#C9A24C',
    items: [
      { title: 'Rerum Novarum',     kicker: 'Leão XIII',    spine: '1891 · Trabalho',      to: `${AppRoute.MAGISTERIUM}?q=rerum-novarum`,   palette: { bg: '#3E2A18', fg: '#EFE0C4', accent: '#C9A24C', grain: 'ink' } },
      { title: 'Humanae Vitae',     kicker: 'Paulo VI',     spine: '1968 · Vida',          to: `${AppRoute.MAGISTERIUM}?q=humanae-vitae`,   palette: { bg: '#DDE4E8', fg: '#1A2E3E', accent: '#8A6B3E', grain: 'paper' } },
      { title: 'Redemptor Hominis', kicker: 'João Paulo II',spine: '1979 · Cristo',        to: `${AppRoute.MAGISTERIUM}?q=redemptor-hominis`, palette: { bg: '#4A1220', fg: '#F0E4D0', accent: '#C9A24C', grain: 'ink' } },
      { title: 'Deus Caritas Est',  kicker: 'Bento XVI',    spine: '2005 · Amor',          to: `${AppRoute.MAGISTERIUM}?q=deus-caritas-est`, palette: { bg: '#2C3E50', fg: '#EEE6D0', accent: '#C9A24C', grain: 'ink' } },
      { title: 'Fratelli Tutti',    kicker: 'Francisco',    spine: '2020 · Fraternidade',  to: `${AppRoute.MAGISTERIUM}?q=fratelli-tutti`,  palette: { bg: '#1F3A2A', fg: '#EADFC6', accent: '#B8965A', grain: 'ink' } },
    ],
  },
];

/** "Descubra" — temas curados com linha curatorial editorial. */
const descubra: { name: string; slug: string; hint: string }[] = [
  { name: 'Esperança',    slug: 'esperanca',    hint: 'Ancorar-se em Cristo quando o presente pesa.' },
  { name: 'Misericórdia', slug: 'misericordia', hint: 'Rosto do Pai que vai ao encontro do filho.' },
  { name: 'Maria',        slug: 'maria',        hint: 'A Mãe segundo os Padres e Doutores.' },
  { name: 'Perdão',       slug: 'perdao',       hint: 'Setenta vezes sete, sem medida.' },
  { name: 'Caridade',     slug: 'caridade',     hint: 'A mais excelente das virtudes.' },
  { name: 'Sacramentos',  slug: 'sacramentos',  hint: 'Sinais visíveis da graça invisível.' },
  { name: 'Oração',       slug: 'oracao',       hint: 'A respiração da alma cristã.' },
  { name: 'Família',      slug: 'familia',      hint: 'Igreja doméstica, escola de virtudes.' },
];



/**
 * Resolve o destino de uma busca em função do eixo ativo.
 * "Levar direto ao resultado correto" — não obriga o usuário
 * a filtrar novamente no destino.
 */
function resolveSearchTarget(query: string, axis: AxisFilter): string {
  const q = query.trim();
  const qp = q ? `q=${encodeURIComponent(q)}` : '';
  switch (axis) {
    case 'tema':
      return `${AppRoute.TEMAS}${qp ? `?${qp}` : ''}`;
    case 'pessoa':
      return `${AppRoute.BUSCAR}?tipo=autores${qp ? `&${qp}` : ''}`;
    case 'documento':
      return `${AppRoute.BUSCAR}?tipo=documentos${qp ? `&${qp}` : ''}`;
    case 'periodo':
      return `${AppRoute.BUSCAR}?tipo=periodo${qp ? `&${qp}` : ''}`;
    case 'fonte':
      return `${AppRoute.BUSCAR}?tipo=fontes${qp ? `&${qp}` : ''}`;
    default:
      return `${AppRoute.BUSCAR}${qp ? `?${qp}` : ''}`;
  }
}

type BibliotecaTheme = 'vaticana' | 'apple' | 'logos';

const BibliotecaPage: React.FC = () => {
  const navigate = useNavigate();
  const { query, axis, tab, setQuery, setAxis, setTab } = useBibliotecaState();
  const { recents, pushRecent, clearRecents, removeRecent } = useBibliotecaRecents();
  const { favorites, removeFavorite } = useFavorites('biblioteca');
  // Identidade travada em "Logos 2030" — seletor removido para reduzir dívida (auditoria).
  const theme: BibliotecaTheme = 'logos';



  const filteredEscritos = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return escritos;
    return escritos.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.kicker.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q),
    );
  }, [query]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() && !axis) return;
    navigate(resolveSearchTarget(query, axis));
  };

  const openEscrito = (item: Escrito) => {
    pushRecent({
      id: `escrito:${item.title}`,
      title: item.title,
      subtitle: item.kicker,
      path: item.to,
    });
  };

  return (
    <ContemplativeLayout>
      <div className="w-full pt-spacing-md pb-spacing-4xl" data-biblioteca-theme={theme}>

        {/* Hero editorial — abertura contemplativa (Sprint R1). */}
        <EditorialHero
          parchment
          meta="Leitura, estudo e oração em um único acervo"
          kicker="Acervo Católico"
          title="Biblioteca"
          subtitle="A Tradição da Igreja reunida para conduzir cada leitura a um caminho de estudo, oração e transformação."
          className="mb-spacing-2xl"
        />


        {/* ABERTURA — Continuar lendo é a página aberta do livro. */}
        <ContinueReadingHero recents={recents} />


        {/* Busca — respiração generosa depois da abertura, sem cara de topo de app. */}
        <form
          onSubmit={submitSearch}
          className="mt-spacing-4xl mb-spacing-lg"
          role="search"
          aria-label="Buscar na Biblioteca"
        >
          <div className="relative">
            <Icons.Search className="pointer-events-none absolute left-spacing-md top-1/2 -translate-y-1/2 w-spacing-sm h-spacing-sm text-primary/30" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="O que você procura?"
              aria-label="O que você procura?"
              className="w-full bg-transparent border-0 border-b border-primary/15 focus:border-secondary focus:outline-none pl-spacing-2xl pr-spacing-md py-spacing-md font-serif text-lg md:text-xl italic placeholder:text-primary/25 text-primary transition-colors"
            />
            {(query || axis) && (
              <button
                type="button"
                onClick={() => { setQuery(''); if (axis) setAxis(axis); }}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-[0.25em] text-primary/45 hover:text-secondary"
                aria-label="Limpar busca"
              >
                Limpar
              </button>
            )}
          </div>

          <div className="mt-spacing-md flex flex-wrap items-center gap-spacing-sm">
            <span className="text-[10px] uppercase tracking-[0.3em] text-primary/40 mr-spacing-sm">
              Filtrar por
            </span>
            {axes.map((a) => {
              const active = axis === a.key;
              return (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => setAxis(a.key)}
                  aria-pressed={active}
                  className={cn(
                    'text-[11px] uppercase tracking-[0.2em] px-spacing-md py-[6px] border transition-colors',
                    active
                      ? 'border-secondary text-secondary bg-secondary/5'
                      : 'border-primary/15 text-primary/60 hover:border-secondary/60 hover:text-secondary',
                  )}
                >
                  {a.label}
                </button>
              );
            })}
            {(query.trim() || axis) && (
              <button
                type="submit"
                className="ml-auto text-[11px] uppercase tracking-[0.25em] text-primary border-b border-primary pb-[3px] hover:text-secondary hover:border-secondary"
              >
                Buscar ↵
              </button>
            )}
          </div>
        </form>

        {/* Navegação editorial — fio único, sem caixa. */}
        <nav aria-label="Seções da Biblioteca" className="border-t border-primary/10">
          <ul className="flex flex-wrap items-center justify-center md:justify-start gap-x-spacing-2xl gap-y-spacing-sm py-spacing-md">
            {tabs.map((t) => {
              const active = tab === t.key;
              const count =
                t.key === 'favoritos' ? favorites.length :
                t.key === 'recentes' ? recents.length : undefined;
              return (
                <li key={t.key}>
                  <button
                    type="button"
                    onClick={() => setTab(t.key)}
                    aria-pressed={active}
                    className={cn(
                      'text-[11px] uppercase tracking-[0.25em] font-medium pb-[6px] border-b transition-colors flex items-baseline gap-spacing-xs',
                      active
                        ? 'text-secondary border-secondary'
                        : 'text-primary/55 border-transparent hover:text-secondary',
                    )}
                  >
                    <span>{t.label}</span>
                    {count !== undefined && count > 0 && (
                      <span className="text-[9px] text-primary/40">{count}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Área principal */}
        <AnimatePresence mode="wait">
          <motion.section
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mt-spacing-2xl"
          >
            {tab === 'escritos' && (
              <EscritosView escritos={filteredEscritos} onOpen={openEscrito} />
            )}
            {tab === 'pesquisar' && (
              <PesquisarView
                query={query}
                axis={axis}
                onSubmit={() => navigate(resolveSearchTarget(query, axis))}
              />
            )}
            {tab === 'temas' && (
              <PlaceholderView to={AppRoute.TEMAS} label="Ir para Temas" description="Explore o conhecimento organizado por temas doutrinais, espirituais e históricos." />
            )}
            {tab === 'autores' && (
              <PlaceholderView to={`${AppRoute.BUSCAR}?tipo=autores`} label="Explorar autores" description="Padres, Doutores, Santos e teólogos — organizados por período e tradição." />
            )}
            {tab === 'colecoes' && (
              <PlaceholderView to={`${AppRoute.BUSCAR}?tipo=colecoes`} label="Ver coleções" description="Coleções editoriais curadas: Patrística, Doutrina Social, Espiritualidade Clássica." />
            )}
            {tab === 'favoritos' && (
              <FavoritosView items={favorites} onRemove={removeFavorite} />
            )}
            {tab === 'recentes' && (
              <RecentesView items={recents} onClear={clearRecents} onRemove={removeRecent} />
            )}
          </motion.section>
        </AnimatePresence>
      </div>
    </ContemplativeLayout>
  );
};

/* -------------------- Sub-views -------------------- */

/* -------------------- Estante (v3 — “Kindle da Igreja”) --------------------
 * Hero horizontal “Continuar lendo” (usa o último recente ou fallback curado)
 * + faixa de capas tipográficas 2:3 para Fontes Primárias
 * + faixa de Coleções curadas (opacidade reduzida = hierarquia).
 * Sem imagens externas — capas 100% tipográficas com tokens semânticos.
 */

/** Paleta neutra usada pelo hero quando não há paleta explícita. */
const DEFAULT_PALETTE: CoverPalette = { bg: '#111111', fg: '#F4E9D0', accent: '#C9A24C', grain: 'ink' };

/**
 * Textura de papel MUITO discreta via gradientes radiais.
 * 'paper' aplica pontos escuros em multiply; 'ink' aplica pontos claros em screen.
 * Nenhuma imagem — apenas CSS. Efeito quase imperceptível, apenas quebra a chapadão.
 */
const grainStyle = (mode: CoverPalette['grain']): React.CSSProperties =>
  mode === 'paper'
    ? {
        backgroundImage:
          'radial-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), radial-gradient(rgba(0,0,0,0.03) 1px, transparent 1px)',
        backgroundSize: '3px 3px, 7px 7px',
        backgroundPosition: '0 0, 1px 2px',
        mixBlendMode: 'multiply',
      }
    : {
        backgroundImage:
          'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)',
        backgroundSize: '3px 3px, 7px 7px',
        backgroundPosition: '0 0, 1px 2px',
        mixBlendMode: 'screen',
      };

const BookCover: React.FC<{
  kicker: string;
  title: string;
  spine: string;
  palette: CoverPalette;
  to: string;
  onOpen?: () => void;
  size?: 'md' | 'lg';
  /** Marca de leitura discreta à esquerda (fio dourado vertical). */
  bookmarked?: boolean;
}> = ({ kicker, title, spine, palette, to, onOpen, size = 'md', bookmarked = false }) => {
  const dims = size === 'lg' ? 'w-[168px] md:w-[200px]' : 'w-[144px] md:w-[160px]';
  return (
    <Link
      to={to}
      onClick={onOpen}
      className={cn(
        'group relative block flex-shrink-0 snap-start focus:outline-none',
        dims,
      )}
      aria-label={`Abrir ${title}`}
    >
      {/* Capa 2:3 — objeto físico: papel, lombada, folhas, brilho superior. */}
      <div
        className={cn(
          'relative aspect-[2/3] w-full overflow-hidden transition-all duration-500 ease-out',
          // Sombra editorial: livro em pé sobre a mesa, não card de dashboard.
          'shadow-[-1px_0_0_rgba(0,0,0,0.10),1px_2px_3px_rgba(0,0,0,0.10),10px_20px_32px_-18px_rgba(0,0,0,0.55)]',
          'group-hover:-translate-y-[5px] group-hover:rotate-[-0.2deg]',
          'group-hover:shadow-[-1px_0_0_rgba(0,0,0,0.12),2px_4px_6px_rgba(0,0,0,0.12),14px_30px_42px_-14px_rgba(0,0,0,0.65)]',
          'group-focus-visible:ring-2 group-focus-visible:ring-secondary group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background',
        )}
        style={{ backgroundColor: palette.bg, color: palette.fg }}
      >
        {/* Lombada visual — faixa interna à esquerda, dobra do livro. */}
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 w-[8px] pointer-events-none"
          style={{
            background:
              palette.grain === 'ink'
                ? 'linear-gradient(to right, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.18) 40%, rgba(0,0,0,0) 100%)'
                : 'linear-gradient(to right, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.06) 40%, rgba(0,0,0,0) 100%)',
          }}
        />
        {/* Borda direita — folhas do miolo do livro. */}
        <div
          aria-hidden
          className="absolute inset-y-[3%] right-0 w-[3px] pointer-events-none"
          style={{
            background:
              'repeating-linear-gradient(to bottom, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, rgba(0,0,0,0.10) 1px, rgba(0,0,0,0.10) 2px)',
          }}
        />
        {/* Brilho superior — luz incidente na capa. */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-[35%] pointer-events-none"
          style={{
            background:
              palette.grain === 'ink'
                ? 'linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0) 100%)'
                : 'linear-gradient(to bottom, rgba(255,255,255,0.30), rgba(255,255,255,0) 100%)',
          }}
        />
        {/* Sombra inferior interna — peso, desgaste elegante. */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[25%] pointer-events-none"
          style={{
            background:
              'linear-gradient(to top, rgba(0,0,0,0.18), rgba(0,0,0,0) 100%)',
          }}
        />
        {/* Grão de papel */}
        <div aria-hidden className="absolute inset-0 pointer-events-none opacity-80" style={grainStyle(palette.grain)} />
        {/* Moldura interna fina, na cor de acento — impressão editorial. */}
        <div
          aria-hidden
          className="absolute inset-[7px] pointer-events-none"
          style={{ border: `1px solid ${palette.accent}`, opacity: 0.32 }}
        />
        {/* Conteúdo tipográfico */}
        <div className="absolute inset-0 flex flex-col justify-between p-spacing-md pl-[calc(theme(spacing.spacing-md)+6px)]">
          <span
            className="text-[9px] uppercase tracking-[0.3em] font-medium"
            style={{ color: palette.accent }}
          >
            {kicker}
          </span>
          <div className="flex-1 flex items-center justify-center px-[2px]">
            <h3
              className={cn(
                'font-serif italic leading-[1.05] text-center',
                size === 'lg' ? 'text-2xl md:text-[28px]' : 'text-xl md:text-[22px]',
              )}
            >
              {title}
            </h3>
          </div>
          <span
            className="text-[8px] uppercase tracking-[0.24em] text-center truncate"
            style={{ color: palette.accent, opacity: 0.75 }}
          >
            {spine}
          </span>
        </div>
      </div>
      {/* Marca de leitura — fio dourado vertical à esquerda. */}
      {bookmarked && (
        <span
          aria-hidden
          className="absolute -left-[6px] top-[10%] bottom-[10%] w-[2px] bg-secondary/80"
        />
      )}
      {/* Base da estante — mesa de leitura, não sombra de card. */}
      <div aria-hidden className="mx-3 h-[1px] bg-primary/10 mt-[3px]" />
      <div aria-hidden className="mx-4 h-[1px] bg-primary/5 mt-[1px]" />
    </Link>
  );
};


/**
 * ContinueReadingHero — o "livro sobre a mesa".
 * Estrutura editorial (R1.2):
 *   Livro → Título/Capítulo → Referência → Trecho → Progresso → Metadados → CTA
 *
 * Fontes de dados:
 *   - visitedAt (última leitura)  → real (useBibliotecaRecents).
 *   - livro/kind + referência     → derivados de path/subtitle.
 *   - trecho / % / min restantes  → PLACEHOLDER estável por título
 *                                    (hash determinístico). A integrar com
 *                                    marcadores de leitura reais em sprint
 *                                    posterior (não fingir estado no banco).
 */

/** Hash determinístico simples → gera valores estáveis por título. */
function stableHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Infere o "tipo" da obra a partir do path (Bíblia / Catecismo / etc.). */
function inferKind(path?: string): string {
  if (!path) return 'Leitura em curso';
  if (path.includes('/bible') || path.includes('/biblia')) return 'Bíblia';
  if (path.includes('/catechism') || path.includes('/catecismo')) return 'Catecismo';
  if (path.includes('magisterium') || path.includes('magisterio')) return 'Magistério';
  if (path.includes('/saints') || path.includes('/santos')) return 'Vida dos Santos';
  return 'Leitura em curso';
}

/** Formata "Última leitura • Hoje às 07:43" | "Ontem às 22:10" | "12 nov". */
function formatLastRead(iso?: string): string {
  if (!iso) return 'Curadoria de hoje';
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const y = new Date(now); y.setDate(now.getDate() - 1);
  const yesterday = d.toDateString() === y.toDateString();
  const hh = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return `Hoje às ${hh}`;
  if (yesterday) return `Ontem às ${hh}`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

const FALLBACK_EXCERPTS = [
  '…quem vem a mim jamais terá fome; e quem crê em mim jamais terá sede…',
  '…tarde vos amei, ó Beleza tão antiga e tão nova, tarde vos amei…',
  '…nada te perturbe, nada te espante; tudo passa, só Deus não muda…',
  '…tu nos fizeste para ti, e inquieto está o nosso coração até que descanse em ti…',
];

const ContinueReadingHero: React.FC<{
  recents: ReturnType<typeof useBibliotecaRecents>['recents'];
}> = ({ recents }) => {
  const last = recents[0];
  const seedKey = last?.id ?? 'fallback:confissoes';
  const seed = stableHash(seedKey);

  const kind = last ? inferKind(last.path) : 'Leitura recomendada';
  const title = last?.title ?? 'As Confissões';
  const reference = last?.subtitle ?? 'Livro X · A memória e o desejo';
  const path = last?.path ?? `${AppRoute.BUSCAR}?q=${encodeURIComponent('Confissões Agostinho')}`;
  const excerpt = FALLBACK_EXCERPTS[seed % FALLBACK_EXCERPTS.length];

  // Placeholder: 30–85% para nunca soar como "quase terminando" nem "recém aberto".
  const pct = 30 + (seed % 56);
  const minutesLeft = 6 + (seed % 22);
  const lastRead = formatLastRead(last?.visitedAt);

  return (
    <section
      aria-label="Continue lendo"
      className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-spacing-2xl md:gap-spacing-4xl items-start pt-spacing-2xl"
    >
      <div className="mx-auto md:mx-0 relative">
        <BookCover
          kicker={kind}
          title={title}
          spine="Cathedra Digital"
          palette={DEFAULT_PALETTE}
          to={path}
          size="lg"
          bookmarked={!!last}
        />
      </div>

      <div className="min-w-0">
        {/* Bloco superior: LIVRO · CAPÍTULO · REFERÊNCIA */}
        <p className="text-[10px] uppercase tracking-[0.32em] text-secondary font-medium">
          {kind}
        </p>
        <h2 className="font-serif italic text-[2rem] md:text-[3rem] leading-[1.05] text-primary tracking-tight mt-spacing-md">
          {title}
        </h2>
        <p className="font-serif italic text-primary/55 text-lg md:text-xl mt-spacing-sm">
          {reference}
        </p>

        {/* Trecho interrompido — não resumo, evocação. */}
        <blockquote className="mt-spacing-2xl max-w-xl border-l border-secondary/50 pl-spacing-lg">
          <p className="font-serif italic text-primary/75 text-xl md:text-2xl leading-relaxed">
            {excerpt.startsWith('…') ? excerpt : `…${excerpt}`}
          </p>
        </blockquote>

        {/* Progresso — fio dourado 2px com marcador discreto. */}
        <div
          className="mt-spacing-2xl max-w-md"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label={`Progresso de leitura: ${pct}% concluído`}
        >
          <div className="relative h-[2px] w-full bg-primary/10">
            <div
              className="absolute inset-y-0 left-0 bg-secondary"
              style={{ width: `${pct}%` }}
            />
            <div
              aria-hidden="true"
              className="absolute top-1/2 -translate-y-1/2 h-[10px] w-[2px] bg-secondary"
              style={{ left: `calc(${pct}% - 1px)` }}
            />
          </div>
          <div className="mt-spacing-md flex flex-wrap items-baseline gap-x-spacing-xl gap-y-spacing-xs text-[10px] uppercase tracking-[0.28em] text-primary/50">
            <span>{minutesLeft} min restantes</span>
            <span>{pct}% concluído</span>
            <span>Última leitura • {lastRead}</span>
          </div>
        </div>

        {/* CTA editorial — grande, sem cara de botão. */}
        <div className="mt-spacing-2xl">
          <Link
            to={path}
            className="group inline-flex items-baseline gap-spacing-md font-serif italic text-2xl md:text-3xl text-primary border-b border-primary pb-spacing-sm hover:text-secondary hover:border-secondary transition-colors"
          >
            {last ? 'Retomar leitura' : 'Continuar onde parou'}
            <span
              aria-hidden="true"
              className="text-secondary text-xl transition-transform group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
};


const Shelf: React.FC<{
  label: string;
  hint?: string;
  dim?: boolean;
  children: React.ReactNode;
}> = ({ label, hint, dim, children }) => (
  <section aria-label={label} className={cn('mb-spacing-3xl', dim && 'opacity-80')}>
    <header className="flex items-baseline justify-between mb-spacing-lg">
      <div>
        <span className="text-[10px] uppercase tracking-[0.3em] text-secondary font-medium">{label}</span>
        {hint && (
          <p className="font-serif italic text-primary/60 text-base mt-[2px]">{hint}</p>
        )}
      </div>
    </header>
    <div
      className={cn(
        'flex gap-spacing-lg overflow-x-auto snap-x snap-mandatory pb-spacing-md',
        '[scrollbar-width:thin] [-ms-overflow-style:none]',
        '[&::-webkit-scrollbar]:h-[6px] [&::-webkit-scrollbar-thumb]:bg-primary/15 [&::-webkit-scrollbar-track]:bg-transparent',
      )}
    >
      {children}
    </div>
  </section>
);

/**
 * Coleções Editoriais — cada série é uma prateleira com identidade própria.
 * Coluna esquerda: numeral romano dourado + kicker + título grande + curadoria.
 * Coluna direita: fileira de capas físicas com scroll horizontal.
 * Entre séries, respiração generosa e fio dourado sutil (não separator técnico).
 */
const CollectionsEditorial: React.FC<{ series: ColecaoSerie[] }> = ({ series }) => (
  <section aria-label="Coleções editoriais" className="mb-spacing-4xl pt-spacing-2xl">
    {/* Cabeçalho da seção — kicker + subtítulo curatorial. */}
    <div className="mb-spacing-3xl max-w-2xl">
      <span className="text-[10px] uppercase tracking-[0.32em] text-secondary font-medium">
        Coleções Editoriais
      </span>
      <p className="font-serif italic text-primary/60 text-xl md:text-2xl mt-spacing-sm leading-snug">
        Séries curadas para atravessar a Tradição por caminhos que se sustentam.
      </p>
    </div>

    <div className="flex flex-col gap-spacing-4xl">
      {series.map((serie, idx) => (
        <article
          key={serie.title}
          aria-label={serie.title}
          className="group/serie relative"
        >
          {/* Fio horizontal dourado no topo, exceto na primeira. */}
          {idx > 0 && (
            <div
              aria-hidden
              className="absolute -top-spacing-2xl left-0 h-px w-16 bg-secondary/25"
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-spacing-2xl md:gap-spacing-3xl items-start">
            {/* Coluna curatorial */}
            <header className="md:col-span-4 lg:col-span-3 md:sticky md:top-spacing-2xl">
              <div className="flex items-baseline gap-spacing-md mb-spacing-md">
                <span
                  className="font-serif italic text-4xl md:text-5xl leading-none"
                  style={{ color: serie.accent }}
                  aria-hidden
                >
                  {serie.numeral}
                </span>
                <span className="text-[10px] uppercase tracking-[0.28em] text-primary/50 font-medium">
                  {serie.kicker}
                </span>
              </div>
              <h3 className="font-serif italic text-primary text-[2rem] md:text-[2.5rem] leading-[1.05] mb-spacing-md">
                {serie.title}
              </h3>
              <p className="font-serif italic text-primary/60 text-base md:text-lg leading-snug max-w-sm">
                {serie.curator}
              </p>
            </header>

            {/* Prateleira de capas */}
            <div className="md:col-span-8 lg:col-span-9 min-w-0">
              <div
                className={cn(
                  'flex gap-spacing-lg overflow-x-auto snap-x snap-mandatory pb-spacing-md',
                  '[scrollbar-width:thin] [-ms-overflow-style:none]',
                  '[&::-webkit-scrollbar]:h-[6px] [&::-webkit-scrollbar-thumb]:bg-primary/15 [&::-webkit-scrollbar-track]:bg-transparent',
                )}
              >
                {serie.items.map((item) => (
                  <BookCover
                    key={item.title}
                    kicker={item.kicker}
                    title={item.title}
                    spine={item.spine}
                    palette={item.palette}
                    to={item.to}
                  />
                ))}
              </div>
              {/* Base da prateleira — fio dourado discreto sob as capas. */}
              <div
                aria-hidden
                className="h-px w-full mt-spacing-xs"
                style={{ background: `linear-gradient(to right, ${serie.accent}55, transparent 80%)` }}
              />
            </div>
          </div>
        </article>
      ))}
    </div>
  </section>
);



const EscritosView: React.FC<{
  escritos: Escrito[];
  onOpen: (e: Escrito) => void;
}> = ({ escritos, onOpen }) => {
  const [featured, secondaryA, secondaryB, ...tail] = descubra;
  const smalls = tail.slice(0, 3);
  return (
  <div className="w-full">
    <Shelf label="Fontes primárias" hint="A Tradição escrita da Igreja, reunida sob uma só luz.">
      {escritos.length === 0 && (
        <div className="py-spacing-2xl text-primary/40 italic font-serif">
          Nada corresponde à sua busca.
        </div>
      )}
      {escritos.map((e) => (
        <BookCover
          key={e.title}
          kicker={e.kicker}
          title={e.title}
          spine={e.spine}
          palette={e.palette}
          to={e.to}
          onOpen={() => onOpen(e)}
        />
      ))}
    </Shelf>

    <CollectionsEditorial series={seriesColecoes} />


    {/* Descubra — ritmo curatorial 1 grande + 2 médios + 3 pequenos, propositalmente assimétrico. */}
    <section aria-label="Descubra por tema" className="mb-spacing-4xl pt-spacing-3xl">
      <div className="mb-spacing-2xl max-w-2xl">
        <span className="text-[10px] uppercase tracking-[0.32em] text-secondary font-medium">Descubra</span>
        <p className="font-serif italic text-primary/60 text-xl md:text-2xl mt-spacing-sm leading-snug">
          Por onde seu coração precisa começar hoje.
        </p>
      </div>

      {/* Linha 1 — destaque grande + 2 médios em coluna, respiração generosa. */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-spacing-2xl md:gap-spacing-4xl items-start mb-spacing-3xl">
        <Link
          to={`${AppRoute.TEMAS}/${featured.slug}`}
          className="md:col-span-7 group block border-l-[3px] border-secondary/40 pl-spacing-lg py-spacing-sm hover:border-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        >
          <span className="text-[10px] uppercase tracking-[0.32em] text-secondary/80 block mb-spacing-sm">
            Um caminho para começar
          </span>
          <h3 className="font-serif italic text-[2.5rem] md:text-[3.75rem] text-primary leading-[1.02] mb-spacing-md group-hover:text-secondary transition-colors">
            {featured.name}
          </h3>
          <p className="font-serif italic text-primary/60 text-lg md:text-xl leading-snug max-w-md">
            {featured.hint}
          </p>
          <span className="mt-spacing-lg inline-block text-[10px] uppercase tracking-[0.28em] text-primary/50 group-hover:text-secondary border-b border-primary/20 group-hover:border-secondary pb-[2px] transition-colors">
            Entrar no tema →
          </span>
        </Link>

        <div className="md:col-span-5 md:pt-spacing-3xl flex flex-col gap-spacing-2xl">
          {[secondaryA, secondaryB].filter(Boolean).map((t) => (
            <Link
              key={t.slug}
              to={`${AppRoute.TEMAS}/${t.slug}`}
              className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <h4 className="font-serif italic text-[1.75rem] md:text-[2.25rem] text-primary/90 group-hover:text-secondary leading-[1.05] transition-colors">
                {t.name}
              </h4>
              <p className="font-serif italic text-primary/55 text-base md:text-lg mt-spacing-xs leading-snug max-w-sm">
                {t.hint}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Linha 2 — três notas curatoriais alinhadas à direita para quebrar a simetria. */}
      {smalls.length > 0 && (
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-spacing-xl md:gap-spacing-2xl mt-spacing-lg">
          {smalls.map((t) => (
            <li key={t.slug}>
              <Link
                to={`${AppRoute.TEMAS}/${t.slug}`}
                className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <span
                  className="block w-[18px] h-[1px] bg-secondary/50 group-hover:bg-secondary group-hover:w-[36px] transition-all duration-500 mb-spacing-sm"
                  aria-hidden
                />
                <span className="font-serif italic text-xl text-primary/85 group-hover:text-secondary transition-colors block leading-tight">
                  {t.name}
                </span>
                <span className="text-[11px] text-primary/45 font-serif italic block mt-[2px] leading-snug">
                  {t.hint}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  </div>
  );
};



const PesquisarView: React.FC<{ query: string; axis: AxisFilter; onSubmit: () => void }> = ({ query, axis, onSubmit }) => (
  <div className="max-w-2xl">
    <h2 className="font-serif text-primary/90 text-2xl italic mb-spacing-md">Pesquisa aberta</h2>
    <p className="text-primary/55 text-sm leading-relaxed mb-spacing-lg">
      Digite acima e escolha um eixo — Tema, Pessoa, Documento, Período ou Fonte — para ir direto ao resultado certo.
    </p>
    {(query.trim() || axis) && (
      <button
        type="button"
        onClick={onSubmit}
        className="text-[11px] uppercase tracking-[0.25em] text-primary border-b border-primary pb-[3px] hover:text-secondary hover:border-secondary"
      >
        {axis ? `Buscar em ${axis}` : 'Buscar em toda a Biblioteca'} ↵
      </button>
    )}
  </div>
);

const FavoritosView: React.FC<{ items: ReturnType<typeof useFavorites>['favorites']; onRemove: (id: string) => void }> = ({ items, onRemove }) => {
  if (items.length === 0) {
    return (
      <div className="max-w-xl">
        <h2 className="font-serif text-primary/90 text-2xl italic mb-spacing-md">Favoritos</h2>
        <p className="text-primary/55 text-sm leading-relaxed">
          Marque um parágrafo, versículo ou documento como favorito para retornar a ele com um clique.
        </p>
      </div>
    );
  }
  return (
    <div className="max-w-3xl">
      <h2 className="font-serif text-primary/90 text-2xl italic mb-spacing-lg">Favoritos</h2>
      <ul className="divide-y divide-primary/10 border-y border-primary/10">
        {items.map((f, i) => {
          const path = f.content && f.content.startsWith('/') ? f.content : undefined;
          const inner = (
            <>
              <span className="font-serif text-secondary text-lg leading-none mr-spacing-md w-8 tabular-nums">{String(i + 1).padStart(2, '0')}.</span>
              <div className="flex-1 min-w-0">
                <span className="block text-[10px] uppercase tracking-[0.25em] text-secondary/80">{f.type}</span>
                <span className="block font-serif text-xl text-primary group-hover:text-secondary transition-colors">{f.title}</span>
                {!path && f.content && (
                  <span className="block text-xs text-primary/45 mt-[2px] truncate">{f.content}</span>
                )}
              </div>
            </>
          );
          return (
            <li key={f.id} className="flex items-center gap-spacing-sm py-spacing-lg">
              {path ? (
                <Link to={path} className="group flex items-center flex-1 min-w-0">{inner}</Link>
              ) : (
                <div className="flex items-center flex-1 min-w-0 opacity-80">{inner}</div>
              )}
              <button
                type="button"
                onClick={() => onRemove(f.id)}
                className="text-[10px] uppercase tracking-[0.25em] text-primary/40 hover:text-secondary"
                aria-label={`Remover ${f.title} dos favoritos`}
              >
                Remover
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const RecentesView: React.FC<{
  items: ReturnType<typeof useBibliotecaRecents>['recents'];
  onClear: () => void;
  onRemove: (id: string) => void;
}> = ({ items, onClear, onRemove }) => {
  if (items.length === 0) {
    return (
      <div className="max-w-xl">
        <h2 className="font-serif text-primary/90 text-2xl italic mb-spacing-md">Recentes</h2>
        <p className="text-primary/55 text-sm leading-relaxed">
          Suas últimas leituras aparecerão aqui — com retorno direto ao parágrafo ou seção correta.
        </p>
      </div>
    );
  }
  return (
    <div className="max-w-3xl">
      <div className="flex items-baseline justify-between mb-spacing-lg">
        <h2 className="font-serif text-primary/90 text-2xl italic">Recentes</h2>
        <button
          type="button"
          onClick={onClear}
          className="text-[10px] uppercase tracking-[0.25em] text-primary/40 hover:text-secondary"
        >
          Limpar histórico
        </button>
      </div>
      <ul className="divide-y divide-primary/10 border-y border-primary/10">
        {items.map((r, i) => (
          <li key={r.id} className="flex items-center gap-spacing-sm py-spacing-lg">
            <Link to={r.path} className="group flex items-center flex-1 min-w-0">
              <span className="font-serif text-secondary text-lg leading-none mr-spacing-md w-8 tabular-nums">{String(i + 1).padStart(2, '0')}.</span>
              <div className="flex-1 min-w-0">
                {r.subtitle && (
                  <span className="block text-[10px] uppercase tracking-[0.25em] text-secondary/80">{r.subtitle}</span>
                )}
                <span className="block font-serif text-xl text-primary group-hover:text-secondary transition-colors">{r.title}</span>
                <span className="block text-xs text-primary/45 mt-[2px]">
                  {new Date(r.visitedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => onRemove(r.id)}
              className="text-[10px] uppercase tracking-[0.25em] text-primary/40 hover:text-secondary"
              aria-label={`Remover ${r.title} dos recentes`}
            >
              Remover
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

const PlaceholderView: React.FC<{ to: string; label: string; description: string }> = ({ to, label, description }) => (
  <div className="max-w-xl">
    <p className="text-primary/60 text-base leading-relaxed mb-spacing-lg">{description}</p>
    <Link
      to={to}
      className="inline-block text-[11px] uppercase tracking-[0.25em] text-primary border-b border-primary pb-[3px] hover:text-secondary hover:border-secondary transition-colors"
    >
      {label}
    </Link>
  </div>
);

export default BibliotecaPage;
