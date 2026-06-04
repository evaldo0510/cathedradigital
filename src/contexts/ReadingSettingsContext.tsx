import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  focusMode: boolean; // Oculta header e sidebar; reaparece com hover/toque
  immersiveMode: boolean; // Oculta header e menus permanentemente durante a leitura
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
  focusMode: false,
  immersiveMode: false,
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



const SettingsSideEffects: React.FC = () => {
  const { settings } = useReadingSettings();
  
  useEffect(() => {
    if (!settings.focusMode) return;

    const revealUI = () => {
      document.documentElement.classList.add('reveal-chrome');
      
      // Auto-hide again after 3 seconds of inactivity
      const timeout = setTimeout(() => {
        document.documentElement.classList.remove('reveal-chrome');
      }, 3000);

      return () => clearTimeout(timeout);
    };

    const handleInteraction = () => revealUI();

    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY < 50 || e.clientY > window.innerHeight - 50) {
        handleInteraction();
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [settings.focusMode]);

  useEffect(() => {
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

    // Apply Font Size to Root for UI scalability
    root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large', 'font-size-extra-large');
    root.classList.add(`font-size-${settings.fontSize}`);


    // Apply Spacing
    root.setAttribute('data-line-spacing', settings.lineSpacing);
    root.setAttribute('data-letter-spacing', settings.letterSpacing);
    root.setAttribute('data-side-margins', settings.sideMargins);
    root.style.setProperty('--reader-column-width', `${settings.columnWidth}ch`);

    const toggleClass = (cls: string, active: boolean) => {
      if (active) root.classList.add(cls);
      else root.classList.remove(cls);
    };

    toggleClass('auto-hide-ui', settings.autoHideUI);
    toggleClass('visual-silence', settings.visualSilence);
    toggleClass('high-contrast', settings.highContrast);
    toggleClass('contemplative-mode', settings.contemplativeMode);
    toggleClass('visible-focus-mode', settings.visibleFocus);
    toggleClass('reduce-animations', settings.reduceAnimations);
    toggleClass('total-silence', settings.totalSilence);
    toggleClass('full-screen-mode', settings.fullScreen);
    toggleClass('focus-mode', settings.focusMode);
    
  }, [settings]);

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
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.documentElement.classList.remove('reading-scroll-down');
    };
  }, [settings.autoHideUI, settings.contemplativeMode]);

  return null;
};

export const ReadingSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<ReadingSettings>(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    const key = isMobile ? 'cathedra_reading_settings_mobile' : 'cathedra_reading_settings_desktop';
    const stored = localStorage.getItem(key);
    const parsed = stored ? JSON.parse(stored) : defaultSettings;
    
    // Fallback para chave antiga se necessário
    if (!stored) {
      const legacy = localStorage.getItem('cathedra_reading_settings');
      if (legacy) return { ...defaultSettings, ...JSON.parse(legacy) };
    }
    
    return { ...defaultSettings, ...parsed };
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
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    const key = isMobile ? 'cathedra_reading_settings_mobile' : 'cathedra_reading_settings_desktop';
    localStorage.setItem(key, JSON.stringify(settings));
    // Keep legacy for compatibility
    localStorage.setItem('cathedra_reading_settings', JSON.stringify(settings));
  }, [settings]);




  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const updateSettings = useCallback(async (newSettings: Partial<ReadingSettings>) => {
    const updated = { ...settingsRef.current, ...newSettings, lastUpdated: Date.now() };
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
  }, [user, refreshProfile]); // Removed settings dependency

  const resetSettings = useCallback(async () => {
    const reset = { ...defaultSettings, lastUpdated: Date.now() };
    setSettings(reset);
    if (user) {
      await supabase
        .from('profiles')
        .update({
          reading_settings: reset as any
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

  const value = useMemo(() => ({ settings, updateSettings, resetSettings, isLoading }), [settings, updateSettings, resetSettings, isLoading]);

  return (
    <ReadingSettingsContext.Provider value={value}>
      <SettingsSideEffects />
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