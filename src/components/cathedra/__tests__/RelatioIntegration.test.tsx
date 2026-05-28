import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Relatio from '../Relatio';
import { ReadingSettingsProvider } from '@/contexts/ReadingSettingsContext';
import { AuthProvider } from '@/hooks/useAuth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock child components to isolate Relatio
vi.mock('./BibleVersePopover', () => ({ default: () => <div data-testid="bible-popover" /> }));
vi.mock('./CatechismPopover', () => ({ default: () => <div data-testid="catechism-popover" /> }));
vi.mock('./MagisteriumPopover', () => ({ default: () => <div data-testid="magisterium-popover" /> }));

// Mock nexusContent
vi.mock('@/lib/nexusContent', () => ({
  fetchNexusTagContent: vi.fn().mockResolvedValue([
    { id: '1', title: 'Test Connection 1', content_text: 'Content 1', type: 'bible', metadata: { tags: ['grace'] } },
    { id: '2', title: 'Test Connection 2', content_text: 'Content 2', type: 'catechism', metadata: { tags: ['faith'] } },
    { id: '3', title: 'Test Connection 3', content_text: 'Content 3', type: 'magisterium', metadata: { tags: ['love'] } },
    { id: '4', title: 'Test Connection 4', content_text: 'Content 4', type: 'saint', metadata: { tags: ['hope'] } },
    { id: '5', title: 'Test Connection 5', content_text: 'Content 5', type: 'bible', metadata: { tags: ['grace'] } },
  ])
}));

const queryClient = new QueryClient();

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ReadingSettingsProvider>
        {children}
      </ReadingSettingsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

describe('Relatio Ranking Stability', () => {
  it('maintains the same order when showing more and collapsing', async () => {
    const onSelectLogosQuery = vi.fn();
    render(
      <Wrapper>
        <Relatio 
          context={{ type: 'bible', tags: ['grace', 'faith'] }} 
          onSelectLogosQuery={onSelectLogosQuery} 
        />
      </Wrapper>
    );

    // Wait for connections to load
    const titles = await screen.findAllByRole('heading', { level: 4 });
    const initialOrder = titles.map(t => t.textContent);

    // Show More
    const showMoreBtn = screen.getByText(/Ver mais/i);
    fireEvent.click(showMoreBtn);

    const expandedTitles = await screen.findAllByRole('heading', { level: 4 });
    const expandedOrder = expandedTitles.map(t => t.textContent);

    // Check that the first elements match the initial order
    expect(expandedOrder.slice(0, initialOrder.length)).toEqual(initialOrder);

    // Collapse
    const collapseBtn = screen.getByText(/Recolher/i);
    fireEvent.click(collapseBtn);

    const collapsedTitles = await screen.findAllByRole('heading', { level: 4 });
    const collapsedOrder = collapsedTitles.map(t => t.textContent);

    expect(collapsedOrder).toEqual(initialOrder);
  });
});

describe('Relatio Logos Integration', () => {
  it('sends correct prompt and metadata to Logos IA', async () => {
    const onSelectLogosQuery = vi.fn();
    render(
      <Wrapper>
        <Relatio 
          context={{ type: 'bible', tags: ['grace'] }} 
          onSelectLogosQuery={onSelectLogosQuery} 
        />
      </Wrapper>
    );

    const connectionCard = await screen.findByText('Test Connection 1');
    const logosBtn = screen.getAllByTitle(/Pedir explicação à Logos IA/i)[0];
    
    fireEvent.click(logosBtn);

    expect(onSelectLogosQuery).toHaveBeenCalledWith(
      expect.stringContaining('Test Connection 1')
    );
    expect(onSelectLogosQuery).toHaveBeenCalledWith(
      expect.stringContaining('Context: bible')
    );
  });

  it('prevents multiple requests when clicking logos button repeatedly', async () => {
    const onSelectLogosQuery = vi.fn();
    render(
      <Wrapper>
        <Relatio 
          context={{ type: 'bible', tags: ['grace'] }} 
          onSelectLogosQuery={onSelectLogosQuery} 
        />
      </Wrapper>
    );

    const logosBtn = await screen.findAllByTitle(/Pedir explicação à Logos IA/i);
    
    // Click multiple times
    fireEvent.click(logosBtn[0]);
    fireEvent.click(logosBtn[0]);
    fireEvent.click(logosBtn[0]);

    // Should only be called once due to internal lock
    expect(onSelectLogosQuery).toHaveBeenCalledTimes(1);
  });
});
