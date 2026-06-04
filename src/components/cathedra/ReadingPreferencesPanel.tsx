import { Icons } from '@/constants';
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useReadingSettings } from '@/contexts/ReadingSettingsContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { 
  ToggleGroup, 
  ToggleGroupItem 
} from '@/components/ui/toggle-group';
import { useAuth } from '@/hooks/useAuth';

interface ReadingPreferencesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReadingPreferencesPanel: React.FC<ReadingPreferencesPanelProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const { settings, updateSettings, resetSettings } = useReadingSettings();
  const { profile } = useAuth();
  const panelRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
        return;
      }

      const focusableElements = panelRef.current?.querySelectorAll(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [role="button"]'
      );
      
      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Focus the close button or first element when opening
      setTimeout(() => {
        const first = panelRef.current?.querySelector('button, [role="button"]') as HTMLElement;
        first?.focus();
      }, 100);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const themes = [
    { id: 'paper', name: 'Papel', icon: Icons.Sun, color: 'bg-[#FDFBF7]' },
    { id: 'sepia', name: 'Sépia', icon: Icons.Palette, color: 'bg-[#F4ECD8]' },
    { id: 'dark', name: 'Escuro', icon: Icons.Moon, color: 'bg-[#1A1A1A]' },
    { id: 'night', name: 'Noite', icon: Icons.Moon, color: 'bg-[#000000]' },
  ];

  const fontSizes = [
    { id: 'small', label: 'A', className: 'text-premium-xs' },
    { id: 'medium', label: 'A', className: 'text-premium-base' },
    { id: 'large', label: 'A', className: 'text-premium-xl' },
    { id: 'extra-large', label: 'A', className: 'text-premium-2xl' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[300]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            ref={panelRef}
            className="fixed bottom-spacing-0 left-spacing-2xs/2 -translate-x-1/2 w-full max-w-[70ch] bg-background border-t rounded-t-[2.5rem] z-[301] shadow-premium overflow-hidden max-h-[90vh] flex flex-col outline-none"
            tabIndex={-1}
          >
            {/* Handle for drag indicator */}
            <div className="flex justify-center py-spacing-md">
              <div className="w-spacing-2xl h-spacing-2xs rounded-premium-full bg-muted/40" />
            </div>

            <div className="px-spacing-xl pb-spacing-lg flex items-center justify-between">
              <div>
                <h2 className="text-premium-xl font-serif font-bold tracking-tight">Preferências de Leitura</h2>
                <p className="text-premium-xs text-muted-foreground mt-spacing-3xs">Ajuste sua experiência contemplativa</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="rounded-premium-full h-spacing-xl w-spacing-xl hover:bg-muted/50 transition-colors"
              >
                <Icons.X className="w-spacing-md h-spacing-md" />
              </Button>
            </div>

            <ScrollArea className="flex-1 px-spacing-xl pb-spacing-xl">
              <div className="space-y-spacing-xl">
                {/* Theme Selection */}
                <section className="space-y-spacing-md">
                  <div className="flex items-center gap-spacing-xs mb-spacing-xs">
                    <Icons.Sun className="w-spacing-md h-spacing-md text-primary/60" />
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">Ambiente e Profundidade</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-spacing-sm">
                    {themes.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => updateSettings({ theme: theme.id as any })}
                        className={cn(
                          "group relative flex flex-col items-center justify-center p-spacing-md rounded-premium border-2 transition-all duration-300",
                          settings.theme === theme.id 
                            ? "border-primary bg-primary/5 shadow-premium-sm" 
                            : "border-muted/20 bg-muted/5 hover:border-muted/40"
                        )}
                      >
                        <div className={cn(
                          "w-spacing-xl h-spacing-xl rounded-premium-full mb-spacing-sm flex items-center justify-center shadow-premium-md transition-transform group-active:scale-95",
                          theme.color,
                          settings.theme === theme.id ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
                        )}>
                          <theme.icon className={cn(
                            "w-spacing-md h-spacing-md",
                            theme.id === 'paper' || theme.id === 'sepia' ? "text-slate-900" : "text-slate-100"
                          )} />
                        </div>
                        <span className={cn(
                          "text-premium-xs font-medium transition-colors",
                          settings.theme === theme.id ? "text-primary font-bold" : "text-muted-foreground"
                        )}>
                          {theme.name}
                        </span>
                        {settings.theme === theme.id && (
                          <motion.div 
                            layoutId="theme-active"
                            className="absolute top-spacing-xs right-spacing-xs z-10"
                          >
                            <div className="w-spacing-md h-spacing-md bg-primary rounded-premium-full flex items-center justify-center">
                              <Icons.Check className="w-spacing-xs h-spacing-xs text-primary-foreground" />
                            </div>
                          </motion.div>
                        )}
                      </button>
                    ))}
                  </div>
                </section>

                <Separator className="opacity-50" />

                {/* Typography Icons.Settings */}
                <section className="space-y-spacing-lg">
                  <div className="flex items-center gap-spacing-xs mb-spacing-xs">
                    <Icons.Type className="w-spacing-md h-spacing-md text-primary/60" />
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">Tipografia</h3>
                  </div>
                  
                  <div className="space-y-spacing-xl">
                    {/* Font Family */}
                    <div className="bg-muted/5 rounded-premium p-spacing-xs border border-muted/20">
                      <ToggleGroup 
                        type="single" 
                        value={settings.fontFamily} 
                        onValueChange={(v) => v && updateSettings({ fontFamily: v as any })}
                        className="w-full"
                      >
                        <ToggleGroupItem 
                          value="serif" 
                          className="flex-1 py-spacing-lg rounded-premium data-[state=on]:bg-background data-[state=on]:shadow-premium-sm transition-all"
                        >
                          <div className="flex flex-col items-center gap-spacing-2xs">
                            <span className="font-serif text-premium-lg">Serif</span>
                            <span className="text-[9px] uppercase tracking-wider opacity-60">Clássico</span>
                          </div>
                        </ToggleGroupItem>
                        <ToggleGroupItem 
                          value="sans" 
                          className="flex-1 py-spacing-lg rounded-premium data-[state=on]:bg-background data-[state=on]:shadow-premium-sm transition-all"
                        >
                          <div className="flex flex-col items-center gap-spacing-2xs">
                            <span className="font-sans text-premium-lg">Sans</span>
                            <span className="text-[9px] uppercase tracking-wider opacity-60">Moderno</span>
                          </div>
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>

                    {/* Font Size */}
                    <div className="space-y-spacing-md px-spacing-xs">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        <span>Tamanho do Texto</span>
                        <span className="text-primary capitalize">{settings.fontSize.replace('-', ' ')}</span>
                      </div>
                      <div className="flex items-center gap-spacing-md bg-muted/5 rounded-premium p-spacing-md border border-muted/20">
                        <Icons.Minus className="w-spacing-md h-spacing-md text-muted-foreground" />
                        <Slider
                          value={[
                            fontSizes.findIndex(f => f.id === settings.fontSize)
                          ]}
                          max={3}
                          step={1}
                          onValueChange={([val]) => updateSettings({ fontSize: fontSizes[val].id as any })}
                          className="flex-1"
                        />
                        <Icons.Plus className="w-spacing-md h-spacing-md text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </section>

                <Separator className="opacity-50" />

                {/* Icons.Contrast Icons.Settings */}
                <section className="space-y-spacing-lg">
                  <div className="flex items-center gap-spacing-xs mb-spacing-xs">
                    <Icons.Sun className="w-spacing-md h-spacing-md text-primary/60" />
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">Contraste e Nitidez</h3>
                  </div>

                  <div className="bg-muted/5 rounded-premium p-spacing-xs border border-muted/20">
                    <ToggleGroup 
                      type="single" 
                      value={settings.contrast} 
                      onValueChange={(v) => v && updateSettings({ contrast: v as any })}
                      className="w-full"
                    >
                      <ToggleGroupItem value="soft" className="flex-1 py-spacing-md rounded-premium">
                        <div className="flex flex-col items-center gap-spacing-2xs">
                          <span className="text-premium-xs font-medium">Suave</span>
                          <span className="text-[8px] uppercase font-bold tracking-tighter opacity-60">Relaxado</span>
                        </div>
                      </ToggleGroupItem>
                      <ToggleGroupItem value="normal" className="flex-1 py-spacing-md rounded-premium">
                        <div className="flex flex-col items-center gap-spacing-2xs">
                          <span className="text-premium-xs font-medium">Equilibrado</span>
                          <span className="text-[8px] uppercase font-bold tracking-tighter opacity-60">Confortável</span>
                        </div>
                      </ToggleGroupItem>
                      <ToggleGroupItem value="high" className="flex-1 py-spacing-md rounded-premium">
                        <div className="flex flex-col items-center gap-spacing-2xs">
                          <span className="text-premium-xs font-medium">Contraste Máximo</span>
                          <span className="text-[8px] uppercase font-bold tracking-tighter opacity-60">Recomendado</span>
                        </div>
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </section>

                <Separator className="opacity-50" />

                {/* Icons.Layout & Margins */}
                <section className="space-y-spacing-lg">
                  <div className="flex items-center gap-spacing-xs mb-spacing-xs">
                    <Icons.Layout className="w-spacing-md h-spacing-md text-primary/60" />
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">Espaçamento e Densidade</h3>
                  </div>

                  <div className="space-y-spacing-xl">
                    {/* Line Spacing */}
                    <div className="space-y-spacing-sm">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-spacing-2xs">
                        Ritmo entre Linhas
                      </label>
                      <div className="bg-muted/5 rounded-premium p-spacing-xs border border-muted/20">
                        <ToggleGroup 
                          type="single" 
                          value={settings.lineSpacing} 
                          onValueChange={(v) => v && updateSettings({ lineSpacing: v as any })}
                          className="w-full"
                        >
                          <ToggleGroupItem value="tight" className="flex-1 py-spacing-md rounded-premium">
                            <Icons.AlignLeft className="w-spacing-md h-spacing-md scale-y-75" />
                          </ToggleGroupItem>
                          <ToggleGroupItem value="normal" className="flex-1 py-spacing-md rounded-premium">
                            <Icons.AlignLeft className="w-spacing-md h-spacing-md" />
                          </ToggleGroupItem>
                          <ToggleGroupItem value="wide" className="flex-1 py-spacing-md rounded-premium">
                            <Icons.AlignLeft className="w-spacing-md h-spacing-md scale-y-125" />
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>
                    </div>

                    {/* Side Margins / Breathing Room */}
                    <div className="space-y-spacing-sm">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-spacing-2xs">
                        Respiro Lateral (Margens)
                      </label>
                      <div className="bg-muted/5 rounded-premium p-spacing-xs border border-muted/20">
                        <ToggleGroup 
                          type="single" 
                          value={settings.sideMargins} 
                          onValueChange={(v) => v && updateSettings({ sideMargins: v as any })}
                          className="w-full"
                        >
                          <ToggleGroupItem value="standard" className="flex-1 py-spacing-md rounded-premium">
                            <div className="flex flex-col items-center gap-spacing-2xs">
                              <div className="w-spacing-lg h-spacing-2xs bg-primary/40 rounded-premium-full" />
                              <span className="text-[8px] uppercase font-bold tracking-tighter">Focado</span>
                            </div>
                          </ToggleGroupItem>
                          <ToggleGroupItem value="comfortable" className="flex-1 py-spacing-md rounded-premium">
                            <div className="flex flex-col items-center gap-spacing-2xs">
                              <div className="w-spacing-md h-spacing-2xs bg-primary/40 rounded-premium-full" />
                              <span className="text-[8px] uppercase font-bold tracking-tighter">Médio</span>
                            </div>
                          </ToggleGroupItem>
                          <ToggleGroupItem value="wide" className="flex-1 py-spacing-md rounded-premium">
                            <div className="flex flex-col items-center gap-spacing-2xs">
                              <div className="w-spacing-xs h-spacing-2xs bg-primary/40 rounded-premium-full" />
                              <span className="text-[8px] uppercase font-bold tracking-tighter">Largo</span>
                            </div>
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>
                    </div>

                    {/* Word Density (Letter Spacing) */}
                    <div className="space-y-spacing-sm">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-spacing-2xs">
                        Densidade das Palavras
                      </label>
                      <div className="bg-muted/5 rounded-premium p-spacing-xs border border-muted/20">
                        <ToggleGroup 
                          type="single" 
                          value={settings.letterSpacing} 
                          onValueChange={(v) => v && updateSettings({ letterSpacing: v as any })}
                          className="w-full"
                        >
                          <ToggleGroupItem value="tight" className="flex-1 py-spacing-md rounded-premium">
                            <span className="text-[10px] font-bold uppercase">Compacto</span>
                          </ToggleGroupItem>
                          <ToggleGroupItem value="normal" className="flex-1 py-spacing-md rounded-premium">
                            <span className="text-[10px] font-bold uppercase">Normal</span>
                          </ToggleGroupItem>
                          <ToggleGroupItem value="wide" className="flex-1 py-spacing-md rounded-premium">
                            <span className="text-[10px] font-bold uppercase">Aberto</span>
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>
                    </div>
                  </div>
                </section>

                <Separator className="opacity-50" />

                {/* Advanced Experience */}
                <section className="space-y-spacing-md">
                  <div className="flex items-center gap-spacing-xs mb-spacing-xs">
                    <Icons.Settings2 className="w-spacing-md h-spacing-md text-primary/60" />
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">Experiência Imersiva</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-spacing-sm">
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-between h-spacing-3xl rounded-premium px-spacing-lg transition-all",
                        settings.focusMode ? "border-primary bg-primary/5" : "border-muted/20 bg-muted/5"
                      )}
                      onClick={() => updateSettings({ focusMode: !settings.focusMode })}
                    >
                      <div className="flex flex-col items-start text-left">
                        <span className="font-bold text-premium-sm">Modo Foco</span>
                        <span className="text-[10px] text-muted-foreground">Oculta header e sidebar na leitura</span>
                      </div>
                      <div className={cn(
                        "w-spacing-lg h-spacing-lg rounded-premium-full flex items-center justify-center transition-colors",
                        settings.focusMode ? "bg-primary text-primary-foreground" : "bg-muted/40"
                      )}>
                        {settings.focusMode ? <Icons.Check className="w-spacing-sm h-spacing-sm" /> : null}
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-between h-spacing-3xl rounded-premium px-spacing-lg transition-all",
                        settings.visualSilence ? "border-primary bg-primary/5" : "border-muted/20 bg-muted/5"
                      )}
                      onClick={() => updateSettings({ visualSilence: !settings.visualSilence })}
                    >
                      <div className="flex flex-col items-start text-left">
                        <span className="font-bold text-premium-sm">Silêncio Visual</span>
                        <span className="text-[10px] text-muted-foreground">Interface minimalista e sem ruído</span>
                      </div>
                      <div className={cn(
                        "w-spacing-lg h-spacing-lg rounded-premium-full flex items-center justify-center transition-colors",
                        settings.visualSilence ? "bg-primary text-primary-foreground" : "bg-muted/40"
                      )}>
                        {settings.visualSilence ? <Icons.Check className="w-spacing-sm h-spacing-sm" /> : null}
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-between h-spacing-3xl rounded-premium px-spacing-lg transition-all",
                        settings.reduceAnimations ? "border-primary bg-primary/5" : "border-muted/20 bg-muted/5"
                      )}
                      onClick={() => updateSettings({ reduceAnimations: !settings.reduceAnimations })}
                    >
                      <div className="flex flex-col items-start text-left">
                        <span className="font-bold text-premium-sm">Reduzir Movimento</span>
                        <span className="text-[10px] text-muted-foreground">Transições suaves e menos flutuação</span>
                      </div>
                      <div className={cn(
                        "w-spacing-lg h-spacing-lg rounded-premium-full flex items-center justify-center transition-colors",
                        settings.reduceAnimations ? "bg-primary text-primary-foreground" : "bg-muted/40"
                      )}>
                        {settings.reduceAnimations ? <Icons.Check className="w-spacing-sm h-spacing-sm" /> : null}
                      </div>
                    </Button>
                  </div>
                </section>

                {/* Reset Button */}
                <div className="pt-spacing-md">
                  <Button 
                    variant="ghost" 
                    onClick={resetSettings}
                    className="w-full h-spacing-2xl rounded-premium text-muted-foreground hover:text-destructive hover:bg-destructive/5 text-premium-xs font-bold uppercase tracking-[0.2em]"
                  >
                    Restaurar Padrões Contemplativos
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
