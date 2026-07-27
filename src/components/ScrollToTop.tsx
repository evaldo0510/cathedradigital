/**
 * Sobe ao topo em navegações novas (PUSH/REPLACE) e preserva a posição
 * ao usar voltar/avançar do navegador (POP) — comportamento nativo.
 *
 * Respeita `prefers-reduced-motion`.
 * Se existir um `#main-content` scrollável (layout com scroll interno),
 * ele é resetado; caso contrário, cai em `window`.
 */
import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    // Deep-link com âncora: navegador cuida do scroll para o hash.
    if (hash) return;

    // Voltar/avançar: preserva scroll (comportamento nativo do navegador).
    if (navType === 'POP') return;

    // Reseta window + qualquer container de scroll interno conhecido.
    // Feito no próximo frame para depois do layout do novo route.
    const reset = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      document
        .querySelectorAll<HTMLElement>(
          '#main-content, [data-scroll-container], main, [role="main"]',
        )
        .forEach((el) => {
          if (typeof el.scrollTo === 'function') el.scrollTo(0, 0);
          else el.scrollTop = 0;
        });
    };
    reset();
    const raf = requestAnimationFrame(reset);
    return () => cancelAnimationFrame(raf);
  }, [pathname, hash, navType]);

  return null;
};

export default ScrollToTop;
