import { useEffect, useRef } from 'react';

interface SwipeOptions {
  onSwipeLeft?: () => void;   // próximo
  onSwipeRight?: () => void;  // anterior
  onTap?: () => void;         // tap rápido para revelar UI
  threshold?: number;         // px mínimos
  enabled?: boolean;
}

/**
 * Hook de navegação por gestos no mobile.
 * Detecta swipe horizontal (>= threshold) e tap curto (sem deslocamento).
 * Ignora scroll vertical para não interferir na leitura.
 */
export function useSwipeNavigation({
  onSwipeLeft,
  onSwipeRight,
  onTap,
  threshold = 60,
  enabled = true,
}: SwipeOptions) {
  const startX = useRef(0);
  const startY = useRef(0);
  const startT = useRef(0);
  const moved = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      startX.current = t.clientX;
      startY.current = t.clientY;
      startT.current = Date.now();
      moved.current = false;
    };

    const onMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (Math.abs(t.clientX - startX.current) > 8 || Math.abs(t.clientY - startY.current) > 8) {
        moved.current = true;
      }
    };

    const onEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      const dx = t.clientX - startX.current;
      const dy = t.clientY - startY.current;
      const dt = Date.now() - startT.current;

      // Tap rápido sem deslocamento significativo
      if (!moved.current && dt < 280 && Math.abs(dx) < 8 && Math.abs(dy) < 8) {
        onTap?.();
        return;
      }

      // Swipe horizontal (predominante sobre vertical)
      if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0) onSwipeLeft?.();
        else onSwipeRight?.();
      }
    };

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [enabled, threshold, onSwipeLeft, onSwipeRight, onTap]);
}
