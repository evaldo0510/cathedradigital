import { useState, useEffect, useCallback } from 'react';

export type ReadingTheme = 'normal' | 'night' | 'sepia' | 'paper';

export interface ReadingPreferences {
  theme: ReadingTheme;
  fontSize: number; // in pixels
  lineHeight: number; // multiplier
  maxWidth: number; // in pixels or ch
  sepiaIntensity: number; // 0 to 100
  fontFamily: 'serif' | 'sans' | 'monastery';
}

const STORAGE_KEY = 'cathedra_reading_prefs';

const DEFAULT_PREFS: ReadingPreferences = {
  theme: 'normal',
  fontSize: 18,
  lineHeight: 1.8,
  maxWidth: 65,
  sepiaIntensity: 100,
  fontFamily: 'monastery'
};

export function useReadingMode() {
  const [prefs, setPrefs] = useState<ReadingPreferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULT_PREFS, ...JSON.parse(stored) } : DEFAULT_PREFS;
    } catch {
      return DEFAULT_PREFS;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Theme classes
    root.classList.remove('reading-night', 'reading-sepia', 'reading-paper');
    if (prefs.theme !== 'normal') {
      root.classList.add(`reading-${prefs.theme}`);
    }
    
    // CSS Variables
    root.style.setProperty('--reader-font-size', `${prefs.fontSize}px`);
    root.style.setProperty('--reader-line-height', `${prefs.lineHeight}`);
    root.style.setProperty('--reader-max-width', `${prefs.maxWidth}ch`);
    root.style.setProperty('--reader-sepia-intensity', `${prefs.sepiaIntensity}%`);
    
    const fontMap = {
      serif: "'Playfair Display', serif",
      sans: "'Inter', sans-serif",
      monastery: "'EB Garamond', serif"
    };
    root.style.setProperty('--reader-font-family', fontMap[prefs.fontFamily]);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {}
  }, [prefs]);

  const updatePrefs = useCallback((newPrefs: Partial<ReadingPreferences>) => {
    setPrefs(prev => ({ ...prev, ...newPrefs }));
  }, []);

  const toggleTheme = useCallback(() => {
    const themes: ReadingTheme[] = ['normal', 'sepia', 'paper', 'night'];
    const nextIdx = (themes.indexOf(prefs.theme) + 1) % themes.length;
    updatePrefs({ theme: themes[nextIdx] });
  }, [prefs.theme, updatePrefs]);

  return { 
    prefs, 
    updatePrefs, 
    toggleTheme, 
    mode: prefs.theme,
    isNight: prefs.theme === 'night', 
    isSepia: prefs.theme === 'sepia' 
  };
}
