import { useState, useEffect, useCallback } from 'react';

type ReadingMode = 'normal' | 'night';

const STORAGE_KEY = 'cathedra_reading_mode';

export function useReadingMode() {
  const [mode, setMode] = useState<ReadingMode>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEY) as ReadingMode) || 'normal';
    } catch {
      return 'normal';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'night') {
      root.classList.add('reading-night');
    } else {
      root.classList.remove('reading-night');
    }
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {}
  }, [mode]);

  const toggle = useCallback(() => {
    setMode(prev => (prev === 'normal' ? 'night' : 'normal'));
  }, []);

  return { mode, toggle, isNight: mode === 'night' };
}
