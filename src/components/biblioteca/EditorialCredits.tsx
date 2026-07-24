/**
 * EditorialCredits — Bloco reutilizável de créditos editoriais das obras
 * da Biblioteca Patrística (política de licença + domínio público).
 *
 * Usado em:
 *  - SaintWorkOverviewPage (rodapé da obra)
 *  - SaintWorkReaderPage (rodapé de cada capítulo)
 *
 * Regras editoriais (COS §11):
 *  - Textos em Domínio Público exibem selo "DP" + licença de tradução (quando aplicável).
 *  - Traduções modernas exibem crédito explícito + licença + fonte.
 *  - Nunca ocultar a fonte quando declarada.
 */
import React from 'react';
import { Icons } from '@/constants';

export interface EditorialCreditsProps {
  isPublicDomain: boolean;
  license: string | null;
  translationCredit: string | null;
  sourceUrl: string | null;
  /** Renderização compacta (usado no rodapé do capítulo). */
  compact?: boolean;
  className?: string;
}

export const EditorialCredits: React.FC<EditorialCreditsProps> = ({
  isPublicDomain,
  license,
  translationCredit,
  sourceUrl,
  compact = false,
  className,
}) => {
  const hasAny = isPublicDomain || license || translationCredit || sourceUrl;
  if (!hasAny) return null;

  let hostname: string | null = null;
  if (sourceUrl) {
    try {
      hostname = new URL(sourceUrl).hostname.replace(/^www\./, '');
    } catch {
      hostname = sourceUrl;
    }
  }

  return (
    <aside
      className={
        'text-premium-xs text-muted-foreground leading-relaxed ' +
        (compact
          ? 'flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/40 pt-3 mt-6 '
          : 'space-y-1.5 pt-4 mt-6 border-t border-border/50 ') +
        (className ?? '')
      }
      aria-label="Créditos editoriais"
    >
      <div className="flex flex-wrap items-center gap-2">
        {isPublicDomain && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold text-[10px] uppercase tracking-wide"
            title="Texto em Domínio Público"
          >
            <Icons.BookOpen className="w-3 h-3" aria-hidden />
            Domínio Público
          </span>
        )}
        {license && (
          <span className="inline-flex items-center gap-1">
            <span className="uppercase tracking-wide text-[10px] font-semibold">Licença:</span>
            <span>{license}</span>
          </span>
        )}
      </div>

      {translationCredit && (
        <p className={compact ? 'w-full' : ''}>
          <span className="uppercase tracking-wide text-[10px] font-semibold mr-1">Tradução:</span>
          {translationCredit}
        </p>
      )}

      {sourceUrl && hostname && (
        <p className={compact ? 'w-full' : ''}>
          <span className="uppercase tracking-wide text-[10px] font-semibold mr-1">Fonte:</span>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-dotted hover:text-primary"
          >
            {hostname}
          </a>
        </p>
      )}
    </aside>
  );
};

export default EditorialCredits;
