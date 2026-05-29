import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import BottomNav from './BottomNav';
import { LangContext } from '@/contexts/LangContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('BottomNav Unit Tests', () => {
  const renderBottomNav = (path = '/', lang = 'pt') => {
    return render(
      <MemoryRouter initialEntries={[path]}>
        <LangContext.Provider value={{ lang, t: (s: string) => s, setLang: () => {}, availableLanguages: [] }}>
          <BottomNav onOpenSidebar={() => {}} />
        </LangContext.Provider>
      </MemoryRouter>
    );
  };

  it('renders all navigation items', () => {
    renderBottomNav();
    expect(screen.getByLabelText(/Hoje|Today/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Bíblia|Bible/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Catecismo|Catechism/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Logos/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Menu/)).toBeInTheDocument();
  });

  it('marks "Hoje" as active for root path', () => {
    renderBottomNav('/');
    const hojeButton = screen.getByLabelText(/Hoje/);
    expect(hojeButton).toHaveAttribute('aria-current', 'page');
  });

  it('marks "Bíblia" as active for /bible path', () => {
    renderBottomNav('/bible');
    const bibleButton = screen.getByLabelText(/Bíblia/);
    expect(bibleButton).toHaveAttribute('aria-current', 'page');
  });

  it('marks "Catecismo" as active for /catechism path', () => {
    renderBottomNav('/catechism');
    const catechismButton = screen.getByLabelText(/Catecismo/);
    expect(catechismButton).toHaveAttribute('aria-current', 'page');
  });

  it('handles hashes in the URL correctly', () => {
    renderBottomNav('/hoje#versiculo');
    const hojeButton = screen.getByLabelText(/Hoje/);
    expect(hojeButton).toHaveAttribute('aria-current', 'page');
  });

  it('maintains correct tab order', () => {
    renderBottomNav();
    const buttons = screen.getAllByRole('button');
    // We expect the buttons to be in order: Hoje, Bíblia, Catecismo, Logos, Menu
    expect(buttons[0]).toHaveAttribute('aria-label', 'Hoje');
    expect(buttons[1]).toHaveAttribute('aria-label', 'Bíblia');
    expect(buttons[2]).toHaveAttribute('aria-label', 'Catecismo');
    expect(buttons[3]).toHaveAttribute('aria-label', 'Logos');
    expect(buttons[4]).toHaveAttribute('aria-label', 'Menu');
  });
});
