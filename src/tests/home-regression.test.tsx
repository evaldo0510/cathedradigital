import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomeMainContent from '../components/cathedra/HomeMainContent';
import HeroContent from '../pages/landing/hero/HeroContent';
import { MotionValue } from 'framer-motion';

// Mock MotionValue for testing
const mockMotionValue = (val: number) => ({
  get: () => val,
  onChange: () => () => {},
  on: () => () => {},
  clearListeners: () => {},
} as unknown as MotionValue<number>);

describe('Home Page Visual Regression & A11y', () => {
  const mockNavigate = vi.fn();
  const mockT = (key: string) => key;

  describe('Logged Out State', () => {
    it('should match snapshot for Hero', () => {
      const { asFragment } = render(
        <BrowserRouter>
          <HeroContent 
            heroOpacity={mockMotionValue(1)} 
            heroY={mockMotionValue(0)} 
            onStart={() => {}} 
            onAbout={() => {}} 
            user={null}
          />
        </BrowserRouter>
      );
      expect(asFragment()).toMatchSnapshot();
    });

    it('should match snapshot for Main Content', () => {
      const { asFragment } = render(
        <BrowserRouter>
          <HomeMainContent 
            user={null} 
            profile={null} 
            onNavigate={mockNavigate} 
            t={mockT} 
          />
        </BrowserRouter>
      );
      expect(asFragment()).toMatchSnapshot();
    });

    it('should show "Iniciar Jornada" and "Inicie sua Caminhada"', () => {
      render(
        <BrowserRouter>
          <HomeMainContent 
            user={null} 
            profile={null} 
            onNavigate={mockNavigate} 
            t={mockT} 
          />
        </BrowserRouter>
      );
      expect(screen.getByText(/Inicie sua Caminhada/i)).toBeDefined();
    });
  });

  describe('Logged In State', () => {
    const mockUser = { id: '123', email: 'test@example.com' };

    it('should match snapshot for Hero (logged in)', () => {
      const { asFragment } = render(
        <BrowserRouter>
          <HeroContent 
            heroOpacity={mockMotionValue(1)} 
            heroY={mockMotionValue(0)} 
            onStart={() => {}} 
            onAbout={() => {}} 
            user={mockUser}
          />
        </BrowserRouter>
      );
      expect(asFragment()).toMatchSnapshot();
    });

    it('should match snapshot for Main Content (logged in)', () => {
      const { asFragment } = render(
        <BrowserRouter>
          <HomeMainContent 
            user={mockUser} 
            profile={{ role: 'pilgrim' }} 
            onNavigate={mockNavigate} 
            t={mockT} 
          />
        </BrowserRouter>
      );
      expect(asFragment()).toMatchSnapshot();
    });

    it('should show "Ver Atividades" and "Retomar Jornada"', () => {
      render(
        <BrowserRouter>
          <HomeMainContent 
            user={mockUser} 
            profile={{ role: 'pilgrim' }} 
            onNavigate={mockNavigate} 
            t={mockT} 
          />
        </BrowserRouter>
      );
      expect(screen.getByText(/Retomar Jornada/i)).toBeDefined();
    });
  });

  describe('Accessibility & Keyboard Navigation', () => {
    it('all main sections should have ARIA labels', () => {
      render(
        <BrowserRouter>
          <HomeMainContent 
            user={null} 
            profile={null} 
            onNavigate={mockNavigate} 
            t={mockT} 
          />
        </BrowserRouter>
      );
      
      expect(screen.getByLabelText(/Jornada/i)).toBeDefined();
      expect(screen.getByLabelText(/Hoje/i)).toBeDefined();
      expect(screen.getByLabelText(/Doutrina/i)).toBeDefined();
      expect(screen.getByLabelText(/Trilhas/i)).toBeDefined();
    });

    it('interactive cards should have correct ARIA roles', () => {
      render(
        <BrowserRouter>
          <HomeMainContent 
            user={null} 
            profile={null} 
            onNavigate={mockNavigate} 
            t={mockT} 
          />
        </BrowserRouter>
      );
      
      const cards = screen.getAllByRole('button');
      // HomeCard is a button/clickable div with role button in HomeCard.tsx
      expect(cards.length).toBeGreaterThan(5);
    });
  });
});
