import { supabase } from "@/integrations/supabase/client";

// Global constant to help with testing
export const _TEST_MODE = { active: false };

export interface SEOAudit {
  id: string;
  url: string;
  score: number;
  findings: SEOFinding[];
  meta_tags: Record<string, string>;
  headings: Record<string, string[]>;
  links: SEOLink[];
  created_at: string;
}

export interface SEOFinding {
  severity: 'critical' | 'warning' | 'info';
  category: 'meta' | 'heading' | 'links' | 'content';
  message: string;
  recommendation: string;
}

export interface SEOLink {
  href: string;
  text: string;
  status: number;
  isExternal: boolean;
}

export const runSEOAudit = async (url: string = window.location.href) => {
  const audit: Partial<SEOAudit> = {
    url,
    findings: [],
    meta_tags: {},
    headings: {},
    links: [],
    score: 100
  };

  // 1. Meta Tags
  const title = document.title;
  audit.meta_tags!['title'] = title;
  if (!title) {
    audit.findings!.push({
      severity: 'critical',
      category: 'meta',
      message: 'Título da página ausente',
      recommendation: 'Adicione uma tag <title> descritiva.'
    });
    audit.score! -= 20;
  } else if (title.length > 60) {
    audit.findings!.push({
      severity: 'warning',
      category: 'meta',
      message: 'Título muito longo',
      recommendation: 'Mantenha o título abaixo de 60 caracteres.'
    });
    audit.score! -= 5;
  }

  const description = document.querySelector('meta[name="description"]')?.getAttribute('content');
  if (description) {
    audit.meta_tags!['description'] = description;
    if (description.length > 160) {
      audit.findings!.push({
        severity: 'warning',
        category: 'meta',
        message: 'Meta description muito longa',
        recommendation: 'Mantenha a descrição abaixo de 160 caracteres.'
      });
      audit.score! -= 5;
    }
  } else {
    audit.findings!.push({
      severity: 'critical',
      category: 'meta',
      message: 'Meta description ausente',
      recommendation: 'Adicione uma meta description informativa.'
    });
    audit.score! -= 15;
  }

  // Open Graph
  const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
  if (ogTitle) audit.meta_tags!['og:title'] = ogTitle;
  
  const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
  if (ogImage) audit.meta_tags!['og:image'] = ogImage;

  // 2. Headings
  const h1s = Array.from(document.querySelectorAll('h1'));
  audit.headings!['h1'] = h1s.map(h => h.innerText || h.textContent || '');
  if (h1s.length === 0) {
    audit.findings!.push({
      severity: 'critical',
      category: 'heading',
      message: 'H1 ausente',
      recommendation: 'Toda página deve ter exatamente um H1.'
    });
    audit.score! -= 15;
  } else if (h1s.length > 1) {
    audit.findings!.push({
      severity: 'warning',
      category: 'heading',
      message: 'Múltiplos H1s detectados',
      recommendation: 'Use apenas um H1 por página para melhor SEO.'
    });
    audit.score! -= 10;
  }

  ['h2', 'h3', 'h4'].forEach(tag => {
    audit.headings![tag] = Array.from(document.querySelectorAll(tag)).map(h => (h as HTMLElement).innerText || h.textContent || '');
  });

  // 3. Links
  const anchors = Array.from(document.querySelectorAll('a'));
  audit.links = anchors.map(a => {
    const text = (a.innerText || a.textContent || '').trim();
    return {
      href: a.href,
      text: text || 'Link sem texto',
      status: 200,
      isExternal: a.origin !== window.location.origin
    };
  });

  // Detect empty links
  const emptyLinks = audit.links.filter(l => !l.text || l.text === 'Link sem texto');
  if (emptyLinks.length > 0) {
    audit.findings!.push({
      severity: 'warning',
      category: 'links',
      message: `${emptyLinks.length} links com texto vazio ou genérico`,
      recommendation: 'Use texto descritivo nos links.'
    });
    audit.score! -= 5;
  }

  // Final score safety
  audit.score = Math.max(0, audit.score!);

  // Save to DB
  const { data, error } = await supabase
    .from('seo_audits')
    .insert({
      url: audit.url as string,
      score: audit.score,
      findings: audit.findings as any,
      meta_tags: audit.meta_tags as any,
      headings: audit.headings as any,
      links: audit.links as any
    })
    .select()
    .single();

  if (error) throw error;
  return { ...audit, ...data } as unknown as SEOAudit;
};

export const getAuditHistory = async () => {
  const { data, error } = await supabase
    .from('seo_audits')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as unknown as SEOAudit[];
};
