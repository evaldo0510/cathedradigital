import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NexusBubbles from './NexusBubbles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { fetchNexusTagContent } from '@/lib/nexusContent';
import { HelmetProvider } from 'react-helmet-async';
import React from 'react';

// Themes returned from Supabase mock — note the component maps `name` -> `label`
const MOCK_THEMES = [
  { id: 't-amor', name: 'Amor', slug: 'amor', emoji: '❤️', category: 'fundamentos' },
  { id: 't-fe', name: 'Fé', slug: 'fe', emoji: '✝️', category: 'fundamentos' },
  { id: 't-oracao', name: 'Oração', slug: 'oracao', emoji: '🙏', category: 'fundamentos' },
  { id: 't-paz', name: 'Paz', slug: 'paz', emoji: '🕊️', category: 'vida' },
  { id: 't-jesus', name: 'Jesus', slug: 'jesus', emoji: '✝️', category: 'divino' },
];

const buildSupabaseMock = (themes: any[] = MOCK_THEMES) => {
  return {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockImplementation(() => ({
      then: (resolve: any) => resolve({ data: themes, error: null }),
    })),
  };
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

vi.mock('@/lib/nexusContent', () => ({
  fetchNexusTagContent: vi.fn(),
}));

vi.mock('@/services/aiService', () => ({
  getSpiritualInsight: vi.fn(() =>
    Promise.resolve({ content: 'Reflexão espiritual mockada', error: null })
  ),
}));

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{ui}</BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

/**
 * NexusBubbles renders each tag both in its category section and (when applicable)
 * in the "Sugeridos para sua Jornada" section. Use the first match for stable clicks.
 */
const findFirstBubbleByLabel = async (label: string) => {
  const buttons = await screen.findAllByRole('button', {
    name: new RegExp(`Tema: ${label}`, 'i'),
  });
  return buttons[0];
};

describe('NexusBubbles - Bubble interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (supabase.from as any).mockImplementation(() => buildSupabaseMock());
  });

  it('opens the popover when clicking a regular bubble and loads its content', async () => {
    (fetchNexusTagContent as any).mockResolvedValue([
      {
        id: 'b1',
        type: 'bible',
        content_text: 'O amor é paciente, o amor é bondoso.',
        title: '1 Cor 13,4',
        metadata: {},
      },
      {
        id: 'c1',
        type: 'catechism',
        content_text: 'O amor é dom de Deus.',
        title: 'CIC 1822',
        metadata: {},
      },
    ]);

    renderWithProviders(<NexusBubbles />);

    const amor = await findFirstBubbleByLabel('Amor');
    fireEvent.click(amor);

    expect(
      await screen.findByText(/O amor é paciente, o amor é bondoso\./i)
    ).toBeInTheDocument();
    expect(await screen.findByText(/O amor é dom de Deus\./i)).toBeInTheDocument();

    const slugs = (fetchNexusTagContent as any).mock.calls.map(
      (c: any[]) => c[0].slug
    );
    expect(slugs).toContain('amor');
  });

  it('renders the suggested badge for tags matching the user spiritual profile', async () => {
    renderWithProviders(<NexusBubbles profileId="ferido_em_busca" />);

    await screen.findAllByRole('button', { name: /Tema:/i });

    expect(
      await screen.findByText(/Sugeridos para sua Jornada/i)
    ).toBeInTheDocument();

    const suggested = await screen.findAllByRole('button', {
      name: /\(Sugerido\)/i,
    });
    expect(suggested.length).toBeGreaterThan(0);
  });

  it('opens the popover when clicking a suggested bubble and loads its content', async () => {
    (fetchNexusTagContent as any).mockResolvedValue([
      {
        id: 'b2',
        type: 'bible',
        content_text: 'Em Cristo temos a paz.',
        title: 'Jo 14,27',
        metadata: {},
      },
    ]);

    renderWithProviders(<NexusBubbles profileId="ferido_em_busca" />);

    const suggested = await screen.findAllByRole('button', {
      name: /\(Sugerido\)/i,
    });
    fireEvent.click(suggested[0]);

    expect(
      await screen.findByText(/Em Cristo temos a paz\./i)
    ).toBeInTheDocument();

    const slugs = (fetchNexusTagContent as any).mock.calls.map(
      (c: any[]) => c[0].slug
    );
    expect(slugs.length).toBeGreaterThan(0);
  });

  it('shows a retry fallback when content fetching fails and recovers on retry', async () => {
    let callCount = 0;
    (fetchNexusTagContent as any).mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        return Promise.reject(new Error('Falha de rede simulada'));
      }
      return Promise.resolve([
        {
          id: 'b-fe-1',
          type: 'bible',
          content_text: 'A fé move montanhas.',
          title: 'Mt 17,20',
          metadata: {},
        },
      ]);
    });

    renderWithProviders(<NexusBubbles />);

    const fe = await findFirstBubbleByLabel('Fé');
    fireEvent.click(fe);

    expect(
      await screen.findByText(/Erro ao carregar conteúdo/i)
    ).toBeInTheDocument();

    const retry = await screen.findByRole('button', {
      name: /Tentar Novamente/i,
    });
    fireEvent.click(retry);

    expect(
      await screen.findByText(/A fé move montanhas\./i)
    ).toBeInTheDocument();
  });

  it('does not refetch a bubble whose content is already loaded when reopened', async () => {
    (fetchNexusTagContent as any).mockResolvedValue([
      {
        id: 'b-oracao-1',
        type: 'bible',
        content_text: 'Orai sem cessar.',
        title: '1 Ts 5,17',
        metadata: {},
      },
    ]);

    renderWithProviders(<NexusBubbles />);

    const oracao = await findFirstBubbleByLabel('Oração');

    fireEvent.click(oracao);
    await screen.findByText(/Orai sem cessar\./i);

    const callsAfterFirstOpen = (fetchNexusTagContent as any).mock.calls.length;

    // Close (Escape) and reopen
    fireEvent.keyDown(document.body, { key: 'Escape', code: 'Escape' });
    await waitFor(() => {
      // popover content removed from DOM
      expect(screen.queryByText(/Orai sem cessar\./i)).not.toBeInTheDocument();
    });

    fireEvent.click(oracao);
    expect(await screen.findByText(/Orai sem cessar\./i)).toBeInTheDocument();

    // No additional fetch call after reopen
    expect((fetchNexusTagContent as any).mock.calls.length).toBe(
      callsAfterFirstOpen
    );
  });

  it('clicking different bubbles in sequence loads each one independently', async () => {
    (fetchNexusTagContent as any).mockImplementation((tag: any) => {
      if (tag.slug === 'amor') {
        return Promise.resolve([
          {
            id: 'amor-b',
            type: 'bible',
            content_text: 'Conteúdo de Amor',
            title: '1 Cor 13',
            metadata: {},
          },
        ]);
      }
      if (tag.slug === 'fe') {
        return Promise.resolve([
          {
            id: 'fe-b',
            type: 'bible',
            content_text: 'Conteúdo de Fé',
            title: 'Hb 11',
            metadata: {},
          },
        ]);
      }
      return Promise.resolve([]);
    });

    renderWithProviders(<NexusBubbles />);

    const amor = await findFirstBubbleByLabel('Amor');
    fireEvent.click(amor);
    expect(await screen.findByText(/Conteúdo de Amor/i)).toBeInTheDocument();

    fireEvent.keyDown(document.body, { key: 'Escape', code: 'Escape' });
    await waitFor(() =>
      expect(screen.queryByText(/Conteúdo de Amor/i)).not.toBeInTheDocument()
    );

    const fe = await findFirstBubbleByLabel('Fé');
    fireEvent.click(fe);
    expect(await screen.findByText(/Conteúdo de Fé/i)).toBeInTheDocument();

    const slugs = (fetchNexusTagContent as any).mock.calls.map(
      (c: any[]) => c[0].slug
    );
    expect(slugs).toEqual(expect.arrayContaining(['amor', 'fe']));
  });
});
