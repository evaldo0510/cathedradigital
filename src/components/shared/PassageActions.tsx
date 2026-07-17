/**
 * PassageActions — componente oficial de ações para qualquer trecho lido
 * dentro do Cathedra 2.0. Totalmente agnóstico: não conhece Bíblia,
 * Catecismo, Magistério, Busca ou Padres. O consumidor passa apenas o
 * conteúdo e (opcionalmente) callbacks para observar as ações.
 *
 * Ações padrão:
 *  - Copiar trecho           (text)
 *  - Copiar referência       (reference)
 *  - Compartilhar            (Web Share API + fallback)
 *  - Destacar                (delegado via onHighlight — nunca faz destaque local)
 *
 * Regra: se `onHighlight` não for passado, o botão Destacar não é renderizado.
 * Isso força cada superfície a decidir explicitamente como o destaque acontece
 * (no Cathedra 2.0, a Busca navega para o Reader; o Reader persiste no banco).
 */
import React, { useCallback } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/constants';
import { cn } from '@/lib/utils';
import { useShare } from '@/hooks/useShare';

export interface PassageActionsProps {
  /** Texto do trecho (o que será copiado como "trecho"). */
  text: string;
  /** Referência canônica curta (ex.: "Jo 6,53" ou "CIC §142"). */
  reference: string;
  /** URL absoluta compartilhável do trecho. */
  url: string;
  /** Título usado no share nativo (ex.: "Cathedra — Jo 6,53"). */
  title?: string;
  /** Se fornecido, renderiza o botão Destacar e delega a ação. */
  onHighlight?: () => void;
  /** Observabilidade opcional após ação bem-sucedida. */
  onCopy?: (kind: 'text' | 'reference') => void;
  onShare?: () => void;
  /** Tamanho visual dos botões. */
  size?: 'sm' | 'md';
  /** Classes extras aplicadas ao wrapper. */
  className?: string;
}

async function writeClipboard(value: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    /* fallthrough */
  }
  return false;
}

const PassageActions: React.FC<PassageActionsProps> = ({
  text,
  reference,
  url,
  title,
  onHighlight,
  onCopy,
  onShare,
  size = 'sm',
  className,
}) => {
  const share = useShare();

  const handleCopyText = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await writeClipboard(`"${text}"\n— ${reference}\n${url}`);
    if (ok) {
      toast.success('Trecho copiado');
      onCopy?.('text');
    } else {
      toast.error('Não foi possível copiar');
    }
  }, [text, reference, url, onCopy]);

  const handleCopyReference = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await writeClipboard(reference);
    if (ok) {
      toast.success('Referência copiada');
      onCopy?.('reference');
    } else {
      toast.error('Não foi possível copiar');
    }
  }, [reference, onCopy]);

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    await share({ title: title ?? reference, text: `"${text}" — ${reference}`, url });
    onShare?.();
  }, [share, title, reference, text, url, onShare]);

  const handleHighlight = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onHighlight?.();
  }, [onHighlight]);

  const btnBase = cn(
    'inline-flex items-center gap-1.5 rounded-full border border-border/50',
    'bg-background/60 hover:bg-primary/5 hover:border-primary/40',
    'text-muted-foreground hover:text-primary',
    'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
    size === 'sm'
      ? 'px-2.5 py-1 text-[11px] min-h-[44px]'
      : 'px-3 py-1.5 text-xs min-h-[44px]'
  );
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div
      className={cn('flex flex-wrap items-center gap-1.5', className)}
      role="group"
      aria-label={`Ações para ${reference}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={handleCopyText}
        className={btnBase}
        aria-label={`Copiar trecho de ${reference}`}
      >
        <Icons.Quote className={iconSize} aria-hidden="true" />
        <span>Copiar trecho</span>
      </button>
      <button
        type="button"
        onClick={handleCopyReference}
        className={btnBase}
        aria-label={`Copiar referência ${reference}`}
      >
        <Icons.Link className={iconSize} aria-hidden="true" />
        <span>Copiar referência</span>
      </button>
      <button
        type="button"
        onClick={handleShare}
        className={btnBase}
        aria-label={`Compartilhar ${reference}`}
      >
        <Icons.Share className={iconSize} aria-hidden="true" />
        <span>Compartilhar</span>
      </button>
      {onHighlight && (
        <button
          type="button"
          onClick={handleHighlight}
          className={btnBase}
          aria-label={`Destacar ${reference} no leitor`}
        >
          <Icons.Highlighter className={iconSize} aria-hidden="true" />
          <span>Destacar</span>
        </button>
      )}
    </div>
  );
};

PassageActions.displayName = 'PassageActions';

export default PassageActions;
