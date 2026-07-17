/**
 * PassageActions — componente oficial de ações para qualquer trecho lido
 * dentro do Cathedra 2.0. Totalmente agnóstico: não conhece Bíblia,
 * Catecismo, Magistério, Busca ou Padres. O consumidor passa apenas o
 * conteúdo (texto + referência + `url` ou `passage`) e callbacks.
 *
 * Ações padrão:
 *  - Copiar trecho           (text)
 *  - Copiar referência       (reference)
 *  - Compartilhar            (Web Share API + fallback)
 *  - Destacar                (delegado via onHighlight — se ausente e
 *                             `passage` for informado, navega para o
 *                             Reader com ?highlight=…)
 *
 * PA-1 endurece: loading/erro por ação, aria-busy/aria-live, foco
 * visível e tap targets 44×44 em todos os breakpoints.
 */
import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Icons } from '@/constants';
import { cn } from '@/lib/utils';
import { useShare } from '@/hooks/useShare';
import { buildPassageUrl, type PassageDescriptor } from '@/lib/passageUrl';

type ActionKey = 'text' | 'reference' | 'share' | 'highlight';

export interface PassageActionsProps {
  /** Texto do trecho (o que será copiado como "trecho"). */
  text: string;
  /** Referência canônica curta (ex.: "Jo 6,53" ou "CIC §142"). */
  reference: string;
  /** URL absoluta compartilhável do trecho. Opcional se `passage` for informado. */
  url?: string;
  /** Descritor da passagem — usado por `buildPassageUrl` quando `url` não é fornecido. */
  passage?: PassageDescriptor;
  /** Título usado no share nativo (ex.: "Cathedra — Jo 6,53"). */
  title?: string;
  /** Se fornecido, sobrescreve a navegação padrão do botão Destacar. */
  onHighlight?: () => void | Promise<void>;
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
  passage,
  title,
  onHighlight,
  onCopy,
  onShare,
  size = 'sm',
  className,
}) => {
  const share = useShare();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<ActionKey | null>(null);
  const [error, setError] = useState<{ key: ActionKey; message: string } | null>(null);
  const [status, setStatus] = useState<string>('');

  // URL efetiva: prop direta ou derivada de `passage`.
  const effectiveUrl = url ?? (passage ? buildPassageUrl(passage) : '');

  // Destaque efetivo: callback custom OU navegação padrão para o Reader.
  const canHighlight = Boolean(onHighlight || passage);

  const run = useCallback(
    async (key: ActionKey, fn: () => Promise<void>, successMsg?: string) => {
      setLoading(key);
      setError(null);
      try {
        await fn();
        if (successMsg) setStatus(successMsg);
      } catch (err: any) {
        const message = err?.message ?? 'Ação falhou';
        setError({ key, message });
        setStatus(`Erro: ${message}`);
        toast.error(message);
      } finally {
        setLoading(null);
      }
    },
    [],
  );

  const handleCopyText = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      return run('text', async () => {
        const ok = await writeClipboard(
          effectiveUrl ? `"${text}"\n— ${reference}\n${effectiveUrl}` : `"${text}"\n— ${reference}`,
        );
        if (!ok) throw new Error('Não foi possível copiar');
        toast.success('Trecho copiado');
        onCopy?.('text');
      }, 'Trecho copiado');
    },
    [run, text, reference, effectiveUrl, onCopy],
  );

  const handleCopyReference = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      return run('reference', async () => {
        const ok = await writeClipboard(reference);
        if (!ok) throw new Error('Não foi possível copiar');
        toast.success('Referência copiada');
        onCopy?.('reference');
      }, 'Referência copiada');
    },
    [run, reference, onCopy],
  );

  const handleShare = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      return run('share', async () => {
        await share({
          title: title ?? reference,
          text: `"${text}" — ${reference}`,
          url: effectiveUrl || undefined,
        });
        onShare?.();
      }, 'Compartilhado');
    },
    [run, share, title, reference, text, effectiveUrl, onShare],
  );

  const handleHighlight = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      return run('highlight', async () => {
        if (onHighlight) {
          await onHighlight();
        } else if (passage) {
          const dest = buildPassageUrl({ ...passage, highlight: passage.highlight ?? reference });
          // Extrai apenas pathname+search para navegação SPA
          const rel = dest.startsWith('http')
            ? dest.replace(/^https?:\/\/[^/]+/, '')
            : dest;
          navigate(rel);
        }
      });
    },
    [run, onHighlight, passage, reference, navigate],
  );

  const btnBase = cn(
    'inline-flex items-center gap-1.5 rounded-full border border-border/50',
    'bg-background/60 hover:bg-primary/5 hover:border-primary/40',
    'text-muted-foreground hover:text-primary',
    'transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:opacity-60 disabled:cursor-not-allowed',
    'min-h-[44px] min-w-[44px]',
    size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs',
  );
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  const renderIcon = (key: ActionKey, Icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>) => {
    if (loading === key) {
      return <Icons.Loader className={cn(iconSize, 'animate-spin')} aria-hidden={true} />;
    }
    return <Icon className={iconSize} aria-hidden={true} />;
  };

  return (
    <div
      className={cn('flex flex-wrap items-center gap-1.5', className)}
      role="group"
      aria-label={`Ações para ${reference}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Live region para leitores de tela: sucesso/erro por ação. */}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {status}
      </span>

      <button
        type="button"
        onClick={handleCopyText}
        className={btnBase}
        aria-label={`Copiar trecho de ${reference}`}
        aria-busy={loading === 'text' || undefined}
        disabled={loading !== null}
      >
        {renderIcon('text', Icons.Quote)}
        <span>Copiar trecho</span>
      </button>

      <button
        type="button"
        onClick={handleCopyReference}
        className={btnBase}
        aria-label={`Copiar referência ${reference}`}
        aria-busy={loading === 'reference' || undefined}
        disabled={loading !== null}
      >
        {renderIcon('reference', Icons.Link)}
        <span>Copiar referência</span>
      </button>

      <button
        type="button"
        onClick={handleShare}
        className={btnBase}
        aria-label={`Compartilhar ${reference}`}
        aria-busy={loading === 'share' || undefined}
        disabled={loading !== null}
      >
        {renderIcon('share', Icons.Share)}
        <span>Compartilhar</span>
      </button>

      {canHighlight && (
        <button
          type="button"
          onClick={handleHighlight}
          className={btnBase}
          aria-label={`Destacar ${reference} no leitor`}
          aria-busy={loading === 'highlight' || undefined}
          disabled={loading !== null}
        >
          {renderIcon('highlight', Icons.Highlighter)}
          <span>Destacar</span>
        </button>
      )}

      {error && (
        <span role="alert" className="sr-only">
          Erro em {error.key}: {error.message}
        </span>
      )}
    </div>
  );
};

PassageActions.displayName = 'PassageActions';

export default PassageActions;
