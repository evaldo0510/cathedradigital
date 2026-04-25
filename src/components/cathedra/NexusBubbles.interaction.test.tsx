import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

describe('NexusBubbles - Bubble interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (supabase.from as any).mockImplementation(() => buildSupabaseMock());
  });

  it('opens the popover when clicking a regular bubble and loads its content', async () => {
    const user = userEvent.setup();

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

    const amorButton = await screen.findByRole('button', { name: /Tema: Amor/i });
    await user.click(amorButton);

    // Popover header shows the tag label
    await waitFor(() => {
      expect(screen.getAllByText(/Amor/i).length).toBeGreaterThan(0);
    });

    // Content from both categories is rendered
    expect(
      await screen.findByText(/O amor é paciente, o amor é bondoso\./i)
    ).toBeInTheDocument();
    expect(await screen.findByText(/O amor é dom de Deus\./i)).toBeInTheDocument();

    // The fetcher was called exactly once for the clicked tag
    expect(fetchNexusTagContent).toHaveBeenCalledTimes(1);
    expect((fetchNexusTagContent as any).mock.calls[0][0]).toMatchObject({
      slug: 'amor',
      label: 'Amor',
    });
  });

  it('renders the suggested badge for tags matching the user spiritual profile', async () => {
    renderWithProviders(<NexusBubbles profileId="ferido_em_busca" />);

    // Wait for data to load
    await screen.findByRole('button', { name: /Tema: Amor/i });

    // The suggested section header should appear
    expect(
      await screen.findByText(/Sugeridos para sua Jornada/i)
    ).toBeInTheDocument();

    // At least one bubble should carry the "(Sugerido)" aria-label
    const suggested = await screen.findAllByRole('button', {
      name: /\(Sugerido\)/i,
    });
    expect(suggested.length).toBeGreaterThan(0);
  });

  it('opens the popover when clicking a suggested bubble and loads its content', async () => {
    const user = userEvent.setup();

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

    // Find a suggested bubble (the suggestion list contains the same labels but with isSuggested)
    const suggested = await screen.findAllByRole('button', {
      name: /\(Sugerido\)/i,
    });
    await user.click(suggested[0]);

    await waitFor(() => {
      expect(fetchNexusTagContent).toHaveBeenCalledTimes(1);
    });

    expect(
      await screen.findByText(/Em Cristo temos a paz\./i)
    ).toBeInTheDocument();
  });

  it('shows a retry fallback when content fetching fails and recovers on retry', async () => {
    const user = userEvent.setup();

    (fetchNexusTagContent as any).mockRejectedValueOnce(
      new Error('Falha de rede simulada')
    );

    renderWithProviders(<NexusBubbles />);

    const fe = await screen.findByRole('button', { name: /Tema: Fé/i });
    await user.click(fe);

    expect(
      await screen.findByText(/Erro ao carregar conteúdo/i)
    ).toBeInTheDocument();

    // Now succeed on retry
    (fetchNexusTagContent as any).mockResolvedValueOnce([
      {
        id: 'b-fe-1',
        type: 'bible',
        content_text: 'A fé move montanhas.',
        title: 'Mt 17,20',
        metadata: {},
      },
    ]);

    const retry = await screen.findByRole('button', {
      name: /Tentar Novamente/i,
    });
    await user.click(retry);

    expect(
      await screen.findByText(/A fé move montanhas\./i)
    ).toBeInTheDocument();
  });

  it('does not refetch when reopening a bubble whose content is already loaded', async () => {
    const user = userEvent.setup();

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

    const oracao = await screen.findByRole('button', { name: /Tema: Oração/i });

    await user.click(oracao);
    await screen.findByText(/Orai sem cessar\./i);

    // Close (Escape) and reopen
    await user.keyboard('{Escape}');
    await user.click(oracao);

    // Reopened content should still be visible
    expect(await screen.findByText(/Orai sem cessar\./i)).toBeInTheDocument();

    // Fetcher must have been called only once across the two opens
    expect(fetchNexusTagContent).toHaveBeenCalledTimes(1);
  });

  it('clicking different bubbles in sequence loads each one independently', async () => {
    const user = userEvent.setup();

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

    const amor = await screen.findByRole('button', { name: /Tema: Amor/i });
    await user.click(amor);
    expect(await screen.findByText(/Conteúdo de Amor/i)).toBeInTheDocument();

    await user.keyboard('{Escape}');

    const fe = await screen.findByRole('button', { name: /Tema: Fé/i });
    await user.click(fe);
    expect(await screen.findByText(/Conteúdo de Fé/i)).toBeInTheDocument();

    expect(fetchNexusTagContent).toHaveBeenCalledTimes(2);
    const slugs = (fetchNexusTagContent as any).mock.calls.map(
      (c: any[]) => c[0].slug
    );
    expect(slugs).toEqual(expect.arrayContaining(['amor', 'fe']));
  });
});
