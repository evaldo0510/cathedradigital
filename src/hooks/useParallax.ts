import { useRef, useState, useEffect } from 'react';

export function useParallax(speed = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf: number;
    const onScroll = () => {
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const viewH = window.innerHeight;
        // normalise: 0 when element enters bottom, 1 when it leaves top
        const progress = 1 - (rect.bottom / (viewH + rect.height));
        setOffset(progress * speed * rect.height);
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [speed]);

  return { ref, style: { transform: `translateY(${offset}px)` } };
}
