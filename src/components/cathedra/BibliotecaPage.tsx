import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { AppRoute } from '@/types';
import { Icons } from '@/constants';
import ContemplativeLayout from './ContemplativeLayout';
import { cn } from '@/lib/utils';

/**
 * Biblioteca — ambiente único de conhecimento (Conceito "Logos 2030" adaptado).
 * Substitui o índice de módulos por uma navegação editorial com abas
 * Pesquisar · Temas · Escritos · Autores · Coleções · Favoritos · Recentes.
 * Bíblia, Catecismo, Magistério, Padres, Santos, Concílios e Direito Canônico
 * viram sub-itens tipográficos de "Escritos", nunca a porta de entrada.
 */

type TabKey =
  | 'pesquisar'
  | 'temas'
  | 'escritos'
  | 'autores'
  | 'colecoes'
  | 'favoritos'
  | 'recentes';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'pesquisar', label: 'Pesquisar' },
  { key: 'temas', label: 'Temas' },
  { key: 'escritos', label: 'Escritos' },
  { key: 'autores', label: 'Autores' },
  { key: 'colecoes', label: 'Coleções' },
  { key: 'favoritos', label: 'Favoritos' },
  { key: 'recentes', label: 'Recentes' },
];

type Escrito = {
  title: string;
  kicker: string;
  to: string;
  description: string;
};

const escritos: Escrito[] = [
  {
    title: 'Bíblia',
    kicker: 'Sagradas Escrituras',
    to: AppRoute.BIBLE,
    description: 'Antigo e Novo Testamento com anotações e Nexus.',
  },
  {
    title: 'Catecismo',
    kicker: 'Doutrina',
    to: AppRoute.CATECHISM,
    description: 'CIC organizado por parágrafos e referências.',
  },
  {
    title: 'Magistério',
    kicker: 'Documentos Pontifícios',
    to: AppRoute.MAGISTERIUM,
    description: 'Encíclicas, exortações e constituições.',
  },
  {
    title: 'Padres da Igreja',
    kicker: 'Patrística',
    to: `${AppRoute.BUSCAR}?tipo=padres`,
    description: 'Escritos dos Padres do Oriente e Ocidente.',
  },
  {
    title: 'Santos',
    kicker: 'Vida e Escritos',
    to: AppRoute.SAINTS,
    description: 'Biografias, escritos e testemunhos.',
  },
  {
    title: 'Concílios',
    kicker: 'Assembleias da Igreja',
    to: `${AppRoute.BUSCAR}?tipo=concilios`,
    description: 'Documentos conciliares em texto integral.',
  },
  {
    title: 'Direito Canônico',
    kicker: 'Normas',
    to: `${AppRoute.BUSCAR}?tipo=direito-canonico`,
    description: 'Código de 1983 e legislação eclesiástica.',
  },
];

const BibliotecaPage: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>('escritos');
  const [query, setQuery] = useState('');

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
    const q = query.trim();
    if (!q) return;
    navigate(`${AppRoute.BUSCAR}?q=${encodeURIComponent(q)}`);
  };

  return (
    <ContemplativeLayout
      title="Biblioteca"
      subtitle="Sacrum Archivum"
      icon={Icons.Compass}
    >
      <div className="w-full pb-spacing-4xl">
        {/* Busca soberana */}
        <form
          onSubmit={submitSearch}
          className="relative mb-spacing-2xl"
          role="search"
          aria-label="Buscar na Biblioteca"
        >
          <Icons.Search className="pointer-events-none absolute left-spacing-lg top-1/2 -translate-y-1/2 w-spacing-md h-spacing-md text-primary/30" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="O que você procura?"
            aria-label="O que você procura?"
            className="w-full bg-transparent border-0 border-b border-primary/15 focus:border-secondary focus:outline-none pl-spacing-3xl pr-spacing-md py-spacing-lg font-serif text-2xl md:text-3xl italic placeholder:text-primary/25 text-primary transition-colors"
          />
        </form>

        {/* Navegação editorial (abas) */}
        <nav
          aria-label="Seções da Biblioteca"
          className="border-y border-primary/10"
        >
          <ul className="flex flex-wrap items-center justify-center md:justify-start gap-x-spacing-2xl gap-y-spacing-sm py-spacing-md">
            {tabs.map((t) => {
              const active = tab === t.key;
              return (
                <li key={t.key}>
                  <button
                    type="button"
                    onClick={() => setTab(t.key)}
                    aria-pressed={active}
                    className={cn(
                      'text-[11px] uppercase tracking-[0.25em] font-medium pb-[6px] border-b transition-colors',
                      active
                        ? 'text-secondary border-secondary'
                        : 'text-primary/55 border-transparent hover:text-secondary',
                    )}
                  >
                    {t.label}
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
              <EscritosView escritos={filteredEscritos} />
            )}
            {tab === 'pesquisar' && <PesquisarView query={query} />}
            {tab === 'temas' && <PlaceholderView to={AppRoute.TEMAS} label="Ir para Temas" description="Explore o conhecimento organizado por temas doutrinais, espirituais e históricos." />}
            {tab === 'autores' && <PlaceholderView to={`${AppRoute.BUSCAR}?tipo=autores`} label="Explorar autores" description="Padres, Doutores, Santos e teólogos — organizados por período e tradição." />}
            {tab === 'colecoes' && <PlaceholderView to={`${AppRoute.BUSCAR}?tipo=colecoes`} label="Ver coleções" description="Coleções editoriais curadas: Patrística, Doutrina Social, Espiritualidade Clássica." />}
            {tab === 'favoritos' && <PlaceholderView to={AppRoute.FAVORITES} label="Abrir favoritos" description="Suas leituras salvas, marcadores e anotações pessoais." />}
            {tab === 'recentes' && <PlaceholderView to={AppRoute.JORNADAS} label="Ver histórico" description="Retome de onde parou nas últimas leituras." />}
          </motion.section>
        </AnimatePresence>
      </div>
    </ContemplativeLayout>
  );
};

const EscritosView: React.FC<{ escritos: Escrito[] }> = ({ escritos }) => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-spacing-2xl">
    {/* Lista tipográfica de escritos */}
    <div className="lg:col-span-7">
      <h2 className="font-serif text-primary/90 text-2xl italic mb-spacing-lg">
        Fontes primárias
      </h2>
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
              className="group flex items-center justify-between gap-spacing-md py-spacing-lg px-spacing-xs hover:bg-primary/[0.03] transition-colors"
            >
              <div className="min-w-0">
                <span className="block text-[10px] uppercase tracking-[0.25em] text-secondary/80 mb-[2px]">
                  {e.kicker}
                </span>
                <span className="font-serif text-2xl text-primary group-hover:text-secondary transition-colors">
                  {e.title}
                </span>
                <span className="block text-sm text-primary/55 mt-[2px] truncate">
                  {e.description}
                </span>
              </div>
              <Icons.ChevronRight
                className="w-4 h-4 text-secondary opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>

    {/* Destaque editorial + recentes */}
    <aside className="lg:col-span-5 space-y-spacing-2xl">
      <div className="bg-primary text-white p-spacing-2xl relative overflow-hidden">
        <span className="text-secondary text-[10px] tracking-[0.3em] uppercase font-medium mb-spacing-sm block">
          Destaque da coleção
        </span>
        <h3 className="font-serif text-3xl leading-tight mb-spacing-md">
          As Confissões de Santo Agostinho
        </h3>
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

      <div>
        <h4 className="text-[10px] uppercase tracking-[0.25em] font-medium text-primary/45 mb-spacing-md">
          Exploração recente
        </h4>
        <ul className="space-y-spacing-md">
          <li className="flex gap-spacing-md items-start">
            <span className="font-serif text-secondary text-xl leading-none">01.</span>
            <div>
              <p className="text-sm text-primary/85">Catecismo § 142 — A fé como resposta</p>
              <p className="text-xs text-primary/45">Retomar leitura · há 2 dias</p>
            </div>
          </li>
          <li className="flex gap-spacing-md items-start">
            <span className="font-serif text-secondary text-xl leading-none">02.</span>
            <div>
              <p className="text-sm text-primary/85">Dei Verbum — Constituição Dogmática</p>
              <p className="text-xs text-primary/45">Salvo em Coleções · há 1 semana</p>
            </div>
          </li>
        </ul>
      </div>
    </aside>
  </div>
);

const PesquisarView: React.FC<{ query: string }> = ({ query }) => (
  <div className="max-w-2xl">
    <h2 className="font-serif text-primary/90 text-2xl italic mb-spacing-md">Pesquisa aberta</h2>
    <p className="text-primary/55 text-sm leading-relaxed mb-spacing-lg">
      Digite acima e pressione Enter para buscar em toda a Biblioteca. Filtre por tema, pessoa, documento, período e fonte.
    </p>
    <div className="flex flex-wrap gap-spacing-sm">
      {['Tema', 'Pessoa', 'Documento', 'Período', 'Fonte'].map((f) => (
        <span key={f} className="text-[11px] uppercase tracking-[0.25em] text-primary/60 border border-primary/15 px-spacing-md py-spacing-2xs">
          {f}
        </span>
      ))}
    </div>
    {query && (
      <p className="mt-spacing-lg text-sm text-primary/60">
        Pressione Enter para buscar por <span className="font-serif italic text-secondary">"{query}"</span>.
      </p>
    )}
  </div>
);

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
