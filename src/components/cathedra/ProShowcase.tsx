import { Icons } from '@/constants';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { AppRoute } from '@/types';

const BENEFITS = [
  { icon: Icons.BookOpen, label: 'Conteúdo completo', desc: 'Acesso integral a todas as 6 camadas de profundidade' },
  { icon: Icons.Brain, label: 'IA Logos ilimitada', desc: 'Respostas teológicas sem limite de uso' },
  { icon: Icons.Sparkles, label: 'Jornadas avançadas', desc: 'Trilhas exclusivas de formação espiritual' },
  { icon: Icons.Headphones, label: 'Áudio de conteúdos', desc: 'Ouça reflexões, meditações e orações' },
  { icon: Icons.Globe, label: 'Santos em profundidade', desc: 'Vidas completas e conexões com jornadas' },
  { icon: Icons.Crown, label: 'Apoie a evangelização', desc: '50% destinado a doações e missão' },
];

const ProShowcase: React.FC = () => {
  const navigate = useNavigate();
  const { isPremium } = useAuth();

  if (isPremium) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="relative overflow-hidden rounded-premium-full border border-secondary/30 bg-gradient-to-br from-secondary/10 via-card to-primary/5 shadow-premium"
    >
      {/* Decorative glows */}
      <div className="absolute -top-spacing-4xl -right-spacing-4xl w-spacing-4xl h-spacing-4xl bg-secondary/15 rounded-premium  pointer-events-none" />
      <div className="absolute -bottom-spacing-3xl -left-spacing-3xl w-spacing-4xl h-spacing-4xl bg-primary/10 rounded-premium  pointer-events-none" />

      <div className="relative z-10 p-spacing-lg md:p-spacing-xl space-y-spacing-lg">
        {/* Header */}
        <div className="text-center space-y-spacing-xs">
          <div className="inline-flex items-center gap-spacing-xs px-spacing-sm py-spacing-2xs rounded-premium bg-secondary/20 border border-secondary/30">
            <Icons.Crown className="w-spacing-sm h-spacing-sm text-secondary" />
            <span className="text-premium-xs font-black uppercase tracking-[0.3em] text-secondary">Cathedra PRO</span>
          </div>
          <h2 className="text-premium-xl md:text-premium-2xl font-black text-foreground leading-tight">
            Desbloqueie a experiência <br className="hidden md:block" />
            <span className="text-secondary">completa da fé</span>
          </h2>
          <p className="text-premium-sm text-muted-foreground max-w-spacing-md mx-auto">
            Aprofunde-se sem limites. Conteúdos exclusivos, IA teológica e formação espiritual completa.
          </p>
        </div>

        {/* Benefits grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-spacing-sm">
          {BENEFITS.map((b, i) => {
            const Icon = b.icon;
            return (
              <motion.div
                key={b.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="p-spacing-sm rounded-premium-full bg-background/60 border border-border/60 space-y-spacing-2xs"
              >
                <Icon className="w-spacing-md h-spacing-md text-secondary" />
                <p className="text-premium-xs font-bold text-foreground leading-tight">{b.label}</p>
                <p className="text-premium-xs text-muted-foreground leading-snug">{b.desc}</p>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-spacing-sm pt-spacing-xs">
          <Button
            onClick={() => navigate(AppRoute.PRICING)}
            className="w-full max-w-spacing-sm rounded-premium-full h-spacing-2xl gap-spacing-xs font-bold text-premium-xs uppercase tracking-widest bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-premium hover:shadow-premium transition-all"
          >
            <Icons.Crown className="w-spacing-md h-spacing-md" /> Conheça o PRO
            <Icons.ArrowRight className="w-spacing-md h-spacing-md" />
          </Button>
          <p className="text-premium-xs text-muted-foreground">
            Planos a partir de <span className="font-bold text-foreground">R$ 9,90/mês</span> · Cancele quando quiser
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default ProShowcase;
