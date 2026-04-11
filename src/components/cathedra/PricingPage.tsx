import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Check, X, ChevronRight, Sparkles, Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';
import { useAuth } from '@/hooks/useAuth';

const ease = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.1, ease } }),
};

const FREE_VS_PRO = [
  { feature: 'Acesso Inicial e Introdução', free: true, pro: true },
  { feature: 'Bíblia completa', free: true, pro: true },
  { feature: 'Catecismo da Igreja', free: true, pro: true },
  { feature: 'Liturgia diária', free: true, pro: true },
  { feature: 'Santos do dia', free: true, pro: true },
  { feature: 'Rosário e orações', free: true, pro: true },
  { feature: 'Aprofundamento e Continuidade', free: false, pro: true },
  { feature: 'Conteúdos Avançados', free: false, pro: true },
  { feature: 'Colloquium IA', free: false, pro: true },
  { feature: 'Trilhas de formação', free: false, pro: true },
  { feature: 'Badges exclusivos', free: false, pro: true },
  { feature: 'Sem anúncios', free: false, pro: true },
  { feature: 'Suporte prioritário', free: false, pro: true },
];

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isPremium } = useAuth();

  return (
    <div className="min-h-screen pb-24">
      <Helmet>
        <title>Planos e Preços — Cathedra Digital</title>
        <meta name="description" content="Compare os planos gratuito e premium do Cathedra Digital e escolha o melhor para sua jornada de fé." />
      </Helmet>

      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-primary mb-4">
          <Crown className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-[0.15em]">Planos</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-bold">Escolha seu Caminho</h1>
        <p className="text-lg text-muted-foreground italic max-w-xl mx-auto">
          Comece gratuitamente e evolua quando estiver pronto
        </p>
      </motion.div>

      {/* Plans cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-16">
        {/* Free */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
          <Card className="h-full rounded-3xl border-border/50 bg-card shadow-lg">
            <CardHeader className="text-center pb-2 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-muted flex items-center justify-center">
                <Zap className="w-7 h-7 text-muted-foreground" />
              </div>
              <CardTitle className="text-2xl font-serif">Peregrino</CardTitle>
              <div>
                <span className="text-5xl font-display font-bold">R$ 0</span>
                <span className="text-muted-foreground ml-1">/sempre</span>
              </div>
              <p className="text-sm text-muted-foreground">Acesso essencial à fé católica</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                {FREE_VS_PRO.map((item) => (
                  <li key={item.feature} className="flex items-center gap-3 text-sm">
                    {item.free ? (
                      <Check className="w-4 h-4 text-primary shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                    )}
                    <span className={item.free ? '' : 'text-muted-foreground/40'}>{item.feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                className="w-full h-12 rounded-2xl font-bold"
                onClick={() => navigate(user ? AppRoute.DASHBOARD : AppRoute.LOGIN)}
              >
                {user ? 'Ir ao Dashboard' : 'Criar Conta Grátis'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pro */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}>
          <Card className="h-full rounded-3xl border-primary/30 bg-card shadow-xl ring-2 ring-primary/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl">
              Recomendado
            </div>
            <CardHeader className="text-center pb-2 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <CardTitle className="text-2xl font-serif">Cathedra PRO</CardTitle>
              <div>
                <span className="text-5xl font-display font-bold text-primary">R$ 15</span>
                <span className="text-xl font-bold text-primary">,92</span>
                <span className="text-muted-foreground ml-1">/mês</span>
              </div>
              <p className="text-sm text-muted-foreground">
                R$ 191,04/ano · <span className="text-primary font-bold">Economize 20%</span>
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                {FREE_VS_PRO.map((item) => (
                  <li key={item.feature} className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span>{item.feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full h-12 rounded-2xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                onClick={() => navigate(AppRoute.CHECKOUT)}
              >
                {isPremium ? 'Você já é PRO ✓' : 'Assinar Agora'}
                {!isPremium && <ChevronRight className="w-4 h-4 ml-1" />}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Comparison table */}
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-display font-bold text-center mb-8">Comparativo Detalhado</h2>
        <div className="rounded-3xl border border-border/50 overflow-hidden bg-card shadow-sm">
          <div className="grid grid-cols-3 bg-muted/30 px-6 py-4 border-b border-border/30">
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Recurso</span>
            <span className="text-xs font-black uppercase tracking-widest text-center text-muted-foreground">Grátis</span>
            <span className="text-xs font-black uppercase tracking-widest text-center text-primary">PRO</span>
          </div>
          {FREE_VS_PRO.map((item, i) => (
            <div key={item.feature} className={`grid grid-cols-3 px-6 py-3.5 items-center ${i % 2 === 0 ? '' : 'bg-muted/10'} ${i < FREE_VS_PRO.length - 1 ? 'border-b border-border/10' : ''}`}>
              <span className="text-sm">{item.feature}</span>
              <span className="text-center">
                {item.free ? <Check className="w-4 h-4 text-primary mx-auto" /> : <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />}
              </span>
              <span className="text-center">
                <Check className="w-4 h-4 text-primary mx-auto" />
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Mission note */}
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-2xl mx-auto mt-16 text-center space-y-4 p-8 rounded-3xl bg-primary/5 border border-primary/10">
        <Crown className="w-8 h-8 text-primary mx-auto" />
        <p className="text-muted-foreground leading-relaxed italic font-serif">
          "Parte de cada assinatura PRO é destinada a projetos de evangelização e formação católica. Ao assinar, você também contribui para levar a fé a mais pessoas."
        </p>
      </motion.div>
    </div>
  );
};

export default PricingPage;
