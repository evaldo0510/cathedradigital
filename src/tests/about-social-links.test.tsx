import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AboutPage from '../components/cathedra/AboutPage';
import { SOCIAL_LINKS } from '../config/site-config';
import { AuthProvider } from '@/hooks/useAuth';
import { LangContext } from '@/contexts/LangContext';
import { HelmetProvider } from 'react-helmet-async';
import * as analytics from '../lib/analytics';

// Mock analytics
vi.mock('../lib/analytics', () => ({
  trackEvent: vi.fn(),
  initGA4AutoTracking: vi.fn(),
}));

describe('AboutPage Social Links Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderAboutPage = () => {
    return render(
      <HelmetProvider>
        <BrowserRouter>
          <AuthProvider>
            <LangContext.Provider value={{ t: (k: string) => k, lang: 'pt', setLang: () => {} }}>
              <AboutPage />
            </LangContext.Provider>
          </AuthProvider>
        </BrowserRouter>
      </HelmetProvider>
    );
  };

  it('contains correctly configured social links', () => {
    renderAboutPage();
    
    const instagramLink = screen.getByRole('link', { name: /instagram/i });
    expect(instagramLink).toHaveAttribute('href', SOCIAL_LINKS.INSTAGRAM);
    expect(instagramLink).toHaveAttribute('target', '_blank');
    
    const youtubeLink = screen.getByRole('link', { name: /youtube/i });
    expect(youtubeLink).toHaveAttribute('href', SOCIAL_LINKS.YOUTUBE);
    
    const whatsappLink = screen.getByRole('link', { name: /whatsapp/i });
    expect(whatsappLink).toHaveAttribute('href', SOCIAL_LINKS.WHATSAPP);
  });

  it('triggers analytics event when social links are clicked on About page', () => {
    renderAboutPage();
    
    const instagramLink = screen.getByRole('link', { name: /instagram/i });
    fireEvent.click(instagramLink);
    
    expect(analytics.trackEvent).toHaveBeenCalledWith('social_link_click', {
      platform: 'Instagram',
      url: SOCIAL_LINKS.INSTAGRAM
    });
  });
});
