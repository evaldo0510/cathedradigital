import { ArrowLeft, Search } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface MobileTopBarProps {
  /** Título curto exibido no centro. Se ausente, usa apenas kicker. */
  title?: string;
  /** Etiqueta em versalete acima do título (ex.: "Cathedra · Bíblia"). */
  kicker?: string;
  /** Mostra botão de voltar. Se `onBack` não for passado, usa navigate(-1). */
  showBack?: boolean;
  onBack?: () => void;
  /** Ações à direita (ícones). */
  actions?: ReactNode;
  /** Deixa o fundo transparente com blur (útil sobre Hero). */
  transparent?: boolean;
  className?: string;
}

/**
 * MobileTopBar — barra superior fixa para telas mobile do Cathedra 3.0.
 * Consome tokens `stitch-*` e respeita safe-area do notch.
 */
export function MobileTopBar({
  title,
  kicker,
  showBack = false,
  onBack,
  actions,
  transparent = false,
  className,
}: MobileTopBarProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full md:hidden",
        "flex items-center gap-3 px-[var(--stitch-margin-mobile)]",
        "border-b transition-colors",
        transparent
          ? "bg-stitch-surface/70 border-transparent backdrop-blur-md"
          : "bg-stitch-surface border-stitch-outline-variant",
        className,
      )}
      style={{
        height: `calc(var(--stitch-mobile-topbar-h) + var(--stitch-mobile-safe-top))`,
        paddingTop: "var(--stitch-mobile-safe-top)",
      }}
    >
      <Link to="/" className="shrink-0">
        <img src="/monograma-cathedra.svg" alt="Cathedra" className="h-8 w-8" />
      </Link>

      <div className="min-w-0 flex-1">
        {title && (
          <p
            className={cn(
              "font-[var(--font-stitch-display)] text-[18px] leading-tight",
              "text-stitch-on-surface truncate",
            )}
          >
            {title}
          </p>
        )}
      </div>

      <Link
        to="/buscar"
        aria-label="Busca"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-stitch-on-surface hover:bg-stitch-surface-container"
      >
        <Search className="h-5 w-5" />
      </Link>

      {actions && (
        <div className="flex shrink-0 items-center gap-1">{actions}</div>
      )}
    </header>
  );
}
