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

describe('AboutPage Social Links Integration Tests', () => {
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

  it('contains correctly configured Instagram link that opens in new tab', () => {
    renderAboutPage();
    
    const instagramLink = screen.getByRole('link', { name: /^instagram$/i });
    expect(instagramLink).toHaveAttribute('href', SOCIAL_LINKS.INSTAGRAM);
    expect(instagramLink).toHaveAttribute('target', '_blank');
    expect(instagramLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('maintains the official domain even after multiple simulated clicks', () => {
    renderAboutPage();
    
    const instagramLink = screen.getByRole('link', { name: /^instagram$/i });
    
    // Check multiple times to simulate "maintaining domain" in a unit/integration context
    for (let i = 0; i < 3; i++) {
      fireEvent.click(instagramLink);
      expect(instagramLink).toHaveAttribute('href', SOCIAL_LINKS.INSTAGRAM);
      expect(SOCIAL_LINKS.INSTAGRAM).toBe('https://www.instagram.com/cathedradigital/');
    }
  });

  it('all social buttons have consistent aria-labels on About page', () => {
    renderAboutPage();
    
    const socialLinks = screen.getAllByRole('link');
    const socialPlatforms = ['Instagram', 'YouTube', 'X (Twitter)', 'Facebook', 'WhatsApp'];
    
    const linksWithLabels = socialLinks.filter(link => {
      const label = link.getAttribute('aria-label');
      return label && socialPlatforms.includes(label);
    });

    expect(linksWithLabels.length).toBe(socialPlatforms.length);
    
    linksWithLabels.forEach(link => {
      const label = link.getAttribute('aria-label');
      expect(label).toBeTruthy();
    });
  });

  it('triggers analytics event with correct data when Instagram is clicked', () => {
    renderAboutPage();
    
    const instagramLink = screen.getByRole('link', { name: /^instagram$/i });
    fireEvent.click(instagramLink);
    
    expect(analytics.trackEvent).toHaveBeenCalledWith('social_link_click', {
      platform: 'Instagram',
      url: SOCIAL_LINKS.INSTAGRAM
    });
  });
});
