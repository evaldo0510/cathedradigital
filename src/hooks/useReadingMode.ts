import { useState, useEffect, useCallback } from 'react';

type ReadingMode = 'normal' | 'night' | 'sepia';

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
    root.classList.remove('reading-night', 'reading-sepia');
    
    if (mode === 'night') {
      root.classList.add('reading-night');
    } else if (mode === 'sepia') {
      root.classList.add('reading-sepia');
    }
    
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {}
  }, [mode]);

  const toggle = useCallback(() => {
    setMode(prev => {
      if (prev === 'normal') return 'sepia';
      if (prev === 'sepia') return 'night';
      return 'normal';
    });
  }, []);

  const setReadingMode = useCallback((newMode: ReadingMode) => {
    setMode(newMode);
  }, []);

  return { mode, toggle, setReadingMode, isNight: mode === 'night', isSepia: mode === 'sepia' };
}
