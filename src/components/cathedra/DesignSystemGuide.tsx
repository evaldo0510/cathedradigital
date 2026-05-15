import React, { useState } from 'react';
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
import { Icons } from '@/constants';
import { motion } from 'framer-motion';

const InputPlayground = () => {
  const [variant, setVariant] = useState<'default' | 'error' | 'disabled' | 'loading'>('default');
  
  return (
    <div className="p-8 rounded-[2.5rem] bg-white border border-[#0F172A]/5 space-y-8 shadow-sm">
      <div className="flex flex-wrap gap-3">
        {(['default', 'error', 'disabled', 'loading'] as const).map((v) => (
          <Button 
            key={v}
            variant={variant === v ? 'primary' : 'outline'} 
            size="sm" 
            onClick={() => setVariant(v)}
            className="rounded-full px-6 capitalize"
          >
            {v === 'default' ? 'Padrão' : v === 'error' ? 'Erro' : v === 'disabled' ? 'Desativado' : 'Carregando'}
          </Button>
        ))}
      </div>

      <div className="space-y-6 pt-6 border-t border-[#0F172A]/5">
        <div className="space-y-3">
          <Label 
            className={`font-serif text-lg ${variant === 'error' ? 'text-destructive' : 'text-[#0F172A]'}`}
            aria-disabled={variant === 'disabled'}
          >
            Campo de Teste
          </Label>
          <div className="relative">
            <Input 
              disabled={variant === 'disabled'}
              className={`rounded-2xl border-[#0F172A]/10 h-14 px-6 focus-visible:ring-primary/20 ${variant === 'error' ? 'border-destructive focus-visible:ring-destructive/20' : ''}`}
              placeholder={variant === 'loading' ? 'Processando...' : 'Digite algo...'}
            />
            {variant === 'loading' && (
              <Icons.Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-primary" />
            )}
          </div>
          {variant === 'error' && (
            <p className="text-premium-tiny font-black uppercase text-destructive tracking-widest flex items-center gap-2 px-1">
              <Icons.AlertTriangle className="w-3.5 h-3.5" /> Este campo é obrigatório.
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Label className="font-serif text-lg text-[#0F172A]" aria-disabled={variant === 'disabled'}>Seleção de Opção</Label>
          <Select disabled={variant === 'disabled'}>
            <SelectTrigger className={`rounded-2xl border-[#0F172A]/10 h-14 px-6 focus-visible:ring-primary/20 ${variant === 'error' ? 'border-destructive' : ''}`}>
              <SelectValue placeholder="Escolha uma categoria" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-[#0F172A]/10">
              <SelectItem value="1">Liturgia</SelectItem>
              <SelectItem value="2">Catecismo</SelectItem>
              <SelectItem value="3">Vidas dos Santos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10">
        <p className="text-premium-tiny font-black uppercase tracking-widest text-primary mb-3">Acessibilidade (A11y)</p>
        <ul className="text-xs text-[#0F172A]/60 space-y-2 list-none">
          <li className="flex items-center gap-2">
            <Icons.Check className={`w-3.5 h-3.5 ${variant !== 'disabled' ? 'text-green-600' : 'text-[#0F172A]/20'}`} />
            Foco visível: {variant !== 'disabled' ? 'Ativo (Ring 2px)' : 'Inativo'}
          </li>
          <li className="flex items-center gap-2">
            <Icons.Check className={`w-3.5 h-3.5 ${variant === 'disabled' ? 'text-green-600' : 'text-[#0F172A]/20'}`} />
            Aria-disabled: {variant === 'disabled' ? 'true' : 'false'}
          </li>
          <li className="flex items-center gap-2">
            <Icons.Check className={`w-3.5 h-3.5 ${variant === 'error' ? 'text-green-600' : 'text-[#0F172A]/20'}`} />
            Aria-invalid: {variant === 'error' ? 'true' : 'false'}
          </li>
        </ul>
      </div>
    </div>
  );
};

const DesignSystemGuide = () => {
  return (
    <div className="min-h-screen bg-[#F8F5EE] py-16 md:py-24 px-6">
      <div className="max-w-5xl mx-auto space-y-24">
        {/* Header */}
        <header className="space-y-6 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#0F172A]/5 border border-[#0F172A]/10 rounded-full"
          >
            <Icons.ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-premium-tiny font-black uppercase tracking-[0.3em] text-[#0F172A]/60">Design System v2.0</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-serif text-[#0F172A] leading-tight"
          >
            Identidade Visual <br />
            <span className="text-[#D4AF37] italic">Cathedra Digital</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-[#0F172A]/60 max-w-2xl mx-auto font-serif italic"
          >
            Uma linguagem unificada para uma experiência premium, minimalista e contemplativa.
          </motion.p>
        </header>

        {/* Cores Section */}
        <section className="space-y-10">
          <div className="flex items-center gap-6">
            <div className="h-px flex-1 bg-[#0F172A]/10" />
            <h2 className="text-premium-tiny font-black uppercase tracking-[0.4em] text-[#0F172A]/30">Paleta de Cores</h2>
            <div className="h-px flex-1 bg-[#0F172A]/10" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: 'Primária (Navy)', hex: '#0B1F3A', class: 'bg-[#0B1F3A]', accessibility: 'AAA' },
              { name: 'Secundária (Ouro)', hex: '#D4AF37', class: 'bg-[#D4AF37]', accessibility: 'AA' },
              { name: 'Fundo (Papel)', hex: '#F8F5EE', class: 'bg-[#F8F5EE]', border: 'border-[#0F172A]/10' },
              { name: 'Card (Branco)', hex: '#FFFFFF', class: 'bg-white', border: 'border-[#0F172A]/10' },
            ].map((color) => (
              <div key={color.name} className="space-y-4 group">
                <div className={`h-32 rounded-[2rem] ${color.class} ${color.border || 'border-transparent'} shadow-sm transition-transform group-hover:scale-[1.02]`} />
                <div className="px-2">
                  <p className="font-serif font-bold text-[#0F172A]">{color.name}</p>
                  <p className="text-xs text-[#0F172A]/40 font-mono mt-1">{color.hex}</p>
                  {color.accessibility && (
                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/5 text-green-600 text-[10px] font-black uppercase tracking-widest border border-green-500/10">
                      WCAG {color.accessibility} Pass
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tipografia Section */}
        <section className="space-y-10">
          <div className="flex items-center gap-6">
            <div className="h-px flex-1 bg-[#0F172A]/10" />
            <h2 className="text-premium-tiny font-black uppercase tracking-[0.4em] text-[#0F172A]/30">Tipografia</h2>
            <div className="h-px flex-1 bg-[#0F172A]/10" />
          </div>

          <div className="bg-white border border-[#0F172A]/5 rounded-[3rem] p-8 md:p-16 space-y-16 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <div className="space-y-8">
                <span className="text-premium-tiny text-[#D4AF37] font-black uppercase tracking-widest">Display (Font-Serif)</span>
                <div className="space-y-4">
                  <h1 className="text-5xl font-serif text-[#0F172A]">Título Display</h1>
                  <h2 className="text-3xl font-serif text-[#0F172A]/80">Subtítulo Elegante</h2>
                  <p className="text-xl font-serif italic text-[#0F172A]/60">"O Verbo se fez carne e habitou entre nós."</p>
                </div>
              </div>
              <div className="space-y-8">
                <span className="text-premium-tiny text-[#D4AF37] font-black uppercase tracking-widest">Sans (Inter/System)</span>
                <div className="space-y-4">
                  <p className="text-2xl font-sans font-bold text-[#0F172A]">Texto Principal Sans</p>
                  <p className="text-lg text-[#0F172A]/70 leading-relaxed">Utilizada para conteúdos longos, garantindo máxima legibilidade em dispositivos móveis.</p>
                  <p className="text-premium-tiny font-black uppercase tracking-widest text-primary/40">Micro-tipografia e Badges</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Botões Section */}
        <section className="space-y-10">
          <div className="flex items-center gap-6">
            <div className="h-px flex-1 bg-[#0F172A]/10" />
            <h2 className="text-premium-tiny font-black uppercase tracking-[0.4em] text-[#0F172A]/30">Componentes de Ação</h2>
            <div className="h-px flex-1 bg-[#0F172A]/10" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white border border-[#0F172A]/5 rounded-[2.5rem] p-10 space-y-10">
              <h3 className="text-xl font-serif font-bold text-[#0F172A]">Variantes de Botão</h3>
              <div className="grid gap-4">
                <Button className="h-14 rounded-2xl text-premium-tiny font-black uppercase tracking-widest">Ação Primária</Button>
                <Button variant="secondary" className="h-14 rounded-2xl text-premium-tiny font-black uppercase tracking-widest border border-[#0F172A]/10 bg-[#0F172A]/5 text-[#0F172A]">Ação Secundária</Button>
                <Button variant="outline" className="h-14 rounded-2xl text-premium-tiny font-black uppercase tracking-widest border-[#0F172A]/10">Borda (Outline)</Button>
                <Button variant="ghost" className="h-14 rounded-2xl text-premium-tiny font-black uppercase tracking-widest">Fantasma (Ghost)</Button>
              </div>
            </div>

            <div className="bg-white border border-[#0F172A]/5 rounded-[2.5rem] p-10 space-y-10">
              <h3 className="text-xl font-serif font-bold text-[#0F172A]">Estados e Ícones</h3>
              <div className="flex flex-wrap gap-4">
                <Button isLoading className="h-14 rounded-2xl px-8">Processando</Button>
                <Button disabled className="h-14 rounded-2xl px-8">Desativado</Button>
                <Button size="icon" className="h-14 w-14 rounded-2xl">
                  <Icons.Search className="w-5 h-5" />
                </Button>
                <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-[#0F172A]/10">
                  <Icons.Heart className="w-5 h-5" />
                </Button>
              </div>
              <div className="p-5 bg-[#D4AF37]/5 rounded-2xl border border-[#D4AF37]/10">
                <p className="text-[11px] text-[#0F172A]/60 leading-relaxed italic font-serif">
                  * Todos os ícones em botões devem usar o tamanho padrão de 20px (w-5 h-5) para manter a harmonia visual em todos os dispositivos.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Playground Interativo */}
        <section className="space-y-10">
          <div className="flex items-center gap-6">
            <div className="h-px flex-1 bg-[#0F172A]/10" />
            <h2 className="text-premium-tiny font-black uppercase tracking-[0.4em] text-[#0F172A]/30">Playground de Formulários</h2>
            <div className="h-px flex-1 bg-[#0F172A]/10" />
          </div>

          <InputPlayground />
        </section>

        {/* Iconografia Section */}
        <section className="space-y-10">
          <div className="flex items-center gap-6">
            <div className="h-px flex-1 bg-[#0F172A]/10" />
            <h2 className="text-premium-tiny font-black uppercase tracking-[0.4em] text-[#0F172A]/30">Iconografia</h2>
            <div className="h-px flex-1 bg-[#0F172A]/10" />
          </div>

          <div className="grid grid-cols-4 md:grid-cols-8 gap-8 bg-white p-10 rounded-[2.5rem] border border-[#0F172A]/5 shadow-sm">
            {[
              { icon: Icons.Church, label: 'Igreja' },
              { icon: Icons.Bible, label: 'Bíblia' },
              { icon: Icons.Cross, label: 'Cruz' },
              { icon: Icons.Flame, label: 'Chama' },
              { icon: Icons.Sparkles, label: 'Santos' },
              { icon: Icons.Heart, label: 'Amor' },
              { icon: Icons.ShieldCheck, label: 'Proteção' },
              { icon: Icons.ScrollText, label: 'Magistério' },
              { icon: Icons.Compass, label: 'Jornada' },
              { icon: Icons.Search, label: 'Busca' },
              { icon: Icons.User, label: 'Perfil' },
              { icon: Icons.Volume2, label: 'Áudio' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#0F172A]/5 flex items-center justify-center text-primary border border-transparent hover:border-primary/20 transition-all group">
                  <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#0F172A]/40">{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Tom de Voz Section */}
        <section className="space-y-10">
          <div className="flex items-center gap-6">
            <div className="h-px flex-1 bg-[#0F172A]/10" />
            <h2 className="text-premium-tiny font-black uppercase tracking-[0.4em] text-[#0F172A]/30">Tom de Voz e Escrita</h2>
            <div className="h-px flex-1 bg-[#0F172A]/10" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Solene', desc: 'Linguagem respeitosa que honra a tradição milenar da Igreja.' },
              { title: 'Acolhedor', desc: 'Convida à oração e ao estudo, sem ser excessivamente técnico.' },
              { title: 'Minimalista', desc: 'Instruções claras e diretas, evitando distrações visuais ou de texto.' },
            ].map((item) => (
              <div key={item.title} className="bg-white p-8 rounded-[2rem] border border-[#0F172A]/5 shadow-sm space-y-4">
                <h3 className="text-lg font-serif font-bold text-[#0B1F3A]">{item.title}</h3>
                <p className="text-sm text-[#0F172A]/60 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-16 pb-24 border-t border-[#0F172A]/5 text-center space-y-4">
          <Icons.Logo className="w-12 h-12 mx-auto" variant="blue" />
          <p className="text-premium-tiny font-black uppercase tracking-[0.4em] text-[#0F172A]/30">
            Ad Majorem Dei Gloriam
          </p>
        </footer>
      </div>
    </div>
  );
};

export default DesignSystemGuide;