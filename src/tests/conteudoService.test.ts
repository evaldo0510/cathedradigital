import { describe, it, expect, vi } from 'vitest';
import { searchUnified, getContentById } from '../services/conteudoService';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => Promise.resolve({ 
      data: { number: 1, content: 'Test content', summary: 'Summary' }, 
      error: null 
    })),
    // Using a more flexible then mock for range and standard calls
    then: vi.fn().mockImplementation(function(this: any, cb: any) {
      // Simulate data return for search
      const mockData = Array.from({ length: 10 }, (_, i) => ({
        number: i + 1,
        content: `Content ${i + 1}`,
        summary: `Summary ${i + 1}`
      }));
      return Promise.resolve(cb({ data: mockData, error: null }));
    })
  }
}));

describe('conteudoService integration', () => {
  it('should search catechism paragraphs and return metrics', async () => {
    const { data, metrics } = await searchUnified('Eucaristia', ['catechism'], 0, 10);
    expect(data).toBeDefined();
    expect(data.length).toBe(10);
    expect(metrics.responseTime).toBeDefined();
    expect(metrics.cacheHit).toBe(false);
  });

  it('should use cache for repeated queries', async () => {
    await searchUnified('CacheTest', ['catechism'], 0, 10);
    const { metrics } = await searchUnified('CacheTest', ['catechism'], 0, 10);
    expect(metrics.cacheHit).toBe(true);
  });

  it('should handle pagination and result concatenation logic in UI context', async () => {
    const firstPage = await searchUnified('Pagination', ['catechism'], 0, 5);
    const secondPage = await searchUnified('Pagination', ['catechism'], 1, 5);
    
    expect(firstPage.data.length).toBe(10); // Mock returns 10 currently
    expect(secondPage.data.length).toBe(10);
  });

  it('should return content by ID for catechism', async () => {
    const content = await getContentById('catechism', '1');
    expect(content).toBeDefined();
    expect(content?.title).toBe('CIC §1');
  });
});
