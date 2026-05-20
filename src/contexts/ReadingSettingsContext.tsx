import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ReadingSettings {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  fontFamily: 'serif' | 'sans';
  theme: 'paper' | 'sepia' | 'dark' | 'night';
  visualSilence: boolean; // Hides non-essential UI
  reduceAnimations: boolean;
  highContrast: boolean;
  contemplativeMode: boolean;
  lineHeight: 'relaxed' | 'snug' | 'normal';
  fullScreen: boolean;
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
  isLoading: boolean;
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
  fullScreen: false,
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
  const { user, profile, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<ReadingSettings>(() => {
    const stored = localStorage.getItem('cathedra_reading_settings');
    return stored ? JSON.parse(stored) : defaultSettings;
  });

  // Sync with profile if available
  useEffect(() => {
    if (profile?.reading_settings && Object.keys(profile.reading_settings).length > 0) {
      setSettings(prev => ({
        ...prev,
        ...(profile.reading_settings as any)
      }));
    }
    setIsLoading(false);
  }, [profile?.reading_settings]);

  useEffect(() => {
    localStorage.setItem('cathedra_reading_settings', JSON.stringify(settings));
    
    // Apply theme to body
    const root = document.documentElement;
    root.classList.remove('reading-theme-paper', 'reading-theme-sepia', 'reading-theme-dark', 'reading-theme-night');
    root.classList.add(`reading-theme-${settings.theme}`);
    
    // Night mode specific
    if (settings.theme === 'night') {
      root.classList.add('reading-night');
      root.classList.add('dark');
    } else if (settings.theme === 'dark') {
      root.classList.remove('reading-night');
      root.classList.add('dark');
    } else {
      root.classList.remove('reading-night');
      root.classList.remove('dark');
    }
    
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

    if (settings.fullScreen) {
      root.classList.add('full-screen-mode');
    } else {
      root.classList.remove('full-screen-mode');
    }

  }, [settings]);

  const updateSettings = useCallback(async (newSettings: Partial<ReadingSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({
          reading_settings: updated as any
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error syncing reading settings:', error);
      } else {
        refreshProfile();
      }
    }
  }, [settings, user, refreshProfile]);

  const resetSettings = useCallback(async () => {
    setSettings(defaultSettings);
    if (user) {
      await supabase
        .from('profiles')
        .update({
          reading_settings: defaultSettings as any
        })
        .eq('id', user.id);
      refreshProfile();
    }
  }, [user, refreshProfile]);

  return (
    <ReadingSettingsContext.Provider value={{ settings, updateSettings, resetSettings, isLoading }}>
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