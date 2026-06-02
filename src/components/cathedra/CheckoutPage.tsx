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
    <div className="w-full space-y-spacing-2xl py-spacing-xl">
      {/* Hero */}
      <div className="text-center space-y-spacing-md">
        <div className="inline-flex items-center gap-spacing-xs px-spacing-sm py-spacing-2xs bg-primary/10 rounded-premium">
          <Icons.Zap className="w-spacing-md h-spacing-md text-primary" />
          <span className="text-premium-xs font-black uppercase tracking-[0.2em] text-primary">Cathedra PRO</span>
        </div>
        <h1 className="text-premium-4xl md:text-premium-6xl font-serif font-bold text-foreground tracking-tight">
          Eleve sua experiência <br />
          <span className="text-primary italic">espiritual.</span>
        </h1>
        <p className="text-muted-foreground font-serif italic w-full mx-auto text-premium-lg">
          Acesse ferramentas exclusivas de estudo e oração para aprofundar sua vida interior.
        </p>
      </div>

      {/* Plans + Benefits */}
      <div className="grid md:grid-cols-2 gap-spacing-xl items-start">
        <BenefitsSection />

        <div className="space-y-spacing-md">
          {/* Plan selector */}
          <div className="flex gap-spacing-xs p-spacing-2xs bg-muted rounded-premium">
            {PLANS.map(p => (
              <Button
                key={p.id}
                onClick={() => setSelectedPlan(p.id)}
                className={`flex-1 py-spacing-sm px-spacing-md rounded-premium-full text-premium-sm font-bold transition-all ${
                  selectedPlan === p.id ? 'bg-background text-foreground shadow-premium' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p.label}
                {p.badge && selectedPlan === p.id && (
                  <Badge className="ml-spacing-xs bg-primary/15 text-primary border-primary/30 text-premium-xs">{p.badge}</Badge>
                )}
              </Button>
            ))}
          </div>

          {/* Plan card */}
          <Card className="border-2 border-primary shadow-premium-hover rounded-[2.5rem] overflow-hidden">
            <CardHeader className="text-center bg-primary/5 pb-spacing-xl pt-spacing-2xl space-y-spacing-md">
              <CardTitle className="text-premium-xl font-black uppercase tracking-[0.3em] text-primary">
                {plan.label === 'Anual' ? 'Plano Anual' : 'Plano Mensal'}
              </CardTitle>
              <div className="flex flex-col items-center justify-center">
                {appliedCoupon && (
                  <span className="text-premium-xl text-muted-foreground line-through mb-spacing-2xs">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.price)}
                  </span>
                )}
                <span className="text-premium-6xl font-serif font-bold text-foreground">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    getDiscountedPrice(plan.price)
                  )}
                </span>
                <span className="text-premium-sm font-bold text-muted-foreground uppercase tracking-widest mt-spacing-xs">
                  {plan.period}
                </span>
              </div>
              {plan.totalLabel && (
                <CardDescription className="text-premium-xs font-medium bg-primary/10 text-primary px-spacing-md py-spacing-2xs rounded-premium inline-block font-serif">
                  {appliedCoupon
                    ? `${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalChargePrice)}/ano · ${appliedCoupon.discount_percent}% off`
                    : `${plan.totalLabel} · ${plan.badge}`}
                </CardDescription>
              )}
              {appliedCoupon && (
                <div className="flex items-center justify-center gap-spacing-xs">
                  <Badge className="bg-primary/15 text-primary border-primary/30 text-premium-xs">
                    Cupom {appliedCoupon.code} · -{appliedCoupon.discount_percent}%
                  </Badge>
                  <Button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="text-premium-xs text-muted-foreground hover:text-destructive">
                    Remover
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-spacing-xl md:p-spacing-xl space-y-spacing-lg">
              {/* Coupon input */}
              {!appliedCoupon && (
                <div className="flex gap-spacing-xs">
                  <Input
                    placeholder="Código do cupom"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    className="rounded-premium-full uppercase"
                  />
                  <Button
                    variant="outline"
                    onClick={validateCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="rounded-premium-full shrink-0"
                  >
                    {couponLoading ? '...' : 'Aplicar'}
                  </Button>
                </div>
              )}

              <ul className="space-y-spacing-md">
                {['Acesso a todas as trilhas de estudo', 'IA Teológica sem limites', 'Download para uso offline', 'Suporte prioritário', 'Sem anúncios', 'Badges exclusivos no perfil'].map((item, i) => (
                  <li key={i} className="flex items-center gap-spacing-sm text-premium-sm font-serif">
                    <Icons.Star className="w-spacing-md h-spacing-md text-primary shrink-0" />
                    <span className="text-foreground/80">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="p-spacing-xl md:p-spacing-xl pt-spacing-0 flex flex-col gap-spacing-md">
              <Button
                onClick={() => handleCheckout(plan.id, plan.chargePrice, plan.title)}
                disabled={loading || isPremium}
                className="w-full h-spacing-2xl rounded-premium-full text-premium-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] shadow-premium-hover shadow-primary/20"
              >
                {loading ? 'Redirecionando...' : isPremium ? '✓ Plano já ativo' : `Assinar ${plan.label}`}
              </Button>
              <p className="text-premium-xs text-center text-muted-foreground italic flex items-center justify-center gap-spacing-2xs">
                <Icons.Heart className="w-spacing-sm h-spacing-sm text-primary shrink-0" />
                Parte do valor da sua assinatura é destinada a projetos de evangelização.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Plan Comparison */}
      <div className="w-full mx-auto">
        <h2 className="text-premium-2xl font-serif font-bold text-center mb-spacing-xl">Gratuito vs PRO</h2>
        <Card className="rounded-premium overflow-hidden border border-border/50">
          <CardContent className="p-spacing-0">
            <table className="w-full text-premium-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-spacing-md font-bold">Recurso</th>
                  <th className="text-center p-spacing-md font-bold w-spacing-4xl">Gratuito</th>
                  <th className="text-center p-spacing-md font-bold w-spacing-4xl text-primary">PRO</th>
                </tr>
              </thead>
              <tbody>
                {FREE_VS_PRO.map((row, i) => (
                  <tr key={i} className="border-b border-border/30 last:border-0">
                    <td className="p-spacing-md font-medium">{row.feature}</td>
                    <td className="p-spacing-md text-center">
                      {row.free ? (
                        <span className="text-primary text-premium-lg">✓</span>
                      ) : (
                        <span className="text-muted-foreground text-premium-lg">—</span>
                      )}
                    </td>
                    <td className="p-spacing-md text-center">
                      <span className="text-primary text-premium-lg font-bold">✓</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Donation */}
      <div className="w-full mx-auto">
        <Card className="border border-border/50 rounded-premium overflow-hidden bg-muted/30">
          <CardHeader className="text-center space-y-spacing-sm pb-spacing-md">
            <div className="mx-auto w-spacing-2xl h-spacing-2xl rounded-premium bg-primary/10 flex items-center justify-center">
              <Icons.Heart className="w-spacing-lg h-spacing-lg text-primary" />
            </div>
            <CardTitle className="text-premium-xl font-serif font-bold">Doação Voluntária</CardTitle>
            <CardDescription className="text-premium-sm w-full mx-auto">
              Não quer assinar o PRO? Apoie o Cathedra com uma contribuição livre.
              Cada doação ajuda a manter o app gratuito para todos.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-spacing-xl pb-spacing-xs space-y-spacing-md">
            <div className="flex flex-wrap gap-spacing-xs justify-center">
              {DONATION_PRESETS.map(val => (
                <Button
                  key={val}
                  onClick={() => setDonationAmount(val)}
                  className={`px-spacing-md py-spacing-xs rounded-premium-full text-premium-sm font-bold border transition-all ${
                    donationAmount === val
                      ? 'bg-primary text-primary-foreground border-primary shadow-premium shadow-primary/20'
                      : 'bg-background text-foreground border-border hover:border-primary/50'
                  }`}
                >
                  R$ {val}
                </Button>
              ))}
            </div>
            <div className="flex gap-spacing-sm items-center">
              <span className="text-premium-sm font-medium text-muted-foreground whitespace-nowrap">Outro valor:</span>
              <Input
                type="number"
                min={1}
                placeholder="R$ 0,00"
                value={donationAmount || ''}
                onChange={e => setDonationAmount(e.target.value ? Number(e.target.value) : '')}
                className="rounded-premium-full"
              />
            </div>
          </CardContent>
          <CardFooter className="px-spacing-xl pb-spacing-xl pt-spacing-md">
            <Button
              variant="outline"
              onClick={handleDonation}
              disabled={donationLoading || !donationAmount || donationAmount < 1}
              className="w-full h-spacing-2xl rounded-premium-full font-bold gap-spacing-xs border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
            >
              {donationLoading ? 'Processando...' : (
                <>
                  <Icons.Heart className="w-spacing-md h-spacing-md" /> Doar {donationAmount ? `R$ ${donationAmount}` : ''}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="text-center">
        <p className="text-premium-xs text-muted-foreground italic">
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
  <div className="space-y-spacing-xl pr-spacing-0 md:pr-spacing-xl">
    <h2 className="text-premium-2xl font-serif font-bold text-foreground">Por que ser PRO?</h2>
    <div className="grid gap-spacing-lg">
      {[
        { icon: <Icons.Search className="w-spacing-md h-spacing-md" />, title: 'Colloquium IA Ilimitado', desc: 'Pergunte qualquer coisa sobre teologia e receba respostas baseadas na tradição.' },
        { icon: <Icons.Book className="w-spacing-md h-spacing-md" />, title: 'Biblioteca Estendida', desc: 'Acesso a documentos raros e edições comentadas da Patrística.' },
        { icon: <Icons.Heart className="w-spacing-md h-spacing-md" />, title: 'Modo de Oração Imersivo', desc: 'Trilhas de áudio exclusivas e meditações guiadas por grandes santos.' },
        { icon: <Icons.Globe className="w-spacing-md h-spacing-md" />, title: 'Offline total', desc: 'Baixe toda a Bíblia e o Catecismo para ler onde quer que esteja.' },
      ].map((benefit, i) => (
        <div key={i} className="flex gap-spacing-md group">
          <div className="w-spacing-2xl h-spacing-2xl rounded-premium bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
            {benefit.icon}
          </div>
          <div className="space-y-spacing-2xs">
            <h3 className="font-bold text-foreground">{benefit.title}</h3>
            <p className="text-premium-sm text-muted-foreground leading-relaxed">{benefit.desc}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default CheckoutPage;
