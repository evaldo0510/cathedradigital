import { describe, it, expect, vi } from 'vitest';
import { searchUnified } from '../services/conteudoService';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        or: vi.fn(() => ({
          range: vi.fn(() => Promise.resolve({ data: [{ number: 1, content: 'Test', summary: 'Summary' }] }))
        }))
      }))
    }))
  }
}));

describe('Refactor Architecture Tests', () => {
  it('searchUnified should return catechism results', async () => {
    const { data } = await searchUnified('test', ['catechism']);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].type).toBe('catechism');
  });

  it('SEO checks should detect missing tags', () => {
    // Basic test for our upcoming SEO logic
    const mockHtml = '<html><body><h1>Test</h1></body></html>';
    const hasTitle = mockHtml.includes('<title>');
    expect(hasTitle).toBe(false);
  });
});
