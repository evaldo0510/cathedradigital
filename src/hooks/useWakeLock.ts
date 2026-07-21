/**
 * useWakeLock — mantém a tela acordada durante a celebração.
 * Fallback silencioso quando a API não é suportada.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

type WakeLockSentinel = { released: boolean; release: () => Promise<void>; addEventListener: (t: string, cb: () => void) => void };

export function useWakeLock(active: boolean) {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const [supported, setSupported] = useState(false);
  const [engaged, setEngaged] = useState(false);

  useEffect(() => {
    setSupported(typeof navigator !== 'undefined' && 'wakeLock' in navigator);
  }, []);

  const request = useCallback(async () => {
    try {
      // @ts-ignore experimental API
      const s = await navigator.wakeLock?.request('screen');
      if (s) {
        sentinelRef.current = s;
        setEngaged(true);
        s.addEventListener?.('release', () => setEngaged(false));
      }
    } catch {
      setEngaged(false);
    }
  }, []);

  const release = useCallback(async () => {
    try {
      await sentinelRef.current?.release();
    } catch {}
    sentinelRef.current = null;
    setEngaged(false);
  }, []);

  useEffect(() => {
    if (!supported) return;
    if (active) {
      request();
      const onVis = () => {
        if (document.visibilityState === 'visible' && active) request();
      };
      document.addEventListener('visibilitychange', onVis);
      return () => {
        document.removeEventListener('visibilitychange', onVis);
        release();
      };
    } else {
      release();
    }
  }, [active, supported, request, release]);

  return { supported, engaged };
}
