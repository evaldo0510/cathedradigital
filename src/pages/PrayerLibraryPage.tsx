/**
 * PrayerLibraryPage — Livro de Orações (índice).
 *
 * Sprint CAT-12 item 2. Rota `/oracao`.
 * Renderiza o catálogo agrupado por categoria litúrgica com busca por
 * título/tag, chip de categoria e navegação para /oracao/:slug.
 */
import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Clock, ChevronRight, Loader2 } from 'lucide-react';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import { EditorialHero } from '@/components/editorial/harmony';

import {
  usePrayers,
  PRAYER_CATEGORY_LABEL,
  PRAYER_CATEGORY_ORDER,
  type PrayerCategory,
  type Prayer,
} from '@/hooks/usePrayers';
import { cn } from '@/lib/utils';
import { SpaceHeader, SpaceFooter } from '@/components/cathedra/space/SpaceLayout';


function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.round(sec / 60);
  return `${m} min`;
}

const PrayerLibraryPage: React.FC = () => {
  const { prayers, grouped, loading, error } = usePrayers();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<PrayerCategory | 'all'>('all');
  const [metrics, setMetrics] = useState<{ p50: number; p95: number; last: number } | null>(null);

  // Latency monitoring with percentiles P50/P95
  useEffect(() => {
    if (loading || prayers.length === 0) return;

    const entries = performance.getEntriesByType("measure").filter(e => e.name.startsWith("prayer_"));
    const durations = entries.map(e => e.duration).sort((a, b) => a - b);
    
    if (durations.length > 0) {
      const p50 = durations[Math.floor(durations.length * 0.5)];
      const p95 = durations[Math.floor(durations.length * 0.95)];
      setMetrics({ p50: Math.round(p50), p95: Math.round(p95), last: Math.round(durations[durations.length - 1]) });
    }
  }, [loading, prayers]);

  // Debounced search for performance
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 200);
    return () => clearTimeout(handler);
  }, [query]);

  // Prefetching mechanism for individual prayers
  useEffect(() => {
    if (!prayers.length) return;
    
    const prefetchPrayers = async () => {
      // Use logic to determine high-priority prayers for prefetching
      // For now, Supabase client handles caching once queried
    };
    
    prefetchPrayers();
  }, [prayers]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    const base = selectedCat === 'all' ? prayers : (grouped.get(selectedCat) ?? []);
    if (!q) return base;
    return base.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.subtitle ?? '').toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [prayers, grouped, selectedCat, debouncedQuery]);

  // Quando não há filtro nem busca, mostramos agrupado. Caso contrário, lista plana.
  const showGrouped = selectedCat === 'all' && !debouncedQuery.trim();

  return (
    <>


      <section className="mx-auto w-full max-w-[880px] px-4 pb-24 pt-8 md:px-8 md:pt-12">
        <EditorialHero density="minimal" align="center">
          <EditorialHero.Eyebrow>Um espaço para parar, silenciar e rezar.</EditorialHero.Eyebrow>
          <EditorialHero.Title>Sacrário</EditorialHero.Title>
          <EditorialHero.Subtitle>Livro de Orações e Liturgia</EditorialHero.Subtitle>
        </EditorialHero>


        {/* Busca */}
        <div className="mb-6">
          <label htmlFor="prayer-search" className="sr-only">
            Buscar oração
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stitch-on-surface-variant"
              aria-hidden
            />
            <input
              id="prayer-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por título ou tema…"
              className="h-12 w-full rounded-full border border-stitch-outline-variant/40 bg-stitch-surface pl-11 pr-4 font-stitch-body text-sm text-stitch-on-surface placeholder:text-stitch-on-surface-variant/70 focus:border-stitch-secondary focus:outline-none focus:ring-2 focus:ring-stitch-secondary/30"
            />
          </div>
        </div>

        {/* Chips de categoria */}
        <div
          role="tablist"
          aria-label="Categorias de orações"
          className="mb-14 flex flex-wrap justify-center gap-3"
        >
          <CategoryChip
            active={selectedCat === 'all'}
            label="Todas"
            onClick={() => setSelectedCat('all')}
          />
          {['devocional', 'rosario', 'liturgia'].map((cat) => {
            const labelMap: Record<string, string> = {
              'devocional': 'Orações',
              'rosario': 'Rosário',
              'liturgia': 'Liturgia'
            };
            return (
              <CategoryChip
                key={cat}
                active={selectedCat === (cat as PrayerCategory)}
                label={labelMap[cat] || cat}
                onClick={() => setSelectedCat(cat as PrayerCategory)}
              />
            );
          })}
        </div>

        {/* Estados */}
        {loading && (
          <div className="space-y-8 py-8 animate-in fade-in duration-500">
            <div className="space-y-4">
              <div className="h-8 w-48 rounded bg-stitch-outline-variant/20 cathedra-shimmer" />
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 w-full rounded-lg bg-stitch-outline-variant/10 cathedra-shimmer" />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-8 w-32 rounded bg-stitch-outline-variant/20 cathedra-shimmer" />
              <div className="space-y-2">
                {[1, 2, 4].map(i => (
                  <div key={i} className="h-16 w-full rounded-lg bg-stitch-outline-variant/10 cathedra-shimmer" />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && !loading && (
          <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Não foi possível carregar as orações: {error}
          </p>
        )}

        {!loading && !error && filtered.length === 0 && (
          <p className="py-12 text-center font-stitch-body text-sm text-stitch-on-surface-variant">
            Nenhuma oração encontrada.
          </p>
        )}

        {/* Conteúdo */}
        {!loading && !error && filtered.length > 0 && (
          showGrouped ? (
            <div className="space-y-14">
              {PRAYER_CATEGORY_ORDER.map((cat) => {
                const items = grouped.get(cat) ?? [];
                if (items.length === 0) return null;
                return (
                  <section key={cat} aria-labelledby={`cat-${cat}`}>
                    <h2
                      id={`cat-${cat}`}
                      className="mb-4 border-b border-stitch-outline-variant/30 pb-2 font-stitch-display text-2xl text-stitch-on-surface"
                    >
                      {PRAYER_CATEGORY_LABEL[cat]}
                    </h2>
                    <ul className="divide-y divide-stitch-outline-variant/25">
                      {items.map((p) => (
                        <PrayerRow key={p.id} prayer={p} />
                      ))}
                    </ul>
        {!loading && metrics && (
          <div className="mt-8 text-center space-x-4">
            <span className="font-stitch-body text-[9px] uppercase tracking-widest text-stitch-on-surface-variant/40">
              P50: {metrics.p50}ms
            </span>
            <span className="font-stitch-body text-[9px] uppercase tracking-widest text-stitch-on-surface-variant/40">
              P95: {metrics.p95}ms
            </span>
          </div>
        )}
      </section>
                );
              })}
            </div>
          ) : (
            <ul className="divide-y divide-stitch-outline-variant/25 border-y border-stitch-outline-variant/25">
              {filtered.map((p) => (
                <PrayerRow key={p.id} prayer={p} />
              ))}
            </ul>
          )
        )}

        {/* 5. Footer do espaço */}
        <SpaceFooter
          note="Toda oração conduz de volta à Palavra e à vida da Igreja."
          links={[
            { label: 'Átrio', to: '/', hint: 'Voltar à entrada do Mosteiro' },
            { label: 'Biblioteca', to: '/biblioteca', hint: 'Ler a Escritura e os Padres' },
            { label: 'Rosário', to: '/oracao/rosario', hint: 'Contemplar os mistérios' },
          ]}
        />
      </section>


      <MobileBottomNav />
    </>
  );
};

const CategoryChip: React.FC<{ active: boolean; label: string; onClick: () => void }> = ({
  active,
  label,
  onClick,
}) => (
  <button
    type="button"
    role="tab"
    aria-selected={active}
    onClick={onClick}
    className={cn(
      'min-h-[44px] rounded-full border px-4 font-stitch-body text-xs font-semibold uppercase tracking-widest transition-colors',
      active
        ? 'border-stitch-secondary bg-stitch-secondary text-stitch-secondary-foreground'
        : 'border-stitch-outline-variant/40 text-stitch-on-surface-variant hover:border-stitch-secondary/50 hover:text-stitch-on-surface',
    )}
  >
    {label}
  </button>
);

const PrayerRow: React.FC<{ prayer: Prayer }> = ({ prayer }) => (
  <li>
    <Link
      to={`/oracao/${prayer.slug}`}
      className="group flex items-center gap-4 py-4 transition-colors hover:bg-stitch-surface-variant/40"
    >
      <div className="min-w-0 flex-1">
        <p className="font-stitch-display text-lg text-stitch-on-surface group-hover:text-stitch-secondary">
          {prayer.title}
        </p>
        {prayer.subtitle && (
          <p className="mt-0.5 truncate font-stitch-body text-sm text-stitch-on-surface-variant">
            {prayer.subtitle}
          </p>
        )}
      </div>
      <div className="hidden shrink-0 items-center gap-1.5 text-stitch-on-surface-variant sm:flex">
        <Clock className="h-3.5 w-3.5" aria-hidden />
        <span className="font-stitch-body text-xs">{formatDuration(prayer.estimated_seconds)}</span>
      </div>
      <ChevronRight
        className="h-5 w-5 shrink-0 text-stitch-on-surface-variant transition-transform group-hover:translate-x-0.5 group-hover:text-stitch-secondary"
        aria-hidden
      />
    </Link>
  </li>
);

export default PrayerLibraryPage;
