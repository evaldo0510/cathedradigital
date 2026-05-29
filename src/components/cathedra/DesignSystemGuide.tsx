import React from 'react';
import { motion } from 'framer-motion';
import { CathedraCard } from '@/components/cathedra/CathedraCard';
import { CathedraButton } from '@/components/cathedra/CathedraButton';
import { Icons } from '@/constants';
import SEOHead from '@/components/SEOHead';

const DesignSystemGuide: React.FC = () => {
  const tokens = {
    colors: [
      { name: 'Background', variable: '--background', desc: 'Fundo principal (Off-white premium)' },
      { name: 'Foreground', variable: '--foreground', desc: 'Texto principal (Grafite profundo)' },
      { name: 'Primary', variable: '--primary', desc: 'Cor de autoridade e foco' },
      { name: 'Secondary', variable: '--secondary', desc: 'Ouro soberano para destaques' },
      { name: 'Muted', variable: '--muted', desc: 'Interface secundária e silêncio visual' },
      { name: 'Accent', variable: '--accent', desc: 'Realces sutis e interações' },
      { name: 'Border', variable: '--border', desc: 'Divisores e limites de contenção' },
    ],
    typography: [
      { name: 'Display (Cinzel)', class: 'font-display', desc: 'Títulos majestosos e sagrados' },
      { name: 'Serif (Playfair Display)', class: 'font-serif', desc: 'Subtítulos e citações clássicas' },
      { name: 'Reader (Merriweather)', class: 'font-reader', desc: 'Texto de leitura prolongada (Kindle-like)' },
      { name: 'UI (Inter)', class: 'font-ui', desc: 'Interface, navegação e metadados' },
    ],
    spacing: [
      { name: 'XS', class: 'w-2 h-2', value: '0.5rem (8px)' },
      { name: 'SM', class: 'w-4 h-4', value: '1rem (16px)' },
      { name: 'MD', class: 'w-8 h-8', value: '2rem (32px)' },
      { name: 'LG', class: 'w-16 h-16', value: '4rem (64px)' },
      { name: 'XL', class: 'w-32 h-32', value: '8rem (128px)' },
    ],
    radii: [
      { name: 'Small', variable: '--radius-sm', value: '1.25rem' },
      { name: 'Default', variable: '--radius', value: '2rem' },
      { name: 'Large', variable: '--radius-lg', value: '2.5rem' },
      { name: 'Full', variable: '9999px', value: 'Círculo perfeito' },
    ]
  };

  return (
    <div className="min-h-screen bg-background py-16 md:py-32 px-6 transition-colors duration-1000">
      <SEOHead title="Design System Documentation | Cathedra" description="Tokens, regras e componentes do ecossistema visual Cathedra Digital." path="/design-system" />
      
      <div className="max-w-6xl mx-auto space-y-32">
        {/* Header */}
        <header className="space-y-12 text-center py-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-8 py-3 bg-primary/[0.02] border border-primary/10 rounded-full"
          >
            <Icons.ShieldCheck className="w-4 h-4 text-secondary" />
            <span className="text-[11px] font-bold uppercase tracking-[0.5em] text-primary/40">Sistemática Visual v4.0</span>
          </motion.div>
          <div className="space-y-6">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-7xl md:text-9xl font-display font-light text-primary leading-none tracking-tighter"
            >
              Cathedra <br />
              <span className="text-secondary/60 italic font-serif">Artes Docendi</span>
            </motion.h1>
            <p className="font-serif italic text-muted-foreground/60 text-xl max-w-2xl mx-auto leading-relaxed">
              "A beleza é o esplendor da ordem." — Documentação oficial dos tokens e componentes premium.
            </p>
          </div>
        </header>

        {/* 1. Color System */}
        <section className="space-y-16">
          <div className="flex items-center gap-8">
            <h2 className="text-sm font-bold uppercase tracking-[0.4em] text-primary/30 shrink-0">01. Chroma & Contrast</h2>
            <div className="h-px w-full bg-primary/5" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tokens.colors.map((color) => (
              <CathedraCard key={color.name} padding="md" variant="interactive" className="group">
                <div className="space-y-6">
                  <div 
                    className="w-full h-32 rounded-premium border border-primary/5 shadow-inner transition-premium group-hover:scale-[1.02]" 
                    style={{ backgroundColor: `hsl(var(${color.variable}))` }}
                  />
                  <div>
                    <h4 className="font-ui font-bold text-primary mb-1">{color.name}</h4>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">var({color.variable})</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{color.desc}</p>
                  </div>
                </div>
              </CathedraCard>
            ))}
          </div>
        </section>

        {/* 2. Typography Hierarchy */}
        <section className="space-y-16">
          <div className="flex items-center gap-8">
            <h2 className="text-sm font-bold uppercase tracking-[0.4em] text-primary/30 shrink-0">02. Typographia Sacra</h2>
            <div className="h-px w-full bg-primary/5" />
          </div>

          <div className="space-y-12">
            {tokens.typography.map((font) => (
              <div key={font.name} className="group border-b border-primary/5 pb-12 last:border-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-baseline">
                  <div>
                    <h4 className="font-ui font-bold text-secondary mb-2 uppercase tracking-[0.2em] text-[10px]">{font.name}</h4>
                    <p className="text-xs text-muted-foreground max-w-xs">{font.desc}</p>
                  </div>
                  <div className="lg:col-span-2">
                    <p className={`${font.class} text-4xl md:text-6xl text-primary leading-tight`}>
                      Abyssus abyssum invocat in voce cataractarum tuarum.
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Spacing System */}
        <section className="space-y-16">
          <div className="flex items-center gap-8">
            <h2 className="text-sm font-bold uppercase tracking-[0.4em] text-primary/30 shrink-0">03. Spatium & Ritmus</h2>
            <div className="h-px w-full bg-primary/5" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <CathedraCard padding="lg" className="space-y-10">
              <h3 className="h4 text-primary">Escala de Espaçamento</h3>
              <div className="space-y-6">
                {tokens.spacing.map((s) => (
                  <div key={s.name} className="flex items-center gap-8">
                    <div className="w-12 text-[10px] font-bold text-primary/40">{s.name}</div>
                    <div className={`${s.class} bg-secondary/20 rounded-sm`} />
                    <div className="text-[10px] font-mono text-muted-foreground uppercase">{s.value}</div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground/60 leading-relaxed italic">
                O Cathedra utiliza um sistema de espaçamento baseado em 8px para garantir ritmo vertical e horizontal consistente.
              </p>
            </CathedraCard>

            <div className="space-y-8">
              <CathedraCard padding="md" className="space-y-4">
                <h5 className="text-secondary uppercase tracking-widest text-[9px] font-bold">Layout Margins</h5>
                <div className="aspect-video bg-primary/[0.02] border border-dashed border-primary/10 rounded-premium flex items-center justify-center p-8">
                  <div className="w-full h-full border border-dashed border-secondary/40 rounded-premium-sm flex items-center justify-center text-[10px] font-mono text-secondary/60">
                    .app-container (1440px max)
                  </div>
                </div>
              </CathedraCard>
              <CathedraCard padding="md" className="space-y-4">
                <h5 className="text-secondary uppercase tracking-widest text-[9px] font-bold">Stacking Rhythm</h5>
                <div className="space-y-4">
                  <div className="h-8 bg-primary/5 rounded-full w-full" />
                  <div className="h-8 bg-primary/5 rounded-full w-4/5" />
                  <div className="h-8 bg-primary/5 rounded-full w-2/3" />
                  <p className="text-[10px] text-center text-muted-foreground font-mono pt-2">.stack-spacing (space-y-16)</p>
                </div>
              </CathedraCard>
            </div>
          </div>
        </section>

        {/* 4. Borders & Shadows */}
        <section className="space-y-16">
          <div className="flex items-center gap-8">
            <h2 className="text-sm font-bold uppercase tracking-[0.4em] text-primary/30 shrink-0">04. Limites & Umbrae</h2>
            <div className="h-px w-full bg-primary/5" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="aspect-square bg-card border border-primary/5 rounded-premium shadow-premium transition-premium hover:shadow-premium-hover flex items-center justify-center">
                <Icons.Layout className="w-8 h-8 text-primary/20" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-center">Premium Shadow</p>
            </div>
            <div className="space-y-4">
              <div className="aspect-square bg-card border border-primary/5 rounded-premium-sm flex items-center justify-center">
                <Icons.Menu className="w-8 h-8 text-primary/20" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-center">Radius SM (1.25rem)</p>
            </div>
            <div className="space-y-4">
              <div className="aspect-square bg-card border border-primary/5 rounded-premium flex items-center justify-center">
                <Icons.Plus className="w-12 h-12 text-primary/20" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-center">Radius MD (2rem)</p>
            </div>
            <div className="space-y-4">
              <div className="aspect-square bg-card border border-primary/5 rounded-premium-lg flex items-center justify-center">
                <Icons.Maximize className="w-16 h-16 text-primary/20" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-center">Radius LG (2.5rem)</p>
            </div>
          </div>
        </section>

        {/* 5. Componentes Interativos */}
        <section className="space-y-16 pb-20">
          <div className="flex items-center gap-8">
            <h2 className="text-sm font-bold uppercase tracking-[0.4em] text-primary/30 shrink-0">05. Organica & Actio</h2>
            <div className="h-px w-full bg-primary/5" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <CathedraCard padding="xl" className="space-y-12">
              <h3 className="h4 text-primary">Buttons Protocol</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <CathedraButton variant="primary">Primary Action</CathedraButton>
                <CathedraButton variant="secondary">Secondary Action</CathedraButton>
                <CathedraButton variant="outline">Outline View</CathedraButton>
                <CathedraButton variant="ghost">Ghost State</CathedraButton>
              </div>
            </CathedraCard>

            <CathedraCard padding="xl" variant="interactive" className="flex flex-col items-center justify-center text-center space-y-8 bg-secondary/[0.02]">
              <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center animate-pulse">
                <Icons.Zap className="w-8 h-8 text-secondary" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-serif">Micro-interações</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                  Passe o mouse sobre este card para sentir o feedback premium: elevação sutil, sombreamento profundo e blur dinâmico.
                </p>
              </div>
            </CathedraCard>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DesignSystemGuide;
