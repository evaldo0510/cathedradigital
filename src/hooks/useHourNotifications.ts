/**
 * useHourNotifications — opt-in local notifications for canonical hours.
 *
 * Sprint 3 · Onda C. Base para lembretes locais (sem push server). Persiste
 * preferência em localStorage; agenda apenas para a próxima janela de cada
 * hora ativa e reprograma a cada mudança de dia. Silencioso quando o
 * usuário não concedeu permissão.
 */
import { useCallback, useEffect, useState } from 'react';
import type { Prayer } from './usePrayers';

const STORAGE_KEY = 'cathedra:breviary:hour-notifications';

interface PrayerMeta {
  hour_slug?: string;
  window_start?: string;
  window_end?: string;
}

interface Preferences {
  enabled: boolean;
  hours: Record<string, boolean>; // hour_slug -> on/off
}

const DEFAULT_PREFS: Preferences = {
  enabled: false,
  hours: { laudes: true, vesperas: true, completas: true },
};

function load(): Preferences {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

function persist(prefs: Preferences) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

function minutesFromClock(hhmm?: string): number | null {
  if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return null;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function msUntilNext(nowMin: number, targetMin: number): number {
  const delta = targetMin >= nowMin ? targetMin - nowMin : 24 * 60 - nowMin + targetMin;
  return delta * 60 * 1000;
}

export function useHourNotifications(prayers: Prayer[]) {
  const [prefs, setPrefs] = useState<Preferences>(() => load());
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default',
  );

  const setEnabled = useCallback(async (enabled: boolean) => {
    if (enabled && typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
      const res = await Notification.requestPermission();
      setPermission(res);
      if (res !== 'granted') return;
    }
    const next = { ...prefs, enabled };
    setPrefs(next);
    persist(next);
  }, [prefs]);

  const toggleHour = useCallback((hourSlug: string) => {
    const next = { ...prefs, hours: { ...prefs.hours, [hourSlug]: !prefs.hours[hourSlug] } };
    setPrefs(next);
    persist(next);
  }, [prefs]);

  // Agenda uma notificação por hora ativa (apenas para o próximo disparo).
  useEffect(() => {
    if (!prefs.enabled || permission !== 'granted' || typeof window === 'undefined') return;
    const breviario = prayers.filter((p) => p.slug.startsWith('breviario-'));
    const timers: number[] = [];
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();

    for (const p of breviario) {
      const meta = (p as unknown as { meta?: PrayerMeta }).meta ?? {};
      const slug = meta.hour_slug ?? p.slug.replace(/^breviario-/, '');
      if (!prefs.hours[slug]) continue;
      const start = minutesFromClock(meta.window_start);
      if (start == null) continue;
      const delay = msUntilNext(nowMin, start);
      const id = window.setTimeout(() => {
        try {
          new Notification(`${p.title}`, {
            body: p.subtitle ?? 'É hora da Liturgia das Horas.',
            icon: '/favicon-192.png',
            tag: `cathedra:hour:${slug}`,
          });
        } catch { /* browser bloqueou */ }
      }, delay);
      timers.push(id);
    }
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [prefs, permission, prayers]);

  return { prefs, permission, setEnabled, toggleHour };
}
