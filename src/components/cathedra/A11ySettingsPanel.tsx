import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useLang } from '@/hooks/useLang';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';
import { ShortcutInput } from './ShortcutInput';
import { Slider } from '@/components/ui/slider';
import { runDesignSystemAudit, exportAuditReport, AuditResult } from '@/lib/design-system-audit';
import { useLocation } from 'react-router-dom';

interface A11ySettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const A11ySettingsPanel: React.FC<A11ySettingsPanelProps> = ({
  isOpen,
  onClose,
}) => {
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
  const { t } = useLang();
  const { settings, updateSettings } = useReadingSettings();
  const location = useLocation();
  const [auditResult, setAuditResult] = React.useState<AuditResult | null>(null);
  const [isAuditing, setIsAuditing] = React.useState(false);

  const runAudit = async () => {
    setIsAuditing(true);
    try {
      const result = await runDesignSystemAudit(location.pathname);
      setAuditResult(result);
    } catch (error) {
      console.error('Audit failed:', error);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleExport = (format: 'json' | 'pdf') => {
    if (auditResult) {
      exportAuditReport(auditResult, format);
    } else {
      runAudit().then(() => {
        runDesignSystemAudit(location.pathname).then(res => exportAuditReport(res, format));
      });
    }
  };

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
            ref={panelRef}
            className="fixed right-0 top-spacing-0 bottom-spacing-0 w-full max-w-spacing-sm bg-card border-l border-border/40 shadow-premium-hover z-[201] p-spacing-xl flex flex-col outline-none"
            tabIndex={-1}
            role="dialog"
            aria-labelledby="a11y-title"
          >
            <div className="flex items-center justify-between mb-spacing-xl">
              <div className="flex items-center gap-spacing-sm">
                <div className="p-spacing-xs rounded-premium-sm bg-primary/10 text-primary">
                  <Icons.ShieldCheck className="w-spacing-md h-spacing-md" />
                </div>
                <h2 id="a11y-title" className="text-premium-xl font-serif font-bold text-primary">Acessibilidade</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-premium-full">
                <Icons.X className="w-spacing-md h-spacing-md" />
              </Button>
            </div>

            <div className="space-y-spacing-xl overflow-y-auto pr-spacing-xs custom-scrollbar flex-1">
              <section className="space-y-spacing-lg">
                <h3 className="text-premium-xs font-bold uppercase tracking-[0.4em] text-primary/60 border-b border-border/10 pb-spacing-xs">Aparência e Leitura</h3>
                
                <div className="space-y-spacing-md">
                  <div className="flex items-center justify-between group">
                    <div className="space-y-spacing-2xs">
                      <label htmlFor="dark-mode-toggle" className="text-premium-sm font-bold text-primary cursor-pointer">Modo Escuro</label>
                      <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[200px]">Reduz o cansaço visual em ambientes com pouca luz.</p>
                    </div>
                    <Switch 
                      id="dark-mode-toggle" 
                      checked={settings.theme === 'dark' || settings.theme === 'night'} 
                      onCheckedChange={(val) => updateSettings({ theme: val ? 'dark' : 'paper' })} 
                    />
                  </div>

                  <div className="flex items-center justify-between group pt-spacing-md">
                    <div className="space-y-spacing-2xs">
                      <label htmlFor="high-contrast-toggle" className="text-premium-sm font-bold text-primary cursor-pointer">Alto Contraste</label>
                      <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[200px]">Aumenta a distinção entre elementos para facilitar a leitura.</p>
                    </div>
                    <Switch 
                      id="high-contrast-toggle" 
                      checked={settings.highContrast} 
                      onCheckedChange={(val) => updateSettings({ highContrast: val })} 
                    />
                  </div>
                  <div className="flex items-center justify-between group pt-spacing-md">
                    <div className="space-y-spacing-2xs">
                      <label htmlFor="reduce-animations-toggle" className="text-premium-sm font-bold text-primary cursor-pointer">Reduzir Animações</label>
                      <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[200px]">Desativa movimentos excessivos para uma experiência mais estática e rápida.</p>
                    </div>
                    <Switch 
                      id="reduce-animations-toggle" 
                      data-testid="reducao-movimento-toggle"
                      checked={settings.reduceAnimations} 
                      onCheckedChange={(val) => updateSettings({ reduceAnimations: val })} 
                    />
                  </div>
                  </div>
                  
                  <div className="flex items-center justify-between group pt-spacing-md">
                    <div className="space-y-spacing-2xs">
                      <label htmlFor="visible-focus-toggle" className="text-premium-sm font-bold text-primary cursor-pointer">Foco Visível</label>
                      <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[200px]">Adiciona uma borda de alto destaque em elementos selecionados.</p>
                    </div>
                    <Switch 
                      id="visible-focus-toggle" 
                      checked={settings.visibleFocus} 
                      onCheckedChange={(val) => updateSettings({ visibleFocus: val })} 
                    />
                  </div>

                  <div className="space-y-spacing-md pt-spacing-lg">
                    <div className="flex items-center justify-between">
                      <label className="text-premium-sm font-bold text-primary">Tamanho da Fonte</label>
                      <span className="text-[10px] font-bold text-primary uppercase">{settings.fontSize}</span>
                    </div>
                    <div className="flex bg-muted/30 rounded-premium p-spacing-2xs gap-spacing-2xs border border-primary/5">
                      {(['small', 'medium', 'large', 'extra-large'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => updateSettings({ fontSize: s })}
                          className={`flex-1 py-spacing-xs text-[10px] font-bold rounded-premium-lg transition-all ${
                            settings.fontSize === s ? 'bg-background text-primary shadow-premium-sm' : 'text-muted-foreground/40 hover:text-primary'
                          }`}
                          aria-label={`Mudar tamanho da fonte para ${s}`}
                        >
                          {s === 'small' ? 'A' : s === 'medium' ? 'A+' : s === 'large' ? 'A++' : 'A+++'}
                        </button>
                      ))}
                    </div>
                  </div>

              </section>

              <section className="space-y-spacing-lg pt-spacing-md">
                <h3 className="text-premium-xs font-bold uppercase tracking-[0.4em] text-primary/60 border-b border-border/10 pb-spacing-xs">Atalhos de Teclado</h3>
                <div className="grid gap-spacing-sm">
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

              <section className="space-y-spacing-lg pt-spacing-md">
                <div className="flex items-center justify-between mb-spacing-xs">
                  <h3 className="text-premium-xs font-bold uppercase tracking-[0.4em] text-primary/60">Histórico Logos IA</h3>
                  <span className="text-premium-xs font-bold text-primary">{settings.logosHistoryLimit} itens</span>
                </div>
                <div className="px-spacing-xs">
                  <Slider 
                    value={[settings.logosHistoryLimit]} 
                    min={5} 
                    max={50} 
                    step={5} 
                    onValueChange={(val) => updateSettings({ logosHistoryLimit: val[0] })}
                    className="py-spacing-md"
                  />
                  <p className="text-[10px] text-muted-foreground leading-relaxed italic mt-spacing-xs">
                    Define quantas consultas recentes serão mantidas em sua memória local.
                  </p>
                </div>
              </section>

              <section className="space-y-spacing-lg pt-spacing-md">
                <h3 className="text-premium-xs font-bold uppercase tracking-[0.4em] text-primary/60 border-b border-border/10 pb-spacing-xs">Sugestões Logos IA</h3>
                <div className="space-y-spacing-md">
                  <div className="flex flex-col gap-spacing-xs">
                    {(['always', 'first_selection', 'never'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => updateSettings({ logosSuggestions: mode })}
                        className={`flex items-center justify-between p-spacing-md rounded-premium border transition-all ${
                          settings.logosSuggestions === mode 
                            ? 'bg-primary/5 border-primary/20 text-primary' 
                            : 'bg-card border-border/10 text-muted-foreground hover:bg-muted/30'
                        }`}
                      >
                        <span className="text-premium-xs font-bold uppercase tracking-widest">
                          {mode === 'always' ? 'Sempre Exibir' : mode === 'first_selection' ? 'Apenas na Primeira' : 'Nunca Exibir'}
                        </span>
                        {settings.logosSuggestions === mode && <Icons.Check className="w-spacing-md h-spacing-md" />}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed italic px-spacing-2xs">
                    Controla o surgimento das sugestões contextuais durante a leitura.
                  </p>
                </div>
              </section>

              <section className="space-y-spacing-md pt-spacing-md">
                <h3 className="text-premium-xs font-bold uppercase tracking-[0.4em] text-primary/60 border-b border-border/10 pb-spacing-xs">Impacto na Leitura</h3>
                <div className="p-spacing-md rounded-premium bg-primary/5 border border-primary/10 space-y-spacing-sm">
                  <div className="flex items-center gap-spacing-xs text-[11px] font-bold text-primary">
                    <Icons.Info className="w-spacing-sm h-spacing-sm" />
                    <span>Otimização para NVDA & VoiceOver</span>
                  </div>
                  <p className="text-[11px] text-primary/60 leading-relaxed italic">
                    A plataforma utiliza semântica WCAG 2.1 para garantir que a navegação via teclado e leitores de tela seja fluida e contínua.
                  </p>
                </div>
              </section>
              
              <section className="space-y-spacing-lg pt-spacing-xl border-t border-border/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-premium-xs font-bold uppercase tracking-[0.4em] text-primary/60">Auditoria Técnica</h3>
                  {auditResult && (
                    <span className={`text-[10px] font-black uppercase tracking-widest ${auditResult.status === 'premium' ? 'text-green-500' : 'text-amber-500'}`}>
                      Score: {auditResult.wcagScore}%
                    </span>
                  )}
                </div>
                
                <div className="space-y-spacing-md">
                  <Button 
                    variant="outline" 
                    className="w-full h-spacing-2xl rounded-premium text-[9px] font-bold uppercase tracking-[0.2em] border-primary/10 hover:border-primary/20 bg-primary/[0.02]"
                    onClick={runAudit}
                    disabled={isAuditing}
                  >
                    {isAuditing ? 'Auditoria em curso...' : 'Verificar Conformidade WCAG'}
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-spacing-sm">
                    <Button 
                      variant="ghost" 
                      className="h-spacing-2xl rounded-premium text-[9px] font-bold uppercase tracking-[0.2em] text-primary/60 border border-primary/5 hover:border-primary/10"
                      onClick={() => handleExport('json')}
                    >
                      <Icons.Database className="w-spacing-sm h-spacing-sm mr-spacing-xs" />
                      JSON
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="h-spacing-2xl rounded-premium text-[9px] font-bold uppercase tracking-[0.2em] text-primary/60 border border-primary/5 hover:border-primary/10"
                      onClick={() => handleExport('pdf')}
                    >
                      <Icons.FileText className="w-spacing-sm h-spacing-sm mr-spacing-xs" />
                      PDF
                    </Button>
                  </div>

                  {auditResult && auditResult.contrastIssues.length > 0 && (
                    <div className="p-spacing-md rounded-premium bg-amber-500/5 border border-amber-500/10 space-y-spacing-sm">
                      <div className="flex items-center gap-spacing-xs text-[10px] font-bold text-amber-600 uppercase tracking-widest">
                        <Icons.AlertTriangle className="w-spacing-sm h-spacing-sm" />
                        <span>Ajustes de Contraste Necessários</span>
                      </div>
                      <ul className="space-y-spacing-xs">
                        {auditResult.contrastIssues.slice(0, 5).map((issue, idx) => (
                          <li key={idx} className="text-[9px] text-amber-600/70 leading-relaxed italic border-b border-amber-500/5 pb-spacing-xs last:border-0">
                            <div className="flex justify-between items-start gap-spacing-xs">
                              <span>Elemento: <span className="font-bold">{issue.element}</span></span>
                              <span className="font-black text-[8px] bg-amber-500/10 px-spacing-2xs rounded">Ratio: {issue.ratio}</span>
                            </div>
                            <div className="text-[8px] text-amber-700/60 mt-spacing-3xs">
                              {issue.suggestion}
                            </div>
                            <a href={`/design-system?search=contrast`} className="text-[7px] uppercase tracking-tighter underline text-amber-700/40 hover:text-amber-700 block mt-spacing-2xs">Ver Token</a>
                          </li>
                        ))}
                        {auditResult.contrastIssues.length > 5 && (
                          <li className="text-[8px] text-amber-600/40 uppercase font-bold tracking-widest pt-spacing-xs text-center">
                            + {auditResult.contrastIssues.length - 5} problemas adicionais (veja relatório completo)
                          </li>
                        )}
                      </ul>
                      <p className="text-[8px] text-primary/40 leading-relaxed pt-spacing-xs">
                        Consulte o <a href="/design-system" className="underline hover:text-primary">Design System</a> para tokens oficiais.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="pt-spacing-xl border-t border-border/10">
              <Button className="w-full rounded-premium-full h-spacing-2xl text-[10px] font-bold uppercase tracking-[0.3em] shadow-premium btn-premium-primary" onClick={onClose}>
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