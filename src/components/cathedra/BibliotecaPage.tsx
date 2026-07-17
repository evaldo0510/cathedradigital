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

type Escrito = {
  title: string;
  kicker: string;
  to: string;
  description: string;
};

const escritos: Escrito[] = [
  { title: 'Bíblia', kicker: 'Sagradas Escrituras', to: AppRoute.BIBLE, description: 'Antigo e Novo Testamento com anotações e Nexus.' },
  { title: 'Catecismo', kicker: 'Doutrina', to: AppRoute.CATECHISM, description: 'CIC organizado por parágrafos e referências.' },
  { title: 'Magistério', kicker: 'Documentos Pontifícios', to: AppRoute.MAGISTERIUM, description: 'Encíclicas, exortações e constituições.' },
  { title: 'Padres da Igreja', kicker: 'Patrística', to: `${AppRoute.BUSCAR}?tipo=padres`, description: 'Escritos dos Padres do Oriente e Ocidente.' },
  { title: 'Santos', kicker: 'Vida e Escritos', to: AppRoute.SAINTS, description: 'Biografias, escritos e testemunhos.' },
  { title: 'Concílios', kicker: 'Assembleias da Igreja', to: `${AppRoute.BUSCAR}?tipo=concilios`, description: 'Documentos conciliares em texto integral.' },
  { title: 'Direito Canônico', kicker: 'Normas', to: `${AppRoute.BUSCAR}?tipo=direito-canonico`, description: 'Código de 1983 e legislação eclesiástica.' },
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

const BibliotecaPage: React.FC = () => {
  const navigate = useNavigate();
  const { query, axis, tab, setQuery, setAxis, setTab } = useBibliotecaState();
  const { recents, pushRecent, clearRecents, removeRecent } = useBibliotecaRecents();
  const { favorites, removeFavorite } = useFavorites('biblioteca');

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
    <ContemplativeLayout title="Biblioteca" subtitle="Sacrum Archivum" icon={Icons.Compass}>
      <div className="w-full pb-spacing-4xl">
        {/* Busca soberana + eixo */}
        <form
          onSubmit={submitSearch}
          className="mb-spacing-lg"
          role="search"
          aria-label="Buscar na Biblioteca"
        >
          <div className="relative">
            <Icons.Search className="pointer-events-none absolute left-spacing-lg top-1/2 -translate-y-1/2 w-spacing-md h-spacing-md text-primary/30" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="O que você procura?"
              aria-label="O que você procura?"
              className="w-full bg-transparent border-0 border-b border-primary/15 focus:border-secondary focus:outline-none pl-spacing-3xl pr-spacing-md py-spacing-lg font-serif text-2xl md:text-3xl italic placeholder:text-primary/25 text-primary transition-colors"
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
        <nav aria-label="Seções da Biblioteca" className="border-y border-primary/10 mt-spacing-xl">
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
            transition={{ duration: 0.25, ease: 'easeOut' }}
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

const EscritosView: React.FC<{ escritos: Escrito[]; onOpen: (e: Escrito) => void }> = ({ escritos, onOpen }) => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-spacing-2xl">
    <div className="lg:col-span-7">
      <h2 className="font-serif text-primary/90 text-2xl italic mb-spacing-lg">Fontes primárias</h2>
      <p className="text-primary/55 text-sm leading-relaxed mb-spacing-xl max-w-lg">
        Um único ambiente para toda a Tradição escrita da Igreja. Navegue sem trocar de contexto.
      </p>
      <ul className="divide-y divide-primary/10 border-y border-primary/10">
        {escritos.length === 0 && (
          <li className="py-spacing-2xl text-center text-primary/40 italic font-serif">
            Nada corresponde à sua busca.
          </li>
        )}
        {escritos.map((e) => (
          <li key={e.title}>
            <Link
              to={e.to}
              onClick={() => onOpen(e)}
              className="group flex items-center justify-between gap-spacing-md py-spacing-lg px-spacing-xs hover:bg-primary/[0.03] transition-colors"
            >
              <div className="min-w-0">
                <span className="block text-[10px] uppercase tracking-[0.25em] text-secondary/80 mb-[2px]">{e.kicker}</span>
                <span className="font-serif text-2xl text-primary group-hover:text-secondary transition-colors">{e.title}</span>
                <span className="block text-sm text-primary/55 mt-[2px] truncate">{e.description}</span>
              </div>
              <Icons.ChevronRight className="w-4 h-4 text-secondary opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </div>

    <aside className="lg:col-span-5 space-y-spacing-2xl">
      <div className="bg-primary text-white p-spacing-2xl relative overflow-hidden">
        <span className="text-secondary text-[10px] tracking-[0.3em] uppercase font-medium mb-spacing-sm block">Destaque da coleção</span>
        <h3 className="font-serif text-3xl leading-tight mb-spacing-md text-white">As Confissões de Santo Agostinho</h3>
        <p className="text-white/70 text-sm leading-relaxed mb-spacing-lg max-w-sm">
          Uma das obras mais profundas da literatura universal, com comentários e introdução histórica.
        </p>
        <Link
          to={`${AppRoute.BUSCAR}?q=${encodeURIComponent('Confissões Agostinho')}`}
          className="inline-block border border-secondary text-secondary px-spacing-lg py-spacing-sm text-[11px] tracking-[0.25em] uppercase hover:bg-secondary hover:text-primary transition-colors"
        >
          Iniciar leitura
        </Link>
        <div aria-hidden className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full border border-secondary/20" />
        <div aria-hidden className="absolute -right-8 -bottom-8 w-64 h-64 rounded-full border border-secondary/10" />
      </div>
    </aside>
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
