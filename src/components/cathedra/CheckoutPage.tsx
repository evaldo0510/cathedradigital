import React, { useEffect, useState } from 'react';
import { Icons } from '../../constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';

const PLANS = [
  {
    id: 'cathedra_pro_monthly',
    label: 'Mensal',
    price: 19.9,
    period: '/mês',
    title: 'Cathedra PRO – Mensal',
    highlight: false,
    badge: null,
  },
  {
    id: 'cathedra_pro_annual',
    label: 'Anual',
    price: 14.9,
    period: '/mês',
    totalLabel: 'R$ 178,80/ano',
    title: 'Cathedra PRO – Anual',
    highlight: true,
    badge: 'Economize 25%',
  },
];

const DONATION_PRESETS = [5, 10, 20, 50];

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isPremium } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1].id);
  const [donationAmount, setDonationAmount] = useState<number | ''>('');
  const [donationLoading, setDonationLoading] = useState(false);

  // Redirect legacy callback params to the dedicated result page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutState = params.get('checkout');
    if (!checkoutState) return;

    const statusMap: Record<string, string> = { success: 'success', pending: 'pending', failure: 'failure' };
    const mapped = statusMap[checkoutState] || 'failure';
    const resultParams = new URLSearchParams({ status: mapped });
    const paymentId = params.get('payment_id');
    const externalRef = params.get('external_reference');
    if (paymentId) resultParams.set('payment_id', paymentId);
    if (externalRef) resultParams.set('external_reference', externalRef);

    navigate(`${AppRoute.CHECKOUT_RESULT}?${resultParams.toString()}`, { replace: true });
  }, [navigate]);

  const handleCheckout = async (planId: string, price: number, title: string) => {
    if (!user) {
      navigate(AppRoute.LOGIN);
      return;
    }
    if (isPremium) {
      toast.info('Você já é PRO! 🎉');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-create-preference', {
        body: { planId, price, title, origin: window.location.origin },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.checkoutUrl) throw new Error('Não foi possível gerar o link de pagamento.');

      window.location.assign(data.checkoutUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao iniciar o pagamento.');
      setLoading(false);
    }
  };

  const handleDonation = async () => {
    if (!donationAmount || donationAmount < 1) {
      toast.error('Informe um valor mínimo de R$ 1,00');
      return;
    }
    if (!user) {
      navigate(AppRoute.LOGIN);
      return;
    }

    setDonationLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-create-preference', {
        body: {
          planId: 'donation',
          price: donationAmount,
          title: 'Doação voluntária – Cathedra Digital',
          origin: window.location.origin,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.checkoutUrl) throw new Error('Não foi possível gerar o link de pagamento.');

      window.location.assign(data.checkoutUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao processar doação.');
      setDonationLoading(false);
    }
  };

  const plan = PLANS.find(p => p.id === selectedPlan)!;

  return (
    <div className="max-w-5xl mx-auto space-y-14 py-8">
      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
          <Icons.Zap className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Cathedra PRO</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground tracking-tight">
          Eleve sua experiência <br />
          <span className="text-primary italic">espiritual.</span>
        </h1>
        <p className="text-muted-foreground font-serif italic max-w-2xl mx-auto text-lg">
          Acesse ferramentas exclusivas de estudo e oração para aprofundar sua vida interior.
        </p>
      </div>

      {/* Plans + Benefits */}
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <BenefitsSection />

        <div className="space-y-4">
          {/* Plan selector tabs */}
          <div className="flex gap-2 p-1 bg-muted rounded-2xl">
            {PLANS.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPlan(p.id)}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                  selectedPlan === p.id
                    ? 'bg-background text-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p.label}
                {p.badge && selectedPlan === p.id && (
                  <Badge className="ml-2 bg-primary/15 text-primary border-primary/30 text-[10px]">{p.badge}</Badge>
                )}
              </button>
            ))}
          </div>

          {/* Selected plan card */}
          <Card className="border-2 border-primary shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="text-center bg-primary/5 pb-10 pt-12 space-y-4">
              <CardTitle className="text-xl font-black uppercase tracking-[0.3em] text-primary">
                {plan.label === 'Anual' ? 'Plano Anual' : 'Plano Mensal'}
              </CardTitle>
              <div className="flex flex-col items-center justify-center">
                <span className="text-6xl font-serif font-bold text-foreground">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.price)}
                </span>
                <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2">
                  {plan.period}
                </span>
              </div>
              {plan.totalLabel && (
                <CardDescription className="text-xs font-medium bg-primary/10 text-primary px-4 py-1.5 rounded-full inline-block">
                  {plan.totalLabel} · {plan.badge}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="p-8 md:p-10 space-y-6">
              <ul className="space-y-4">
                {[
                  'Acesso a todas as trilhas de estudo',
                  'IA Teológica sem limites',
                  'Download para uso offline',
                  'Suporte prioritário',
                  'Sem anúncios',
                  'Badges exclusivos no perfil',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-serif">
                    <Icons.Star className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-foreground/80">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="p-8 md:p-10 pt-0">
              <Button
                onClick={() => handleCheckout(plan.id, plan.id.includes('annual') ? 178.8 : plan.price, plan.title)}
                disabled={loading || isPremium}
                className="w-full h-14 rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] shadow-xl shadow-primary/20"
              >
                {loading
                  ? 'Redirecionando...'
                  : isPremium
                    ? '✓ Plano já ativo'
                    : `Assinar ${plan.label}`}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Donation section */}
      <div className="max-w-2xl mx-auto">
        <Card className="border border-border/50 rounded-3xl overflow-hidden bg-muted/30">
          <CardHeader className="text-center space-y-3 pb-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Icons.Heart className="w-7 h-7 text-primary" />
            </div>
            <CardTitle className="text-xl font-serif font-bold">Doação Voluntária</CardTitle>
            <CardDescription className="text-sm max-w-md mx-auto">
              Não quer assinar o PRO? Você pode apoiar o Cathedra com uma contribuição livre.
              Cada doação ajuda a manter o app gratuito para todos.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-2 space-y-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {DONATION_PRESETS.map(val => (
                <button
                  key={val}
                  onClick={() => setDonationAmount(val)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                    donationAmount === val
                      ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                      : 'bg-background text-foreground border-border hover:border-primary/50'
                  }`}
                >
                  R$ {val}
                </button>
              ))}
            </div>
            <div className="flex gap-3 items-center">
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Outro valor:</span>
              <Input
                type="number"
                min={1}
                placeholder="R$ 0,00"
                value={donationAmount || ''}
                onChange={e => setDonationAmount(e.target.value ? Number(e.target.value) : '')}
                className="rounded-xl"
              />
            </div>
          </CardContent>
          <CardFooter className="px-8 pb-8 pt-4">
            <Button
              variant="outline"
              onClick={handleDonation}
              disabled={donationLoading || !donationAmount || donationAmount < 1}
              className="w-full h-12 rounded-2xl font-bold gap-2 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
            >
              {donationLoading ? 'Processando...' : (
                <>
                  <Icons.Heart className="w-4 h-4" /> Doar {donationAmount ? `R$ ${donationAmount}` : ''}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="text-center">
        <p className="text-xs text-muted-foreground italic">
          Pagamento processado com segurança pelo Mercado Pago. <br />
          Ao assinar, você concorda com nossos{' '}
          <a href="/termos" className="underline hover:text-primary">termos de serviço</a> e{' '}
          <a href="/privacidade" className="underline hover:text-primary">política de privacidade</a>.
        </p>
      </div>
    </div>
  );
};

const BenefitsSection: React.FC = () => (
  <div className="space-y-8 pr-0 md:pr-8">
    <h2 className="text-2xl font-serif font-bold text-foreground">Por que ser PRO?</h2>
    <div className="grid gap-6">
      {[
        { icon: <Icons.Search className="w-5 h-5" />, title: 'Colloquium IA Ilimitado', desc: 'Pergunte qualquer coisa sobre teologia e receba respostas baseadas na tradição.' },
        { icon: <Icons.Book className="w-5 h-5" />, title: 'Biblioteca Estendida', desc: 'Acesso a documentos raros e edições comentadas da Patrística.' },
        { icon: <Icons.Heart className="w-5 h-5" />, title: 'Modo de Oração Imersivo', desc: 'Trilhas de áudio exclusivas e meditações guiadas por grandes santos.' },
        { icon: <Icons.Globe className="w-5 h-5" />, title: 'Offline total', desc: 'Baixe toda a Bíblia e o Catecismo para ler onde quer que esteja.' },
      ].map((benefit, i) => (
        <div key={i} className="flex gap-4 group">
          <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
            {benefit.icon}
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-foreground">{benefit.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{benefit.desc}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default CheckoutPage;
