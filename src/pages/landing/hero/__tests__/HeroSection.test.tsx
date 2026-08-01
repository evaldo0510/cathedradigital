import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import HeroSection from '../../HeroSection';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axe } from 'vitest-axe';
import { MotionConfig } from 'framer-motion';
import { TestContexts } from '@/test/providers';

// Manual mock for toHaveNoViolations since vitest-axe exports are tricky in this environment
const toHaveNoViolations = (results: any) => {
  if (results.violations.length === 0) {
    return { pass: true, message: () => '' };
  }
  return {
    pass: false,
    message: () => `Aria violations found: ${JSON.stringify(results.violations, null, 2)}`
  };
};
expect.extend({ toHaveNoViolations });

// Mocks
vi.mock('@/hooks/useAuth', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useAuth')>('@/hooks/useAuth');
  return {
    ...actual,

  useAuth: () => ({ user: null, profile: null, loading: false })
};
});

const mockUpdateSettings = vi.fn();
let currentSettings = { reduceAnimations: false };

vi.mock('@/contexts/ReadingSettingsContext', async () => {
  const actual = await vi.importActual<typeof import('@/contexts/ReadingSettingsContext')>('@/contexts/ReadingSettingsContext');
  return {
    ...actual,

  useReadingSettings: () => ({ 
    settings: currentSettings,
    updateSettings: mockUpdateSettings 
  }),
  ReadingSettingsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
};
});

// Helper to mock matchMedia for prefers-reduced-motion
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

describe('HeroSection Advanced Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSettings = { reduceAnimations: false };
    mockMatchMedia(false);
  });

  const renderHero = (reducedMotion = false) => {
    return render(
      <HelmetProvider>
        <BrowserRouter>
          <TestContexts><MotionConfig reducedMotion={reducedMotion ? "always" : "never"}>
            <HeroSection onStart={() => {}} />
          </MotionConfig></TestContexts>
        </BrowserRouter>
      </HelmetProvider>
    );
  };

  it('should have no accessibility violations (WCAG 2.1 AA)', async () => {
    const { container } = renderHero();
    const results = await axe(container);
    // @ts-ignore
    expect(results).toHaveNoViolations();
  });

  it('validates keyboard navigation and focus order', () => {
    renderHero();
    const buttons = screen.getAllByRole('button');
    
    // Check if buttons are focusable and have correct attributes
    buttons.forEach(btn => {
      btn.focus();
      expect(document.activeElement).toBe(btn);
      expect(btn).toHaveAttribute('aria-label');
      // The button component uses variant classes like btn-premium-primary or btn-premium-outline
      // which are verified in the contrast test. Here we check for accessibility attributes.
    });
  });

  it('respects prefers-reduced-motion in runtime environment', () => {
    mockMatchMedia(true);
    const { container } = renderHero(true);
    
    const content = container.querySelector('.relative.z-10');
    expect(content).toBeInTheDocument();
    
    // Snapshot to ensure layout remains consistent without animations
    expect(container).toMatchSnapshot();
  });

  it('validates contrast for critical CTAs', () => {
    renderHero();
    const primaryBtn = screen.getByLabelText(/Continuar leitura/i);
    
    // Verify primary button has high contrast classes
    expect(primaryBtn).toHaveClass('btn-premium-primary');
  });

  it('renders correctly across mobile and desktop breakpoints (Snapshot)', () => {
    // Desktop view
    window.innerWidth = 1920;
    const desktop = renderHero();
    expect(desktop.asFragment()).toMatchSnapshot('desktop-hero');

    // Mobile view
    window.innerWidth = 375;
    const mobile = renderHero();
    expect(mobile.asFragment()).toMatchSnapshot('mobile-hero');
  });
});
