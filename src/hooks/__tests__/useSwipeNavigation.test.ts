import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useSwipeNavigation } from '../useSwipeNavigation';

describe('useSwipeNavigation', () => {
  it('should detect keyboard navigation (ArrowRight)', () => {
    const onSwipeLeft = vi.fn();
    renderHook(() => useSwipeNavigation({ onSwipeLeft, enabled: true }));

    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    window.dispatchEvent(event);

    expect(onSwipeLeft).toHaveBeenCalled();
  });

  it('should detect keyboard navigation (ArrowLeft)', () => {
    const onSwipeRight = vi.fn();
    renderHook(() => useSwipeNavigation({ onSwipeRight, enabled: true }));

    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
    window.dispatchEvent(event);

    expect(onSwipeRight).toHaveBeenCalled();
  });

  it('should detect tap/enter to reveal UI', () => {
    const onTap = vi.fn();
    renderHook(() => useSwipeNavigation({ onTap, enabled: true }));

    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    window.dispatchEvent(event);

    expect(onTap).toHaveBeenCalled();
  });

  it('should detect touch swipe left', () => {
    const onSwipeLeft = vi.fn();
    renderHook(() => useSwipeNavigation({ onSwipeLeft, enabled: true, threshold: 50 }));

    // Mock touch events
    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientX: 200, clientY: 100 } as any]
    });
    window.dispatchEvent(touchStart);

    const touchMove = new TouchEvent('touchmove', {
      touches: [{ clientX: 180, clientY: 100 } as any]
    });
    window.dispatchEvent(touchMove);

    const touchEnd = new TouchEvent('touchend', {
      changedTouches: [{ clientX: 100, clientY: 100 } as any]
    });
    window.dispatchEvent(touchEnd);

    expect(onSwipeLeft).toHaveBeenCalled();
  });
});
