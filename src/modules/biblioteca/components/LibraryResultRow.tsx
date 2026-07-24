/**
 * Sprint B.1 · Onda B.1.3 — Linha de resultado unificada.
 *
 * UMA marcação para qualquer módulo (Glossário, Bíblia, Catecismo, Santos…).
 * Recebe `LibraryResult` e renderiza: ícone canônico + tipo + título + trecho
 * + selo ICE + contagem de Nexus + tempo estimado + botão "Abrir".
 *
 * Sem cards específicos por módulo. Sem ifs de tipo. Design tokens semânticos
 * apenas — o mesmo componente funciona em qualquer skin (default ou Stitch).
 */
import { Link } from 'react-router-dom';
import { ArrowRight, Clock3, Network } from 'lucide-react';
import { cn } from '@/lib/utils';
import IceBadge from './IceBadge';
import { LIBRARY_MODULE_META } from '../search/moduleMeta';
import type { LibraryResult } from '../search/types';

export interface LibraryResultRowProps {
  result: LibraryResult;
  onOpen?: (result: LibraryResult) => void;
  className?: string;
}

export function LibraryResultRow({ result, onOpen, className }: LibraryResultRowProps) {
  const Icon = result.icon;
  const label = LIBRARY_MODULE_META[result.type].label;
  const nexusTotal = result.nexus?.total ?? 0;

  return (
    <article
      className={cn(
        'group relative flex gap-4 rounded-lg border border-border/60 bg-card p-4 transition hover:border-primary/40 hover:shadow-sm',
        className,
      )}
      data-library-result={result.type}
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/40 text-primary"
        aria-hidden
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span>{label}</span>
          {result.subtitle ? (
            <>
              <span aria-hidden>·</span>
              <span className="truncate">{result.subtitle}</span>
            </>
          ) : null}
        </div>

        <h3 className="mt-1 truncate text-base font-semibold text-foreground">
          <Link
            to={result.href}
            onClick={() => onOpen?.(result)}
            className="focus-visible:underline focus-visible:outline-none"
          >
            {result.title}
          </Link>
        </h3>

        {result.excerpt ? (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{result.excerpt}</p>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          {result.editorialStatus ? <IceBadge level={result.editorialStatus} /> : null}
          {nexusTotal > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-muted-foreground">
              <Network className="h-3 w-3" aria-hidden />
              {nexusTotal} nexus
            </span>
          ) : null}
          {typeof result.readingMinutes === 'number' && result.readingMinutes > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-muted-foreground">
              <Clock3 className="h-3 w-3" aria-hidden />
              {result.readingMinutes} min
            </span>
          ) : null}
          {result.reason ? (
            <span className="rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[11px] text-primary">
              {result.reason}
            </span>
          ) : null}
        </div>
      </div>

      <Link
        to={result.href}
        onClick={() => onOpen?.(result)}
        aria-label={`Abrir ${result.title}`}
        className="ml-2 inline-flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-md border border-border/60 text-primary transition group-hover:border-primary/60 group-hover:bg-primary/10"
      >
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </article>
  );
}

export default LibraryResultRow;
