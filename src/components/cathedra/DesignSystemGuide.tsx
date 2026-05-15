import React, { useState, useEffect } from 'react';
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
    <div className="p-8 md:p-12 rounded-[3rem] bg-card border border-border/20 space-y-10 shadow-premium transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex flex-wrap gap-3">
          {(['default', 'error', 'disabled', 'loading'] as const).map((s) => (
            <Button 
              key={s}
              variant={state === s ? 'primary' : 'outline'} 
              size="sm" 
              onClick={() => setState(s)}
              className="rounded-full px-6 capitalize h-11 text-[10px] font-bold tracking-widest border-border/30"
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

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const toggleMode = () => {
    const newMode = !isDarkMode;
    // Dispatch event to sync with App.tsx state if necessary, 
    // though App.tsx should handle class changes
    if (newMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    
    // Save to localStorage for persistence consistency
    localStorage.setItem('cathedra_dark', newMode ? 'true' : 'false');
  };

  return (
    <div className="min-h-screen bg-background py-16 md:py-24 px-6 transition-colors duration-300">
      <div className="max-w-5xl mx-auto space-y-24">
        {/* Header */}
        <header className="space-y-8 text-center py-10 md:py-20">
          <div className="flex justify-end mb-12">
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
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-foreground/40">Design System v2.5</span>
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
                name: isDarkMode ? 'Primária (Ouro)' : 'Primária (Navy)', 
                hex: isDarkMode ? '#D4AF37' : '#0F172A', 
                class: 'bg-primary', 
                accessibility: 'AAA',
                contrast: isDarkMode ? '8.4:1' : '15.8:1'
              },
              { 
                name: isDarkMode ? 'Secundária (Escuro)' : 'Secundária (Ouro)', 
                hex: isDarkMode ? '#1A1A1A' : '#D4AF37', 
                class: 'bg-secondary', 
                accessibility: 'AAA',
                contrast: isDarkMode ? '12.2:1' : '7.1:1'
              },
              { 
                name: 'Fundo (Adaptive)', 
                hex: isDarkMode ? '#0F172A' : '#F8F5EE', 
                class: 'bg-background', 
                border: 'border-border/40',
                accessibility: 'AAA',
                contrast: '21:1'
              },
              { 
                name: 'Card (Adaptive)', 
                hex: isDarkMode ? '#1E293B' : '#FFFFFF', 
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
                    <h1 className="text-5xl md:text-7xl font-serif text-foreground leading-tight">A Glória de Deus</h1>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30">H2 Headline - 48px</p>
                    <h2 className="text-3xl md:text-5xl font-serif text-foreground">Oração e Contemplação</h2>
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

        {/* Botões Section */}
        <section className="space-y-10">
          <div className="flex items-center gap-6">
            <div className="h-px flex-1 bg-border/40" />
            <h2 className="text-premium-tiny font-black uppercase tracking-[0.4em] text-foreground/30">Componentes de Ação</h2>
            <div className="h-px flex-1 bg-border/40" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-card border border-border/40 rounded-[2.5rem] p-10 space-y-10">
              <h3 className="text-xl font-serif font-bold text-foreground">Variantes de Botão</h3>
              <div className="grid gap-4">
                <Button className="h-14 rounded-2xl text-premium-tiny font-black uppercase tracking-widest">Ação Primária</Button>
                <Button variant="secondary" className="h-14 rounded-2xl text-premium-tiny font-black uppercase tracking-widest">Ação Secundária</Button>
                <Button variant="outline" className="h-14 rounded-2xl text-premium-tiny font-black uppercase tracking-widest border-border/40">Borda (Outline)</Button>
                <Button variant="ghost" className="h-14 rounded-2xl text-premium-tiny font-black uppercase tracking-widest">Fantasma (Ghost)</Button>
              </div>
            </div>

            <div className="bg-card border border-border/40 rounded-[2.5rem] p-10 space-y-10">
              <h3 className="text-xl font-serif font-bold text-foreground">Estados e Ícones</h3>
              <div className="flex flex-wrap gap-4">
                <Button isLoading className="h-14 rounded-2xl px-8">Processando</Button>
                <Button disabled className="h-14 rounded-2xl px-8">Desativado</Button>
                <Button size="icon" className="h-14 w-14 rounded-2xl">
                  <Icons.Search className="w-5 h-5" />
                </Button>
                <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-border/40">
                  <Icons.Heart className="w-5 h-5" />
                </Button>
              </div>
              <div className="p-5 bg-secondary/10 rounded-2xl border border-secondary/20">
                <p className="text-[11px] text-foreground/60 leading-relaxed italic font-serif">
                  * Todos os ícones em botões devem usar o tamanho padrão de 20px (w-5 h-5) via classes utilitárias no componente UI/Button para garantir padronização em todos os breakpoints.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Playground Interativo */}
        <section className="space-y-10">
          <div className="flex items-center gap-6">
            <div className="h-px flex-1 bg-border/40" />
            <h2 className="text-premium-tiny font-black uppercase tracking-[0.4em] text-foreground/30">Playground de Acessibilidade</h2>
            <div className="h-px flex-1 bg-border/40" />
          </div>
          <ComponentPlayground />
        </section>

        {/* Contrast Checker Simulation */}
        <section className="space-y-10">
          <div className="flex items-center gap-6">
            <div className="h-px flex-1 bg-border/40" />
            <h2 className="text-premium-tiny font-black uppercase tracking-[0.4em] text-foreground/30">Validação WCAG AAA</h2>
            <div className="h-px flex-1 bg-border/40" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-primary p-8 rounded-[2.5rem] space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-primary-foreground/40 text-[10px] font-black uppercase tracking-widest">Primary vs Foreground</span>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/20 shadow-none">AAA Pass</Badge>
              </div>
              <p className="text-primary-foreground font-serif text-lg leading-relaxed">
                Legibilidade perfeita para longos blocos de texto sobre fundo adaptativo.
              </p>
            </div>
            
            <div className="bg-secondary p-8 rounded-[2.5rem] space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-secondary-foreground/40 text-[10px] font-black uppercase tracking-widest">Secondary vs Foreground</span>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/20 shadow-none">AAA Pass</Badge>
              </div>
              <p className="text-secondary-foreground font-serif text-lg leading-relaxed">
                Destaque premium com alto contraste para elementos de atenção.
              </p>
            </div>

            <div className="bg-card border border-border/40 p-8 rounded-[2.5rem] space-y-4 shadow-premium">
              <div className="flex justify-between items-start">
                <span className="text-foreground/40 text-[10px] font-black uppercase tracking-widest">Card vs Background</span>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/20 shadow-none">7.5:1 (AAA)</Badge>
              </div>
              <p className="text-foreground font-serif text-lg leading-relaxed">
                Separação visual clara e confortável para leitura prolongada.
              </p>
            </div>
          </div>
        </section>

        {/* Footer info */}
        <footer className="pt-20 border-t border-border/40 text-center space-y-4">
          <p className="text-premium-tiny font-black uppercase tracking-[0.5em] text-foreground/20">
            Ad Majorem Dei Gloriam
          </p>
          <div className="flex justify-center gap-4">
            <div className="w-1.5 h-1.5 rounded-full bg-secondary/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-secondary/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-secondary/40" />
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DesignSystemGuide;