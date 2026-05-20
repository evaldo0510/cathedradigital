import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LandingHeader from '../components/landing/LandingHeader';
import HeroContent from '../pages/landing/hero/HeroContent';
import { MotionValue } from 'framer-motion';

// Mock MotionValue for testing
const mockMotionValue = (val: number) => ({
  get: () => val,
  onChange: () => () => {},
  on: () => () => {},
  clearListeners: () => {},
} as unknown as MotionValue<number>);

describe('Visual Consistency & Accessibility Audit', () => {
  it('LandingHeader should have correct accessibility attributes', () => {
    render(
      <BrowserRouter>
        <LandingHeader />
      </BrowserRouter>
    );
    
    // Check for ARIA label on logo button
    const logoButton = screen.getByLabelText(/cathedra/i);
    expect(logoButton).toBeDefined();
    expect(logoButton.getAttribute('role')).toBe('button');
    expect(logoButton.getAttribute('tabindex')).toBe('0');
  });

  it('Hero title should be an H1 for SEO and hierarchy', () => {
    render(
      <BrowserRouter>
        <HeroContent 
          heroOpacity={mockMotionValue(1)} 
          heroY={mockMotionValue(0)} 
          onStart={() => {}} 
        />
      </BrowserRouter>
    );
    
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeDefined();
    expect(h1.textContent).toBe('Nem toda prisão é visível');
  });

  it('Buttons should have uppercase tracking and font weights as per design system', () => {
    render(
      <BrowserRouter>
        <HeroContent 
          heroOpacity={mockMotionValue(1)} 
          heroY={mockMotionValue(0)} 
          onStart={() => {}} 
        />
      </BrowserRouter>
    );
    
    const startButton = screen.getByLabelText(/iniciar sua jornada/i);
    const classes = startButton.className;
    
    // Check for design system tokens
    expect(classes).toContain('uppercase');
    expect(classes).toContain('tracking');
    expect(classes).toContain('font-bold');
  });
});
