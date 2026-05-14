import { describe, it, expect, vi } from 'vitest';
import { runSEOAudit } from '../services/seoAudit';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id: '1', findings: [], score: 100, created_at: new Date().toISOString() }, error: null })
  }
}));

describe('SEO Audit Service', () => {
  it('should detect missing titles', async () => {
    // Setup document mock
    Object.defineProperty(document, 'title', { value: '', configurable: true });
    
    const audit = await runSEOAudit('https://test.com');
    
    expect(audit.score).toBeLessThan(100);
    const missingTitle = (audit.findings as any[]).find(f => f.message === 'Título da página ausente');
    expect(missingTitle).toBeDefined();
  });

  it('should detect multiple H1 tags', async () => {
    // Setup DOM
    document.body.innerHTML = '<h1>Title 1</h1><h1>Title 2</h1>';
    Object.defineProperty(document, 'title', { value: 'Valid Title', configurable: true });
    
    const audit = await runSEOAudit('https://test.com');
    
    const multipleH1 = (audit.findings as any[]).find(f => f.message === 'Múltiplos H1s detectados');
    expect(multipleH1).toBeDefined();
  });

  it('should identify empty links', async () => {
    document.body.innerHTML = '<a href="/test"></a><a href="/test2">Desc</a>';
    
    const audit = await runSEOAudit('https://test.com');
    
    const emptyLinks = (audit.findings as any[]).find(f => f.message.includes('links com texto vazio'));
    expect(emptyLinks).toBeDefined();
  });
});
