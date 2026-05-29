
import { useEffect } from 'react';
import { getContrastRatio, getWCAGLevel } from './a11y-utils';

/**
 * A hook that monitors the current theme's primary contrast 
 * and warns in the console if it falls below the premium standard (4.5:1).
 */
export const useA11yGuard = (enabled = true) => {
  useEffect(() => {
    if (!enabled || process.env.NODE_ENV === 'production') return;

    const checkContrast = () => {
      const style = getComputedStyle(document.documentElement);
      const bg = style.getPropertyValue('--background').trim();
      const fg = style.getPropertyValue('--foreground').trim();
      
      if (bg && fg) {
        const ratio = getContrastRatio(bg, fg);
        const level = getWCAGLevel(ratio);
        
        if (ratio < 4.5) {
          console.warn(
            `%c[Cathedra A11y Guard] Low contrast detected: ${ratio}:1 (${level}). %cLegibility might be compromised in this theme state.`,
            'color: #ff9800; font-weight: bold;',
            'color: inherit;'
          );
        } else {
          console.log(
            `%c[Cathedra A11y Guard] Premium contrast verified: ${ratio}:1 (${level}).`,
            'color: #4caf50; font-weight: bold;'
          );
        }
      }
    };

    // Check on load and when class changes (theme change)
    checkContrast();
    const observer = new MutationObserver(checkContrast);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, [enabled]);
};
