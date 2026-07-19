/**
 * PrayerLibraryPage — Livro de Orações (índice).
 *
 * Sprint CAT-12 item 2. Rota `/oracao`.
 * Renderiza o catálogo agrupado por categoria litúrgica com busca por
 * título/tag, chip de categoria e navegação para /oracao/:slug.
 */
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Clock, ChevronRight, Loader2 } from 'lucide-react';
import EditorialReaderChrome from '@/components/editorial/EditorialReaderChrome';
import { MobileTopBar } from '@/components/mobile/MobileTopBar';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import {
  usePrayers,
  PRAYER_CATEGORY_LABEL,
  PRAYER_CATEGORY_ORDER,
  type PrayerCategory,
  type Prayer,
} from '@/hooks/usePrayers';
import { cn } from '@/lib/utils';

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.round(sec / 60);
  return `${m} min`;
}

const PrayerLibraryPage: React.FC = () => {
  const { prayers, grouped, loading, error } = usePrayers();
  const [query, setQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<PrayerCategory | 'all'>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = selectedCat === 'all' ? prayers : (grouped.get(selectedCat) ?? []);
    if (!q) return base;
    return base.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.subtitle ?? '').toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [prayers, grouped, selectedCat, query]);

  // Quando não há filtro nem busca, mostramos agrupado. Caso contrário, lista plana.
  const showGrouped = selectedCat === 'all' && !query.trim();

  return (
    <>


      <main className="mx-auto w-full max-w-[880px] px-4 pb-24 pt-8 md:px-8 md:pt-12">
        {/* Hero editorial breve */}
        <header className="mb-10 text-center">
          <p className="font-stitch-body text-[11px] font-bold uppercase tracking-[0.28em] text-stitch-secondary">
            Cathedra · Orações
          </p>
          <h1 className="mt-3 font-stitch-display text-4xl md:text-5xl leading-tight text-stitch-on-surface">
            Livro de Orações
          </h1>
          <p className="mx-auto mt-4 max-w-[52ch] font-stitch-body text-base text-stitch-on-surface-variant">
            Um único lugar para as orações vivas da Igreja — organizadas por categoria,
            com meditação, referências e continuidade para a Escritura e o Catecismo.
          </p>
        </header>

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
          className="mb-10 flex flex-wrap gap-2"
        >
          <CategoryChip
            active={selectedCat === 'all'}
            label="Todas"
            onClick={() => setSelectedCat('all')}
          />
          {PRAYER_CATEGORY_ORDER.map((cat) => {
            const n = grouped.get(cat)?.length ?? 0;
            if (n === 0) return null;
            return (
              <CategoryChip
                key={cat}
                active={selectedCat === cat}
                label={`${PRAYER_CATEGORY_LABEL[cat]} · ${n}`}
                onClick={() => setSelectedCat(cat)}
              />
            );
          })}
        </div>

        {/* Estados */}
        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-stitch-on-surface-variant">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="font-stitch-body text-sm">Carregando orações…</span>
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
      </main>

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
      'h-9 rounded-full border px-4 font-stitch-body text-xs font-semibold uppercase tracking-widest transition-colors',
      active
        ? 'border-stitch-secondary bg-stitch-secondary text-stitch-on-secondary'
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
