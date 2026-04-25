import { describe, it, expect, vi } from 'vitest';
import { fetchNexusTagContent } from './nexusContent';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        overlaps: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }))
    }))
  }
}));

describe('Nexus Integration - Empty Scenarios', () => {
  it('should return an empty array when no content is found', async () => {
    const tag = { label: 'Inexistente', slug: 'inexistente' };
    const results = await fetchNexusTagContent(tag);
    expect(results).toEqual([]);
    expect(results.length).toBe(0);
  });

  it('should handle partial errors gracefully', async () => {
    // Mocking one call to fail
    (supabase.from as any).mockImplementationOnce(() => ({
      select: () => ({
        overlaps: () => ({
          limit: () => Promise.resolve({ data: null, error: { message: 'DB Error' } })
        })
      })
    }));

    const tag = { label: 'Erro', slug: 'erro' };
    await expect(fetchNexusTagContent(tag)).rejects.toBeDefined();
  });
});
