import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'cathedra:nexus-high-contrast';
const ATTR = 'data-nexus-contrast';

function readInitial(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function applyAttr(enabled: boolean) {
  if (typeof document === 'undefined') return;
  if (enabled) {
    document.documentElement.setAttribute(ATTR, 'high');
  } else {
    document.documentElement.removeAttribute(ATTR);
  }
}

/**
 * Alto contraste para as bolhas do Nexus.
 * Persistido em localStorage, aplicado via atributo no <html>
 * para que CSS isole as overrides (ver index.css).
 */
export function useHighContrast() {
  const [enabled, setEnabled] = useState<boolean>(readInitial);

  useEffect(() => {
    applyAttr(enabled);
    try {
      window.localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
    } catch {
      /* storage indisponível — segue sem persistência */
    }
  }, [enabled]);

  const toggle = useCallback(() => setEnabled((v) => !v), []);

  return { enabled, toggle, setEnabled };
}
