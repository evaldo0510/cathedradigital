import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import { Button } from '@/components/cathedra/Button';
import { HomeCard as Card } from '@/components/cathedra/HomeCard';
import SEOHead from '@/components/SEOHead';
import { CathedraIcon, IconSizePreset } from '@/components/cathedra/CathedraIcon';

const DesignSystemGuide: React.FC = () => {
  return (
    <div className="app-container py-12 md:py-24 space-y-24">
      <SEOHead title="Design System - Cathedra" description="Documentação visual e técnica do Cathedra Digital." path="/design-system" />
      
      <header className="space-y-6 max-w-3xl">
        <div className="premium-tag">
          <Icons.ShieldCheck className="w-3.5 h-3.5" />
          <span>Systema Designandi</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-display font-bold text-primary tracking-tight heading-hero">Design System</h1>
        <p className="text-xl text-primary/60 italic font-serif leading-relaxed text-premium-body">
          "A ordem é a disposição das coisas iguais e desiguais, dando a cada uma o seu lugar." — Santo Agostinho
        </p>
      </header>

      {/* 1. TOKENS DE CORES */}
      <section className="space-y-12">
        <div className="flex items-center gap-6">
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/20 whitespace-nowrap heading-section-label">01. Colores (Cores)</h2>
          <div className="h-px flex-1 bg-primary/5" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Primary', class: 'bg-primary', text: 'text-primary-foreground', hex: '#0F172A' },
            { label: 'Secondary', class: 'bg-secondary', text: 'text-secondary-foreground', hex: '#D4AF37' },
            { label: 'Background', class: 'bg-background border border-border/10', text: 'text-foreground', hex: '#F8F5EE' },
            { label: 'Muted', class: 'bg-muted', text: 'text-muted-foreground', hex: '#E5E1D6' },
          ].map((color) => (
            <div key={color.label} className="space-y-3">
              <div className={`h-24 rounded-premium ${color.class}`} />
              <div>
                <p className="text-sm font-bold text-primary text-premium-body">{color.label}</p>
                <p className="text-[10px] font-black text-primary/30 uppercase tracking-widest text-premium-body">{color.hex}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. TIPOGRAFIA */}
      <section className="space-y-12">
        <div className="flex items-center gap-6">
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/20 whitespace-nowrap heading-section-label">02. Typographia (Tipografia)</h2>
          <div className="h-px flex-1 bg-primary/5" />
        </div>
        <div className="space-y-10">
          <div className="space-y-4">
            <span className="text-[9px] font-black uppercase tracking-widest text-primary/30">Display (Cinzel)</span>
            <h1 className="text-4xl md:text-6xl font-display heading-hero">Títulos de Glória</h1>
          </div>
          <div className="space-y-4">
            <span className="text-[9px] font-black uppercase tracking-widest text-primary/30">Serif (Playfair Display)</span>
            <p className="text-2xl md:text-4xl font-serif italic text-primary/80 text-premium-body">"A beleza salvará o mundo."</p>
          </div>
          <div className="space-y-4">
            <span className="text-[9px] font-black uppercase tracking-widest text-primary/30">Body (Inter)</span>
            <p className="text-base text-primary/60 leading-relaxed max-w-2xl text-premium-body">
              O texto base do Cathedra é focado em legibilidade e clareza, utilizando fontes sans-serif modernas para interfaces e fontes serifadas clássicas para conteúdos de leitura profunda.
            </p>
          </div>
        </div>
      </section>

      {/* 3. BOTÕES */}
      <section className="space-y-12">
        <div className="flex items-center gap-6">
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/20 whitespace-nowrap heading-section-label">03. Bullones (Botões)</h2>
          <div className="h-px flex-1 bg-primary/5" />
        </div>
        <div className="flex flex-wrap gap-8 items-center">
          <div className="space-y-4 text-center">
            <Button variant="primary">Primarius</Button>
            <p className="text-[9px] font-bold text-primary/30 uppercase tracking-widest text-premium-body">Primary</p>
          </div>
          <div className="space-y-4 text-center">
            <Button variant="secondary">Secundarius</Button>
            <p className="text-[9px] font-bold text-primary/30 uppercase tracking-widest text-premium-body">Secondary</p>
          </div>
          <div className="space-y-4 text-center">
            <Button variant="outline">Adumbratio</Button>
            <p className="text-[9px] font-bold text-primary/30 uppercase tracking-widest text-premium-body">Outline</p>
          </div>
          <div className="space-y-4 text-center">
            <Button variant="ghost">Spiritus</Button>
            <p className="text-[9px] font-bold text-primary/30 uppercase tracking-widest text-premium-body">Ghost</p>
          </div>
        </div>
      </section>

      {/* 4. CARDS */}
      <section className="space-y-12">
        <div className="flex items-center gap-6">
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/20 whitespace-nowrap heading-section-label">04. Chartulae (Cards)</h2>
          <div className="h-px flex-1 bg-primary/5" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <Card className="p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center">
                <Icons.Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-primary heading-card">Standard Premium Card</h3>
            </div>
            <p className="text-sm text-primary/60 leading-relaxed text-premium-body">
              O card padrão do Cathedra utiliza border-radius de 24px, fundo levemente translúcido e sombra projetada suave.
            </p>
          </Card>

          <Card variant="interactive" className="p-8 space-y-6 group">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform duration-700">
                <Icons.Flame className="w-6 h-6" />
              </div>
              <Icons.ChevronRight className="w-5 h-5 text-primary/10 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-xl font-bold text-primary heading-card">Interactive Premium Card</h3>
            <p className="text-sm text-primary/60 leading-relaxed text-premium-body">
              Cards interativos possuem feedback visual de hover, escala e brilho, ideais para navegação e trilhas.
            </p>
          </Card>
        </div>
      </section>

      {/* 5. ÍCONES E COMPONENTES */}
      <section className="space-y-12">
        <div className="flex items-center gap-6">
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/20 whitespace-nowrap heading-section-label">05. Iconographia (Ícones)</h2>
          <div className="h-px flex-1 bg-primary/5" />
        </div>
        <div className="flex flex-wrap gap-8">
          {[Icons.Bible, Icons.Catechism, Icons.Liturgy, Icons.Journeys, Icons.Compass, Icons.Heart].map((Icon, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <CathedraIcon icon={Icon as any} size={IconSizePreset.ACTION} variant={i % 2 === 0 ? 'primary' : 'secondary'} />
              <span className="text-[8px] font-black text-primary/20 uppercase tracking-widest">Icon {i+1}</span>
            </div>
          ))}
        </div>
      </section>

      <footer className="pt-24 text-center opacity-20">
        <p className="text-[10px] font-black uppercase tracking-widest text-premium-body">Cathedra Digital © MMXXVI</p>
      </footer>
    </div>
  );
};

export default DesignSystemGuide;
