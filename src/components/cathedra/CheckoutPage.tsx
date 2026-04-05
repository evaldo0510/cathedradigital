import React, { useEffect, useState } from 'react';
import { Icons } from '../../constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const PLAN_PRICE = 19.9;

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isPremium } = useAuth();
  const [loading, setLoading] = useState(false);

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

  const handleSubscribe = async () => {
    if (!user) {
      navigate(AppRoute.LOGIN);
      return;
    }

    if (isPremium) {
      navigate(AppRoute.DASHBOARD);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-create-preference', {
        body: {
          planId: 'cathedra_pro',
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

  return (
    <div className="max-w-5xl mx-auto space-y-12 py-8">
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

      <div className="grid md:grid-cols-2 gap-8 items-start">
        <BenefitsSection />
        <PricingCard
          loading={loading}
          isPremium={isPremium}
          onSubscribe={handleSubscribe}
        />
      </div>

      <div className="text-center">
        <p className="text-xs text-muted-foreground italic">
          Pagamento processado com segurança pelo Mercado Pago. <br />
          Ao assinar, você concorda com nossos termos de serviço e política de privacidade.
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

const PricingCard: React.FC<{ loading: boolean; isPremium: boolean; onSubscribe: () => void }> = ({ loading, isPremium, onSubscribe }) => (
  <Card className="border-2 border-primary shadow-2xl rounded-[2.5rem] overflow-hidden">
    <CardHeader className="text-center bg-primary/5 pb-10 pt-12 space-y-4">
      <CardTitle className="text-xl font-black uppercase tracking-[0.3em] text-primary">Plano Anual</CardTitle>
      <div className="flex flex-col items-center justify-center">
        <span className="text-6xl font-serif font-bold text-foreground">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(PLAN_PRICE)}
        </span>
        <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2">por mês</span>
      </div>
      <CardDescription className="text-xs font-medium bg-primary/10 text-primary px-4 py-1.5 rounded-full inline-block">
        Economize 20% no plano anual
      </CardDescription>
    </CardHeader>
    <CardContent className="p-8 md:p-10 space-y-6">
      <ul className="space-y-4">
        {[
          'Acesso a todas as trilhas de estudo',
          'IA Teológica sem limites',
          'Download para uso offline',
          'Suporte prioritário',
          'Sem anúncios',
          'Badges exclusivos no perfil'
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
        onClick={onSubscribe}
        disabled={loading}
        className="w-full h-14 rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] shadow-xl shadow-primary/20"
      >
        {loading
          ? 'Redirecionando...'
          : isPremium
            ? 'Plano já ativo'
            : 'Pagar com Mercado Pago'}
      </Button>
    </CardFooter>
  </Card>
);

export default CheckoutPage;
