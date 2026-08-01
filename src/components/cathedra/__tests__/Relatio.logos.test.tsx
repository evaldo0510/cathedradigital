import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Relatio from '../Relatio';
import * as nexusContent from '@/lib/nexusContent';

// Mock dependencies
vi.mock('@/lib/nexusContent', () => ({
  fetchNexusTagContent: vi.fn(),
}));

vi.mock('@/contexts/ReadingSettingsContext', async () => {
  const actual = await vi.importActual<typeof import('@/contexts/ReadingSettingsContext')>('@/contexts/ReadingSettingsContext');
  return {
    ...actual,

  useReadingSettings: () => ({
    settings: { relatio: { enabled: true } }
  })
};
});

vi.mock('@/hooks/useFavorites', () => ({
  useFavorites: () => ({
    toggleFavorite: vi.fn(),
    isFavorite: vi.fn().mockReturnValue(false)
  })
}));

vi.mock('@/hooks/useAuth', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useAuth')>('@/hooks/useAuth');
  return {
    ...actual,

  useAuth: () => ({ user: { id: 'test-user' } })
};
});

describe('Relatio Component - Logos Interaction', () => {
  it('opens Logos drawer with correct prompt when clicking sparkles button', async () => {
    const mockOnSelectLogosQuery = vi.fn();
    const mockConnections = [{
      id: '1',
      title: 'Catecismo 101',
      type: 'catechism',
      content_text: 'Test content',
      metadata: {}
    }];
    
    vi.mocked(nexusContent.fetchNexusTagContent).mockResolvedValue(mockConnections);

    render(
      <Relatio 
        context={{ type: 'bible', id: 'gen-1', tags: ['creation'] }}
        onSelectLogosQuery={mockOnSelectLogosQuery}
      />
    );

    // Wait for dynamic connections to load
    await waitFor(() => {
      expect(screen.getByText('Catecismo 101')).toBeInTheDocument();
    });

    const sparklesButton = screen.getByTitle('Pedir explicação à Logos IA');
    fireEvent.click(sparklesButton);

    expect(mockOnSelectLogosQuery).toHaveBeenCalledWith(
      expect.stringContaining('Catecismo 101')
    );
  });
});
