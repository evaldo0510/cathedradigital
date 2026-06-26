/**
 * Testes do hook `useBibleReadGate` e seu wrapper RPC.
 *
 * Mock direto do client supabase para cobrir os cenários:
 *   - cobertura OK → não bloqueia
 *   - findings bloqueantes → bloqueia + reason
 *   - diagnose com erro → bloqueia + status='error'
 *   - sem run registrada → não bloqueia (status='unknown')
 *   - falha na RPC → propaga erro
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: vi.fn() },
}));

import { useBibleReadGate } from "@/hooks/useBibleReadGate";
import { supabase } from "@/integrations/supabase/client";

const rpc = supabase.rpc as unknown as ReturnType<typeof vi.fn>;

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

describe("useBibleReadGate", () => {
  beforeEach(() => { rpc.mockReset(); });

  it("libera leitura quando cobertura está OK", async () => {
    rpc.mockResolvedValue({
      data: [{ blocked: false, status: "ok", last_run_at: "2026-06-26T00:00:00Z", run_id: "r1", blocking_findings: 0, reason: "Cobertura validada." }],
      error: null,
    });
    const { result } = renderHook(() => useBibleReadGate(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.gate?.blocked).toBe(false);
    expect(result.current.gate?.status).toBe("ok");
    expect(rpc).toHaveBeenCalledWith("bible_read_gate_status");
  });

  it("bloqueia quando há achados bloqueantes (missing_chapter)", async () => {
    rpc.mockResolvedValue({
      data: [{ blocked: true, status: "warning", last_run_at: "2026-06-26T00:00:00Z", run_id: "r2", blocking_findings: 3, reason: "3 achados bloqueantes" }],
      error: null,
    });
    const { result } = renderHook(() => useBibleReadGate(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.gate?.blocked).toBe(true));
    expect(result.current.gate?.blocking_findings).toBe(3);
    expect(result.current.gate?.reason).toMatch(/bloqueantes/);
  });

  it("bloqueia quando a diagnose falhou (status='error')", async () => {
    rpc.mockResolvedValue({
      data: [{ blocked: true, status: "error", last_run_at: null, run_id: "r3", blocking_findings: 0, reason: "Diagnose falhou: timeout" }],
      error: null,
    });
    const { result } = renderHook(() => useBibleReadGate(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.gate?.blocked).toBe(true));
    expect(result.current.gate?.status).toBe("error");
  });

  it("retorna status 'unknown' quando não há nenhuma run", async () => {
    rpc.mockResolvedValue({
      data: [{ blocked: false, status: "unknown", last_run_at: null, run_id: null, blocking_findings: 0, reason: "Nenhuma diagnose registrada — leitura liberada." }],
      error: null,
    });
    const { result } = renderHook(() => useBibleReadGate(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.gate?.blocked).toBe(false);
    expect(result.current.gate?.status).toBe("unknown");
  });

  it("propaga erros da RPC", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "rpc failed" } });
    const { result } = renderHook(() => useBibleReadGate(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect((result.current.error as Error).message).toBe("rpc failed");
  });

  it("aceita data como objeto único (não-array)", async () => {
    rpc.mockResolvedValue({
      data: { blocked: false, status: "ok", last_run_at: null, run_id: "x", blocking_findings: 0, reason: "ok" },
      error: null,
    });
    const { result } = renderHook(() => useBibleReadGate(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.gate?.blocked).toBe(false);
  });
});
