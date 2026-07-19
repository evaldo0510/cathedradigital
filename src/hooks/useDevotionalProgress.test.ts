/**
 * useDevotionalProgress.test — Etapa M9 (Persistência).
 *
 * Garante que o progresso do leitor devocional persiste entre sessões
 * (unmount/remount) via localStorage para /rosary, /viacrucis e /breviary
 * quando o usuário está desautenticado (fallback mobile).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useDevotionalProgress } from "@/hooks/useDevotionalProgress";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, profile: null, loading: false }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: null, error: null }),
              }),
            }),
          }),
        }),
      }),
      upsert: () => Promise.resolve({ data: null, error: null }),
    }),
  },
}));

describe("useDevotionalProgress — persistência mobile entre sessões", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it.each(["rosary", "viacrucis", "breviary"])(
    "salva e restaura progresso em nova montagem para /%s",
    async (key) => {
      const first = renderHook(() => useDevotionalProgress(key));
      await waitFor(() => expect(first.result.current.loaded).toBe(true));

      await act(async () => {
        await first.result.current.save({
          section: "sec-A",
          step: 4,
          label: "Etapa 4",
        });
      });

      // Confirma que o valor foi gravado no localStorage.
      const raw = localStorage.getItem(`cathedra:devotional-progress:${key}`);
      expect(raw).toBeTruthy();
      expect(JSON.parse(raw!).step).toBe(4);

      first.unmount(); // simula fechar app / trocar de sessão

      const second = renderHook(() => useDevotionalProgress(key));
      await waitFor(() => expect(second.result.current.loaded).toBe(true));
      expect(second.result.current.progress.step).toBe(4);
      expect(second.result.current.progress.section).toBe("sec-A");
      expect(second.result.current.progress.label).toBe("Etapa 4");
    },
  );

  it("mantém progressos independentes por rota", async () => {
    const a = renderHook(() => useDevotionalProgress("rosary"));
    await waitFor(() => expect(a.result.current.loaded).toBe(true));
    await act(async () => {
      await a.result.current.save({ section: "joyful", step: 2, label: "Gozosos" });
    });

    const b = renderHook(() => useDevotionalProgress("viacrucis"));
    await waitFor(() => expect(b.result.current.loaded).toBe(true));
    await act(async () => {
      await b.result.current.save({ section: "stations", step: 7, label: "Estação 7" });
    });

    a.unmount();
    b.unmount();

    const a2 = renderHook(() => useDevotionalProgress("rosary"));
    const b2 = renderHook(() => useDevotionalProgress("viacrucis"));
    await waitFor(() => expect(a2.result.current.loaded).toBe(true));
    await waitFor(() => expect(b2.result.current.loaded).toBe(true));
    expect(a2.result.current.progress.step).toBe(2);
    expect(b2.result.current.progress.step).toBe(7);
    expect(a2.result.current.progress.label).toBe("Gozosos");
    expect(b2.result.current.progress.label).toBe("Estação 7");
  });
});
