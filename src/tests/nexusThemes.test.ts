import { describe, it, expect, vi } from 'vitest';
import { fetchNexusTagContent } from '../lib/nexusContent';

// Mocking Supabase since we are in a test environment
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null })
        }),
        overlaps: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [
            { id: '1', type: 'bible', content_text: 'Content about Maria', tags: ['maria', 'nossa_senhora'] }
          ], error: null })
        }),
        or: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null })
        })
      })
    })
  }
}));

// Mocking tag normalization
vi.mock('../lib/tagNormalization', () => ({
  getSearchTermsForTag: vi.fn().mockImplementation((tag) => {
    if (tag.slug === 'maria') return ['maria', 'nossa senhora', 'virgem'];
    return [tag.label, tag.slug];
  })
}));

describe('Nexus Themes and Synonyms', () => {
  it('should return results for theme "Maria" including synonyms', async () => {
    const tag = { id: 'maria-id', label: 'Maria', slug: 'maria' };
    const { content, logs } = await fetchNexusTagContent(tag, { mode: 'tags', includeSynonyms: true });
    
    expect(content.length).toBeGreaterThan(0);
    expect(logs.some(l => l.stage === 'Term Expansion')).toBe(true);
    
    const expansionLog = logs.find(l => l.stage === 'Term Expansion');
    expect(expansionLog?.termsUsed).toContain('maria');
    expect(expansionLog?.termsUsed).toContain('nossa senhora');
  });

  it('should support search by text mode', async () => {
    const tag = { id: 'igreja-id', label: 'Igreja', slug: 'igreja' };
    const { logs } = await fetchNexusTagContent(tag, { mode: 'text', includeSynonyms: true });
    
    const dbLog = logs.find(l => l.stage === 'DB Query (Spiritual)');
    expect(dbLog?.query).toBe('text');
  });

  it('should normalize search terms correctly', async () => {
    const tag = { id: 'sacramentos-id', label: 'Sacramentos', slug: 'sacramentos' };
    const { logs } = await fetchNexusTagContent(tag);
    
    const expansionLog = logs.find(l => l.stage === 'Term Expansion');
    expect(expansionLog?.termsUsed.length).toBeGreaterThan(0);
  });
});
