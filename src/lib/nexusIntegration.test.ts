import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchNexusTagContent, formatNexusContent } from './nexusContent';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn()
  }
}));

describe('Nexus Integration - Error and Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return an empty array when no content is found', async () => {
    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({
        overlaps: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }))
    });

    const tag = { label: 'Inexistente', slug: 'inexistente' };
    const results = await fetchNexusTagContent(tag);
    expect(results).toEqual([]);
  });

  it('should throw an error when Supabase returns an error', async () => {
    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({
        overlaps: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Database Timeout' } }))
        }))
      }))
    });

    const tag = { label: 'Erro', slug: 'erro' };
    await expect(fetchNexusTagContent(tag)).rejects.toThrow('Database Timeout');
  });

  it('should handle malformed data by providing robust fallbacks via formatNexusContent', () => {
    const malformedData = { id: 'bad-1', type: 'bible', content_text: null, title: null, reference_id: null };
    const formatted = formatNexusContent(malformedData, 'bible');
    
    expect(formatted.id).toBe('bad-1');
    expect(formatted.content_text).toBe('');
    expect(formatted.title).toBe('Escritura'); // Fallback for bible type
  });

  it('should handle missing type by providing default fallback', () => {
    const data = { id: 'unknown-1', type: 'unknown' };
    const formatted = formatNexusContent(data, 'unknown');
    expect(formatted.title).toBe('Tradição'); // Default fallback
  });
});
