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
      className="relative overflow-hidden rounded-3xl border border-secondary/30 bg-gradient-to-br from-secondary/10 via-card to-primary/5 shadow-lg"
    >
      {/* Decorative glows */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-secondary/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/20 border border-secondary/30">
            <Crown className="w-3.5 h-3.5 text-secondary" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary">Cathedra PRO</span>
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {BENEFITS.map((b, i) => {
            const Icon = b.icon;
            return (
              <motion.div
                key={b.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="p-3 rounded-2xl bg-background/60 border border-border/60 space-y-1.5"
              >
                <Icon className="w-4 h-4 text-secondary" />
                <p className="text-xs font-bold text-foreground leading-tight">{b.label}</p>
                <p className="text-[10px] text-muted-foreground leading-snug">{b.desc}</p>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3 pt-2">
          <Button
            onClick={() => navigate(AppRoute.PRICING)}
            className="w-full max-w-sm rounded-2xl h-12 gap-2 font-bold text-xs uppercase tracking-widest bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-md hover:shadow-lg transition-all"
          >
            <Crown className="w-4 h-4" /> Conheça o PRO
            <ArrowRight className="w-4 h-4" />
          </Button>
          <p className="text-[10px] text-muted-foreground">
            Planos a partir de <span className="font-bold text-foreground">R$ 9,90/mês</span> · Cancele quando quiser
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default ProShowcase;
