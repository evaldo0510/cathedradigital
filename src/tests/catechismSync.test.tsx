import { describe, it, expect, vi } from 'vitest';
import { useCatechismSync } from '@/hooks/useCatechismSync';
import { supabase } from '@/integrations/supabase/client';
import { renderHook, act } from '@testing-library/react';

// Mock the dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn(),
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' }
  }),
}));

describe('useCatechismSync - Concurrency and Uniqueness', () => {
  it('should use upsert with proper onConflict and ignoreDuplicates false', async () => {
    const mockData = { user_id: 'test-user-id', paragraph: 1, read_at: new Date().toISOString() };
    const singleMock = vi.fn().mockResolvedValue({ data: mockData, error: null });
    (supabase.from('catechism_paragraphs_read').single as any) = singleMock;

    const { result } = renderHook(() => useCatechismSync());
    
    await act(async () => {
      await result.current.syncProgress(1);
    });

    expect(supabase.from).toHaveBeenCalledWith('catechism_paragraphs_read');
    expect(supabase.upsert).toHaveBeenCalledWith(
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
    const singleMock = vi.fn().mockResolvedValue({ data: mockData, error: null });
    (supabase.from('catechism_paragraphs_read').single as any) = singleMock;

    const { result } = renderHook(() => useCatechismSync());
    
    // Simulate multiple simultaneous calls
    const calls = [
      result.current.syncProgress(42),
      result.current.syncProgress(42),
      result.current.syncProgress(42)
    ];

    const results = await Promise.all(calls);
    
    expect(results.every(r => r.success)).toBe(true);
    // Even if called multiple times, the underlying DB upsert handles the uniqueness
    expect(supabase.upsert).toHaveBeenCalledTimes(3); 
  });
});
