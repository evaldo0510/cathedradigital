import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icons } from '../../constants';
import { Button } from '@/components/ui/button';
import { FuzzySearchInput } from './FuzzySearchInput';
import { useDebounce } from '@/hooks/useDebounce';
import {
  searchSaintsAdvanced,
  getSaintsFilterFacets,
  type SaintsFilterInput,
  type SaintsSortOption,
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

const SORT_OPTIONS: Array<{ value: SaintsSortOption; label: string }> = [
  { value: 'name-asc', label: 'Nome (A–Z)' },
  { value: 'name-desc', label: 'Nome (Z–A)' },
  { value: 'feast-asc', label: 'Festa litúrgica (Jan → Dez)' },
  { value: 'feast-desc', label: 'Festa litúrgica (Dez → Jan)' },
];

const PAGE_SIZE = 24;

const SaintsFilters: React.FC<Props> = ({ onOpenSaint }) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | undefined>();
  const [century, setCentury] = useState<number | undefined>();
  const [country, setCountry] = useState<string | undefined>();
  const [virtue, setVirtue] = useState<string | undefined>();
  const [sort, setSort] = useState<SaintsSortOption>('name-asc');
  const [page, setPage] = useState(1);

  const debouncedQuery = useDebounce(query, 300);

  const { data: facets } = useQuery({
    queryKey: ['saints-facets'],
    queryFn: getSaintsFilterFacets,
    staleTime: 1000 * 60 * 30,
  });

  const countriesEmpty = !!facets && facets.countries.length === 0;
  const vocationsEmpty = !!facets && facets.vocations.length === 0;
  const showEnrichmentNotice = countriesEmpty || vocationsEmpty;

  const filters: SaintsFilterInput = useMemo(() => ({
    query: debouncedQuery,
    category,
    century,
    country,
    virtue,
    sort,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  }), [debouncedQuery, category, century, country, virtue, sort, page]);

  // Reset page when filters change (mas não quando muda apenas offset)
  const filterKey = `${debouncedQuery}|${category}|${century}|${country}|${virtue}|${sort}`;
  React.useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['saints-advanced', filters],
    queryFn: () => searchSaintsAdvanced(filters),
    placeholderData: (prev) => prev,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const clearAll = () => {
    setQuery('');
    setCategory(undefined);
    setCentury(undefined);
    setCountry(undefined);
    setVirtue(undefined);
    setSort('name-asc');
    setPage(1);
  };

  const anyFilter = !!(debouncedQuery || category || century || country || virtue);

  return (
    <section aria-labelledby="filters-heading" className="space-y-spacing-lg max-w-5xl mx-auto px-spacing-md">
      <h2 id="filters-heading" className="sr-only">Filtros da Biblioteca dos Santos</h2>

      {showEnrichmentNotice && (
        <div
          role="status"
          className="flex items-start gap-spacing-sm rounded-premium border border-amber-500/30 bg-amber-500/5 p-spacing-md text-premium-xs text-foreground"
        >
          <Icons.Info className="w-spacing-md h-spacing-md text-amber-600 shrink-0 mt-[2px]" aria-hidden="true" />
          <div className="space-y-spacing-2xs">
            <p className="font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
              Enriquecimento editorial em andamento
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {countriesEmpty && vocationsEmpty
                ? 'Os campos País e Vocação ainda estão sendo preenchidos para os santos da base. Enquanto isso, use Categoria, Século, Virtude e a busca por nome.'
                : countriesEmpty
                ? 'O campo País ainda está sendo preenchido. Enquanto isso, o filtro está desativado — use Categoria, Século, Virtude ou nome.'
                : 'O campo Vocação ainda está sendo preenchido. Enquanto isso, o filtro está desativado — use Categoria, Século, Virtude ou nome.'}
            </p>
          </div>
        </div>
      )}

      <FuzzySearchInput
        value={query}
        onChange={setQuery}
        placeholder="Buscar por nome, título ou padroado…"
        isSearching={query !== debouncedQuery || isFetching}
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
          label={countriesEmpty ? 'País (em breve)' : 'País'}
          value={country ?? ''}
          onChange={(v) => setCountry(v || undefined)}
          options={(facets?.countries ?? []).map((c) => ({ value: c, label: c }))}
          disabled={countriesEmpty}
        />
        <FilterSelect
          label="Virtude"
          value={virtue ?? ''}
          onChange={(v) => setVirtue(v || undefined)}
          options={(facets?.virtues ?? []).slice(0, 30).map((v) => ({ value: v, label: v }))}
        />
      </div>

      {/* Sort + summary */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-spacing-sm">
        <p className="text-premium-xs uppercase tracking-widest text-muted-foreground">
          {isLoading
            ? 'Buscando…'
            : `${total} ${total === 1 ? 'santo encontrado' : 'santos encontrados'}`}
          {anyFilter && ' · com filtros'}
        </p>
        <div className="flex items-center gap-spacing-sm">
          <label className="flex items-center gap-spacing-2xs">
            <span className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground">Ordenar</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SaintsSortOption)}
              className="h-spacing-xl px-spacing-sm rounded-premium border border-border bg-background text-premium-xs text-foreground focus-visible:ring-2 focus-visible:ring-primary outline-none"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          {anyFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-premium-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              <Icons.X className="w-spacing-sm h-spacing-sm mr-spacing-2xs" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center py-spacing-3xl">
          <Icons.Cross className="w-spacing-xl h-spacing-xl animate-spin opacity-20" />
        </div>
      ) : items.length > 0 ? (
        <>
          <StaggeredList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-spacing-md">
            {items.map((saint) => (
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
                    category={saint.category}
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
                  <div className="flex flex-wrap gap-spacing-2xs pt-spacing-2xs text-premium-xs text-muted-foreground">
                    {saint.feastDay && <span>Festa: {saint.feastDay}</span>}
                    {saint.century && <span>· Séc. {saint.century}</span>}
                    {saint.country && <span>· {saint.country}</span>}
                  </div>
                </div>
              </button>
            ))}
          </StaggeredList>

          {totalPages > 1 && (
            <nav
              aria-label="Paginação da Biblioteca dos Santos"
              className="flex items-center justify-center gap-spacing-xs pt-spacing-lg"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isFetching}
              >
                <Icons.ChevronLeft className="w-spacing-sm h-spacing-sm" />
                Anterior
              </Button>
              <span className="text-premium-xs uppercase tracking-widest text-muted-foreground px-spacing-md">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isFetching}
              >
                Próxima
                <Icons.ChevronRight className="w-spacing-sm h-spacing-sm" />
              </Button>
            </nav>
          )}
        </>
      ) : (
        <div className="text-center py-spacing-3xl bg-muted/20 rounded-[2rem] border border-dashed border-border">
          <p className="text-premium-sm font-serif italic text-muted-foreground">
            {anyFilter
              ? 'Nenhum santo encontrado com esses filtros. Tente afrouxar os critérios.'
              : 'Escolha um filtro, uma ordenação ou digite um nome para explorar.'}
          </p>
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
  disabled?: boolean;
}> = ({ label, value, onChange, options, disabled }) => (
  <label className={`flex flex-col gap-spacing-2xs ${disabled ? 'opacity-60' : ''}`}>
    <span className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground">{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="h-spacing-2xl px-spacing-sm rounded-premium border border-border bg-background text-premium-sm text-foreground focus-visible:ring-2 focus-visible:ring-primary outline-none disabled:cursor-not-allowed"
    >
      <option value="">Todos</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </label>
);

export default SaintsFilters;
