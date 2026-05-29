import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useLang } from '@/hooks/useLang';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';
import { ShortcutInput } from './ShortcutInput';
import { Slider } from '@/components/ui/slider';

interface A11ySettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  isHighContrast: boolean;
  onToggleHighContrast: () => void;
}

const A11ySettingsPanel: React.FC<A11ySettingsPanelProps> = ({
  isOpen,
  onClose,
  isDark,
  onToggleDark,
  isHighContrast,
  onToggleHighContrast
}) => {
  const { t } = useLang();
  const { settings, updateSettings } = useReadingSettings();

  const handleShortcutChange = (key: keyof typeof settings.shortcuts, newValue: string) => {
    updateSettings({
      shortcuts: {
        ...settings.shortcuts,
        [key]: newValue
      }
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
            aria-hidden="true"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-card border-l border-border/40 shadow-premium-hover z-[201] p-8 flex flex-col"
            role="dialog"
            aria-labelledby="a11y-title"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-premium-sm bg-primary/10 text-primary">
                  <Icons.ShieldCheck className="w-5 h-5" />
                </div>
                <h2 id="a11y-title" className="text-xl font-serif font-bold text-primary">Acessibilidade</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <Icons.X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-8 overflow-y-auto pr-2 custom-scrollbar flex-1">
              <section className="space-y-6">
                <h3 className="text-premium-tiny font-bold uppercase tracking-[0.4em] text-primary/60 border-b border-border/10 pb-2">Aparência e Leitura</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between group">
                    <div className="space-y-1">
                      <label htmlFor="dark-mode-toggle" className="text-sm font-bold text-primary cursor-pointer">Modo Escuro</label>
                      <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[200px]">Reduz o cansaço visual em ambientes com pouca luz.</p>
                    </div>
                    <Switch 
                      id="dark-mode-toggle" 
                      checked={isDark} 
                      onCheckedChange={onToggleDark} 
                    />
                  </div>

                  <div className="flex items-center justify-between group pt-4">
                    <div className="space-y-1">
                      <label htmlFor="high-contrast-toggle" className="text-sm font-bold text-primary cursor-pointer">Alto Contraste</label>
                      <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[200px]">Aumenta a distinção entre elementos para facilitar a leitura.</p>
                    </div>
                    <Switch 
                      id="high-contrast-toggle" 
                      checked={isHighContrast} 
                      onCheckedChange={onToggleHighContrast} 
                    />
                  </div>
                  <div className="flex items-center justify-between group pt-4">
                    <div className="space-y-1">
                      <label htmlFor="reduce-animations-toggle" className="text-sm font-bold text-primary cursor-pointer">Reduzir Animações</label>
                      <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[200px]">Desativa movimentos excessivos para uma experiência mais estática e rápida.</p>
                    </div>
                    <Switch 
                      id="reduce-animations-toggle" 
                      checked={settings.reduceAnimations} 
                      onCheckedChange={(val) => updateSettings({ reduceAnimations: val })} 
                    />
                  </div>
                </div>

              </section>

              <section className="space-y-6 pt-4">
                <h3 className="text-premium-tiny font-bold uppercase tracking-[0.4em] text-primary/60 border-b border-border/10 pb-2">Atalhos de Teclado</h3>
                <div className="grid gap-3">
                  <ShortcutInput 
                    label="Bíblia" 
                    value={settings.shortcuts.bible} 
                    onChange={(val) => handleShortcutChange('bible', val)} 
                  />
                  <ShortcutInput 
                    label="Catecismo" 
                    value={settings.shortcuts.catechism} 
                    onChange={(val) => handleShortcutChange('catechism', val)} 
                  />
                  <ShortcutInput 
                    label="Magistério" 
                    value={settings.shortcuts.magisterium} 
                    onChange={(val) => handleShortcutChange('magisterium', val)} 
                  />
                  <ShortcutInput 
                    label="Logos IA" 
                    value={settings.shortcuts.logos} 
                    onChange={(val) => handleShortcutChange('logos', val)} 
                  />
                </div>
              </section>

              <section className="space-y-6 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-premium-tiny font-bold uppercase tracking-[0.4em] text-primary/60">Histórico Logos IA</h3>
                  <span className="text-xs font-bold text-primary">{settings.logosHistoryLimit} itens</span>
                </div>
                <div className="px-2">
                  <Slider 
                    value={[settings.logosHistoryLimit]} 
                    min={5} 
                    max={50} 
                    step={5} 
                    onValueChange={(val) => updateSettings({ logosHistoryLimit: val[0] })}
                    className="py-4"
                  />
                  <p className="text-[10px] text-muted-foreground leading-relaxed italic mt-2">
                    Define quantas consultas recentes serão mantidas em sua memória local.
                  </p>
                </div>
              </section>

              <section className="space-y-6 pt-4">
                <h3 className="text-premium-tiny font-bold uppercase tracking-[0.4em] text-primary/60 border-b border-border/10 pb-2">Sugestões Logos IA</h3>
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    {(['always', 'first_selection', 'never'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => updateSettings({ logosSuggestions: mode })}
                        className={`flex items-center justify-between p-4 rounded-premium border transition-all ${
                          settings.logosSuggestions === mode 
                            ? 'bg-primary/5 border-primary/20 text-primary' 
                            : 'bg-card border-border/10 text-muted-foreground hover:bg-muted/30'
                        }`}
                      >
                        <span className="text-xs font-bold uppercase tracking-widest">
                          {mode === 'always' ? 'Sempre Exibir' : mode === 'first_selection' ? 'Apenas na Primeira' : 'Nunca Exibir'}
                        </span>
                        {settings.logosSuggestions === mode && <Icons.Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed italic px-1">
                    Controla o surgimento das sugestões contextuais durante a leitura.
                  </p>
                </div>
              </section>

              <section className="space-y-4 pt-4">
                <h3 className="text-premium-tiny font-bold uppercase tracking-[0.4em] text-primary/60 border-b border-border/10 pb-2">Impacto na Leitura</h3>
                <div className="p-4 rounded-premium bg-primary/5 border border-primary/10 space-y-3">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-primary">
                    <Icons.Info className="w-3.5 h-3.5" />
                    <span>Otimização para NVDA & VoiceOver</span>
                  </div>
                  <p className="text-[11px] text-primary/60 leading-relaxed italic">
                    A plataforma utiliza semântica WCAG 2.1 para garantir que a navegação via teclado e leitores de tela seja fluida e contínua.
                  </p>
                </div>
              </section>
            </div>

            <div className="pt-8 border-t border-border/10">
              <Button className="w-full rounded-full h-14 text-[10px] font-bold uppercase tracking-[0.3em] shadow-premium btn-premium-primary" onClick={onClose}>
                Concluído
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default A11ySettingsPanel;