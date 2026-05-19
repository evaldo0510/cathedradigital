import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Footer from '../components/cathedra/Footer';
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

describe('Footer Analytics Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderFooter = () => {
    return render(
      <HelmetProvider>
        <BrowserRouter>
          <AuthProvider>
            <LangContext.Provider value={{ t: (k: string) => k, lang: 'pt', setLang: () => {} }}>
              <Footer />
            </LangContext.Provider>
          </AuthProvider>
        </BrowserRouter>
      </HelmetProvider>
    );
  };

  it('triggers analytics event when Instagram link is clicked', () => {
    renderFooter();
    
    // Find Instagram link by its href
    const instagramLink = screen.getByRole('link', { name: /instagram/i });
    expect(instagramLink).toHaveAttribute('href', SOCIAL_LINKS.INSTAGRAM);
    
    fireEvent.click(instagramLink);
    
    expect(analytics.trackEvent).toHaveBeenCalledWith('social_link_click', {
      platform: 'Instagram',
      url: SOCIAL_LINKS.INSTAGRAM
    });
  });

  it('triggers analytics event when Youtube link is clicked', () => {
    renderFooter();
    
    const youtubeLink = screen.getByRole('link', { name: /youtube/i });
    expect(youtubeLink).toHaveAttribute('href', SOCIAL_LINKS.YOUTUBE);
    
    fireEvent.click(youtubeLink);
    
    expect(analytics.trackEvent).toHaveBeenCalledWith('social_link_click', {
      platform: 'Youtube',
      url: SOCIAL_LINKS.YOUTUBE
    });
  });

  it('triggers analytics event when WhatsApp link is clicked', () => {
    renderFooter();
    
    const whatsappLink = screen.getByRole('link', { name: /whatsapp/i });
    expect(whatsappLink).toHaveAttribute('href', SOCIAL_LINKS.WHATSAPP);
    
    fireEvent.click(whatsappLink);
    
    expect(analytics.trackEvent).toHaveBeenCalledWith('social_link_click', {
      platform: 'Whatsapp',
      url: SOCIAL_LINKS.WHATSAPP
    });
  });
});
