/**
 * ReaderToolbar — barra editorial canônica do Reader Template Master.
 *
 * Sticky strip com:
 *  - Kicker + breadcrumb + título/subtítulo
 *  - Ações: fonte, modo foco (immersive), compartilhar
 *
 * Substitui o legado `@/components/editorial/EditorialReaderChrome`
 * (C0.5.a). Convive com `ReaderShell` (barra sticky) sem duplicar layout:
 * NÃO renderiza corpo de leitura, apenas o chrome utilitário.
 *
 * Regra COS §10 — Reader Architecture Rule:
 *   Único toolbar de leitura permitido no Reader Template Master.
 */

import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Type, Focus, Share2 } from 'lucide-react';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';
import { cn } from '@/lib/utils';

type FontSize = 'small' | 'medium' | 'large' | 'extra-large';
const FONT_ORDER: FontSize[] = ['small', 'medium', 'large', 'extra-large'];

export interface ReaderToolbarProps {
  kicker?: string;
  title: string;
  subtitle?: string;
  backHref?: string;
  shareUrl?: string;
  className?: string;
}

export const ReaderToolbar: React.FC<ReaderToolbarProps> = ({
  kicker = 'Cathedra · Lectio',
  title,
  subtitle,
  backHref,
  shareUrl,
  className,
}) => {
  const { settings, updateSettings } = useReadingSettings();

  const cycleFont = useCallback(() => {
    const idx = FONT_ORDER.indexOf(settings.fontSize);
    const next = FONT_ORDER[(idx + 1) % FONT_ORDER.length];
    updateSettings({ fontSize: next });
  }, [settings.fontSize, updateSettings]);

  const toggleFocus = useCallback(() => {
    updateSettings({ immersiveMode: !settings.immersiveMode });
  }, [settings.immersiveMode, updateSettings]);

  const share = useCallback(async () => {
    const url = shareUrl ?? (typeof window !== 'undefined' ? window.location.href : '');
    if (!url) return;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* silent */
    }
  }, [shareUrl, title]);

  return (
    <div
      className={cn(
        'sticky top-0 z-40 border-b border-stitch-outline-variant/25',
        'bg-stitch-background/85 backdrop-blur supports-[backdrop-filter]:bg-stitch-background/70',
        className,
      )}
      role="region"
      aria-label="Barra editorial do leitor"
      data-reader-toolbar
    >
      <div className="mx-auto flex w-full max-w-[1120px] items-center gap-3 px-4 py-2 md:px-8">
        {backHref && (
          <Link
            to={backHref}
            className="hidden shrink-0 items-center gap-1.5 border-r border-stitch-outline-variant/30 pr-3 font-stitch-body text-[11px] font-bold uppercase tracking-[0.18em] text-stitch-on-surface-variant transition-colors hover:text-stitch-secondary md:inline-flex"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar
          </Link>
        )}

        <div className="min-w-0 flex-1">
          <span className="block truncate font-stitch-body text-[10px] font-bold uppercase tracking-[0.32em] text-stitch-secondary">
            {kicker}
          </span>
          <div className="mt-0.5 flex min-w-0 items-baseline gap-2">
            <h2 className="truncate font-stitch-display text-[15px] italic leading-tight text-stitch-primary md:text-[17px]">
              {title}
            </h2>
            {subtitle && (
              <span className="hidden truncate font-stitch-body text-[12px] italic text-stitch-on-surface-variant md:inline">
                · {subtitle}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <ToolbarButton
            label={`Tamanho da fonte (${settings.fontSize})`}
            onClick={cycleFont}
            icon={<Type className="h-4 w-4" />}
          />
          <ToolbarButton
            label={settings.immersiveMode ? 'Sair do modo foco' : 'Modo foco'}
            onClick={toggleFocus}
            active={settings.immersiveMode}
            icon={<Focus className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Compartilhar"
            onClick={share}
            icon={<Share2 className="h-4 w-4" />}
          />
        </div>
      </div>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-stitch-secondary/40 to-transparent" />
    </div>
  );
};

const ToolbarButton = React.forwardRef<
  HTMLButtonElement,
  {
    label: string;
    onClick: () => void;
    icon: React.ReactNode;
    active?: boolean;
  }
>(({ label, onClick, icon, active, ...rest }, ref) => (
  <button
    ref={ref}
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    aria-pressed={active}
    className={cn(
      'inline-flex h-11 w-11 items-center justify-center rounded-full border transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      active
        ? 'border-stitch-secondary/60 bg-stitch-secondary/10 text-stitch-secondary'
        : 'border-transparent text-stitch-on-surface-variant hover:border-stitch-outline-variant/40 hover:text-stitch-primary',
    )}
    {...rest}
  >
    {icon}
  </button>
));
ToolbarButton.displayName = 'ToolbarButton';

export default ReaderToolbar;
