import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import InstitutionalVideoSection from '../InstitutionalVideoSection';
import '@testing-library/jest-dom';
import React from 'react';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user' } } })),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    motion: {
      div: React.forwardRef(({ children, ...props }: any, ref: any) => <div {...props} ref={ref}>{children}</div>),
      h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
      p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
      section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
    useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
    useTransform: () => ({ get: () => 0 }),
    useReducedMotion: () => false,
  };
});

// Mock video asset
vi.mock('../../assets/institutional-video.mp4.asset.json', () => ({
  default: { url: 'mock-video-url' }
}));

describe('InstitutionalVideoSection Accessibility', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    document.body.style.overflow = 'unset';
  });

  it('opens modal on play button click and focuses close button', async () => {
    render(<InstitutionalVideoSection />);
    const playBtn = screen.getByLabelText(/Abrir vídeo de apresentação/i);
    fireEvent.click(playBtn);
    
    await waitFor(() => {
      const closeBtn = screen.getByLabelText(/Fechar vídeo de apresentação/i);
      expect(closeBtn).toBeInTheDocument();
      expect(document.activeElement).toBe(closeBtn);
    });
  });

  it('sets scroll lock when modal is open', async () => {
    render(<InstitutionalVideoSection />);
    const playBtn = screen.getByLabelText(/Abrir vídeo de apresentação/i);
    fireEvent.click(playBtn);
    
    await waitFor(() => {
      expect(document.body.style.overflow).toBe('hidden');
    });

    const closeBtn = screen.getByLabelText(/Fechar vídeo de apresentação/i);
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(document.body.style.overflow).toBe('unset');
    });
  });

  it('closes modal on Escape key', async () => {
    render(<InstitutionalVideoSection />);
    fireEvent.click(screen.getByLabelText(/Abrir vídeo de apresentação/i));
    
    await waitFor(() => screen.getByLabelText(/Fechar vídeo de apresentação/i));
    
    fireEvent.keyDown(window, { key: 'Escape' });
    
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('persists playback position in localStorage', async () => {
    render(<InstitutionalVideoSection />);
    fireEvent.click(screen.getByLabelText(/Abrir vídeo de apresentação/i));
    
    const video = await waitFor(() => screen.getByRole('dialog').querySelector('video'));
    if (!video) throw new Error('Video not found');
    
    // Simulate time update
    Object.defineProperty(video, 'currentTime', { value: 10, writable: true });
    fireEvent.timeUpdate(video);
    
    expect(localStorage.getItem('cathedra_video_pos')).toBe('10');
  });

  it('restores playback position on reopen', async () => {
    localStorage.setItem('cathedra_video_pos', '25');
    render(<InstitutionalVideoSection />);
    fireEvent.click(screen.getByLabelText(/Abrir vídeo de apresentação/i));
    
    const video = await waitFor(() => screen.getByRole('dialog').querySelector('video') as HTMLVideoElement);
    // In JSDOM, setting currentTime might not work directly without proper mocks, 
    // but the code should have tried to set it.
    expect(video.currentTime).toBe(25);
  });

  it('maintains circular focus trap with Tab and Shift+Tab', async () => {
    render(<InstitutionalVideoSection />);
    fireEvent.click(screen.getByLabelText(/Abrir vídeo de apresentação/i));
    
    await waitFor(() => screen.getByLabelText(/Fechar vídeo de apresentação/i));
    
    const modal = screen.getByRole('dialog');
    const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), video');
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Start at close button (usually the last or near last)
    lastElement.focus();
    expect(document.activeElement).toBe(lastElement);

    // Tab on last element should focus first element
    fireEvent.keyDown(lastElement, { key: 'Tab' });
    expect(document.activeElement).toBe(firstElement);

    // Shift+Tab on first element should focus last element
    fireEvent.keyDown(firstElement, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(lastElement);
  });
});
