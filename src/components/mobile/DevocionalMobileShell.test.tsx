/**
 * DevocionalMobileShell.test — Etapa M9 (Testes).
 *
 * Verifica que as 6 rotas devocionais renderizadas pelo shell mobile
 * expõem MobileTopBar (via aria-label="Voltar") e MobileBottomNav
 * (via role="navigation").
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DevocionalMobileShell } from "@/components/mobile/DevocionalMobileShell";

// Mock de useAuth para evitar dependência de Supabase no teste.
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, profile: null, loading: false }),
}));

// Mock do supabase client (bible_favorites query no shell).
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    }),
  },
}));

const M9_ROUTES = [
  { path: "/rosary", title: "Rosário", kicker: "Cathedra · Rosário" },
  { path: "/viacrucis", title: "Via Crucis", kicker: "Cathedra · Via Crucis" },
  { path: "/missal", title: "Missal", kicker: "Cathedra · Missal" },
  { path: "/breviary", title: "Breviário", kicker: "Cathedra · Liturgia das Horas" },
  { path: "/litanies", title: "Ladainhas", kicker: "Cathedra · Ladainhas" },
  { path: "/oracao", title: "Oração", kicker: "Cathedra · Orações" },
];

describe("DevocionalMobileShell (M9)", () => {
  it.each(M9_ROUTES)(
    "renderiza MobileTopBar e MobileBottomNav em $path",
    ({ path, title, kicker }) => {
      render(
        <MemoryRouter initialEntries={[path]}>
          <DevocionalMobileShell title={title} kicker={kicker}>
            <div>conteúdo</div>
          </DevocionalMobileShell>
        </MemoryRouter>,
      );

      // TopBar
      expect(screen.getByRole("button", { name: /voltar/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
      expect(screen.getByText(kicker)).toBeInTheDocument();

      // BottomNav (identificado pela navegação principal)
      const nav = screen.getByRole("navigation");
      expect(nav).toBeInTheDocument();
      expect(nav.textContent).toContain("Átrio");
      expect(nav.textContent).toContain("Oração");
    },
  );
});
