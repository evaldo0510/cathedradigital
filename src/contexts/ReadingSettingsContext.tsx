import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ReadingSettings {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  fontFamily: 'serif' | 'sans';
  theme: 'paper' | 'sepia' | 'dark' | 'night';
  visualSilence: boolean;
  reduceAnimations: boolean;
  totalSilence: boolean;
  highContrast: boolean;
  visibleFocus: boolean;
  contemplativeMode: boolean;
  autoHideUI: boolean; // Mobile: oculta interface ao ler; reaparece com toque
  fullScreen: boolean;
  lineSpacing: 'tight' | 'normal' | 'wide';
  letterSpacing: 'tight' | 'normal' | 'wide';
  sideMargins: 'standard' | 'comfortable' | 'wide';
  columnWidth: number; // ch — coluna ideal (45-90)
  contrast: 'normal' | 'soft' | 'high';
  resumeBehavior: 'always' | 'never' | 'once' | 'confirm';
  reminders: {
    enabled: boolean;
    time: string;
  };
  nightSchedule: {
    enabled: boolean;
    start: string;
    end: string;
  };
  shortcuts: {
    bible: string;
    catechism: string;
    magisterium: string;
    logos: string;
    highlight: string;
    note: string;
    clear: string;
  };
  logosHistoryLimit: number;
  relatio: {
    enabled: boolean;
    intensity: 'subtle' | 'standard' | 'deep';
    showBible: boolean;
    showCatechism: boolean;
    showMagisterium: boolean;
    showSaints: boolean;
    relevanceByProgress: boolean;
  };
  logosSuggestions: 'always' | 'first_selection' | 'never';
  lastUpdated?: number; // Timestamp for local vs remote sync
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
  totalSilence: false,
  highContrast: true,
  visibleFocus: false,
  contemplativeMode: false,
  autoHideUI: false,
  lineSpacing: 'normal',
  letterSpacing: 'normal',
  sideMargins: 'standard',
  columnWidth: 68,
  contrast: 'high',
  resumeBehavior: 'confirm',
  reminders: {
    enabled: false,
    time: '08:00',
  },
  nightSchedule: {
    enabled: false,
    start: '20:00',
    end: '06:00',
  },
  fullScreen: false,
  shortcuts: {
    bible: 'b',
    catechism: 'c',
    magisterium: 'm',
    logos: 'l',
    highlight: 'h',
    note: 'n',
    clear: 'Escape',
  },
  logosHistoryLimit: 20,
  relatio: {
    enabled: true,
    intensity: 'standard',
    showBible: true,
    showCatechism: true,
    showMagisterium: true,
    showSaints: true,
    relevanceByProgress: true,
  },
  logosSuggestions: 'always',
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
      const remoteSettings = profile.reading_settings as ReadingSettings;
      
      setSettings(prev => {
        // Only update if remote settings are actually different AND not older than local
        // If remote has no timestamp but local has, we might want to keep local
        const remoteTimestamp = remoteSettings.lastUpdated || 0;
        const localTimestamp = prev.lastUpdated || 0;

        if (remoteTimestamp < localTimestamp) {
          console.log('Keeping local settings as they are newer than remote profile');
          return prev;
        }

        const remoteStr = JSON.stringify(remoteSettings);
        const prevStr = JSON.stringify(prev);
        if (remoteStr === prevStr) return prev;
        
        console.log('Updating settings from remote profile');
        return { ...prev, ...remoteSettings };
      });
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

    // Apply Contrast
    root.classList.remove('contrast-soft', 'contrast-high');
    if (settings.contrast !== 'normal') {
      root.classList.add(`contrast-${settings.contrast}`);
    }

    // Apply Spacing
    root.setAttribute('data-line-spacing', settings.lineSpacing);
    root.setAttribute('data-letter-spacing', settings.letterSpacing);
    root.setAttribute('data-side-margins', settings.sideMargins);
    root.style.setProperty('--reader-column-width', `${settings.columnWidth}ch`);

    if (settings.autoHideUI) {
      root.classList.add('auto-hide-ui');
    } else {
      root.classList.remove('auto-hide-ui');
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

    if (settings.visibleFocus) {
      root.classList.add('visible-focus-mode');
    } else {
      root.classList.remove('visible-focus-mode');
    }

    if (settings.reduceAnimations) {
      root.classList.add('reduce-animations');
    } else {
      root.classList.remove('reduce-animations');
    }

    if (settings.totalSilence) {
      root.classList.add('total-silence');
    } else {
      root.classList.remove('total-silence');
    }

    if (settings.fullScreen) {
      root.classList.add('full-screen-mode');
    } else {
      root.classList.remove('full-screen-mode');
    }
  }, [settings]);



  const updateSettings = useCallback(async (newSettings: Partial<ReadingSettings>) => {
    const updated = { ...settings, ...newSettings, lastUpdated: Date.now() };
    setSettings(updated);

    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({
          reading_settings: updated as any,
          notification_settings: {
            daily_reminder: updated.reminders
          }
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

  useEffect(() => {
    const handleToggle = (e: any) => {
      const newValue = e.detail;
      updateSettings({ totalSilence: newValue });
      toast.success(newValue ? "Silêncio Total Ativado" : "Silêncio Total Desativado", {
        description: newValue ? "Ambiente de oração absoluta." : "Interface e áudio restaurados.",
        icon: newValue ? "🤫" : "🔊"
      });
    };
    
    const handleKeyboardShortcut = (e: KeyboardEvent) => {
      // Alt + S or Option + S
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const newValue = !settings.totalSilence;
        updateSettings({ totalSilence: newValue });
        toast.success(newValue ? "Silêncio Total Ativado" : "Silêncio Total Desativado", {
          description: newValue ? "Ambiente de oração absoluta." : "Interface e áudio restaurados.",
          icon: newValue ? "🤫" : "🔊"
        });
      }
    };

    window.addEventListener('toggle-total-silence', handleToggle);
    window.addEventListener('keydown', handleKeyboardShortcut);
    return () => {
      window.removeEventListener('toggle-total-silence', handleToggle);
      window.removeEventListener('keydown', handleKeyboardShortcut);
    };
  }, [updateSettings, settings.totalSilence]);

  // Auto-hide UI ao rolar (mobile / contemplativo)
  useEffect(() => {
    if (!settings.autoHideUI && !settings.contemplativeMode) {
      document.documentElement.classList.remove('reading-scroll-down');
      return;
    }
    let lastY = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (Math.abs(y - lastY) > 8) {
          if (y > lastY && y > 80) {
            document.documentElement.classList.add('reading-scroll-down');
            document.documentElement.classList.remove('reveal-chrome');
          } else {
            document.documentElement.classList.remove('reading-scroll-down');
          }
          lastY = y;
        }
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [settings.autoHideUI, settings.contemplativeMode]);

  // Modo noturno agendado (transição gradual via CSS)
  useEffect(() => {
    const sch = settings.nightSchedule;
    if (!sch?.enabled) return;
    const check = () => {
      const now = new Date();
      const m = now.getHours() * 60 + now.getMinutes();
      const [sh, sm] = sch.start.split(':').map(Number);
      const [eh, em] = sch.end.split(':').map(Number);
      const a = sh * 60 + sm;
      const b = eh * 60 + em;
      const inNight = a <= b ? (m >= a && m < b) : (m >= a || m < b);
      if (inNight && settings.theme !== 'night') updateSettings({ theme: 'night' });
      else if (!inNight && settings.theme === 'night') updateSettings({ theme: 'paper' });
    };
    check();
    const id = window.setInterval(check, 60_000);
    return () => window.clearInterval(id);
  }, [settings.nightSchedule, settings.theme, updateSettings]);

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