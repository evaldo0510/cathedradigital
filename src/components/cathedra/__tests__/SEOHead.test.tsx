import { render } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import SEOHead from '../SEOHead';
import { describe, it, expect, vi } from 'vitest';

// Mock useSEO hook
vi.mock('@/hooks/useSEO', () => ({
  useSEO: () => ({
    data: {
      site_title: 'Cathedra Digital',
      site_description: 'Site description',
    }
  })
}));

describe('SEOHead Component', () => {
  it('renders correct canonical link and og tags', () => {
    render(
      <HelmetProvider>
        <SEOHead 
          title="Bible" 
          description="Read the holy bible" 
          path="/bible" 
        />
      </HelmetProvider>
    );

    // We check the head elements via document.querySelector because Helmet renders to head
    const canonical = document.querySelector('link[rel="canonical"]');
    expect(canonical?.getAttribute('href')).toBe('https://www.cathedradigital.com.br/bible');

    const ogTitle = document.querySelector('meta[property="og:title"]');
    expect(ogTitle?.getAttribute('content')).toContain('Bible');

    const ogUrl = document.querySelector('meta[property="og:url"]');
    expect(ogUrl?.getAttribute('content')).toBe('https://www.cathedradigital.com.br/bible');
  });

  it('renders fallback image when no image is provided', () => {
    render(
      <HelmetProvider>
        <SEOHead path="/test" />
      </HelmetProvider>
    );
    
    const ogImage = document.querySelector('meta[property="og:image"]');
    expect(ogImage?.getAttribute('content')).toContain('gpwrpmoniglarqwfyryp.supabase.co');
  });
});
