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
    chargePrice: 19.9,
  },
  {
    id: 'cathedra_pro_annual',
    label: 'Anual',
    price: 15.92,
    period: '/mês',
    totalLabel: 'R$ 191,04/ano',
    title: 'Cathedra PRO – Anual',
    highlight: true,
    badge: 'Economize 20%',
    chargePrice: 191.04,
  },
];

const DONATION_PRESETS = [5, 10, 20, 50];

const FREE_VS_PRO = [
  { feature: 'Bíblia completa', free: true, pro: true },
  { feature: 'Catecismo da Igreja', free: true, pro: true },
  { feature: 'Liturgia diária', free: true, pro: true },
  { feature: 'Santos do dia', free: true, pro: true },
  { feature: 'Colloquium IA', free: false, pro: true },
  { feature: 'Modo de estudo avançado', free: false, pro: true },
  { feature: 'Download offline', free: false, pro: true },
  { feature: 'Trilhas de formação', free: false, pro: true },
  { feature: 'Badges exclusivos', free: false, pro: true },
  { feature: 'Sem anúncios', free: false, pro: true },
  { feature: 'Suporte prioritário', free: false, pro: true },
];

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isPremium } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1].id);
  const [donationAmount, setDonationAmount] = useState<number | ''>('');
  const [donationLoading, setDonationLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount_percent: number } | null>(null);

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

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-coupon', {
        body: { code: couponCode.trim() },
      });
      if (error) throw error;
      if (data?.valid) {
        setAppliedCoupon({ code: data.code, discount_percent: data.discount_percent });
        toast.success(`Cupom "${data.code}" aplicado! ${data.discount_percent}% de desconto.`);
      } else {
        setAppliedCoupon(null);
        toast.error(data?.error || 'Cupom inválido.');
      }
    } catch {
      toast.error('Erro ao validar cupom.');
    } finally {
      setCouponLoading(false);
    }
  };

  const getDiscountedPrice = (price: number) => {
    if (!appliedCoupon) return price;
    return Math.round(price * (1 - appliedCoupon.discount_percent / 100) * 100) / 100;
  };

  const handleCheckout = async (planId: string, price: number, title: string) => {
    if (!user) { navigate(AppRoute.LOGIN); return; }
    if (isPremium) { toast.info('Você já é PRO!'); return; }

    const finalPrice = getDiscountedPrice(price);
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-create-preference', {
        body: {
          planId,
          price: finalPrice,
          title: appliedCoupon ? `${title} (cupom ${appliedCoupon.code})` : title,
          origin: window.location.origin,
        },
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
    if (!donationAmount || donationAmount < 1) { toast.error('Informe um valor mínimo de R$ 1,00'); return; }
    if (!user) { navigate(AppRoute.LOGIN); return; }
    setDonationLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-create-preference', {
        body: { planId: 'donation', price: donationAmount, title: 'Doação voluntária – Cathedra Digital', origin: window.location.origin },
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
  const finalChargePrice = getDiscountedPrice(plan.chargePrice);

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
          {/* Plan selector */}
          <div className="flex gap-2 p-1 bg-muted rounded-2xl">
            {PLANS.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPlan(p.id)}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                  selectedPlan === p.id ? 'bg-background text-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p.label}
                {p.badge && selectedPlan === p.id && (
                  <Badge className="ml-2 bg-primary/15 text-primary border-primary/30 text-[10px]">{p.badge}</Badge>
                )}
              </button>
            ))}
          </div>

          {/* Plan card */}
          <Card className="border-2 border-primary shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="text-center bg-primary/5 pb-10 pt-12 space-y-4">
              <CardTitle className="text-xl font-black uppercase tracking-[0.3em] text-primary">
                {plan.label === 'Anual' ? 'Plano Anual' : 'Plano Mensal'}
              </CardTitle>
              <div className="flex flex-col items-center justify-center">
                {appliedCoupon && (
                  <span className="text-xl text-muted-foreground line-through mb-1">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.price)}
                  </span>
                )}
                <span className="text-6xl font-serif font-bold text-foreground">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    getDiscountedPrice(plan.price)
                  )}
                </span>
                <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2">
                  {plan.period}
                </span>
              </div>
              {plan.totalLabel && (
                <CardDescription className="text-xs font-medium bg-primary/10 text-primary px-4 py-1.5 rounded-full inline-block font-serif">
                  {appliedCoupon
                    ? `${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalChargePrice)}/ano · ${appliedCoupon.discount_percent}% off`
                    : `${plan.totalLabel} · ${plan.badge}`}
                </CardDescription>
              )}
              {appliedCoupon && (
                <div className="flex items-center justify-center gap-2">
                  <Badge className="bg-primary/15 text-primary border-primary/30 text-xs">
                    Cupom {appliedCoupon.code} · -{appliedCoupon.discount_percent}%
                  </Badge>
                  <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="text-xs text-muted-foreground hover:text-destructive">
                    Remover
                  </button>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-8 md:p-10 space-y-6">
              {/* Coupon input */}
              {!appliedCoupon && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Código do cupom"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    className="rounded-xl uppercase"
                  />
                  <Button
                    variant="outline"
                    onClick={validateCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="rounded-xl shrink-0"
                  >
                    {couponLoading ? '...' : 'Aplicar'}
                  </Button>
                </div>
              )}

              <ul className="space-y-4">
                {['Acesso a todas as trilhas de estudo', 'IA Teológica sem limites', 'Download para uso offline', 'Suporte prioritário', 'Sem anúncios', 'Badges exclusivos no perfil'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-serif">
                    <Icons.Star className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-foreground/80">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="p-8 md:p-10 pt-0 flex flex-col gap-4">
              <Button
                onClick={() => handleCheckout(plan.id, plan.chargePrice, plan.title)}
                disabled={loading || isPremium}
                className="w-full h-14 rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] shadow-xl shadow-primary/20"
              >
                {loading ? 'Redirecionando...' : isPremium ? '✓ Plano já ativo' : `Assinar ${plan.label}`}
              </Button>
              <p className="text-xs text-center text-muted-foreground italic flex items-center justify-center gap-1.5">
                <Icons.Heart className="w-3.5 h-3.5 text-primary shrink-0" />
                Parte do valor da sua assinatura é destinada a projetos de evangelização.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Plan Comparison */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-serif font-bold text-center mb-8">Gratuito vs PRO</h2>
        <Card className="rounded-3xl overflow-hidden border border-border/50">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-4 font-bold">Recurso</th>
                  <th className="text-center p-4 font-bold w-24">Gratuito</th>
                  <th className="text-center p-4 font-bold w-24 text-primary">PRO</th>
                </tr>
              </thead>
              <tbody>
                {FREE_VS_PRO.map((row, i) => (
                  <tr key={i} className="border-b border-border/30 last:border-0">
                    <td className="p-4 font-medium">{row.feature}</td>
                    <td className="p-4 text-center">
                      {row.free ? (
                        <span className="text-primary text-lg">✓</span>
                      ) : (
                        <span className="text-muted-foreground text-lg">—</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-primary text-lg font-bold">✓</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Donation */}
      <div className="max-w-2xl mx-auto">
        <Card className="border border-border/50 rounded-3xl overflow-hidden bg-muted/30">
          <CardHeader className="text-center space-y-3 pb-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Icons.Heart className="w-7 h-7 text-primary" />
            </div>
            <CardTitle className="text-xl font-serif font-bold">Doação Voluntária</CardTitle>
            <CardDescription className="text-sm max-w-md mx-auto">
              Não quer assinar o PRO? Apoie o Cathedra com uma contribuição livre.
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
