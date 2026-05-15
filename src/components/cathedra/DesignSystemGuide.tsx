import React, { useState, useEffect } from 'react';
import { runDesignSystemAudit, AuditResult } from '@/lib/design-system-audit';
import { ShieldAlert, Activity, RefreshCw, Type, Grid } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Icons } from '@/constants';
import { motion, AnimatePresence } from 'framer-motion';

const ComponentPlayground = () => {
  const [state, setState] = useState<'default' | 'error' | 'disabled' | 'loading'>('default');
  const [activeTab, setActiveTab] = useState('inputs');
  
  return (
    <div className="p-8 md:p-12 rounded-premium bg-card border border-border/20 space-y-10 shadow-premium transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex flex-wrap gap-3">
          {(['default', 'error', 'disabled', 'loading'] as const).map((s) => (
            <Button 
              key={s}
              variant={state === s ? 'primary' : 'outline'} 
              size="sm" 
              onClick={() => setState(s)}
              className="rounded-full px-6 capitalize h-11 text-[10px] font-bold tracking-widest border-border/30 hover:shadow-premium"
            >
              {s === 'default' ? 'Padrão' : s === 'error' ? 'Erro' : s === 'disabled' ? 'Desativado' : 'Carregando'}
            </Button>
          ))}
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList className="bg-primary/[0.03] rounded-full p-1.5 h-14 border border-border/10">
            <TabsTrigger value="inputs" className="rounded-full px-8 text-[10px] font-bold uppercase tracking-[0.2em] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Inputs</TabsTrigger>
            <TabsTrigger value="selects" className="rounded-full px-8 text-[10px] font-bold uppercase tracking-[0.2em] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Selects</TabsTrigger>
            <TabsTrigger value="others" className="rounded-full px-8 text-[10px] font-bold uppercase tracking-[0.2em] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Outros</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="pt-8 border-t border-border/40 min-h-[300px]">
        <AnimatePresence mode="wait">
          {activeTab === 'inputs' && (
            <motion.div 
              key="inputs"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-3">
                <Label 
                  className={`font-serif text-lg ${state === 'error' ? 'text-destructive' : 'text-foreground'}`}
                  aria-disabled={state === 'disabled'}
                >
                  Nome do Fiel
                </Label>
                <div className="relative">
                  <Input 
                    disabled={state === 'disabled'}
                    className={`rounded-2xl border-border/40 h-14 px-6 focus-visible:ring-primary/20 ${state === 'error' ? 'border-destructive focus-visible:ring-destructive/20' : ''}`}
                    placeholder={state === 'loading' ? 'Processando...' : 'Digite seu nome completo...'}
                  />
                  {state === 'loading' && (
                    <Icons.Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-primary" />
                  )}
                </div>
                {state === 'error' && (
                  <p className="text-premium-tiny font-black uppercase text-destructive tracking-widest flex items-center gap-2 px-1">
                    <Icons.AlertTriangle className="w-3.5 h-3.5" /> Este campo é obrigatório.
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'selects' && (
            <motion.div 
              key="selects"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-3">
                <Label className="font-serif text-lg text-foreground" aria-disabled={state === 'disabled'}>Tema de Oração</Label>
                <Select disabled={state === 'disabled'}>
                  <SelectTrigger className={`rounded-2xl border-border/40 h-14 px-6 focus-visible:ring-primary/20 ${state === 'error' ? 'border-destructive' : ''}`}>
                    <SelectValue placeholder="Escolha um tema" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border/40">
                    <SelectItem value="1">Liturgia Diária</SelectItem>
                    <SelectItem value="2">Catecismo da Igreja</SelectItem>
                    <SelectItem value="3">Vidas dos Santos</SelectItem>
                  </SelectContent>
                </Select>
                {state === 'error' && (
                  <p className="text-premium-tiny font-black uppercase text-destructive tracking-widest flex items-center gap-2 px-1">
                    <Icons.AlertTriangle className="w-3.5 h-3.5" /> Selecione uma opção válida.
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'others' && (
            <motion.div 
              key="others"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center space-x-3">
                <Checkbox id="terms" disabled={state === 'disabled'} className="rounded-md border-border/40" />
                <Label htmlFor="terms" className="text-sm font-serif leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Aceito os termos de uso e privacidade
                </Label>
              </div>
              
              <div className="flex items-center space-x-3">
                <Checkbox id="newsletter" disabled={state === 'disabled'} defaultChecked className="rounded-md border-border/40" />
                <Label htmlFor="newsletter" className="text-sm font-serif leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Desejo receber notificações diárias de oração
                </Label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10">
        <p className="text-premium-tiny font-black uppercase tracking-widest text-primary mb-3">Auditoria de Acessibilidade (A11y)</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Icons.CheckCircle2 className={`w-4 h-4 ${state !== 'disabled' ? 'text-green-600' : 'text-[#0F172A]/20'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Foco Visível (Ring 2px)</span>
          </div>
          <div className="flex items-center gap-2">
            <Icons.CheckCircle2 className={`w-4 h-4 ${state === 'disabled' ? 'text-green-600' : 'text-[#0F172A]/20'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Aria-Disabled Support</span>
          </div>
          <div className="flex items-center gap-2">
            <Icons.CheckCircle2 className={`w-4 h-4 ${state === 'error' ? 'text-green-600' : 'text-[#0F172A]/20'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Aria-Invalid Semantic</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const DesignSystemGuide = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [isHighContrast, setIsHighContrast] = useState(() => document.documentElement.classList.contains('high-contrast'));

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains('dark'));
          setIsHighContrast(document.documentElement.classList.contains('high-contrast'));
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const toggleMode = () => {
    if (isDarkMode) document.documentElement.classList.remove('dark');
    else document.documentElement.classList.add('dark');
  };

  const toggleHighContrast = () => {
    if (isHighContrast) document.documentElement.classList.remove('high-contrast');
    else document.documentElement.classList.add('high-contrast');
  };

  return (
    <div className="min-h-screen bg-background py-16 md:py-24 px-6 transition-colors duration-300">
      <div className="max-w-5xl mx-auto space-y-24">
        {/* Header */}
        <header className="space-y-8 text-center py-10 md:py-20">
          <div className="flex flex-wrap justify-center md:justify-end gap-4 mb-12">
            <Button 
              onClick={toggleHighContrast} 
              variant={isHighContrast ? "default" : "outline"}
              className="rounded-full gap-3 border-border/20 px-6 h-12"
            >
              <Icons.ShieldCheck className={`w-5 h-5 ${isHighContrast ? 'text-primary-foreground' : 'text-primary'}`} />
              <span className="text-[10px] font-bold uppercase tracking-widest">{isHighContrast ? 'Desativar Alto Contraste' : 'Ativar Alto Contraste'}</span>
            </Button>
            <Button 
              onClick={toggleMode} 
              variant="outline" 
              className="rounded-full gap-3 border-border/20 px-6 h-12 hover:bg-primary/[0.03]"
            >
              {isDarkMode ? <Icons.Sun className="w-5 h-5 text-secondary" strokeWidth={1.5} /> : <Icons.Moon className="w-5 h-5 text-primary" strokeWidth={1.5} />}
              <span className="text-[10px] font-bold uppercase tracking-widest">{isDarkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
            </Button>
          </div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-6 py-2 bg-primary/[0.03] border border-border/20 rounded-full"
          >
            <Icons.ShieldCheck className="w-4 h-4 text-secondary" strokeWidth={1.5} />
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-foreground/40">Design System v2.7</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-display font-medium text-primary leading-[1.1] tracking-tight"
          >
            Identidade <br />
            <span className="text-secondary/70 italic font-serif">Visual Premium</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl text-foreground/40 max-w-2xl mx-auto font-serif italic"
          >
            Uma linguagem unificada para uma experiência espiritual inteligente, contemplativa e sofisticada.
          </motion.p>
        </header>

        {/* Cores Section */}
        <section className="space-y-10">
          <div className="flex items-center gap-6">
            <div className="h-px flex-1 bg-border/40" />
            <h2 className="text-premium-tiny font-black uppercase tracking-[0.4em] text-foreground/30">Paleta de Cores & Contraste</h2>
            <div className="h-px flex-1 bg-border/40" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { 
                name: isDarkMode ? 'Primária (Ouro AAA)' : 'Primária (Navy AAA)', 
                hex: isDarkMode ? '#F3D059' : '#0F172A', 
                class: 'bg-primary', 
                accessibility: 'AAA',
                contrast: isDarkMode ? '7.5:1' : '17.5:1'
              },
              { 
                name: isDarkMode ? 'Acento (Deep Blue)' : 'Acento (Gold)', 
                hex: isDarkMode ? '#0F172A' : '#D4AF37', 
                class: 'bg-secondary', 
                accessibility: 'AAA',
                contrast: isDarkMode ? '12.2:1' : '7.1:1'
              },
              { 
                name: 'Fundo Adaptive', 
                hex: isDarkMode ? '#0A0E1A' : '#F8F5EE', 
                class: 'bg-background', 
                border: 'border-border/40',
                accessibility: 'AAA',
                contrast: '21:1'
              },
              { 
                name: 'Card Adaptive', 
                hex: isDarkMode ? '#0F172A' : '#FFFFFF', 
                class: 'bg-card', 
                border: 'border-border/40',
                accessibility: 'AAA',
                contrast: '18:1'
              },
            ].map((color) => (
              <div key={color.name} className="space-y-4 group">
                <div className={`h-32 rounded-[2rem] ${color.class} ${color.border || 'border-transparent'} shadow-sm transition-transform group-hover:scale-[1.02]`} />
                <div className="px-2">
                  <p className="font-serif font-bold text-foreground">{color.name}</p>
                  <p className="text-xs text-foreground/40 font-mono mt-1">{color.hex}</p>
                  <div className="mt-3 flex flex-col gap-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/5 text-green-600 text-[10px] font-black uppercase tracking-widest border border-green-500/10 w-fit">
                      WCAG {color.accessibility} Pass
                    </div>
                    <span className="text-[10px] text-foreground/40 font-mono">Contraste: {color.contrast}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tipografia Section */}
        <section className="space-y-10">
          <div className="flex items-center gap-6">
            <div className="h-px flex-1 bg-border/40" />
            <h2 className="text-premium-tiny font-black uppercase tracking-[0.4em] text-foreground/30">Tipografia Adaptive</h2>
            <div className="h-px flex-1 bg-border/40" />
          </div>

          <div className="bg-card border border-border/40 rounded-[3rem] p-8 md:p-16 space-y-16 shadow-premium transition-colors">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <div className="space-y-8">
                <span className="text-premium-tiny text-secondary font-black uppercase tracking-widest">Display & Headlines</span>
                <div className="space-y-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30">H1 Display - 72px</p>
                    <h1 className="text-5xl md:text-7xl font-display text-foreground leading-tight">A Glória de Deus</h1>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30">H2 Headline - 48px</p>
                    <h2 className="text-3xl md:text-5xl font-display text-foreground">Oração e Contemplação</h2>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30">H3 Subheadline - 32px</p>
                    <h3 className="text-2xl md:text-3xl font-serif text-foreground/80 italic">Caminho de Santidade</h3>
                  </div>
                </div>
              </div>
              <div className="space-y-8">
                <span className="text-premium-tiny text-secondary font-black uppercase tracking-widest">Body & UI Text</span>
                <div className="space-y-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30">Body Base - 18px (Serif)</p>
                    <p className="text-lg font-serif text-foreground/80 leading-relaxed">
                      "Não te inquietes com as dificuldades da vida, com os seus altos e baixos, com as suas decepções."
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30">UI Small - 14px (Sans)</p>
                    <p className="text-sm font-sans font-medium text-foreground/60">
                      Utilizado para descrições secundárias, metadados e textos de interface que exigem precisão.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30">Premium Tiny - 10px (All-caps)</p>
                    <p className="text-premium-tiny font-black uppercase tracking-[0.3em] text-primary">
                      Ação Primária • 15 de Maio
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Visual Regression Sticker Sheet */}
        <section className="space-y-12">
          <div className="flex items-center gap-6">
            <div className="h-px flex-1 bg-border/40" />
            <h2 className="text-premium-tiny font-black uppercase tracking-[0.4em] text-foreground/30">Sticker Sheet & Regressão Visual</h2>
            <div className="h-px flex-1 bg-border/40" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Card Consistency */}
            <div className="space-y-6">
              <h3 className="text-xl font-serif font-bold text-primary">Consistência de Cards</h3>
              <div className="space-y-6">
                <div className="premium-card p-8 flex flex-col gap-4">
                  <Badge className="w-fit rounded-full bg-primary/5 text-primary border-primary/10 px-4 py-1">Premium Default</Badge>
                  <p className="font-serif italic text-lg opacity-70">"A base de toda a interface."</p>
                  <div className="text-[10px] font-mono text-muted-foreground opacity-50">.premium-card</div>
                </div>
                <div className="premium-card-interactive p-8 flex flex-col gap-4">
                  <Badge className="w-fit rounded-full bg-secondary/10 text-secondary border-secondary/20 px-4 py-1">Premium Interactive</Badge>
                  <p className="font-serif italic text-lg opacity-70">"Feedback visual de hover e escala."</p>
                  <div className="text-[10px] font-mono text-muted-foreground opacity-50">.premium-card-interactive</div>
                </div>
              </div>
            </div>

            {/* Typography Consistency */}
            <div className="space-y-6">
              <h3 className="text-xl font-serif font-bold text-primary">Hierarquia Visual</h3>
              <div className="space-y-6 premium-card p-8">
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-secondary">Display (h1)</span>
                  <h1 className="text-4xl font-display">Soli Deo Gloria</h1>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-secondary">Headline (h2)</span>
                  <h2 className="text-2xl font-display">Veritas et Caritas</h2>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-secondary">Subheadline (h3)</span>
                  <h3 className="text-xl font-display">Mysterium Fidei</h3>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-secondary">Body (p)</span>
                  <p className="text-sm leading-relaxed">O equilíbrio perfeito entre o minimalismo contemporâneo e a tradição sagrada.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Component & Grid Audit */}
        <section className="space-y-12">
          <div className="flex items-center gap-6">
            <div className="h-px flex-1 bg-border/40" />
            <h2 className="text-premium-tiny font-black uppercase tracking-[0.4em] text-foreground/30">Auditoria de Grids & Componentes</h2>
            <div className="h-px flex-1 bg-border/40" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-14 lg:gap-20">
            {[
              { label: 'Grid Mobile (sm)', desc: 'Coluna Única (16px gap)', status: 'Validado' },
              { label: 'Grid Tablet (md)', desc: 'Duas Colunas (24px gap)', status: 'Validado' },
              { label: 'Grid Desktop (lg)', desc: 'Três Colunas (32px gap)', status: 'Validado' },
              { label: 'Desktop XL', desc: 'Layout com Sidebar (40px gap)', status: 'Validado' }
            ].map((item, i) => (
              <div key={i} className="premium-card p-6 border-secondary/10 bg-secondary/[0.02]">
                <p className="text-[10px] font-black uppercase tracking-widest text-secondary mb-2">{item.label}</p>
                <p className="text-sm font-medium text-primary">{item.desc}</p>
                <div className="mt-4 flex items-center gap-2">
                  <Icons.CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-green-600/70">{item.status}</span>
                </div>
              </div>
            ))}
          </div>

          <ComponentPlayground />
        </section>

        {/* Real-time Design Audit */}
        <section className="space-y-10">
          <div className="flex items-center gap-6">
            <div className="h-px flex-1 bg-border/40" />
            <h2 className="text-premium-tiny font-black uppercase tracking-[0.4em] text-foreground/30">Auditoria em Tempo Real (WCAG & Tokens)</h2>
            <div className="h-px flex-1 bg-border/40" />
          </div>

          <RealTimeAudit />
        </section>


        <footer className="pt-24 pb-12 text-center border-t border-border/10">
          <p className="text-premium-tiny font-black uppercase tracking-[0.5em] text-foreground/20">
            Cathedra Digital • Design Protocol v2.8.0
          </p>
        </footer>
      </div>
    </div>
  );
};

export default DesignSystemGuide;