import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import HeroSection from '../../HeroSection';
import { describe, it, expect, vi } from 'vitest';
import { MotionConfig } from 'framer-motion';

describe('HeroSection Accessibility and Hierarchy', () => {
  const renderHero = () => {
    return render(
      <HelmetProvider>
        <BrowserRouter>
          <HeroSection onStart={() => {}} />
        </BrowserRouter>
      </HelmetProvider>
    );
  };

  it('renders the correct heading hierarchy', () => {
    renderHero();
    // Section should have a screen-reader only H1
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeInTheDocument();
    expect(h1).toHaveClass('sr-only');

    // Content should have an H2 (Cathedra)
    const h2 = screen.getByRole('heading', { level: 2 });
    expect(h2).toHaveTextContent(/Cathedra/i);
  });

  it('contains proper landmarks', () => {
    renderHero();
    // Should be wrapped in a section
    expect(screen.getByRole('region', { name: /Cathedra Digital/i })).toBeInTheDocument();
  });

  it('has accessible CTAs with labels', () => {
    renderHero();
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
    });
  });
});
