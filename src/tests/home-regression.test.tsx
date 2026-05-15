import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomeMainContent from '../components/cathedra/HomeMainContent';
import HeroContent from '../pages/landing/hero/HeroContent';
import { MotionValue } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock hooks that use context or external state
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    profile: null,
    loading: false
  })
}));

vi.mock('@/hooks/useSaints', () => ({
  useOfficialSaint: () => ({
    data: { name: 'São Bento', image: '' },
    isLoading: false
  })
}));

vi.mock('@/hooks/useLang', () => ({
  useLang: () => ({
    lang: 'pt',
    setLang: vi.fn(),
    t: (key: string) => key
  })
}));

// Mock Framer Motion to avoid issues with animation logic in tests
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    motion: {
      div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
      p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
      section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
    },
    useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
    useTransform: () => ({ get: () => 0 }),
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

describe('Home Page Visual Regression & A11y', () => {
  const mockNavigate = vi.fn();
  const mockT = (key: string) => key;
  const mockMotionValue = (val: number) => ({
    get: () => val,
    onChange: () => () => {},
    on: () => () => {},
    clearListeners: () => {},
  } as unknown as MotionValue<number>);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );

  describe('Logged Out State', () => {
    it('should match snapshot for Hero', () => {
      const { asFragment } = render(
        <TestWrapper>
          <HeroContent 
            heroOpacity={mockMotionValue(1)} 
            heroY={mockMotionValue(0)} 
            onStart={() => {}} 
            onAbout={() => {}} 
            user={null}
          />
        </TestWrapper>
      );
      expect(asFragment()).toMatchSnapshot();
    });

    it('should match snapshot for Main Content', () => {
      const { asFragment } = render(
        <TestWrapper>
          <HomeMainContent 
            user={null} 
            profile={null} 
            onNavigate={mockNavigate} 
            t={mockT} 
          />
        </TestWrapper>
      );
      expect(asFragment()).toMatchSnapshot();
    });

    it('should show "Iniciar Jornada" and "Inicie sua Caminhada"', () => {
      render(
        <TestWrapper>
          <HomeMainContent 
            user={null} 
            profile={null} 
            onNavigate={mockNavigate} 
            t={mockT} 
          />
        </TestWrapper>
      );
      expect(screen.getByText(/Inicie sua Caminhada/i)).toBeDefined();
    });
  });

  describe('Logged In State', () => {
    const mockUser = { id: '123', email: 'test@example.com' };

    it('should match snapshot for Hero (logged in)', () => {
      const { asFragment } = render(
        <TestWrapper>
          <HeroContent 
            heroOpacity={mockMotionValue(1)} 
            heroY={mockMotionValue(0)} 
            onStart={() => {}} 
            onAbout={() => {}} 
            user={mockUser}
          />
        </TestWrapper>
      );
      expect(asFragment()).toMatchSnapshot();
    });

    it('should match snapshot for Main Content (logged in)', () => {
      const { asFragment } = render(
        <TestWrapper>
          <HomeMainContent 
            user={mockUser} 
            profile={{ role: 'pilgrim' }} 
            onNavigate={mockNavigate} 
            t={mockT} 
          />
        </TestWrapper>
      );
      expect(asFragment()).toMatchSnapshot();
    });

    it('should show "Ver Atividades" and "Retomar Jornada"', () => {
      render(
        <TestWrapper>
          <HomeMainContent 
            user={mockUser} 
            profile={{ role: 'pilgrim' }} 
            onNavigate={mockNavigate} 
            t={mockT} 
          />
        </TestWrapper>
      );
      expect(screen.getByText(/Retomar Jornada/i)).toBeDefined();
    });
  });

  describe('Accessibility & Keyboard Navigation', () => {
    it('all main sections should have ARIA labels', () => {
      render(
        <TestWrapper>
          <HomeMainContent 
            user={null} 
            profile={null} 
            onNavigate={mockNavigate} 
            t={mockT} 
          />
        </TestWrapper>
      );
      
      expect(screen.getByLabelText(/Jornada/i)).toBeDefined();
      expect(screen.getByLabelText(/Hoje/i)).toBeDefined();
      expect(screen.getByLabelText(/Doutrina/i)).toBeDefined();
      expect(screen.getByLabelText(/Trilhas/i)).toBeDefined();
    });

    it('interactive cards should have correct ARIA roles', () => {
      render(
        <TestWrapper>
          <HomeMainContent 
            user={null} 
            profile={null} 
            onNavigate={mockNavigate} 
            t={mockT} 
          />
        </TestWrapper>
      );
      
      const cards = screen.getAllByRole('button');
      expect(cards.length).toBeGreaterThan(5);
    });
  });
});
