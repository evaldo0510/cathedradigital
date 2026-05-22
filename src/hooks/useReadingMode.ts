import { useCallback } from 'react';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';

export function useReadingMode() {
  const { settings, updateSettings } = useReadingSettings();

  const toggle = useCallback(() => {
    updateSettings({ theme: settings.theme === 'night' ? 'paper' : 'night' });
  }, [settings.theme, updateSettings]);

  return { 
    mode: settings.theme === 'night' ? 'night' : 'normal', 
    toggle, 
    isNight: settings.theme === 'night' 
  };
}
