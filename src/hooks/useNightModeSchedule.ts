import { useEffect } from 'react';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';

/**
 * Ativa modo noturno automaticamente entre nightStart e nightEnd
 * quando settings.nightSchedule.enabled === true.
 * Transição é gradual via CSS (.reading-night transition).
 */
export function useNightModeSchedule() {
  const { settings, updateSettings } = useReadingSettings();

  useEffect(() => {
    const schedule = settings.nightSchedule;
    if (!schedule?.enabled) return;

    const check = () => {
      const now = new Date();
      const minutes = now.getHours() * 60 + now.getMinutes();
      const [sh, sm] = schedule.start.split(':').map(Number);
      const [eh, em] = schedule.end.split(':').map(Number);
      const startM = sh * 60 + sm;
      const endM = eh * 60 + em;

      // Janela noturna (cruzando meia-noite)
      const inNight = startM <= endM
        ? minutes >= startM && minutes < endM
        : minutes >= startM || minutes < endM;

      const shouldBeNight = inNight;
      const isNight = settings.theme === 'night';
      if (shouldBeNight && !isNight) {
        updateSettings({ theme: 'night' });
      } else if (!shouldBeNight && isNight) {
        updateSettings({ theme: 'paper' });
      }
    };

    check();
    const id = window.setInterval(check, 60_000);
    return () => window.clearInterval(id);
  }, [settings.nightSchedule, settings.theme, updateSettings]);
}
