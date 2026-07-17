import { Button } from '@/components/ui/button';
import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Icons } from '../../constants';
import { useCatechismParagraph } from '@/hooks/useCatechismParagraph';

interface CatechismPopoverProps {
  paragraph: number;
  onNavigate?: (paragraph: number) => void;
  variant?: 'default' | 'mini';
}

const CatechismPopover: React.FC<CatechismPopoverProps> = memo(({
  paragraph,
  onNavigate,
  variant = 'default',
}) => {
  const { data, isLoading, isFetched, error } = useCatechismParagraph(paragraph);
  const [showDiag, setShowDiag] = React.useState(false);

  const content = data?.content || '';
  const err = error as any;
  const diag = {
    status: err?.code || data?.status || (isFetched && !content ? 'empty' : 'ok'),
    httpStatus: err?.status ?? '—',
    requestId: `cic-${paragraph}-${Date.now().toString(36)}`,
    message: err?.message || (isFetched && !content ? 'Conteúdo vazio retornado pelo servidor.' : ''),
  };
  const hasIssue = Boolean(err) || (isFetched && !content);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={variant === 'mini' 
            ? "ml-spacing-2xs inline-flex h-spacing-md w-spacing-md items-center justify-center rounded-premium-full bg-primary/10 text-premium-xs font-black text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all align-middle"
            : "px-spacing-xs py-spacing-2xs rounded-premium-full bg-card border border-border text-premium-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-all"}
        >
          {variant === 'mini' ? '§' : `§${paragraph}`}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-spacing-4xl max-h-spacing-4xl overflow-y-auto p-spacing-0 rounded-premium border-primary/20 bg-card shadow-premium"
      >
        <div className="p-spacing-sm border-b border-border bg-primary/5 flex items-center justify-between">
          <div className="flex items-center gap-spacing-xs">
            <Icons.Cross className="w-spacing-sm h-spacing-sm text-primary" />
            <span className="text-premium-xs font-black uppercase tracking-wider text-primary">
              CIC §{paragraph}
            </span>
          </div>
          {onNavigate && (
            <Button
              onClick={() => onNavigate(paragraph)}
              className="text-premium-xs font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-spacing-2xs"
            >
              Abrir completo
              <Icons.ArrowDown className="w-spacing-sm h-spacing-sm -rotate-90" />
            </Button>
          )}
        </div>
        <div className="p-spacing-sm">
          {isLoading && (
            <div className="space-y-spacing-xs py-spacing-xs">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-spacing-sm bg-muted rounded animate-pulse" style={{ width: `${50 + i * 15}%` }} />
              ))}
            </div>
          )}
          {!isLoading && isFetched && content && (
            <p className="text-premium-xs leading-relaxed text-foreground/90 font-serif">
              {content.length > 300 ? content.slice(0, 300) + '…' : content}
            </p>
          )}
          {!isLoading && isFetched && !content && (
            <div className="space-y-spacing-xs">
              <p className="text-premium-xs text-muted-foreground italic">
                Texto ainda não importado para o banco oficial.
              </p>
              <Link
                to={`/catechism?paragraph=${paragraph}`}
                className="inline-flex items-center gap-spacing-2xs text-premium-xs font-bold text-primary hover:underline"
                data-testid="catechism-open-internal"
              >
                <Icons.ArrowDown className="w-spacing-sm h-spacing-sm -rotate-90" />
                Abrir §{paragraph} no Catecismo
              </Link>
            </div>
          )}

          {!isLoading && hasIssue && (
            <div className="mt-spacing-sm border-t border-border pt-spacing-xs">
              <button
                type="button"
                onClick={() => setShowDiag(v => !v)}
                className="text-premium-xs font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-spacing-2xs"
                data-testid="catechism-diag-toggle"
              >
                <Icons.AlertTriangle className="w-spacing-sm h-spacing-sm" />
                Diagnóstico {showDiag ? '▾' : '▸'}
              </button>
              {showDiag && (
                <dl className="mt-spacing-xs space-y-spacing-2xs text-premium-xs font-mono bg-muted/40 rounded-premium p-spacing-xs">
                  <div className="flex justify-between gap-spacing-xs">
                    <dt className="text-muted-foreground">status</dt>
                    <dd className="text-foreground">{String(diag.status)}</dd>
                  </div>
                  <div className="flex justify-between gap-spacing-xs">
                    <dt className="text-muted-foreground">http</dt>
                    <dd className="text-foreground">{String(diag.httpStatus)}</dd>
                  </div>
                  <div className="flex justify-between gap-spacing-xs">
                    <dt className="text-muted-foreground">request_id</dt>
                    <dd className="text-foreground break-all">{diag.requestId}</dd>
                  </div>
                  {diag.message && (
                    <div>
                      <dt className="text-muted-foreground mb-spacing-2xs">message</dt>
                      <dd className="text-foreground whitespace-pre-wrap break-words">{diag.message}</dd>
                    </div>
                  )}
                </dl>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
});

export default CatechismPopover;
