import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchNexusTagContent } from '../lib/nexusContent';
import { supabase } from '../integrations/supabase/client';

// Mocking Supabase to simulate different scenarios
vi.mock('../src/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      overlaps: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      abortSignal: vi.fn().mockReturnThis(),
    })),
  },
}));

describe('Nexus Intelligence - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should expand search terms correctly with synonyms', async () => {
    const mockSynonyms = [{ term: 'paraclito' }, { term: 'espírito de verdade' }];
    
    // Setup mock response for synonyms
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'nexus_synonyms') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: mockSynonyms, error: null }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        overlaps: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        abortSignal: vi.fn().mockReturnThis(),
        mockResolvedValue: vi.fn().mockResolvedValue({ data: [], error: null })
      };
    });

    // Mock other queries to return empty but success
    (supabase.from('spiritual_contents').select('*') as any).mockResolvedValue({ data: [], error: null });
    (supabase.from('journeys').select('*') as any).mockResolvedValue({ data: [], error: null });

    const tag = { label: 'Espírito Santo', slug: 'espirito_santo' };
    const { logs } = await fetchNexusTagContent(tag, { mode: 'tags', includeSynonyms: true });

    const termExpansionLog = logs.find(l => l.stage === 'Term Expansion');
    expect(termExpansionLog).toBeDefined();
    expect(termExpansionLog?.termsUsed).toContain('paraclito');
    expect(termExpansionLog?.termsUsed).toContain('espírito de verdade');
    expect(termExpansionLog?.termsUsed).toContain('espirito_santo');
  });

  it('should return results for title search mode', async () => {
    const mockContent = [{ id: '1', title: 'O Batismo no Espírito', content_text: '...', type: 'catechism' }];
    
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'spiritual_contents') {
        return {
          select: vi.fn().mockReturnThis(),
          or: vi.fn().mockResolvedValue({ data: mockContent, error: null }),
          limit: vi.fn().mockReturnThis(),
          abortSignal: vi.fn().mockReturnThis(),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        overlaps: vi.fn().mockReturnThis(),
        or: vi.fn().mockResolvedValue({ data: [], error: null }),
        limit: vi.fn().mockReturnThis(),
        abortSignal: vi.fn().mockReturnThis(),
      };
    });

    const tag = { label: 'Espírito', slug: 'espirito' };
    const { content, logs } = await fetchNexusTagContent(tag, { mode: 'title', includeSynonyms: false });

    expect(content.length).toBeGreaterThan(0);
    expect(content[0].title).toContain('Espírito');
    
    const dbLog = logs.find(l => l.stage === 'DB Query (Spiritual)');
    expect(dbLog?.resultsCount).toBe(1);
  });

  it('should verify variations (hyphen vs underscore) in term expansion', async () => {
    const tag = { label: 'Maria Madalena', slug: 'maria_madalena' };
    const { logs } = await fetchNexusTagContent(tag, { mode: 'tags', includeSynonyms: false });

    const terms = logs[0].termsUsed;
    expect(terms).toContain('maria_madalena');
    expect(terms).toContain('maria-madalena');
  });
});
