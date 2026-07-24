import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icons } from '../../constants';
import { Button } from '@/components/ui/button';
import { FuzzySearchInput } from './FuzzySearchInput';
import { useDebounce } from '@/hooks/useDebounce';
import {
  searchSaintsAdvanced,
  getSaintsFilterFacets,
  type SaintsFilterInput,
} from '@/services/saintsService';
import type { Saint } from '@/data/saints';
import SacredImage from './SacredImage';
import StaggeredList from './StaggeredList';
import { CATEGORY_LABELS } from './SaintDetail.categories';

interface Props {
  onOpenSaint: (saint: Saint) => void;
}

const QUICK_CHIPS: Array<{ label: string; category: string; icon: React.ReactNode }> = [
  { label: 'Doutores', category: 'doctor', icon: <Icons.BookOpen className="w-spacing-sm h-spacing-sm" /> },
  { label: 'Papas', category: 'pope', icon: <Icons.Crown className="w-spacing-sm h-spacing-sm" /> },
  { label: 'Mártires', category: 'martyr', icon: <Icons.Flame className="w-spacing-sm h-spacing-sm" /> },
  { label: 'Fundadores', category: 'founder', icon: <Icons.Building2 className="w-spacing-sm h-spacing-sm" /> },
];

/**
 * SaintsFilters — Painel de filtros combinados da Biblioteca dos Santos.
 * Nome · Categoria · Século · País · Virtude + Chips rápidos.
 */
const SaintsFilters: React.FC<Props> = ({ onOpenSaint }) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | undefined>();
  const [century, setCentury] = useState<number | undefined>();
  const [country, setCountry] = useState<string | undefined>();
  const [virtue, setVirtue] = useState<string | undefined>();

  const debouncedQuery = useDebounce(query, 300);

  const { data: facets } = useQuery({
    queryKey: ['saints-facets'],
    queryFn: getSaintsFilterFacets,
    staleTime: 1000 * 60 * 30,
  });

  const filters: SaintsFilterInput = useMemo(() => ({
    query: debouncedQuery,
    category,
    century,
    country,
    virtue,
  }), [debouncedQuery, category, century, country, virtue]);

  const anyFilter = !!(debouncedQuery || category || century || country || virtue);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['saints-advanced', filters],
    queryFn: () => searchSaintsAdvanced(filters),
    enabled: anyFilter,
  });

  const clearAll = () => {
    setQuery('');
    setCategory(undefined);
    setCentury(undefined);
    setCountry(undefined);
    setVirtue(undefined);
  };

  return (
    <section aria-labelledby="filters-heading" className="space-y-spacing-lg max-w-5xl mx-auto px-spacing-md">
      <h2 id="filters-heading" className="sr-only">Filtros da Biblioteca dos Santos</h2>

      <FuzzySearchInput
        value={query}
        onChange={setQuery}
        placeholder="Buscar por nome, título ou padroado…"
        isSearching={query !== debouncedQuery || isLoading}
        size="lg"
      />

      {/* Quick chips */}
      <div className="flex flex-wrap gap-spacing-xs" role="group" aria-label="Categorias rápidas">
        {QUICK_CHIPS.map((chip) => {
          const active = category === chip.category;
          return (
            <button
              key={chip.category}
              type="button"
              onClick={() => setCategory(active ? undefined : chip.category)}
              aria-pressed={active}
              className={`inline-flex items-center gap-spacing-2xs px-spacing-md py-spacing-2xs rounded-premium-full text-premium-xs font-black uppercase tracking-widest border transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none ${
                active
                  ? 'bg-primary text-primary-foreground border-primary shadow-premium'
                  : 'bg-secondary/40 text-foreground border-border hover:border-primary/40'
              }`}
            >
              {chip.icon}
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Select filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-spacing-md">
        <FilterSelect
          label="Categoria"
          value={category ?? ''}
          onChange={(v) => setCategory(v || undefined)}
          options={Object.entries(CATEGORY_LABELS).map(([v, l]) => ({ value: v, label: l }))}
        />
        <FilterSelect
          label="Século"
          value={century ? String(century) : ''}
          onChange={(v) => setCentury(v ? Number(v) : undefined)}
          options={(facets?.centuries ?? []).map((c) => ({ value: String(c), label: `Século ${c}` }))}
        />
        <FilterSelect
          label="País"
          value={country ?? ''}
          onChange={(v) => setCountry(v || undefined)}
          options={(facets?.countries ?? []).map((c) => ({ value: c, label: c }))}
        />
        <FilterSelect
          label="Virtude"
          value={virtue ?? ''}
          onChange={(v) => setVirtue(v || undefined)}
          options={(facets?.virtues ?? []).slice(0, 30).map((v) => ({ value: v, label: v }))}
        />
      </div>

      {anyFilter && (
        <div className="flex items-center justify-between">
          <p className="text-premium-xs uppercase tracking-widest text-muted-foreground">
            {isLoading
              ? 'Buscando…'
              : `${results.length} ${results.length === 1 ? 'santo encontrado' : 'santos encontrados'}`}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-premium-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            <Icons.X className="w-spacing-sm h-spacing-sm mr-spacing-2xs" />
            Limpar filtros
          </Button>
        </div>
      )}

      {/* Results */}
      {anyFilter ? (
        isLoading ? (
          <div className="flex justify-center py-spacing-3xl">
            <Icons.Cross className="w-spacing-xl h-spacing-xl animate-spin opacity-20" />
          </div>
        ) : results.length > 0 ? (
          <StaggeredList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-spacing-md">
            {results.map((saint) => (
              <button
                key={saint.id}
                type="button"
                onClick={() => onOpenSaint(saint)}
                aria-label={`Abrir perfil de ${saint.name}`}
                className="group text-left premium-card overflow-hidden flex flex-col focus-visible:ring-2 focus-visible:ring-primary outline-none"
              >
                <div className="relative h-spacing-4xl overflow-hidden">
                  <SacredImage
                    src={saint.image || ''}
                    alt={saint.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <span className="absolute bottom-spacing-xs left-spacing-md text-premium-xs font-black uppercase tracking-widest text-white/90 bg-primary/80 px-spacing-xs py-spacing-3xs rounded-premium-full">
                    {CATEGORY_LABELS[saint.category] || saint.category}
                  </span>
                </div>
                <div className="flex-1 p-spacing-md space-y-spacing-2xs">
                  <h3 className="font-serif text-premium-lg text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-spacing-2xs">
                    {saint.name}
                  </h3>
                  {saint.title && (
                    <p className="text-premium-xs text-muted-foreground italic font-serif line-clamp-spacing-2xs">
                      {saint.title}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-spacing-2xs pt-spacing-2xs">
                    {saint.century && (
                      <span className="text-premium-xs text-muted-foreground">Séc. {saint.century}</span>
                    )}
                    {saint.country && (
                      <span className="text-premium-xs text-muted-foreground">· {saint.country}</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </StaggeredList>
        ) : (
          <div className="text-center py-spacing-3xl bg-muted/20 rounded-[2rem] border border-dashed border-border">
            <p className="text-premium-sm font-serif italic text-muted-foreground">
              Nenhum santo encontrado com esses filtros.
            </p>
          </div>
        )
      ) : (
        <div className="text-center py-spacing-3xl text-muted-foreground font-serif italic">
          Escolha um filtro ou digite um nome para explorar a Biblioteca dos Santos.
        </div>
      )}
    </section>
  );
};

const FilterSelect: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}> = ({ label, value, onChange, options }) => (
  <label className="flex flex-col gap-spacing-2xs">
    <span className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground">{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-spacing-2xl px-spacing-sm rounded-premium border border-border bg-background text-premium-sm text-foreground focus-visible:ring-2 focus-visible:ring-primary outline-none"
    >
      <option value="">Todos</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </label>
);

export default SaintsFilters;
