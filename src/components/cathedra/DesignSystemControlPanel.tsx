
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/constants';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';
import { getContrastRatio, getWCAGLevel } from '@/lib/a11y-utils';
import { cn } from '@/lib/utils';

export const ThemeControlPanel: React.FC = () => {
  const { settings, updateSettings } = useReadingSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [contrastStats, setContrastStats] = useState({ ratio: 0, level: 'Fail' });

  useEffect(() => {
    // Get current computed colors from CSS variables
    const style = getComputedStyle(document.documentElement);
    const bg = style.getPropertyValue('--background').trim();
    const fg = style.getPropertyValue('--foreground').trim();
    
    if (bg && fg) {
      const ratio = getContrastRatio(bg, fg);
      setContrastStats({ ratio, level: getWCAGLevel(ratio) });
    }
  }, [settings.theme, settings.highContrast]);

  const themes = [
    { id: 'paper', label: 'Modo Claro', icon: Icons.Sun },
    { id: 'dark', label: 'Modo Escuro', icon: Icons.Moon },
    { id: 'night', label: 'Modo Noite', icon: Icons.CloudMoon },
  ];

  return (
    <div className="fixed bottom-24 left-6 z-[250] md:bottom-12 md:left-12">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-16 left-0 w-72 bg-card border border-border/10 rounded-premium shadow-premium p-6 space-y-8 backdrop-blur-xl"
          >
            <div className="space-y-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40">Sistemática de Temas</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">Alterne entre estados visuais do Cathedra.</p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => updateSettings({ theme: t.id as any })}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-premium-sm transition-all duration-300 border border-transparent",
                    settings.theme === t.id 
                      ? "bg-primary text-primary-foreground shadow-lg" 
                      : "hover:bg-primary/5 hover:border-primary/5 text-primary/60"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <t.icon className="w-4 h-4" />
                    <span className="text-[11px] font-bold uppercase tracking-widest">{t.label}</span>
                  </div>
                  {settings.theme === t.id && <Icons.Check className="w-3 h-3" />}
                </button>
              ))}
            </div>

            <div className="h-px bg-primary/5" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/40">Alto Contraste</span>
                <button
                  onClick={() => updateSettings({ highContrast: !settings.highContrast })}
                  className={cn(
                    "w-10 h-5 rounded-full relative transition-colors duration-500",
                    settings.highContrast ? "bg-secondary" : "bg-primary/10"
                  )}
                >
                  <motion.div 
                    animate={{ x: settings.highContrast ? 20 : 2 }}
                    className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm" 
                  />
                </button>
              </div>

              {/* A11y Feedback */}
              <div className={cn(
                "p-4 rounded-premium-sm border space-y-2 transition-colors duration-500",
                contrastStats.ratio >= 4.5 ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"
              )}>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">Acessibilidade</span>
                  <span className={cn(
                    "text-[9px] font-black px-2 py-0.5 rounded-full uppercase",
                    contrastStats.ratio >= 4.5 ? "bg-green-500/20 text-green-600" : "bg-red-500/20 text-red-600"
                  )}>
                    {contrastStats.level}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-display font-light text-primary">{contrastStats.ratio}:1</span>
                  <span className="text-[10px] text-muted-foreground italic">ratio</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-3 px-5 py-3 rounded-full shadow-premium transition-premium border",
          isOpen ? "bg-primary text-primary-foreground border-primary" : "bg-card text-primary border-primary/10 hover:border-primary/20"
        )}
      >
        <Icons.Palette className="w-4 h-4" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] hidden md:block">
          {isOpen ? 'Fechar Painel' : 'Temas & Contraste'}
        </span>
      </motion.button>
    </div>
  );
};
