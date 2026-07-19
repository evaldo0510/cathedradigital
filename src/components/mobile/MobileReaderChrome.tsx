import type { ReactNode } from "react";
import { ArrowLeft, Type, Focus, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface MobileReaderChromeProps {
  kicker?: string;
  title: string;
  /** Ex.: "Cap. 6 · §14" — meta compacta. */
  meta?: string;
  onBack?: () => void;
  onToggleFocus?: () => void;
  onOpenTypography?: () => void;
  onShare?: () => void;
  /** Ações extras à direita (opcional). */
  extraActions?: ReactNode;
  isFocusMode?: boolean;
  className?: string;
}

/**
 * MobileReaderChrome — barra superior compacta para Readers em mobile.
 * Variante do EditorialReaderChrome desktop; hierarquia kicker + título + meta,
 * com ações de tipografia, foco e compartilhamento.
 */
export function MobileReaderChrome({
  kicker,
  title,
  meta,
  onBack,
  onToggleFocus,
  onOpenTypography,
  onShare,
  extraActions,
  isFocusMode = false,
  className,
}: MobileReaderChromeProps) {
  const navigate = useNavigate();
  const handleBack = () => (onBack ? onBack() : navigate(-1));

  return (
    <header
      className={cn(
        "sticky top-0 z-30 w-full md:hidden",
        "border-b border-stitch-outline-variant/70",
        "bg-stitch-surface/90 backdrop-blur-md",
        className,
      )}
      style={{ paddingTop: "var(--stitch-mobile-safe-top)" }}
    >
      <div
        className="flex items-center gap-2 px-[var(--stitch-margin-mobile)]"
        style={{ height: "var(--stitch-mobile-topbar-h)" }}
      >
        <ChromeIconButton onClick={handleBack} label="Voltar">
          <ArrowLeft className="h-5 w-5" />
        </ChromeIconButton>

        <div className="min-w-0 flex-1 text-center">
          {kicker && (
            <p
              className={cn(
                "font-[var(--font-stitch-label)] text-[10px] font-bold uppercase",
                "tracking-[0.1em] text-stitch-secondary truncate",
              )}
            >
              {kicker}
            </p>
          )}
          <p
            className={cn(
              "font-[var(--font-stitch-display)] text-[15px] leading-tight",
              "text-stitch-on-surface truncate",
            )}
          >
            {title}
          </p>
          {meta && (
            <p className="font-[var(--font-stitch-label)] text-[10px] text-stitch-on-surface-variant/80 truncate">
              {meta}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {onOpenTypography && (
            <ChromeIconButton onClick={onOpenTypography} label="Tipografia">
              <Type className="h-5 w-5" />
            </ChromeIconButton>
          )}
          {onToggleFocus && (
            <ChromeIconButton
              onClick={onToggleFocus}
              label={isFocusMode ? "Sair do modo foco" : "Modo foco"}
              active={isFocusMode}
            >
              <Focus className="h-5 w-5" />
            </ChromeIconButton>
          )}
          {onShare && (
            <ChromeIconButton onClick={onShare} label="Compartilhar">
              <Share2 className="h-5 w-5" />
            </ChromeIconButton>
          )}
          {extraActions}
        </div>
      </div>
    </header>
  );
}

interface ChromeIconButtonProps {
  onClick?: () => void;
  label: string;
  children: ReactNode;
  active?: boolean;
}

function ChromeIconButton({ onClick, label, children, active }: ChromeIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center justify-center rounded-full transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stitch-secondary",
        active
          ? "bg-stitch-secondary-container text-stitch-on-secondary-container"
          : "text-stitch-on-surface hover:bg-stitch-surface-container",
      )}
      style={{
        width: "var(--stitch-mobile-touch-min)",
        height: "var(--stitch-mobile-touch-min)",
      }}
    >
      {children}
    </button>
  );
}
