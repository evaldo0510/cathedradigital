import { Icons } from '@/constants';
import React from 'react';
import SEOHead from '@/components/SEOHead';
import { motion } from 'framer-motion';

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

type Feature = { label: string; free: boolean };
type Group = { title: string; items: Feature[] };

const GROUPS: Group[] = [
  {
    title: 'Fundamentos da Fé',
    items: [
      { label: 'Bíblia completa', free: true },
      { label: 'Catecismo da Igreja', free: true },
      { label: 'Liturgia diária', free: true },
      { label: 'Santos do dia', free: true },
      { label: 'Rosário e orações', free: true },
    ],
  },
  {
    title: 'Aprofundamento e Formação',
    items: [
      { label: 'Conteúdos avançados', free: false },
      { label: 'Colloquium IA', free: false },
      { label: 'Trilhas de formação', free: false },
      { label: 'Badges exclusivos', free: false },
      { label: 'Sem anúncios', free: false },
      { label: 'Suporte prioritário', free: false },
    ],
  },
];

const FeatureList: React.FC<{ variant: 'free' | 'pro' }> = ({ variant }) => (
  <div className="space-y-spacing-lg">
    {GROUPS.map((group) => (
      <div key={group.title} className="space-y-spacing-sm">
        <h4 className="text-premium-xs font-black uppercase tracking-[0.15em] text-muted-foreground/80 pb-spacing-2xs border-b border-border/30">
          {group.title}
        </h4>
        <ul className="space-y-spacing-xs">
          {group.items.map((item) => {
            const included = variant === 'pro' ? true : item.free;
            return (
              <li key={item.label} className="flex items-center gap-spacing-sm text-premium-sm">
                {included ? (
                  <Icons.Check className="w-spacing-md h-spacing-md text-primary shrink-0" />
                ) : (
                  <Icons.X className="w-spacing-md h-spacing-md text-muted-foreground/40 shrink-0" />
                )}
                <span className={included ? '' : 'text-muted-foreground/60'}>{item.label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    ))}
  </div>
);

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isPremium } = useAuth();

  return (
    <div className="min-h-screen pb-spacing-4xl">
      <SEOHead
        title="Planos e Preços"
        description="Compare os planos gratuito e premium do Cathedra Digital e escolha o melhor para sua jornada de fé."
        path="/pricing"
        type="website"
      />
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: 'Assinatura Cathedra Premium',
          description: 'Acesso completo a ferramentas de estudo e espiritualidade avançada.',
          offers: {
            '@type': 'Offer',
            price: '15.92',
            priceCurrency: 'BRL',
            availability: 'https://schema.org/InStock',
            url: 'https://www.cathedradigital.com.br/pricing',
          },
        })}
      </script>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="text-center space-y-spacing-md mb-spacing-2xl"
      >
        <div className="inline-flex items-center gap-spacing-xs px-spacing-md py-spacing-2xs bg-primary/10 border border-primary/20 rounded-premium-full text-primary mb-spacing-md">
          <Icons.Crown className="w-spacing-md h-spacing-md" />
          <span className="text-premium-xs font-black uppercase tracking-[0.15em]">Planos</span>
        </div>
        <h1 className="text-premium-4xl md:text-premium-5xl font-display font-bold">Escolha seu Caminho</h1>
        <p className="text-premium-lg text-muted-foreground italic max-w-spacing-xl mx-auto">
          Comece gratuitamente e evolua quando estiver pronto
        </p>
      </motion.div>

      {/* Plans cards */}
      <div className="grid md:grid-cols-2 gap-spacing-xl max-w-spacing-3xl mx-auto mb-spacing-3xl">
        {/* Free */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
          <Card className="h-full rounded-premium border-border/50 bg-card shadow-premium">
            <CardHeader className="text-center pb-spacing-xs space-y-spacing-md">
              <div className="w-spacing-2xl h-spacing-2xl mx-auto rounded-premium bg-muted flex items-center justify-center">
                <Icons.Zap className="w-spacing-lg h-spacing-lg text-muted-foreground" />
              </div>
              <CardTitle className="text-premium-2xl font-serif">Peregrino</CardTitle>
              <div>
                <span className="text-premium-5xl font-display font-bold">R$ 0</span>
                <span className="text-muted-foreground ml-spacing-2xs">/sempre</span>
              </div>
              <p className="text-premium-sm text-muted-foreground">Acesso essencial à fé católica</p>
            </CardHeader>
            <CardContent className="space-y-spacing-lg">
              <FeatureList variant="free" />
              <Button
                variant="outline"
                className="w-full h-spacing-2xl rounded-premium-full font-bold"
                onClick={() => navigate(user ? AppRoute.DASHBOARD : AppRoute.LOGIN)}
              >
                {user ? 'Ir ao Dashboard' : 'Criar Conta Grátis'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pro */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}>
          <Card className="h-full rounded-premium border-primary/30 bg-card shadow-premium-hover ring-2 ring-primary/10 relative overflow-hidden">
            <div className="absolute top-spacing-0 right-0 bg-primary text-primary-foreground text-premium-xs font-black uppercase tracking-widest px-spacing-md py-spacing-2xs rounded-bl-2xl">
              Recomendado
            </div>
            <CardHeader className="text-center pb-spacing-xs space-y-spacing-md">
              <div className="w-spacing-2xl h-spacing-2xl mx-auto rounded-premium bg-primary/10 flex items-center justify-center">
                <Icons.Sparkles className="w-spacing-lg h-spacing-lg text-primary" />
              </div>
              <CardTitle className="text-premium-2xl font-serif">Cathedra PRO</CardTitle>
              <div>
                <span className="text-premium-5xl font-display font-bold text-primary">R$ 15</span>
                <span className="text-premium-xl font-bold text-primary">,92</span>
                <span className="text-muted-foreground ml-spacing-2xs">/mês</span>
              </div>
              <p className="text-premium-sm text-muted-foreground">
                R$ 191,04/ano · <span className="text-primary font-bold">Economize 20%</span>
              </p>
            </CardHeader>
            <CardContent className="space-y-spacing-lg">
              <FeatureList variant="pro" />
              <Button
                className="w-full h-spacing-2xl rounded-premium-full font-bold bg-primary text-primary-foreground shadow-premium shadow-primary/20"
                onClick={() => navigate(AppRoute.CHECKOUT)}
              >
                {isPremium ? 'Você já é PRO ✓' : 'Assinar Agora'}
                {!isPremium && <Icons.ChevronRight className="w-spacing-md h-spacing-md ml-spacing-2xs" />}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Mission note */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="max-w-spacing-2xl mx-auto mt-spacing-3xl text-center space-y-spacing-md p-spacing-xl rounded-premium bg-primary/5 border border-primary/10"
      >
        <Icons.Crown className="w-spacing-xl h-spacing-xl text-primary mx-auto" />
        <p className="text-muted-foreground leading-relaxed italic font-serif">
          "Parte de cada assinatura PRO é destinada a projetos de evangelização e formação católica. Ao assinar, você
          também contribui para levar a fé a mais pessoas."
        </p>
      </motion.div>
    </div>
  );
};

export default PricingPage;
