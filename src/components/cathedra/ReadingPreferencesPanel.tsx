import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Type, Layout, AlignLeft, Sun, Moon, 
  Minus, Plus, ChevronRight, Check,
  Maximize2, Minimize2, Settings2, Palette
} from 'lucide-react';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
    { id: 'paper', name: 'Papel', icon: Sun, color: 'bg-[#FDFBF7]' },
    { id: 'sepia', name: 'Sépia', icon: Palette, color: 'bg-[#F4ECD8]' },
    { id: 'dark', name: 'Escuro', icon: Moon, color: 'bg-[#1A1A1A]' },
    { id: 'night', name: 'Noite', icon: Moon, color: 'bg-[#000000]' },
  ];

  const fontSizes = [
    { id: 'small', label: 'A', className: 'text-xs' },
    { id: 'medium', label: 'A', className: 'text-base' },
    { id: 'large', label: 'A', className: 'text-xl' },
    { id: 'extra-large', label: 'A', className: 'text-2xl' },
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
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[70ch] bg-background border-t rounded-t-[2.5rem] z-[301] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col outline-none"
            tabIndex={-1}
          >
            {/* Handle for drag indicator */}
            <div className="flex justify-center py-4">
              <div className="w-12 h-1.5 rounded-full bg-muted/40" />
            </div>

            <div className="px-8 pb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-serif font-bold tracking-tight">Preferências de Leitura</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Ajuste sua experiência contemplativa</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="rounded-full h-10 w-10 hover:bg-muted/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <ScrollArea className="flex-1 px-8 pb-10">
              <div className="space-y-10">
                {/* Theme Selection */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sun className="w-4 h-4 text-primary/60" />
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">Ambiente e Profundidade</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {themes.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => updateSettings({ theme: theme.id as any })}
                        className={cn(
                          "group relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300",
                          settings.theme === theme.id 
                            ? "border-primary bg-primary/5 shadow-sm" 
                            : "border-muted/20 bg-muted/5 hover:border-muted/40"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-full mb-3 flex items-center justify-center shadow-inner transition-transform group-active:scale-95",
                          theme.color,
                          settings.theme === theme.id ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
                        )}>
                          <theme.icon className={cn(
                            "w-5 h-5",
                            theme.id === 'paper' || theme.id === 'sepia' ? "text-slate-900" : "text-slate-100"
                          )} />
                        </div>
                        <span className={cn(
                          "text-xs font-medium transition-colors",
                          settings.theme === theme.id ? "text-primary font-bold" : "text-muted-foreground"
                        )}>
                          {theme.name}
                        </span>
                        {settings.theme === theme.id && (
                          <motion.div 
                            layoutId="theme-active"
                            className="absolute top-2 right-2 z-10"
                          >
                            <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-primary-foreground" />
                            </div>
                          </motion.div>
                        )}
                      </button>
                    ))}
                  </div>
                </section>

                <Separator className="opacity-50" />

                {/* Typography Settings */}
                <section className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Type className="w-4 h-4 text-primary/60" />
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">Tipografia</h3>
                  </div>
                  
                  <div className="space-y-8">
                    {/* Font Family */}
                    <div className="bg-muted/5 rounded-2xl p-2 border border-muted/20">
                      <ToggleGroup 
                        type="single" 
                        value={settings.fontFamily} 
                        onValueChange={(v) => v && updateSettings({ fontFamily: v as any })}
                        className="w-full"
                      >
                        <ToggleGroupItem 
                          value="serif" 
                          className="flex-1 py-6 rounded-xl data-[state=on]:bg-background data-[state=on]:shadow-sm transition-all"
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-serif text-lg">Serif</span>
                            <span className="text-[9px] uppercase tracking-wider opacity-60">Clássico</span>
                          </div>
                        </ToggleGroupItem>
                        <ToggleGroupItem 
                          value="sans" 
                          className="flex-1 py-6 rounded-xl data-[state=on]:bg-background data-[state=on]:shadow-sm transition-all"
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-sans text-lg">Sans</span>
                            <span className="text-[9px] uppercase tracking-wider opacity-60">Moderno</span>
                          </div>
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>

                    {/* Font Size */}
                    <div className="space-y-4 px-2">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        <span>Tamanho do Texto</span>
                        <span className="text-primary capitalize">{settings.fontSize.replace('-', ' ')}</span>
                      </div>
                      <div className="flex items-center gap-4 bg-muted/5 rounded-2xl p-4 border border-muted/20">
                        <Minus className="w-4 h-4 text-muted-foreground" />
                        <Slider
                          value={[
                            fontSizes.findIndex(f => f.id === settings.fontSize)
                          ]}
                          max={3}
                          step={1}
                          onValueChange={([val]) => updateSettings({ fontSize: fontSizes[val].id as any })}
                          className="flex-1"
                        />
                        <Plus className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </section>

                <Separator className="opacity-50" />

                {/* Contrast Settings */}
                <section className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Sun className="w-4 h-4 text-primary/60" />
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">Contraste e Nitidez</h3>
                  </div>

                  <div className="bg-muted/5 rounded-2xl p-2 border border-muted/20">
                    <ToggleGroup 
                      type="single" 
                      value={settings.contrast} 
                      onValueChange={(v) => v && updateSettings({ contrast: v as any })}
                      className="w-full"
                    >
                      <ToggleGroupItem value="soft" className="flex-1 py-4 rounded-xl">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs font-medium">Suave</span>
                          <span className="text-[8px] uppercase font-bold tracking-tighter opacity-60">Relaxado</span>
                        </div>
                      </ToggleGroupItem>
                      <ToggleGroupItem value="normal" className="flex-1 py-4 rounded-xl">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs font-medium">Equilibrado</span>
                          <span className="text-[8px] uppercase font-bold tracking-tighter opacity-60">Confortável</span>
                        </div>
                      </ToggleGroupItem>
                      <ToggleGroupItem value="high" className="flex-1 py-4 rounded-xl">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs font-medium">Contraste Máximo</span>
                          <span className="text-[8px] uppercase font-bold tracking-tighter opacity-60">Recomendado</span>
                        </div>
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </section>

                <Separator className="opacity-50" />

                {/* Layout & Margins */}
                <section className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Layout className="w-4 h-4 text-primary/60" />
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">Espaçamento e Densidade</h3>
                  </div>

                  <div className="space-y-8">
                    {/* Line Spacing */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                        Ritmo entre Linhas
                      </label>
                      <div className="bg-muted/5 rounded-2xl p-2 border border-muted/20">
                        <ToggleGroup 
                          type="single" 
                          value={settings.lineSpacing} 
                          onValueChange={(v) => v && updateSettings({ lineSpacing: v as any })}
                          className="w-full"
                        >
                          <ToggleGroupItem value="tight" className="flex-1 py-4 rounded-xl">
                            <AlignLeft className="w-4 h-4 scale-y-75" />
                          </ToggleGroupItem>
                          <ToggleGroupItem value="normal" className="flex-1 py-4 rounded-xl">
                            <AlignLeft className="w-4 h-4" />
                          </ToggleGroupItem>
                          <ToggleGroupItem value="wide" className="flex-1 py-4 rounded-xl">
                            <AlignLeft className="w-4 h-4 scale-y-125" />
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>
                    </div>

                    {/* Side Margins / Breathing Room */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                        Respiro Lateral (Margens)
                      </label>
                      <div className="bg-muted/5 rounded-2xl p-2 border border-muted/20">
                        <ToggleGroup 
                          type="single" 
                          value={settings.sideMargins} 
                          onValueChange={(v) => v && updateSettings({ sideMargins: v as any })}
                          className="w-full"
                        >
                          <ToggleGroupItem value="standard" className="flex-1 py-4 rounded-xl">
                            <div className="flex flex-col items-center gap-1">
                              <div className="w-6 h-1 bg-primary/40 rounded-full" />
                              <span className="text-[8px] uppercase font-bold tracking-tighter">Focado</span>
                            </div>
                          </ToggleGroupItem>
                          <ToggleGroupItem value="comfortable" className="flex-1 py-4 rounded-xl">
                            <div className="flex flex-col items-center gap-1">
                              <div className="w-4 h-1 bg-primary/40 rounded-full" />
                              <span className="text-[8px] uppercase font-bold tracking-tighter">Médio</span>
                            </div>
                          </ToggleGroupItem>
                          <ToggleGroupItem value="wide" className="flex-1 py-4 rounded-xl">
                            <div className="flex flex-col items-center gap-1">
                              <div className="w-2 h-1 bg-primary/40 rounded-full" />
                              <span className="text-[8px] uppercase font-bold tracking-tighter">Largo</span>
                            </div>
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>
                    </div>

                    {/* Word Density (Letter Spacing) */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                        Densidade das Palavras
                      </label>
                      <div className="bg-muted/5 rounded-2xl p-2 border border-muted/20">
                        <ToggleGroup 
                          type="single" 
                          value={settings.letterSpacing} 
                          onValueChange={(v) => v && updateSettings({ letterSpacing: v as any })}
                          className="w-full"
                        >
                          <ToggleGroupItem value="tight" className="flex-1 py-4 rounded-xl">
                            <span className="text-[10px] font-bold uppercase">Compacto</span>
                          </ToggleGroupItem>
                          <ToggleGroupItem value="normal" className="flex-1 py-4 rounded-xl">
                            <span className="text-[10px] font-bold uppercase">Normal</span>
                          </ToggleGroupItem>
                          <ToggleGroupItem value="wide" className="flex-1 py-4 rounded-xl">
                            <span className="text-[10px] font-bold uppercase">Aberto</span>
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>
                    </div>
                  </div>
                </section>

                <Separator className="opacity-50" />

                {/* Advanced Experience */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings2 className="w-4 h-4 text-primary/60" />
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">Experiência Imersiva</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-between h-16 rounded-2xl px-6 transition-all",
                        settings.focusMode ? "border-primary bg-primary/5" : "border-muted/20 bg-muted/5"
                      )}
                      onClick={() => updateSettings({ focusMode: !settings.focusMode })}
                    >
                      <div className="flex flex-col items-start text-left">
                        <span className="font-bold text-sm">Modo Foco</span>
                        <span className="text-[10px] text-muted-foreground">Oculta header e sidebar na leitura</span>
                      </div>
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                        settings.focusMode ? "bg-primary text-primary-foreground" : "bg-muted/40"
                      )}>
                        {settings.focusMode ? <Check className="w-3.5 h-3.5" /> : null}
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-between h-16 rounded-2xl px-6 transition-all",
                        settings.visualSilence ? "border-primary bg-primary/5" : "border-muted/20 bg-muted/5"
                      )}
                      onClick={() => updateSettings({ visualSilence: !settings.visualSilence })}
                    >
                      <div className="flex flex-col items-start text-left">
                        <span className="font-bold text-sm">Silêncio Visual</span>
                        <span className="text-[10px] text-muted-foreground">Interface minimalista e sem ruído</span>
                      </div>
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                        settings.visualSilence ? "bg-primary text-primary-foreground" : "bg-muted/40"
                      )}>
                        {settings.visualSilence ? <Check className="w-3.5 h-3.5" /> : null}
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-between h-16 rounded-2xl px-6 transition-all",
                        settings.reduceAnimations ? "border-primary bg-primary/5" : "border-muted/20 bg-muted/5"
                      )}
                      onClick={() => updateSettings({ reduceAnimations: !settings.reduceAnimations })}
                    >
                      <div className="flex flex-col items-start text-left">
                        <span className="font-bold text-sm">Reduzir Movimento</span>
                        <span className="text-[10px] text-muted-foreground">Transições suaves e menos flutuação</span>
                      </div>
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                        settings.reduceAnimations ? "bg-primary text-primary-foreground" : "bg-muted/40"
                      )}>
                        {settings.reduceAnimations ? <Check className="w-3.5 h-3.5" /> : null}
                      </div>
                    </Button>
                  </div>
                </section>

                {/* Reset Button */}
                <div className="pt-4">
                  <Button 
                    variant="ghost" 
                    onClick={resetSettings}
                    className="w-full h-14 rounded-2xl text-muted-foreground hover:text-destructive hover:bg-destructive/5 text-xs font-bold uppercase tracking-[0.2em]"
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
