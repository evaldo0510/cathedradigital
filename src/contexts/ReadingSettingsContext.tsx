import React, { createContext, useContext, useState, useEffect } from 'react';

interface ReadingSettings {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  fontFamily: 'serif' | 'sans';
  theme: 'paper' | 'sepia' | 'dark' | 'night';
  visualSilence: boolean; // Hides non-essential UI
  reduceAnimations: boolean;
  highContrast: boolean;
  contemplativeMode: boolean;
  lineHeight: 'relaxed' | 'snug' | 'normal';
  shortcuts: {
    bible: string;
    catechism: string;
    magisterium: string;
    logos: string;
  };
  logosHistoryLimit: number;
}

interface ReadingSettingsContextType {
  settings: ReadingSettings;
  updateSettings: (newSettings: Partial<ReadingSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: ReadingSettings = {
  fontSize: 'medium',
  fontFamily: 'serif',
  theme: 'paper',
  visualSilence: false,
  reduceAnimations: false,
  highContrast: false,
  contemplativeMode: false,
  lineHeight: 'relaxed',
  shortcuts: {
    bible: 'b',
    catechism: 'c',
    magisterium: 'm',
    logos: 'l',
  },
  logosHistoryLimit: 20,
};

const ReadingSettingsContext = createContext<ReadingSettingsContextType | undefined>(undefined);

export const ReadingSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ReadingSettings>(() => {
    const stored = localStorage.getItem('cathedra_reading_settings');
    return stored ? JSON.parse(stored) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('cathedra_reading_settings', JSON.stringify(settings));
    
    // Apply theme to body
    const root = document.documentElement;
    root.classList.remove('reading-theme-paper', 'reading-theme-sepia', 'reading-theme-dark', 'reading-theme-night');
    root.classList.add(`reading-theme-${settings.theme}`);
    
    if (settings.visualSilence) {
      root.classList.add('visual-silence');
    } else {
      root.classList.remove('visual-silence');
    }

    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    if (settings.contemplativeMode) {
      root.classList.add('contemplative-mode');
    } else {
      root.classList.remove('contemplative-mode');
    }

    if (settings.reduceAnimations) {
      root.classList.add('reduce-animations');
    } else {
      root.classList.remove('reduce-animations');
    }

  }, [settings]);

  const updateSettings = (newSettings: Partial<ReadingSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <ReadingSettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </ReadingSettingsContext.Provider>
  );
};

export const useReadingSettings = () => {
  const context = useContext(ReadingSettingsContext);
  if (context === undefined) {
    throw new Error('useReadingSettings must be used within a ReadingSettingsProvider');
  }
  return context;
};
