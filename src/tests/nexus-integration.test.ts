import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchNexusTagContent } from '../lib/nexusContent';
import { supabase } from '../integrations/supabase/client';

// Helper to create a chainable mock
const createMockQuery = (responseData: any = { data: [], error: null }) => {
  const mock = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    overlaps: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    abortSignal: vi.fn().mockReturnThis(),
    then: vi.fn((resolve) => resolve(responseData)),
    // Support for direct await
    mockResolvedValue: vi.fn().mockResolvedValue(responseData)
  };
  
  // Make the mock itself a thenable to support await query
  (mock as any).then = (onFulfilled: any) => Promise.resolve(responseData).then(onFulfilled);
  
  return mock;
};

vi.mock('../integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('Nexus Intelligence - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should expand search terms correctly with synonyms', async () => {
    const mockSynonyms = { data: [{ term: 'paraclito' }, { term: 'espírito de verdade' }], error: null };
    
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'nexus_synonyms') {
        return createMockQuery(mockSynonyms);
      }
      return createMockQuery({ data: [], error: null });
    });

    const tag = { label: 'Espírito Santo', slug: 'espirito_santo' };
    const { logs } = await fetchNexusTagContent(tag, { mode: 'tags', includeSynonyms: true });

    const termExpansionLog = logs.find(l => l.stage === 'Term Expansion');
    expect(termExpansionLog).toBeDefined();
    expect(termExpansionLog?.termsUsed).toContain('paraclito');
    expect(termExpansionLog?.termsUsed).toContain('espírito de verdade');
    expect(termExpansionLog?.termsUsed).toContain('espirito_santo');
  });

  it('should return results for title search mode', async () => {
    const mockContent = { data: [{ id: '1', title: 'O Batismo no Espírito', content_text: '...', type: 'catechism' }], error: null };
    
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'spiritual_contents') {
        return createMockQuery(mockContent);
      }
      return createMockQuery({ data: [], error: null });
    });

    const tag = { label: 'Espírito', slug: 'espirito' };
    const { content, logs } = await fetchNexusTagContent(tag, { mode: 'title', includeSynonyms: false });

    expect(content.length).toBeGreaterThan(0);
    expect(content[0].title).toContain('Espírito');
    
    const dbLog = logs.find(l => l.stage === 'DB Query (Spiritual)');
    expect(dbLog?.resultsCount).toBe(1);
  });

  it('should verify variations (hyphen vs underscore) in term expansion', async () => {
    (supabase.from as any).mockImplementation(() => createMockQuery());
    
    const tag = { label: 'Maria Madalena', slug: 'maria_madalena' };
    const { logs } = await fetchNexusTagContent(tag, { mode: 'tags', includeSynonyms: false });

    const terms = logs[0].termsUsed;
    expect(terms).toContain('maria_madalena');
    expect(terms).toContain('maria-madalena');
  });
});
