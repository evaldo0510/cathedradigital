/**
 * Unit tests for useFuzzySearch.
 *
 * We mock `@/integrations/supabase/client` so the hook talks to a
 * controllable fake RPC. The fake records every call and lets each
 * test resolve the promise on demand to assert pending/loading state
 * transitions during the debounce window.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFuzzySearch } from './useFuzzySearch';

// ── Mock supabase client ─────────────────────────────────────────────
const rpcMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}));

interface SaintRow {
  id: string;
  name: string;
  title?: string;
}

beforeEach(() => {
  rpcMock.mockReset();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useFuzzySearch', () => {
  it('does not call the RPC when query is shorter than minLength', () => {
    const { result, rerender } = renderHook(
      ({ query }) =>
        useFuzzySearch<SaintRow>({
          rpc: 'search_saints_fuzzy',
          query,
          primaryField: 'name',
          minLength: 2,
        }),
      { initialProps: { query: '' } },
    );

    // Initial empty query → no RPC, no results
    expect(rpcMock).not.toHaveBeenCalled();
    expect(result.current.results).toBeNull();

    // Single-char query is still below minLength even after debounce flushes
    rerender({ query: 't' });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(rpcMock).not.toHaveBeenCalled();
    expect(result.current.results).toBeNull();
  });

  it('debounces and only fires one RPC call for rapid keystrokes', async () => {
    rpcMock.mockResolvedValue({ data: [{ id: '1', name: 'Tomás' }], error: null });

    const { rerender } = renderHook(
      ({ query }) =>
        useFuzzySearch<SaintRow>({
          rpc: 'search_saints_fuzzy',
          query,
          primaryField: 'name',
          debounceMs: 300,
        }),
      { initialProps: { query: '' } },
    );

    // Type "tom" character by character, faster than the debounce window
    rerender({ query: 't' });
    act(() => { vi.advanceTimersByTime(100); });
    rerender({ query: 'to' });
    act(() => { vi.advanceTimersByTime(100); });
    rerender({ query: 'tom' });

    // Before the debounce flushes, no RPC has been issued
    expect(rpcMock).not.toHaveBeenCalled();

    // Flush the debounce timer
    act(() => { vi.advanceTimersByTime(300); });

    // Wait for the async effect to run
    await vi.waitFor(() => {
      expect(rpcMock).toHaveBeenCalledTimes(1);
    });

    expect(rpcMock).toHaveBeenCalledWith('search_saints_fuzzy', {
      search_query: 'tom',
      result_limit: 50,
    });
  });

  it('flips isPending to true while the debounce timer is running', async () => {
    rpcMock.mockResolvedValue({ data: [], error: null });

    const { result, rerender } = renderHook(
      ({ query }) =>
        useFuzzySearch<SaintRow>({
          rpc: 'search_saints_fuzzy',
          query,
          primaryField: 'name',
          debounceMs: 300,
        }),
      { initialProps: { query: '' } },
    );

    expect(result.current.isPending).toBe(false);

    // Typing a meaningful query → query !== debouncedQuery → isPending = true
    rerender({ query: 'tomas' });
    expect(result.current.isPending).toBe(true);

    // After the debounce flushes and the RPC resolves, isPending goes back to false
    act(() => { vi.advanceTimersByTime(300); });
    await vi.waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });

  it('decorates each row with a similarityScore based on primary + secondary fields', async () => {
    rpcMock.mockResolvedValue({
      data: [
        { id: '1', name: 'São Tomás de Aquino', title: 'Doutor da Igreja' },
        { id: '2', name: 'Outro Santo', title: 'sem relação' },
      ],
      error: null,
    });

    const { result, rerender } = renderHook(
      ({ query }) =>
        useFuzzySearch<SaintRow>({
          rpc: 'search_saints_fuzzy',
          query,
          primaryField: 'name',
          secondaryField: 'title',
          debounceMs: 300,
        }),
      { initialProps: { query: '' } },
    );

    rerender({ query: 'tomas' });
    act(() => { vi.advanceTimersByTime(300); });

    await vi.waitFor(() => {
      expect(result.current.results).not.toBeNull();
      expect(result.current.results).toHaveLength(2);
    });

    const [first, second] = result.current.results!;
    // Both should have a numeric score …
    expect(typeof first.similarityScore).toBe('number');
    expect(typeof second.similarityScore).toBe('number');
    // … and the matching saint must outrank the unrelated one.
    expect(first.similarityScore!).toBeGreaterThan(second.similarityScore!);
    expect(first.similarityScore!).toBeGreaterThan(0.5);
  });

  it('exposes the RPC error and clears results when the call fails', async () => {
    const failure = new Error('boom');
    rpcMock.mockResolvedValue({ data: null, error: failure });

    const { result, rerender } = renderHook(
      ({ query }) =>
        useFuzzySearch<SaintRow>({
          rpc: 'search_saints_fuzzy',
          query,
          primaryField: 'name',
          debounceMs: 300,
        }),
      { initialProps: { query: '' } },
    );

    rerender({ query: 'tomas' });
    act(() => { vi.advanceTimersByTime(300); });

    await vi.waitFor(() => {
      expect(result.current.error).toBe(failure);
    });
    expect(result.current.results).toBeNull();
    expect(result.current.isSearching).toBe(false);
  });
});
