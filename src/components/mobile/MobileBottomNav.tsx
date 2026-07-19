import { NavLink, useLocation } from "react-router-dom";
import { Home, BookOpen, Sparkles, GraduationCap, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface MobileNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Rotas adicionais que também ativam este item. */
  matches?: RegExp;
}

const DEFAULT_ITEMS: MobileNavItem[] = [
  { to: "/", label: "Átrio", icon: Home, matches: /^\/$/ },
  { to: "/biblioteca", label: "Biblioteca", icon: BookOpen, matches: /^\/(biblioteca|bible|catechism|magisterium|santos|saints-legacy)/ },
  { to: "/buscar", label: "Buscar", icon: Search, matches: /^\/buscar/ },
  { to: "/nexus", label: "Nexus", icon: Sparkles, matches: /^\/nexus/ },
  { to: "/formacao", label: "Formação", icon: GraduationCap, matches: /^\/(formacao|jornadas)/ },
];

interface MobileBottomNavProps {
  items?: MobileNavItem[];
  /** Esconde a barra (ex.: em Readers com modo foco). */
  hidden?: boolean;
  className?: string;
}

/**
 * MobileBottomNav — navegação inferior fixa com 5 áreas do Cathedra.
 * Aparece apenas em viewports `< md` e respeita safe-area do iOS.
 */
export function MobileBottomNav({
  items = DEFAULT_ITEMS,
  hidden = false,
  className,
}: MobileBottomNavProps) {
  const { pathname } = useLocation();

  if (hidden) return null;

  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 md:hidden",
        "flex items-stretch justify-around",
        "border-t border-stitch-outline-variant/60",
        "bg-stitch-surface/95 backdrop-blur-md",
        className,
      )}
      style={{
        paddingBottom: "var(--stitch-mobile-safe-bottom)",
        minHeight: `calc(var(--stitch-mobile-bottomnav-h) + var(--stitch-mobile-safe-bottom))`,
      }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.matches
          ? item.matches.test(pathname)
          : pathname === item.to;

        return (
          <NavLink
            key={item.to}
            to={item.to}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group flex flex-1 flex-col items-center justify-center gap-1",
              "px-2 py-2 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-inset focus-visible:ring-stitch-secondary",
            )}
            style={{ minHeight: "var(--stitch-mobile-touch-min)" }}
          >
            <span
              className={cn(
                "inline-flex items-center justify-center rounded-full px-3 py-1 transition-colors",
                isActive
                  ? "bg-stitch-secondary-container text-stitch-on-secondary-container"
                  : "text-stitch-on-surface-variant group-hover:text-stitch-primary",
              )}
            >
              <Icon
                className="h-5 w-5"
                strokeWidth={isActive ? 2.25 : 1.75}
                aria-hidden="true"
              />
            </span>
            <span
              className={cn(
                "font-[var(--font-stitch-label)] text-[11px] font-bold uppercase tracking-[0.08em]",
                isActive
                  ? "text-stitch-primary"
                  : "text-stitch-on-surface-variant",
              )}
            >
              {item.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export type { MobileNavItem };
