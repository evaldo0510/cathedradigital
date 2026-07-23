/**
 * Renovação automática da sessão + "lembrar dispositivo".
 *
 * Complementa `autoRefreshToken` do Supabase disparando um refresh silencioso
 * ao voltar à aba/tela para prevenir pedidos repetidos de autenticação.
 */
import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from '@/lib/analytics';

const REMEMBER_KEY = 'cathedra_remember_device';
const LAST_REFRESH_KEY = 'cathedra_last_refresh_at';
const MIN_INTERVAL_MS = 5 * 60 * 1000; // 5 min

export function isDeviceRemembered(): boolean {
  try {
    return localStorage.getItem(REMEMBER_KEY) !== '0';
  } catch {
    return true;
  }
}

export function setDeviceRemembered(value: boolean): void {
  try {
    localStorage.setItem(REMEMBER_KEY, value ? '1' : '0');
    trackEvent('session_remember_device_toggle', { value });
  } catch {
    /* noop */
  }
}

async function silentRefresh(reason: string) {
  try {
    const now = Date.now();
    const last = Number(localStorage.getItem(LAST_REFRESH_KEY) || '0');
    if (now - last < MIN_INTERVAL_MS) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const expiresAt = (session.expires_at ?? 0) * 1000;
    // renova quando faltam < 10 minutos ou já expirou
    if (expiresAt && expiresAt - now > 10 * 60 * 1000) return;

    const { error } = await supabase.auth.refreshSession();
    if (!error) {
      localStorage.setItem(LAST_REFRESH_KEY, String(now));
      trackEvent('session_silent_refresh', { reason });
    }
  } catch {
    /* silencioso — nunca interromper UX */
  }
}

let installed = false;

export function installSessionRenewal(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  const onVisibility = () => {
    if (document.visibilityState === 'visible' && isDeviceRemembered()) {
      void silentRefresh('visibility');
    }
  };
  const onFocus = () => {
    if (isDeviceRemembered()) void silentRefresh('focus');
  };

  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('focus', onFocus);
}
