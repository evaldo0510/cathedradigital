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

        {/* Marca d'água mínima — só uma linha de identidade, sem barra de dashboard. */}
        <div className="mb-spacing-2xl flex items-baseline gap-spacing-sm opacity-70">
          <Icons.Compass className="w-3 h-3 text-primary/30" strokeWidth={1.4} aria-hidden="true" />
          <span className="text-[10px] uppercase tracking-[0.32em] text-primary/45">Sacrum Archivum · Biblioteca</span>
        </div>

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
      className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-spacing-2xl md:gap-spacing-4xl items-start pt-spacing-2xl"
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
      <div className="min-w-0 pt-spacing-md">
        {/* Epígrafe editorial — a atmosfera antes da informação. */}
        <p className="font-serif italic text-primary/45 text-sm md:text-base leading-snug mb-spacing-xl max-w-md">
          {last
            ? '“Você fechou o livro aqui. Ele ainda espera.”'
            : '“Toda grande caminhada começa por uma única página.”'}
        </p>

        <span className="text-[10px] uppercase tracking-[0.32em] text-secondary font-medium block mb-spacing-sm">
          {last ? 'Continue sua caminhada' : 'Recomendado hoje'}
        </span>
        <h2 className="font-serif italic text-[2.25rem] md:text-[3.25rem] text-primary leading-[1.02] mb-spacing-md tracking-tight">
          {title}
        </h2>
        {last?.subtitle && (
          <p className="font-serif italic text-primary/55 text-lg md:text-xl mb-spacing-lg">
            {last.subtitle}
          </p>
        )}
        <p className="text-primary/60 text-base md:text-lg leading-relaxed max-w-xl mb-spacing-xl font-serif">
          {description}
        </p>
        <div className="flex flex-wrap items-baseline gap-spacing-lg">
          <Link
            to={path}
            className="inline-block border-b border-primary text-[11px] uppercase tracking-[0.28em] text-primary pb-[3px] hover:text-secondary hover:border-secondary transition-colors"
          >
            {cta} →
          </Link>
          <span className="text-[10px] uppercase tracking-[0.28em] text-primary/40">
            {meta}
          </span>
        </div>

        {/* Próximas leituras — evocação de lombadas, sem card. */}
        {suggestions.length > 0 && (
          <div className="hidden md:block mt-spacing-2xl">
            <span className="text-[9px] uppercase tracking-[0.32em] text-primary/40 block mb-spacing-md">
              A seguir na sua mesa
            </span>
            <ul className="flex flex-col gap-spacing-sm">
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

    <Shelf label="Coleções curadas" hint="Séries editoriais para atravessar um tema em profundidade." dim>
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

      {/* Linha 2 — três pequenos alinhados como notas curatoriais. */}
      {smalls.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-spacing-xl md:gap-spacing-2xl md:pl-[calc(60%_-_2rem)] md:-mt-spacing-lg">
          {/* Deslocamento à direita cria a assimetria — não é grade neutra. */}
        </div>
      )}
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
