import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import HeroSection from '../../HeroSection';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axe, toHaveNoViolations } from 'vitest-axe';
import { MotionConfig } from 'framer-motion';

expect.extend(toHaveNoViolations);

// Mocks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null, profile: null, loading: false })
}));

const mockUpdateSettings = vi.fn();
let currentSettings = { reduceAnimations: false };

vi.mock('@/contexts/ReadingSettingsContext', () => ({
  useReadingSettings: () => ({ 
    settings: currentSettings,
    updateSettings: mockUpdateSettings 
  }),
  ReadingSettingsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

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
          <MotionConfig reducedMotion={reducedMotion ? "always" : "never"}>
            <HeroSection onStart={() => {}} />
          </MotionConfig>
        </BrowserRouter>
      </HelmetProvider>
    );
  };

  it('should have no accessibility violations (WCAG 2.1 AA)', async () => {
    const { container } = renderHero();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('validates keyboard navigation and focus order', () => {
    renderHero();
    const buttons = screen.getAllByRole('button');
    
    // Check if buttons are in focusable order
    buttons[0].focus();
    expect(document.activeElement).toBe(buttons[0]);
    
    fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
    // Note: RTL doesn't actually move focus with Tab, we test focusability and labels
    buttons.forEach(btn => {
      btn.focus();
      expect(document.activeElement).toBe(btn);
      expect(btn).toHaveAttribute('aria-label');
      // Verify visible focus indicator (checking for class)
      expect(btn).toHaveClass('focus-visible:ring-1');
    });
  });

  it('respects prefers-reduced-motion in runtime environment', () => {
    mockMatchMedia(true);
    const { container } = renderHero(true);
    
    // Check if motion styles are suppressed (framer-motion handles this via MotionConfig)
    const content = container.querySelector('.relative.z-10');
    expect(content).toBeInTheDocument();
    
    // In a real browser, we would check computed styles, here we check the implementation property
    // HeroContent uses useReducedMotion() which we verify via rendering snapshot
    expect(container).toMatchSnapshot();
  });

  it('validates contrast for critical CTAs', () => {
    renderHero();
    const primaryBtn = screen.getByLabelText(/Continuar leitura/i);
    
    // Verify primary button has high contrast classes
    expect(primaryBtn).toHaveClass('bg-primary');
    expect(primaryBtn).toHaveClass('text-primary-foreground');
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
