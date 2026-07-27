import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, BookOpen, ArrowUpDown, Info } from 'lucide-react';
import type { SaintWritingRef } from '../types';
import { SaintWritingProvenanceModal } from './SaintWritingProvenanceModal';

interface Props {
  writings: SaintWritingRef[];
}

type OriginFilter = 'all' | 'hosted' | 'linked';
type SortMode = 'origin' | 'title-asc' | 'title-desc';

const isHosted = (w: SaintWritingRef) => Boolean(w.slug);

/** Escritos: hospedados (`slug`) preferem link interno; senão externo com atribuição. */
export const SaintWritingsBlock: React.FC<Props> = ({ writings }) => {
  const [filter, setFilter] = useState<OriginFilter>('all');
  const [sort, setSort] = useState<SortMode>('origin');
  const [modalWriting, setModalWriting] = useState<SaintWritingRef | null>(null);

  const counts = useMemo(() => {
    const hosted = writings.filter(isHosted).length;
    return { all: writings.length, hosted, linked: writings.length - hosted };
  }, [writings]);

  const visible = useMemo(() => {
    const filtered = writings.filter((w) => {
      if (filter === 'hosted') return isHosted(w);
      if (filter === 'linked') return !isHosted(w);
      return true;
    });
    const sorted = [...filtered];
    const byTitle = (a: SaintWritingRef, b: SaintWritingRef) =>
      a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' });
    if (sort === 'title-asc') sorted.sort(byTitle);
    else if (sort === 'title-desc') sorted.sort((a, b) => byTitle(b, a));
    else
      sorted.sort((a, b) => {
        const oa = isHosted(a) ? 0 : 1;
        const ob = isHosted(b) ? 0 : 1;
        return oa === ob ? byTitle(a, b) : oa - ob;
      });
    return sorted;
  }, [writings, filter, sort]);

  const filterOptions: { id: OriginFilter; label: string; count: number }[] = [
    { id: 'all', label: 'Todos', count: counts.all },
    { id: 'hosted', label: 'Hospedado no Cathedra', count: counts.hosted },
    { id: 'linked', label: 'Conteúdo linkado', count: counts.linked },
  ];

  return (
    <section
      aria-labelledby="saint-writings"
      className="rounded-2xl border border-border/60 bg-card/40 p-spacing-lg"
    >
      <div className="flex flex-wrap items-center justify-between gap-spacing-sm mb-spacing-sm">
        <h2 id="saint-writings" className="font-serif text-premium-lg text-foreground">
          Escritos
        </h2>
        <label className="flex items-center gap-1 text-premium-xs text-muted-foreground">
          <ArrowUpDown className="w-3 h-3" aria-hidden />
          <span className="sr-only">Ordenar</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="bg-transparent border border-border/60 rounded px-1.5 py-0.5 text-premium-xs focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Ordenar escritos"
          >
            <option value="origin">Origem (internos primeiro)</option>
            <option value="title-asc">Título (A–Z)</option>
            <option value="title-desc">Título (Z–A)</option>
          </select>
        </label>
      </div>

      <div
        role="tablist"
        aria-label="Filtrar por origem"
        className="flex flex-wrap gap-1.5 mb-spacing-md"
      >
        {filterOptions.map((opt) => {
          const active = filter === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(opt.id)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-premium-xs transition-colors ${
                active
                  ? 'bg-primary/10 text-primary border-primary/40'
                  : 'bg-transparent text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground'
              }`}
            >
              <span>{opt.label}</span>
              <span
                className={`inline-flex items-center justify-center min-w-[1.25rem] h-4 px-1 rounded-full text-[10px] font-semibold ${
                  active ? 'bg-primary/20' : 'bg-muted'
                }`}
              >
                {opt.count}
              </span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="text-premium-sm text-muted-foreground italic">
          Nenhum escrito nesta categoria.
        </p>
      ) : (
        <ul className="space-y-spacing-sm">
          {visible.map((w) => {
            const hosted = isHosted(w);
            const internal = hosted ? `/biblioteca/escritos/${w.slug}` : null;
            const Wrapper: React.ElementType = internal ? Link : 'a';
            const wrapperProps = internal
              ? { to: internal }
              : { href: w.externalUrl ?? '#', target: '_blank', rel: 'noopener nofollow' };
            const hasProvenance = Boolean(
              w.attribution || w.license || w.isPublicDomain || w.canonicalUrl || w.externalUrl,
            );
            return (
              <li key={w.id} className="rounded-xl border border-border/50 p-spacing-md">
                <Wrapper {...wrapperProps} className="flex items-start gap-spacing-xs group">
                  {hosted ? (
                    <BookOpen
                      className="w-4 h-4 mt-1 text-primary flex-shrink-0"
                      aria-hidden
                    />
                  ) : (
                    <ExternalLink
                      className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0"
                      aria-hidden
                    />
                  )}
                  <span className="font-serif text-premium-md text-foreground group-hover:text-primary transition-colors">
                    {w.title}
                  </span>
                </Wrapper>
                {w.summary && (
                  <p className="text-premium-sm text-muted-foreground mt-spacing-2xs leading-relaxed">
                    {w.summary}
                  </p>
                )}
                {hasProvenance && (
                  <button
                    type="button"
                    onClick={() => setModalWriting(w)}
                    className="mt-spacing-2xs inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground/80 hover:text-primary transition-colors"
                    aria-label={`Ver proveniência de ${w.title}`}
                  >
                    <Info className="w-3 h-3" aria-hidden />
                    <span>
                      {[
                        w.attribution,
                        w.isPublicDomain ? 'Domínio público' : w.license,
                      ]
                        .filter(Boolean)
                        .join(' · ') || 'Ver fonte e licença'}
                    </span>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <SaintWritingProvenanceModal
        writing={modalWriting}
        open={Boolean(modalWriting)}
        onOpenChange={(open) => !open && setModalWriting(null)}
      />
    </section>
  );
};
