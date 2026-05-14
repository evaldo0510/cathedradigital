import { describe, it, expect, vi, beforeEach } from 'vitest';
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
    then: vi.fn().mockImplementation((cb) => cb({ 
      data: [{ number: 1, content: 'Test content', summary: 'Summary' }], 
      error: null 
    }))
  }
}));

describe('conteudoService', () => {
  it('should search catechism paragraphs with correct pagination', async () => {
    const results = await searchUnified('Eucaristia', ['catechism'], 0, 10);
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
  });

  it('should return content by ID for catechism', async () => {
    const content = await getContentById('catechism', '1');
    expect(content).toBeDefined();
    expect(content?.type).toBe('catechism');
    expect(content?.title).toBe('CIC §1');
  });

  it('should return null for non-existent content type', async () => {
    // @ts-ignore
    const content = await getContentById('invalid', '1');
    expect(content).toBeNull();
  });
});
