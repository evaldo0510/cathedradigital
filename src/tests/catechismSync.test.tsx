import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCatechismSync } from '@/hooks/useCatechismSync';
import { renderHook, act } from '@testing-library/react';

// Use a simpler mock approach
const mockUpsert = vi.fn().mockReturnThis();
const mockSelect = vi.fn().mockReturnThis();
const mockSingle = vi.fn();
const mockFrom = vi.fn().mockReturnValue({
  upsert: mockUpsert,
  select: mockSelect,
  single: mockSingle,
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' }
  }),
}));

describe('useCatechismSync - Concurrency and Uniqueness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use upsert with proper onConflict and ignoreDuplicates false', async () => {
    const mockData = { user_id: 'test-user-id', paragraph: 1, read_at: new Date().toISOString() };
    mockSingle.mockResolvedValue({ data: mockData, error: null });

    const { result } = renderHook(() => useCatechismSync());
    
    await act(async () => {
      await result.current.syncProgress(1);
    });

    expect(mockFrom).toHaveBeenCalledWith('catechism_paragraphs_read');
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'test-user-id',
        paragraph: 1,
      }),
      expect.objectContaining({
        onConflict: 'user_id,paragraph',
        ignoreDuplicates: false,
      })
    );
  });

  it('should handle simultaneous sync requests for the same paragraph (concurrency)', async () => {
    const mockData = { user_id: 'test-user-id', paragraph: 42, read_at: new Date().toISOString() };
    mockSingle.mockResolvedValue({ data: mockData, error: null });

    const { result } = renderHook(() => useCatechismSync());
    
    // Simulate multiple simultaneous calls within act to handle state updates
    let results: any[] = [];
    await act(async () => {
      results = await Promise.all([
        result.current.syncProgress(42),
        result.current.syncProgress(42),
        result.current.syncProgress(42)
      ]);
    });
    
    expect(results.every(r => r.success)).toBe(true);
    // 3 calls should result in 3 upsert calls
    expect(mockUpsert).toHaveBeenCalledTimes(3);
  });
});
