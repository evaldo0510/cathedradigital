import React, { useState } from 'react';
import { HomeButton } from '@/components/cathedra/HomeButton';
import { trackEvent } from '@/lib/analytics';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/constants';
import { supabase } from '@/integrations/supabase/client';

const LeadCaptureForm = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast({
        title: "Erro na validação",
        description: "Por favor, insira um e-mail válido.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    trackEvent('conversion', { type: 'lead_capture_attempt' });

    try {
      const { error } = await supabase
        .from('landing_leads' as any)
        .insert([{ email } as any]);

      if (error) throw error;
      
      setSubmitted(true);
      trackEvent('conversion', { type: 'lead_capture_success' });
      toast({
        title: "Sucesso!",
        description: "Recebemos seu e-mail. Você receberá conteúdos exclusivos em breve.",
      });
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Não foi possível processar sua solicitação no momento.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center space-y-spacing-md py-spacing-xl animate-in fade-in duration-1000">
        <div className="w-spacing-2xl h-spacing-2xl rounded-premium-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
          <Icons.Check className="w-spacing-lg h-spacing-lg" />
        </div>
        <h3 className="text-premium-xl font-bold font-display">Bem-vindo à Irmandade!</h3>
        <p className="text-muted-foreground font-serif">Seu e-mail foi cadastrado. Fique atento à sua caixa de entrada.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-spacing-3xl mx-auto space-y-spacing-xl">
      <div className="text-center space-y-spacing-sm">
        <h2 className="text-premium-2xl font-display font-bold">Junte-se ao Acervo Cathedra</h2>
        <p className="text-muted-foreground text-premium-sm font-serif">
          Receba reflexões teológicas, notícias do Vaticano e atualizações exclusivas do projeto.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-spacing-md">
        <div className="flex-1 relative">
          <input
            type="email"
            placeholder="Seu melhor e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full h-spacing-3xl px-spacing-xl rounded-premium-full bg-background border border-border focus:border-primary/40 focus:ring-1 focus:ring-primary/20 outline-none transition-all text-premium-base font-serif"
            required
          />
        </div>
        <HomeButton
          type="submit"
          disabled={loading}
          className="h-spacing-3xl px-spacing-2xl flex-shrink-0"
        >
          {loading ? 'Processando...' : 'Inscrever-me'}
        </HomeButton>
      </form>
      <p className="text-[10px] text-center text-muted-foreground/60 uppercase tracking-widest font-bold">
        Respeitamos sua privacidade. Sem spam, apenas fé.
      </p>
    </div>
  );
};

export default LeadCaptureForm;
