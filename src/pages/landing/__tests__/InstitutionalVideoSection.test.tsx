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

// Mock HTMLMediaElement
window.HTMLMediaElement.prototype.play = vi.fn().mockImplementation(() => Promise.resolve());
window.HTMLMediaElement.prototype.pause = vi.fn();
window.HTMLMediaElement.prototype.load = vi.fn();

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user' } } })),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        insert: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}));

// Mock framer-motion minimally
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    useReducedMotion: () => false,
    useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
    useTransform: () => ({ get: () => 0 }),
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
    
    // Mock currentTime property
    let time = 0;
    Object.defineProperty(video, 'currentTime', { 
      get: () => time,
      set: (val) => { time = val; },
      configurable: true 
    });
    
    time = 10;
    fireEvent.timeUpdate(video);
    
    expect(localStorage.getItem('cathedra_video_pos')).toBe('10');
  });

  it('maintains circular focus trap', async () => {
    render(<InstitutionalVideoSection />);
    fireEvent.click(screen.getByLabelText(/Abrir vídeo de apresentação/i));
    
    await waitFor(() => screen.getByLabelText(/Fechar vídeo de apresentação/i));
    
    const modal = screen.getByRole('dialog');
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), video';
    const focusableElements = modal.querySelectorAll(focusableSelector);
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // The order should be: Select -> Mute Btn -> Close Btn -> Video
    // lastElement should be video
    
    lastElement.focus();
    expect(document.activeElement).toBe(lastElement);

    fireEvent.keyDown(lastElement, { key: 'Tab' });
    expect(document.activeElement).toBe(firstElement);

    fireEvent.keyDown(firstElement, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(lastElement);
  });
});
