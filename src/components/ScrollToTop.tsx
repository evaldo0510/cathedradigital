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

    // Voltar/avançar do navegador: preserva scroll (comportamento nativo).
    if (navType === 'POP') return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const behavior: ScrollBehavior = prefersReduced ? 'auto' : 'auto';

    const main = document.getElementById('main-content');
    if (main && typeof main.scrollTo === 'function') {
      main.scrollTo({ top: 0, left: 0, behavior });
    }
    window.scrollTo({ top: 0, left: 0, behavior });
  }, [pathname, hash, navType]);

  return null;
};

export default ScrollToTop;
