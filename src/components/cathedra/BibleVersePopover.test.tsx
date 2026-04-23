import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import BibleVersePopover from './BibleVersePopover';

// Mock supabase client (popover triggers a fetch on open)
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { verses: [] }, error: null }),
    },
  },
}));

function LocationProbe() {
  const loc = useLocation();
  return (
    <div data-testid="probe">
      {loc.pathname}
      {loc.search}
    </div>
  );
}

function renderWithRouter(ui: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={['/start']}>
      <Routes>
        <Route path="/start" element={<>{ui}</>} />
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('BibleVersePopover navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('default navigation includes book, ch AND v in the URL', async () => {
    renderWithRouter(
      <BibleVersePopover abbr="Jo" chapter={3} verse={16} label="Jo 3,16" />
    );

    // Open popover — triggers fetch
    fireEvent.click(screen.getByRole('button', { name: 'Jo 3,16' }));

    const goBtn = await screen.findByRole('button', { name: /Ir ao versículo 16/i });
    fireEvent.click(goBtn);

    await waitFor(() => {
      const probe = screen.getByTestId('probe');
      expect(probe.textContent).toContain('/bible');
      expect(probe.textContent).toContain('book=Jo');
      expect(probe.textContent).toContain('ch=3');
      expect(probe.textContent).toContain('v=16');
    });
  });

  it('omits v param when verse is not provided', async () => {
    renderWithRouter(
      <BibleVersePopover abbr="Mt" chapter={5} label="Mt 5" />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mt 5' }));
    const openBtn = await screen.findByRole('button', { name: /Abrir completo/i });
    fireEvent.click(openBtn);

    await waitFor(() => {
      const probe = screen.getByTestId('probe');
      expect(probe.textContent).toContain('book=Mt');
      expect(probe.textContent).toContain('ch=5');
      expect(probe.textContent).not.toContain('v=');
    });
  });

  it('forwards verse to onNavigate override (regression: never just abbr+chapter)', async () => {
    const onNavigate = vi.fn();
    renderWithRouter(
      <BibleVersePopover
        abbr="1Cor"
        chapter={13}
        verse={4}
        label="1Cor 13,4"
        onNavigate={onNavigate}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '1Cor 13,4' }));
    const goBtn = await screen.findByRole('button', { name: /Ir ao versículo 4/i });
    fireEvent.click(goBtn);

    expect(onNavigate).toHaveBeenCalledWith('1Cor', 13, 4);
  });
});
