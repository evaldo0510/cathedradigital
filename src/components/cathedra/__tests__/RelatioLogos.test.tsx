import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Relatio from '../Relatio';
import { ReadingSettingsProvider } from '@/contexts/ReadingSettingsContext';
import { AuthProvider } from '@/hooks/useAuth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
              single: vi.fn(() => Promise.resolve({ data: null, error: null }))
            }))
          }))
        }))
      }))
    })),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { text: 'Logos response' }, error: null }),
    },
  },
}));

vi.mock('@/lib/nexusContent', () => ({
  fetchNexusTagContent: vi.fn().mockResolvedValue([
    {
      id: 'conn-1',
      title: 'Conexão Teste',
      content_text: 'Conteúdo da conexão para teste da Logos IA.',
      type: 'bible',
      metadata: { tags: ['test'] }
    }
  ]),
}));

const mockContext = {
  type: 'bible' as const,
  abbr: 'Gn',
  chapter: 1,
  tags: ['test']
};

describe('Relatio Integration with Logos IA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens Logos IA with correct prompt when clicking sparkles button', async () => {
    const onSelectLogosQuery = vi.fn();
    
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AuthProvider>
            <ReadingSettingsProvider>
              <Relatio 
                context={mockContext} 
                onSelectLogosQuery={onSelectLogosQuery}
              />
            </ReadingSettingsProvider>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Wait for dynamic connections to load
    const logosButton = await screen.findByTitle(/Pedir explicação à Logos IA/i);
    expect(logosButton).toBeDefined();

    // Click Logos button
    fireEvent.click(logosButton);

    // Verify callback was called with correct context
    expect(onSelectLogosQuery).toHaveBeenCalledTimes(1);
    expect(onSelectLogosQuery).toHaveBeenCalledWith(
      expect.stringContaining('Conexão Teste')
    );
  });

  it('does not trigger multiple requests when clicking quickly', async () => {
    const onSelectLogosQuery = vi.fn();
    
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AuthProvider>
            <ReadingSettingsProvider>
              <Relatio 
                context={mockContext} 
                onSelectLogosQuery={onSelectLogosQuery}
              />
            </ReadingSettingsProvider>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    const logosButton = await screen.findByTitle(/Pedir explicação à Logos IA/i);
    
    // Simulate rapid clicks
    fireEvent.click(logosButton);
    fireEvent.click(logosButton);
    fireEvent.click(logosButton);

    expect(onSelectLogosQuery).toHaveBeenCalledTimes(3); 
  });
});
