import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, BookOpen, Brain, Sparkles, Headphones, Globe, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { AppRoute } from '@/types';

const BENEFITS = [
  { icon: BookOpen, label: 'Conteúdo completo', desc: 'Acesso integral a todas as 6 camadas de profundidade' },
  { icon: Brain, label: 'IA Logos ilimitada', desc: 'Respostas teológicas sem limite de uso' },
  { icon: Sparkles, label: 'Jornadas avançadas', desc: 'Trilhas exclusivas de formação espiritual' },
  { icon: Headphones, label: 'Áudio de conteúdos', desc: 'Ouça reflexões, meditações e orações' },
  { icon: Globe, label: 'Santos em profundidade', desc: 'Vidas completas e conexões com jornadas' },
  { icon: Crown, label: 'Apoie a evangelização', desc: '50% destinado a doações e missão' },
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
      className="relative overflow-hidden rounded-full border border-secondary/30 bg-gradient-to-br from-secondary/10 via-card to-primary/5 shadow-premium"
    >
      {/* Decorative glows */}
      <div className="absolute -top-4xl -right-4xl w-4xl h-4xl bg-secondary/15 rounded-premium  pointer-events-none" />
      <div className="absolute -bottom-3xl -left-3xl w-4xl h-4xl bg-primary/10 rounded-premium  pointer-events-none" />

      <div className="relative z-10 p-lg md:p-xl space-y-lg">
        {/* Header */}
        <div className="text-center space-y-xs">
          <div className="inline-flex items-center gap-xs px-sm py-2xs rounded-premium bg-secondary/20 border border-secondary/30">
            <Crown className="w-sm h-sm text-secondary" />
            <span className="text-xs font-black uppercase tracking-[0.3em] text-secondary">Cathedra PRO</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-foreground leading-tight">
            Desbloqueie a experiência <br className="hidden md:block" />
            <span className="text-secondary">completa da fé</span>
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Aprofunde-se sem limites. Conteúdos exclusivos, IA teológica e formação espiritual completa.
          </p>
        </div>

        {/* Benefits grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-sm">
          {BENEFITS.map((b, i) => {
            const Icon = b.icon;
            return (
              <motion.div
                key={b.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="p-sm rounded-full bg-background/60 border border-border/60 space-y-2xs"
              >
                <Icon className="w-md h-md text-secondary" />
                <p className="text-xs font-bold text-foreground leading-tight">{b.label}</p>
                <p className="text-xs text-muted-foreground leading-snug">{b.desc}</p>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-sm pt-xs">
          <Button
            onClick={() => navigate(AppRoute.PRICING)}
            className="w-full max-w-sm rounded-full h-2xl gap-xs font-bold text-xs uppercase tracking-widest bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-premium hover:shadow-premium transition-all"
          >
            <Crown className="w-md h-md" /> Conheça o PRO
            <ArrowRight className="w-md h-md" />
          </Button>
          <p className="text-xs text-muted-foreground">
            Planos a partir de <span className="font-bold text-foreground">R$ 9,90/mês</span> · Cancele quando quiser
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default ProShowcase;
