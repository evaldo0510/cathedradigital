import React, { useState } from 'react';
import { Icons } from '../../constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';
import { toast } from 'sonner';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = () => {
    setLoading(true);
    // Simulate checkout
    setTimeout(() => {
      setLoading(false);
      toast.success('Assinatura processada com sucesso! (Modo Simulação)');
      navigate(AppRoute.DASHBOARD);
    }, 2000);
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
        {/* Benefits */}
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

        {/* Pricing Card */}
        <Card className="border-2 border-primary shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="text-center bg-primary/5 pb-10 pt-12 space-y-4">
            <CardTitle className="text-xl font-black uppercase tracking-[0.3em] text-primary">Plano Anual</CardTitle>
            <div className="flex flex-col items-center justify-center">
              <span className="text-6xl font-serif font-bold text-foreground">R$ 19,90</span>
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
              onClick={handleSubscribe} 
              disabled={loading}
              className="w-full h-14 rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] shadow-xl shadow-primary/20"
            >
              {loading ? 'Processando...' : 'Assinar Agora'}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="text-center">
        <p className="text-xs text-muted-foreground italic">
          Ao assinar, você concorda com nossos termos de serviço e política de privacidade. <br />
          Cancele a qualquer momento na sua página de perfil.
        </p>
      </div>
    </div>
  );
};

export default CheckoutPage;
