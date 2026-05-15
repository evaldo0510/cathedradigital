import React, { useState } from 'react';
import { Button } from '@/components/cathedra/Button';
import { Icons } from '@/constants';
import { useReadingMode, ReadingTheme } from '@/hooks/useReadingMode';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Type, Maximize2, Settings2, Sliders, Sun, Moon, Palette } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

const ReadingPreferencesPanel: React.FC = () => {
  const { prefs, updatePrefs, toggleTheme } = useReadingMode();
  const [isOpen, setIsOpen] = useState(false);

  const themes: { id: ReadingTheme; label: string; icon: React.ElementType }[] = [
    { id: 'normal', label: 'Claro', icon: Sun },
    { id: 'sepia', label: 'Sépia', icon: Palette },
    { id: 'paper', label: 'Papel', icon: Settings2 },
    { id: 'night', label: 'Noite', icon: Moon },
  ];

  const fontFamilies: { id: 'serif' | 'sans' | 'monastery'; label: string }[] = [
    { id: 'monastery', label: 'Garamond' },
    { id: 'serif', label: 'Playfair' },
    { id: 'sans', label: 'Inter' },
  ];

  return (
    <div className="fixed bottom-24 right-4 lg:bottom-12 lg:right-12 z-[200]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-16 right-0 w-[320px] bg-background border border-border/50 shadow-premium rounded-[2rem] p-6 space-y-8 backdrop-blur-xl reading-sepia"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40">Preferências de Leitura</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Themes */}
            <div className="space-y-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-primary/20">Tema</p>
              <div className="grid grid-cols-4 gap-2">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => updatePrefs({ theme: t.id })}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all",
                      prefs.theme === t.id 
                        ? "bg-primary/5 border-primary/20 text-primary" 
                        : "border-transparent text-primary/40 hover:bg-primary/5"
                    )}
                  >
                    <t.icon className="w-4 h-4" />
                    <span className="text-[9px] font-bold uppercase">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Family */}
            <div className="space-y-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-primary/20">Tipografia</p>
              <div className="flex gap-2">
                {fontFamilies.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => updatePrefs({ fontFamily: f.id })}
                    className={cn(
                      "flex-1 py-2 px-1 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-all",
                      prefs.fontFamily === f.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-primary/10 text-primary/40 hover:border-primary/30"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-6">
              {/* Font Size */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-primary/20">
                  <span className="flex items-center gap-2"><Type className="w-3 h-3" /> Tamanho da Fonte</span>
                  <span>{prefs.fontSize}px</span>
                </div>
                <Slider 
                  value={[prefs.fontSize]} 
                  onValueChange={([v]) => updatePrefs({ fontSize: v })}
                  min={14} max={28} step={1}
                />
              </div>

              {/* Line Length (Max Width) */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-primary/20">
                  <span className="flex items-center gap-2"><Maximize2 className="w-3 h-3" /> Largura do Texto</span>
                  <span>{prefs.maxWidth}ch</span>
                </div>
                <Slider 
                  value={[prefs.maxWidth]} 
                  onValueChange={([v]) => updatePrefs({ maxWidth: v })}
                  min={40} max={90} step={5}
                />
              </div>

              {/* Sepia Intensity (only if sepia is selected) */}
              {prefs.theme === 'sepia' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-primary/20">
                    <span className="flex items-center gap-2"><Sliders className="w-3 h-3" /> Intensidade Sépia</span>
                    <span>{prefs.sepiaIntensity}%</span>
                  </div>
                  <Slider 
                    value={[prefs.sepiaIntensity]} 
                    onValueChange={([v]) => updatePrefs({ sepiaIntensity: v })}
                    min={0} max={200} step={10}
                  />
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-primary/5 flex justify-center">
              <p className="text-[8px] font-medium text-primary/20 italic">Ajustado para seu conforto espiritual</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full bg-background border border-border shadow-premium hover:shadow-premium-hover transition-all group overflow-hidden",
          isOpen && "ring-2 ring-primary border-transparent"
        )}
        title="Configurações de Leitura"
      >
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          <Settings2 className="w-6 h-6 text-primary" />
        </motion.div>
      </Button>
    </div>
  );
};

export default ReadingPreferencesPanel;
