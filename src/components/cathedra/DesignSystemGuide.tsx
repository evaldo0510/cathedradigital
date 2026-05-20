import React from 'react';
import { motion } from 'framer-motion';
import { CathedraCard } from '@/components/cathedra/CathedraCard';
import { CathedraButton } from '@/components/cathedra/CathedraButton';
import { Icons } from '@/constants';
import SEOHead from '@/components/SEOHead';

const DesignSystemGuide: React.FC = () => {
  return (
    <div className="min-h-screen bg-background py-16 md:py-24 px-6 transition-colors duration-300">
      <SEOHead title="Guia do Design System - Cathedra" description="Documentação interna dos componentes premium do Cathedra Digital." path="/design-system" />
      
      <div className="max-w-5xl mx-auto space-y-24">
        {/* Header */}
        <header className="space-y-8 text-center py-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-6 py-2 bg-primary/[0.03] border border-border/20 rounded-full"
          >
            <Icons.ShieldCheck className="w-4 h-4 text-secondary" />
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-foreground/40">Design Protocol v3.0</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-display font-medium text-primary leading-[1.1] tracking-tight"
          >
            Cathedra <br />
            <span className="text-secondary/70 italic font-serif">Componentes Premium</span>
          </motion.h1>
        </header>

        {/* Buttons Section */}
        <section className="space-y-12">
          <div className="flex items-center gap-6">
            <div className="h-px flex-1 bg-border/40" />
            <h2 className="text-premium-tiny font-black uppercase tracking-[0.4em] text-foreground/30">CathedraButton</h2>
            <div className="h-px flex-1 bg-border/40" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <CathedraCard padding="lg" className="space-y-8">
              <h3 className="text-xl font-serif font-bold text-primary">Variantes</h3>
              <div className="flex flex-wrap gap-4">
                <CathedraButton variant="primary">Principal</CathedraButton>
                <CathedraButton variant="secondary">Secundário</CathedraButton>
                <CathedraButton variant="outline">Contorno</CathedraButton>
                <CathedraButton variant="ghost">Fantasma</CathedraButton>
              </div>
              <p className="text-sm text-muted-foreground italic">Use 'primary' para ações principais da página e 'secondary' para destaques de cor ouro.</p>
            </CathedraCard>

            <CathedraCard padding="lg" className="space-y-8">
              <h3 className="text-xl font-serif font-bold text-primary">Tamanhos</h3>
              <div className="flex flex-col gap-4 items-start">
                <CathedraButton size="sm">Pequeno (sm)</CathedraButton>
                <CathedraButton size="md">Médio (md)</CathedraButton>
                <CathedraButton size="lg">Grande (lg)</CathedraButton>
                <CathedraButton size="xl">Extra Grande (xl)</CathedraButton>
              </div>
            </CathedraCard>
          </div>
        </section>

        {/* Cards Section */}
        <section className="space-y-12">
          <div className="flex items-center gap-6">
            <div className="h-px flex-1 bg-border/40" />
            <h2 className="text-premium-tiny font-black uppercase tracking-[0.4em] text-foreground/30">CathedraCard</h2>
            <div className="h-px flex-1 bg-border/40" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              <h3 className="text-xl font-serif font-bold text-primary">Variantes de Estilo</h3>
              <div className="space-y-6">
                <CathedraCard variant="default" className="text-center">
                  <p className="text-sm font-bold uppercase tracking-widest text-primary/40 mb-2">Default</p>
                  <p className="font-serif italic">Base sólida para conteúdos de leitura.</p>
                </CathedraCard>
                
                <CathedraCard variant="interactive" className="text-center">
                  <p className="text-sm font-bold uppercase tracking-widest text-secondary mb-2">Interactive</p>
                  <p className="font-serif italic">Feedback visual de hover e escala para cards clicáveis.</p>
                </CathedraCard>

                <CathedraCard variant="glass" className="text-center">
                  <p className="text-sm font-bold uppercase tracking-widest text-primary/40 mb-2">Glass</p>
                  <p className="font-serif italic">Efeito de desfoque para sobreposições e modais.</p>
                </CathedraCard>
              </div>
            </div>

            <div className="space-y-8">
              <h3 className="text-xl font-serif font-bold text-primary">Sistema de Padding</h3>
              <div className="grid grid-cols-1 gap-4">
                <CathedraCard padding="sm" className="bg-muted/10 border-dashed">Padding SM (Compacto)</CathedraCard>
                <CathedraCard padding="md" className="bg-muted/10 border-dashed">Padding MD (Padrão)</CathedraCard>
                <CathedraCard padding="lg" className="bg-muted/10 border-dashed">Padding LG (Espaçoso)</CathedraCard>
              </div>
            </div>
          </div>
        </section>

        {/* Checklist Auditoria */}
        <section className="space-y-12 pb-20">
          <div className="flex items-center gap-6">
            <div className="h-px flex-1 bg-border/40" />
            <h2 className="text-premium-tiny font-black uppercase tracking-[0.4em] text-foreground/30">Checklist de Auditoria Visual</h2>
            <div className="h-px flex-1 bg-border/40" />
          </div>

          <CathedraCard padding="lg" className="bg-secondary/5 border-secondary/20">
            <ul className="space-y-4 font-serif">
              <li className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 mt-1">✓</div>
                <p><strong>Cards:</strong> Todos os containers devem usar <code>CathedraCard</code> ou classes <code>rounded-premium shadow-premium</code>.</p>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 mt-1">✓</div>
                <p><strong>Botões:</strong> Substituir <code>Button</code> do shadcn por <code>CathedraButton</code> (ou <code>HomeButton</code> que é o alias compatível).</p>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 mt-1">✓</div>
                <p><strong>Grids:</strong> Manter <code>gap-8 md:gap-12 lg:gap-16</code> em listagens e <code>stack-spacing</code> para seções verticais.</p>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 mt-1">✓</div>
                <p><strong>Sombras:</strong> Nunca usar <code>shadow-premium/lg/xl</code> nativos; usar <code>shadow-premium</code> ou <code>shadow-soft</code>.</p>
              </li>
            </ul>
          </CathedraCard>
        </section>
      </div>
    </div>
  );
};

export default DesignSystemGuide;
