import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'cathedra:nexus-high-contrast';
const ATTR = 'data-nexus-contrast';

function readLocal(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeLocal(value: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
  } catch {
    /* ignore */
  }
}

function applyAttr(enabled: boolean) {
  if (typeof document === 'undefined') return;
  if (enabled) document.documentElement.setAttribute(ATTR, 'high');
  else document.documentElement.removeAttribute(ATTR);
}

/**
 * Preferência de alto contraste das bolhas do Nexus.
 * - Inicia do localStorage (rápido, sem flicker).
 * - Hidrata do perfil quando o usuário está autenticado.
 * - Persiste em ambos os lados ao alternar.
 */
export function useHighContrast() {
  const [enabled, setEnabled] = useState<boolean>(readLocal);
  const hydratedFromServer = useRef(false);

  // aplica + persiste local sempre que muda
  useEffect(() => {
    applyAttr(enabled);
    writeLocal(enabled);
  }, [enabled]);

  // hidrata do servidor uma vez por sessão
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const { data, error } = await supabase
          .from('profiles')
          .select('nexus_high_contrast')
          .eq('id', user.id)
          .maybeSingle();
        if (cancelled || error || !data) return;
        const serverValue = Boolean((data as { nexus_high_contrast?: boolean }).nexus_high_contrast);
        hydratedFromServer.current = true;
        if (serverValue !== enabled) setEnabled(serverValue);
      } catch {
        /* sem rede / sem sessão — segue com localStorage */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistRemote = useCallback(async (value: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from('profiles')
        .update({ nexus_high_contrast: value })
        .eq('id', user.id);
    } catch {
      /* offline / sem sessão — localStorage já guardou */
    }
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      void persistRemote(next);
      return next;
    });
  }, [persistRemote]);

  return { enabled, toggle, setEnabled };
}
