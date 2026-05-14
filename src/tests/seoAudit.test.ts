import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as seoAudit from '../services/seoAudit';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ 
      data: { id: '1', findings: [], score: 100, created_at: new Date().toISOString() }, 
      error: null 
    })
  }
}));

describe('SEO Audit Service', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    seoAudit._TEST_MODE.active = true;
  });

  it('should detect missing titles', async () => {
    // Force missing title
    const originalTitle = document.title;
    Object.defineProperty(document, 'title', { value: '', configurable: true });
    
    const audit = await seoAudit.runSEOAudit('https://test.com');
    
    expect(audit.score).toBeLessThan(100);
    const missingTitle = (audit.findings as any[]).find(f => f.message === 'Título da página ausente');
    expect(missingTitle).toBeDefined();
    
    Object.defineProperty(document, 'title', { value: originalTitle, configurable: true });
  });

  it('should detect multiple H1 tags', async () => {
    document.body.innerHTML = '<h1>Title 1</h1><h1>Title 2</h1>';
    Object.defineProperty(document, 'title', { value: 'Valid Title', configurable: true });
    
    const audit = await seoAudit.runSEOAudit('https://test.com');
    
    const multipleH1 = (audit.findings as any[]).find(f => f.message === 'Múltiplos H1s detectados');
    expect(multipleH1).toBeDefined();
    expect(audit.score).toBeLessThan(100);
  });

  it('should identify empty links', async () => {
    document.body.innerHTML = '<a href="/test"></a><a href="/test2">Desc</a>';
    Object.defineProperty(document, 'title', { value: 'Valid Title', configurable: true });
    
    const audit = await seoAudit.runSEOAudit('https://test.com');
    
    const emptyLinks = (audit.findings as any[]).find(f => f.message.includes('links com texto vazio'));
    expect(emptyLinks).toBeDefined();
  });
});
