import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HojePage from '../HojePage';
import BibliotecaPage from '../BibliotecaPage';
import { AuthProvider } from '@/hooks/useAuth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LangContext } from '@/contexts/LangContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Navigation Tests', () => {
  const renderWithContext = (component: React.ReactNode) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <LangContext.Provider value={{ t: (k: string) => k, lang: 'pt', setLang: () => {} }}>
              {component}
            </LangContext.Provider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  describe('HojePage', () => {
    it('renders correctly and has interactive cards', () => {
      renderWithContext(<HojePage />);
      expect(screen.getByText(/Sua jornada espiritual/i)).toBeInTheDocument();
    });

    it('navigation cards have correct accessibility attributes', () => {
      renderWithContext(<HojePage />);
      const quickAccessCards = screen.getAllByRole('button', { name: /Acessar/i });
      expect(quickAccessCards.length).toBeGreaterThan(0);
      quickAccessCards.forEach(card => {
        expect(card).toHaveAttribute('tabIndex', '0');
      });
    });
  });

  describe('BibliotecaPage', () => {
    it('renders correctly and filters items', () => {
      renderWithContext(<BibliotecaPage />);
      expect(screen.getByText(/Mergulhe na profundidade/i)).toBeInTheDocument();
      
      const searchInput = screen.getByPlaceholderText(/Buscar módulo/i);
      fireEvent.change(searchInput, { target: { value: 'Bíblia' } });
      
      expect(screen.getByText('Bíblia')).toBeInTheDocument();
      expect(screen.queryByText('Catecismo')).not.toBeInTheDocument();
    });

    it('cards are accessible via keyboard', () => {
      renderWithContext(<BibliotecaPage />);
      const bibleCard = screen.getByLabelText(/Explorar Bíblia/i);
      expect(bibleCard).toHaveAttribute('tabIndex', '0');
      
      fireEvent.keyDown(bibleCard, { key: 'Enter' });
      expect(mockNavigate).toHaveBeenCalled();
    });
  });
});
