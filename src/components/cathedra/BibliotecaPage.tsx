import React, { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { AppRoute } from '@/types';
import { Icons } from '@/constants';
import ContemplativeLayout from './ContemplativeLayout';
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

type Colecao = { title: string; kicker: string; subtitle: string; to: string; palette: CoverPalette };
const colecoes: Colecao[] = [
  { title: 'A Esperança',       kicker: 'Percurso',   subtitle: 'Ancorar-se em Cristo em tempos difíceis',    to: `${AppRoute.TEMAS}/esperanca`,   palette: { bg: '#2C3E50', fg: '#EEE6D0', accent: '#C9A24C', grain: 'ink'   } },
  { title: 'A Eucaristia',      kicker: 'Percurso',   subtitle: 'Fonte e ápice da vida cristã',               to: `${AppRoute.TEMAS}/sacramentos`, palette: { bg: '#3A0E1A', fg: '#F0E4D0', accent: '#C9A24C', grain: 'ink'   } },
  { title: 'Maria',             kicker: 'Percurso',   subtitle: 'A Mãe segundo os Padres e Doutores',         to: `${AppRoute.TEMAS}/maria`,       palette: { bg: '#DDE4E8', fg: '#1A2E3E', accent: '#8A6B3E', grain: 'paper' } },
  { title: 'Doutrina Social',   kicker: 'Percurso',   subtitle: 'De Rerum Novarum a Fratelli Tutti',          to: AppRoute.MAGISTERIUM,            palette: { bg: '#3E2A18', fg: '#EFE0C4', accent: '#C9A24C', grain: 'ink'   } },
];

/** Chips “Descubra” — 8 temas curados que existem em `themes` (slugs reais). */
const descubra: { name: string; slug: string }[] = [
  { name: 'Esperança',    slug: 'esperanca'    },
  { name: 'Família',      slug: 'familia'      },
  { name: 'Maria',        slug: 'maria'        },
  { name: 'Perdão',       slug: 'perdao'       },
  { name: 'Caridade',     slug: 'caridade'     },
  { name: 'Sacramentos',  slug: 'sacramentos'  },
  { name: 'Oração',       slug: 'oracao'       },
  { name: 'Misericórdia', slug: 'misericordia' },
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
      <div className="w-full pt-spacing-lg pb-spacing-4xl" data-biblioteca-theme={theme}>

        {/* Identidade compacta — libera espaço na primeira dobra (A.5) */}
        <header className="mb-spacing-md flex items-baseline justify-between gap-spacing-md">
          <div className="flex items-baseline gap-spacing-sm">
            <Icons.Compass className="w-3 h-3 text-primary/30" strokeWidth={1.4} aria-hidden="true" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-primary/50">Sacrum Archivum</span>
          </div>
          <h1 className="font-serif italic text-primary/80 text-base md:text-lg leading-none">
            Biblioteca
          </h1>
        </header>

        {/* Busca soberana + eixo */}
        <form
          onSubmit={submitSearch}
          className="mb-spacing-md"
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

          {/* Eixos "o que você procura?" — chips como filtro axial */}
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

        {/* Navegação editorial (abas) */}
        <nav aria-label="Seções da Biblioteca" className="border-y border-primary/10 mt-spacing-lg">
          <ul className="flex flex-wrap items-center justify-center md:justify-start gap-x-spacing-2xl gap-y-spacing-sm py-spacing-sm">
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

        {/* Hero "Continuar lendo" — âncora da primeira dobra (A.5) */}
        <div className="mt-spacing-xl">
          <ContinueReadingHero recents={recents} />
        </div>

        {/* Área principal */}
        <AnimatePresence mode="wait">
          <motion.section
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="mt-spacing-lg"
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
      {/* Capa 2:3 — sombra editorial lateral (livro em pé), não SaaS drop-shadow. */}
      <div
        className={cn(
          'relative aspect-[2/3] w-full overflow-hidden transition-all duration-500 ease-out',
          // sombra editorial: leve à esquerda (lombada), profunda à direita e abaixo
          'shadow-[-1px_0_0_rgba(0,0,0,0.08),1px_2px_3px_rgba(0,0,0,0.08),8px_18px_28px_-18px_rgba(0,0,0,0.45)]',
          'group-hover:-translate-y-[4px]',
          'group-hover:shadow-[-1px_0_0_rgba(0,0,0,0.10),2px_4px_6px_rgba(0,0,0,0.10),12px_26px_36px_-16px_rgba(0,0,0,0.55)]',
          'group-focus-visible:ring-2 group-focus-visible:ring-secondary group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background',
        )}
        style={{ backgroundColor: palette.bg, color: palette.fg }}
      >
        {/* Lombada visual — faixa interna à esquerda, mais escura, simulando dobra. */}
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 w-[6px] pointer-events-none"
          style={{
            background:
              palette.grain === 'ink'
                ? 'linear-gradient(to right, rgba(0,0,0,0.30), rgba(0,0,0,0) 100%)'
                : 'linear-gradient(to right, rgba(0,0,0,0.10), rgba(0,0,0,0) 100%)',
          }}
        />
        {/* Grão de papel — sutil, apenas quebra a chapadão. */}
        <div aria-hidden className="absolute inset-0 pointer-events-none opacity-70" style={grainStyle(palette.grain)} />
        {/* Moldura interna fina, na cor de acento. */}
        <div
          aria-hidden
          className="absolute inset-[6px] pointer-events-none"
          style={{ border: `1px solid ${palette.accent}`, opacity: 0.35 }}
        />
        {/* Conteúdo tipográfico */}
        <div className="absolute inset-0 flex flex-col justify-between p-spacing-md pl-[calc(theme(spacing.spacing-md)+4px)]">
          <span
            className="text-[9px] uppercase tracking-[0.28em] font-medium"
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
            className="text-[8px] uppercase tracking-[0.22em] text-center truncate"
            style={{ color: palette.accent, opacity: 0.7 }}
          >
            {spine}
          </span>
        </div>
      </div>
      {/* Marca de leitura — fio dourado vertical à esquerda, apenas quando bookmarked. */}
      {bookmarked && (
        <span
          aria-hidden
          className="absolute -left-[6px] top-[10%] bottom-[10%] w-[2px] bg-secondary/80"
        />
      )}
      {/* Base da estante */}
      <div aria-hidden className="mx-2 h-[2px] bg-primary/15 shadow-[0_1px_0_hsl(var(--primary)/0.05)]" />
    </Link>
  );
};


const ContinueReadingHero: React.FC<{
  recents: ReturnType<typeof useBibliotecaRecents>['recents'];
}> = ({ recents }) => {
  const last = recents[0];
  const kicker = last?.subtitle ?? 'Destaque da coleção';
  const title = last?.title ?? 'As Confissões';
  const path = last?.path ?? `${AppRoute.BUSCAR}?q=${encodeURIComponent('Confissões Agostinho')}`;
  const description = last
    ? 'Retome exatamente de onde parou. Sua última leitura permanece aberta.'
    : 'Uma das obras mais profundas da literatura universal — comentada, com introdução histórica e Nexus.';
  const cta = last ? 'Continuar leitura' : 'Iniciar leitura';
  const meta = last
    ? `Leitura em curso · ${new Date(last.visitedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`
    : 'Curadoria editorial · Cathedra';

  // Próximas sugestões — 2 itens seguintes do histórico ou fallback curado.
  const nextUp = recents.slice(1, 3);
  const fallbackNext = [
    { id: 'f1', title: 'Suma Teológica', subtitle: 'Tomás de Aquino', path: AppRoute.CATECHISM },
    { id: 'f2', title: 'Imitação de Cristo', subtitle: 'Kempis', path: `${AppRoute.BUSCAR}?q=${encodeURIComponent('Imitação de Cristo')}` },
  ];
  const suggestions = nextUp.length > 0 ? nextUp : fallbackNext;

  return (
    <section
      aria-label="Continuar lendo"
      className="mb-spacing-3xl grid grid-cols-1 md:grid-cols-[200px_1fr] gap-spacing-2xl md:gap-spacing-3xl items-start border-y border-primary/10 py-spacing-3xl"
    >
      <div className="mx-auto md:mx-0 relative">
        <BookCover
          kicker={kicker}
          title={title}
          spine="Cathedra Digital"
          palette={DEFAULT_PALETTE}
          to={path}
          size="lg"
          bookmarked={!!last}
        />
      </div>
      <div className="min-w-0 pt-spacing-sm">
        <span className="text-[10px] uppercase tracking-[0.3em] text-secondary font-medium block mb-spacing-sm">
          {last ? 'Continuar lendo' : 'Recomendado hoje'}
        </span>
        <h2 className="font-serif italic text-[2rem] md:text-[2.75rem] text-primary leading-[1.05] mb-spacing-md">
          {title}
        </h2>
        <p className="text-primary/60 text-base md:text-lg leading-relaxed max-w-xl mb-spacing-lg font-serif">
          {description}
        </p>
        <div className="flex flex-wrap items-baseline gap-spacing-lg mb-spacing-xl">
          <Link
            to={path}
            className="inline-block border-b border-primary text-[11px] uppercase tracking-[0.25em] text-primary pb-[3px] hover:text-secondary hover:border-secondary transition-colors"
          >
            {cta} →
          </Link>
          <span className="text-[10px] uppercase tracking-[0.25em] text-primary/40">
            {meta}
          </span>
        </div>

        {/* Próximas leituras — evocação de lombadas ao lado, sem cards. */}
        {suggestions.length > 0 && (
          <div className="hidden md:block border-t border-primary/10 pt-spacing-lg">
            <span className="text-[9px] uppercase tracking-[0.3em] text-primary/40 block mb-spacing-sm">
              A seguir
            </span>
            <ul className="flex flex-col gap-spacing-xs">
              {suggestions.map((s) => (
                <li key={s.id}>
                  <Link
                    to={s.path}
                    className="group inline-flex items-baseline gap-spacing-sm hover:text-secondary transition-colors"
                  >
                    <span className="w-[2px] h-[14px] bg-secondary/40 group-hover:bg-secondary transition-colors" aria-hidden />
                    <span className="font-serif italic text-lg text-primary/85 group-hover:text-secondary">
                      {s.title}
                    </span>
                    {s.subtitle && (
                      <span className="text-[10px] uppercase tracking-[0.22em] text-primary/40">
                        · {s.subtitle}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
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

const EscritosView: React.FC<{
  escritos: Escrito[];
  onOpen: (e: Escrito) => void;
}> = ({ escritos, onOpen }) => (
  <div className="w-full">
    <Shelf label="Fontes primárias" hint="A Tradição escrita da Igreja, num só ambiente.">
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

    <Shelf label="Coleções curadas" hint="Séries editoriais para leitura em profundidade." dim>
      {colecoes.map((c) => (
        <BookCover
          key={c.title}
          kicker={c.kicker}
          title={c.title}
          spine={c.subtitle}
          palette={c.palette}
          to={c.to}
        />
      ))}
    </Shelf>

    {/* Descubra — chips ligados a temas reais (tabela `themes`). */}
    <section aria-label="Descubra por tema" className="mb-spacing-3xl border-t border-primary/10 pt-spacing-2xl">
      <div className="mb-spacing-lg">
        <span className="text-[10px] uppercase tracking-[0.3em] text-secondary font-medium">Descubra</span>
        <p className="font-serif italic text-primary/60 text-base mt-[2px]">
          Por onde seu coração precisa começar hoje.
        </p>
      </div>
      <ul className="flex flex-wrap gap-spacing-sm">
        {descubra.map((t) => (
          <li key={t.slug}>
            <Link
              to={`${AppRoute.TEMAS}/${t.slug}`}
              className="inline-block font-serif italic text-primary/85 text-lg border-b border-primary/20 pb-[2px] hover:text-secondary hover:border-secondary transition-colors"
            >
              {t.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  </div>
);



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
