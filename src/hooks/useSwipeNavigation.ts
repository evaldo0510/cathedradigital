import { useEffect, useRef } from 'react';
import { telemetry } from '@/utils/navigation-telemetry';

interface SwipeOptions {
  onSwipeLeft?: () => void;   // próximo
  onSwipeRight?: () => void;  // anterior
  onTap?: () => void;         // tap rápido para revelar UI
  threshold?: number;         // px mínimos (opcional, sobrescreve env)
  ratio?: number;            // razão diagonal (opcional, sobrescreve env)
  enabled?: boolean;
}

// Configurações via variáveis de ambiente com fallbacks seguros
const SWIPE_THRESHOLD = Number(import.meta.env.VITE_SWIPE_THRESHOLD) || 80;
const SWIPE_RATIO = Number(import.meta.env.VITE_SWIPE_RATIO) || 2.5;

/**
 * Hook de navegação por gestos no mobile.
 * Detecta swipe horizontal (>= threshold) e tap curto (sem deslocamento).
 * Ignora scroll vertical para não interferir na leitura.
 */
export function useSwipeNavigation({
  onSwipeLeft,
  onSwipeRight,
  onTap,
  threshold = SWIPE_THRESHOLD,
  ratio = SWIPE_RATIO,
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
      // Increased ratio from 1.5 to 2.5 to be more strict
      if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy) * ratio) {
        telemetry.log('Valid Swipe Triggered', 'info', { dx, dy, threshold });
        if (dx < 0) onSwipeLeft?.();
        else onSwipeRight?.();
      } else if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
        telemetry.log('Swipe Below Threshold or Ratio', 'warn', { dx, dy, threshold });
        window.dispatchEvent(new CustomEvent('nav-blocked', { 
          detail: { reason: 'threshold_not_met', dx, dy, threshold } 
        }));
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      // Navegação por setas (acessibilidade e conveniência desktop)
      if (e.key === 'ArrowLeft') {
        onSwipeRight?.();
        onTap?.(); // Revela a UI brevemente como feedback visual
      }
      if (e.key === 'ArrowRight') {
        onSwipeLeft?.();
        onTap?.(); // Revela a UI brevemente como feedback visual
      }
      // Espaço ou Enter para revelar a UI no modo contemplativo
      if (e.key === ' ' || e.key === 'Enter') {
        if (document.activeElement?.tagName === 'BODY' || document.activeElement?.tagName === 'DIV') {
          onTap?.();
        }
      }
    };

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [enabled, threshold, onSwipeLeft, onSwipeRight, onTap]);

}
