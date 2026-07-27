import { Icons } from '@/constants';
import React from 'react';
import { Helmet } from 'react-helmet-async';
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

const PRICE_MONTHLY = 15.92;
const PRICE_YEARLY = 191.04;
const PAGE_TITLE = 'Planos — Cathedra Digital · R$ 15,92/mês';
const PAGE_DESCRIPTION =
  'Cathedra PRO por R$ 15,92/mês (R$ 191,04/ano · economize 20%). Compare o plano gratuito Peregrino e o PRO: Bíblia, Catecismo, Liturgia, IA Colloquium e trilhas de formação.';
const CANONICAL_URL = 'https://www.cathedradigital.com.br/pricing';

export type Feature = { label: string; free: boolean };
export type FeatureGroup = { title: string; items: Feature[] };

export const PRICING_GROUPS: FeatureGroup[] = [
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

export const FeatureList: React.FC<{ variant: 'free' | 'pro' }> = ({ variant }) => (
  <div className="space-y-6">
    {PRICING_GROUPS.map((group) => (
      <div key={group.title} className="space-y-2">
        <h4
          data-testid={`group-header-${variant}`}
          className="text-[11px] font-black uppercase tracking-[0.15em] text-muted-foreground/80 pb-2 border-b border-border/30"
        >
          {group.title}
        </h4>
        <ul className="space-y-2">
          {group.items.map((item) => {
            const included = variant === 'pro' ? true : item.free;
            return (
              <li key={item.label} className="flex items-center gap-3 text-sm">
                {included ? (
                  <Icons.Check className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                ) : (
                  <Icons.X className="w-4 h-4 text-muted-foreground/40 shrink-0" aria-hidden="true" />
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

const priceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Cathedra PRO',
  description:
    'Assinatura Cathedra PRO: acesso completo à formação católica, Colloquium IA, trilhas e conteúdos avançados.',
  brand: { '@type': 'Brand', name: 'Cathedra Digital' },
  offers: [
    {
      '@type': 'Offer',
      name: 'Cathedra PRO — Mensal',
      price: PRICE_MONTHLY.toFixed(2),
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
      url: CANONICAL_URL,
      category: 'subscription',
    },
    {
      '@type': 'Offer',
      name: 'Cathedra PRO — Anual',
      price: PRICE_YEARLY.toFixed(2),
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
      url: CANONICAL_URL,
      category: 'subscription',
    },
  ],
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://www.cathedradigital.com.br/' },
    { '@type': 'ListItem', position: 2, name: 'Planos', item: CANONICAL_URL },
  ],
};

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isPremium } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{PAGE_TITLE}</title>
        <meta name="description" content={PAGE_DESCRIPTION} />
        <meta name="robots" content="index,follow" />
        <link rel="canonical" href={CANONICAL_URL} />
        <meta property="og:title" content={PAGE_TITLE} />
        <meta property="og:description" content={PAGE_DESCRIPTION} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={CANONICAL_URL} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={PAGE_TITLE} />
        <meta name="twitter:description" content={PAGE_DESCRIPTION} />
        <script type="application/ld+json">{JSON.stringify(priceJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
      </Helmet>

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <motion.header
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-center space-y-4 mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-primary">
            <Icons.Crown className="w-4 h-4" aria-hidden="true" />
            <span className="text-[11px] font-black uppercase tracking-[0.15em]">Planos</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold">Escolha seu Caminho</h1>
          <p className="text-lg text-muted-foreground italic max-w-xl mx-auto">
            Comece gratuitamente e evolua quando estiver pronto
          </p>
        </motion.header>

        <div className="grid gap-6 sm:gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          {/* Free */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
            <Card
              data-testid="plan-card-free"
              className="h-full rounded-2xl border-border/50 bg-card shadow-sm flex flex-col"
            >
              <CardHeader className="text-center pb-4 space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-muted flex items-center justify-center">
                  <Icons.Zap className="w-6 h-6 text-muted-foreground" aria-hidden="true" />
                </div>
                <CardTitle className="text-2xl font-serif">Peregrino</CardTitle>
                <div>
                  <span className="text-5xl font-display font-bold">R$ 0</span>
                  <span className="text-muted-foreground ml-1">/sempre</span>
                </div>
                <p className="text-sm text-muted-foreground">Acesso essencial à fé católica</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-6">
                <FeatureList variant="free" />
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-full font-bold mt-auto"
                  onClick={() => navigate(user ? AppRoute.DASHBOARD : AppRoute.LOGIN)}
                >
                  {user ? 'Ir ao Dashboard' : 'Criar Conta Grátis'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pro */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}>
            <Card
              data-testid="plan-card-pro"
              className="h-full rounded-2xl border-primary/30 bg-card shadow-md ring-2 ring-primary/10 relative overflow-hidden flex flex-col"
            >
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl">
                Recomendado
              </div>
              <CardHeader className="text-center pb-4 space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Icons.Sparkles className="w-6 h-6 text-primary" aria-hidden="true" />
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
              <CardContent className="flex-1 flex flex-col gap-6">
                <FeatureList variant="pro" />
                <Button
                  className="w-full h-12 rounded-full font-bold bg-primary text-primary-foreground shadow-md shadow-primary/20 mt-auto"
                  onClick={() => navigate(AppRoute.CHECKOUT)}
                >
                  {isPremium ? 'Você já é PRO ✓' : 'Assinar Agora'}
                  {!isPremium && <Icons.ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.aside
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-2xl mx-auto mt-16 text-center space-y-3 p-6 sm:p-8 rounded-2xl bg-primary/5 border border-primary/10"
        >
          <Icons.Crown className="w-8 h-8 text-primary mx-auto" aria-hidden="true" />
          <p className="text-muted-foreground leading-relaxed italic font-serif">
            "Parte de cada assinatura PRO é destinada a projetos de evangelização e formação católica. Ao assinar, você
            também contribui para levar a fé a mais pessoas."
          </p>
        </motion.aside>
      </div>
    </div>
  );
};

export default PricingPage;
