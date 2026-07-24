/**
 * Sprint B.1 · Onda B.1.2 — Barra única de filtros por módulo.
 *
 * "Todos" + 10 módulos. Multi-seleção. Renderiza sempre a mesma pílula, com
 * o ícone canônico do módulo e contagem opcional (vinda da busca).
 */
import { Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LibraryModule } from '../types';
import { LIBRARY_MODULE_META, LIBRARY_MODULE_ORDER } from '../search/moduleMeta';

export interface LibraryFiltersProps {
  /** Módulos ativos; vazio = "Todos". */
  active: LibraryModule[];
  onChange: (next: LibraryModule[]) => void;
  counts?: Partial<Record<LibraryModule, number>>;
  className?: string;
}

export function LibraryFilters({ active, onChange, counts, className }: LibraryFiltersProps) {
  const isAll = active.length === 0;
  const toggle = (mod: LibraryModule) => {
    onChange(active.includes(mod) ? active.filter((m) => m !== mod) : [...active, mod]);
  };
  const total = counts ? Object.values(counts).reduce((s, n) => s + (n ?? 0), 0) : undefined;

  return (
    <div
      role="toolbar"
      aria-label="Filtrar Biblioteca por módulo"
      className={cn('flex flex-wrap items-center gap-2', className)}
    >
      <button
        type="button"
        onClick={() => onChange([])}
        aria-pressed={isAll}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
          isAll
            ? 'border-primary/60 bg-primary/10 text-primary'
            : 'border-border bg-background text-muted-foreground hover:bg-muted',
        )}
      >
        <Filter className="h-3.5 w-3.5" aria-hidden />
        Todos
        {typeof total === 'number' && total > 0 && (
          <span className="ml-1 text-[10px] opacity-70">{total}</span>
        )}
      </button>

      {LIBRARY_MODULE_ORDER.map((mod) => {
        const meta = LIBRARY_MODULE_META[mod];
        const Icon = meta.icon;
        const isActive = active.includes(mod);
        const count = counts?.[mod];
        return (
          <button
            key={mod}
            type="button"
            onClick={() => toggle(mod)}
            aria-pressed={isActive}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
              isActive
                ? 'border-primary/60 bg-primary/10 text-primary'
                : 'border-border bg-background text-muted-foreground hover:bg-muted',
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {meta.label}
            {typeof count === 'number' && count > 0 && (
              <span className="ml-1 text-[10px] opacity-70">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
