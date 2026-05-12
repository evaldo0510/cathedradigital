import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HojePage from '../HojePage';
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

describe('HojePage Navigation', () => {
  const renderHojePage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <LangContext.Provider value={{ t: (k: string) => k, lang: 'pt' }}>
              <HojePage />
            </LangContext.Provider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('renders correctly and has interactive cards', () => {
    renderHojePage();
    // Use a loose match for text since it might be in multiple elements
    expect(screen.getByText(/Sua jornada espiritual/i)).toBeInTheDocument();
  });

  it('navigation cards have correct accessibility attributes', () => {
    renderHojePage();
    const quickAccessCards = screen.getAllByRole('button', { name: /Acessar/i });
    expect(quickAccessCards.length).toBeGreaterThan(0);
    quickAccessCards.forEach(card => {
      expect(card).toHaveAttribute('tabIndex', '0');
    });
  });
});
