
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
  const [auditIssues, setAuditIssues] = useState<{ component: string; tokens: string[]; ratio: number; level: string }[]>([]);

  useEffect(() => {
    // Get current computed colors from CSS variables
    const style = getComputedStyle(document.documentElement);
    
    const checkPair = (bgVar: string, fgVar: string) => {
      const bg = style.getPropertyValue(bgVar).trim();
      const fg = style.getPropertyValue(fgVar).trim();
      if (!bg || !fg) return { ratio: 1, level: 'Fail' };
      const ratio = getContrastRatio(bg, fg);
      return { ratio, level: getWCAGLevel(ratio) };
    };

    // Main check for stats
    const main = checkPair('--background', '--foreground');
    setContrastStats(main);

    // Detailed audit
    const pairs = [
      { name: 'Texto Principal', tokens: ['--background', '--foreground'], min: 4.5 },
      { name: 'Cores de Destaque', tokens: ['--background', '--primary'], min: 4.5 },
      { name: 'Botões Primários', tokens: ['--primary', '--primary-foreground'], min: 4.5 },
      { name: 'Botões Secundários', tokens: ['--secondary', '--secondary-foreground'], min: 4.5 },
      { name: 'Textos Mudos', tokens: ['--background', '--muted-foreground'], min: 4.5 },
    ];

    const issues = pairs
      .map(p => {
        const result = checkPair(p.tokens[0], p.tokens[1]);
        return { ...p, ...result };
      })
      .filter(p => p.ratio < p.min)
      .map(p => ({
        component: p.name,
        tokens: p.tokens,
        ratio: p.ratio,
        level: p.level
      }));

    setAuditIssues(issues);
  }, [settings.theme, settings.highContrast]);

  const themes = [
    { id: 'paper', label: 'Modo Claro', icon: Icons.Sun },
    { id: 'dark', label: 'Modo Escuro', icon: Icons.Moon },
    { id: 'night', label: 'Modo Noite', icon: Icons.Sparkles },
  ];

  return (
    <div className="fixed bottom-spacing-4xl left-spacing-lg z-[250] md:bottom-spacing-2xl md:left-spacing-2xl">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-spacing-3xl left-0 w-spacing-4xl bg-card border border-border/10 rounded-premium shadow-premium p-spacing-lg space-y-spacing-xl backdrop-blur-xl"
          >
            <div className="space-y-spacing-xs">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40">Sistemática de Temas</h3>
              <p className="text-premium-xs text-muted-foreground leading-relaxed">Alterne entre estados visuais do Cathedra.</p>
            </div>

            <div className="grid grid-cols-1 gap-spacing-xs">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => updateSettings({ theme: t.id as any })}
                  className={cn(
                    "flex items-center justify-between px-spacing-md py-spacing-sm rounded-premium-sm transition-all duration-300 border border-transparent",
                    settings.theme === t.id 
                      ? "bg-primary text-primary-foreground shadow-premium" 
                      : "hover:bg-primary/5 hover:border-primary/5 text-primary/60"
                  )}
                >
                  <div className="flex items-center gap-spacing-sm">
                    <t.icon className="w-spacing-md h-spacing-md" />
                    <span className="text-[11px] font-bold uppercase tracking-widest">{t.label}</span>
                  </div>
                  {settings.theme === t.id && <Icons.Check className="w-spacing-sm h-spacing-sm" />}
                </button>
              ))}
            </div>

            <div className="h-px bg-primary/5" />

            <div className="space-y-spacing-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/40">Alto Contraste</span>
                <button
                  onClick={() => updateSettings({ highContrast: !settings.highContrast })}
                  className={cn(
                    "w-spacing-xl h-spacing-md rounded-premium-full relative transition-colors duration-500",
                    settings.highContrast ? "bg-secondary" : "bg-primary/10"
                  )}
                >
                  <motion.div 
                    animate={{ x: settings.highContrast ? 20 : 2 }}
                    className="absolute top-spacing-2xs w-spacing-sm h-spacing-sm bg-white rounded-premium-full shadow-premium-sm" 
                  />
                </button>
              </div>

              {/* A11y Feedback */}
              <div className={cn(
                "p-spacing-md rounded-premium-sm border space-y-spacing-sm transition-all duration-500",
                contrastStats.ratio >= 4.5 ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"
              )}>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">Acessibilidade</span>
                  <span className={cn(
                    "text-[9px] font-black px-spacing-xs py-spacing-3xs rounded-premium-full uppercase",
                    contrastStats.ratio >= 4.5 ? "bg-green-500/20 text-green-600" : "bg-red-500/20 text-red-600"
                  )}>
                    {contrastStats.level}
                  </span>
                </div>
                <div className="flex items-center gap-spacing-xs">
                  <span className="text-premium-xl font-display font-light text-primary">{contrastStats.ratio}:1</span>
                  <span className="text-[10px] text-muted-foreground italic">ratio</span>
                </div>

                {auditIssues.length > 0 && (
                  <div className="pt-spacing-xs border-t border-red-500/10 space-y-spacing-xs">
                    <div className="flex items-center gap-spacing-2xs text-[9px] font-bold text-red-600/60 uppercase">
                      <Icons.AlertTriangle className="w-spacing-sm h-spacing-sm" />
                      <span>{auditIssues.length} Conflitos de Contraste</span>
                    </div>
                    <div className="space-y-spacing-2xs">
                      {auditIssues.map((issue, idx) => (
                        <div key={idx} className="flex flex-col gap-spacing-3xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-medium text-primary/80">{issue.component}</span>
                            <span className="text-[9px] font-bold text-red-600">{issue.ratio}:1</span>
                          </div>
                          <div className="flex gap-spacing-2xs">
                            {issue.tokens.map(token => (
                              <a
                                key={token}
                                href={`/design-system#${token.replace('--', '')}`}
                                className="text-[8px] px-spacing-2xs py-spacing-3xs rounded-premium-sm bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors border border-red-500/5"
                              >
                                {token}
                              </a>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
          "relative flex items-center gap-spacing-sm px-spacing-md py-spacing-sm rounded-premium-full shadow-premium transition-premium border",
          isOpen ? "bg-primary text-primary-foreground border-primary" : "bg-card text-primary border-primary/10 hover:border-primary/20",
          !isOpen && auditIssues.length > 0 && "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
        )}
      >
        <Icons.Layout className="w-spacing-md h-spacing-md" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] hidden md:block">
          {isOpen ? 'Fechar Painel' : 'Temas & Contraste'}
        </span>
        
        {auditIssues.length > 0 && !isOpen && (
          <span className="absolute -top-spacing-2xs -right-spacing-2xs w-spacing-md h-spacing-md bg-red-500 text-white text-[8px] font-bold flex items-center justify-center rounded-premium-full animate-pulse shadow-premium">
            {auditIssues.length}
          </span>
        )}
      </motion.button>
    </div>
  );
};
