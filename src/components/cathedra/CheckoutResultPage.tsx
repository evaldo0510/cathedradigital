import { Icons } from '@/constants';
import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppRoute } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';

import confetti from 'canvas-confetti';

type ResultState = 'loading' | 'success' | 'pending' | 'failure';

const CheckoutResultPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const checkoutState = searchParams.get('status');
  const paymentId = searchParams.get('payment_id');
  const externalReference = searchParams.get('external_reference');

  const [state, setState] = useState<ResultState>(() => {
    if (checkoutState === 'failure') return 'failure';
    if (checkoutState === 'pending') return 'pending';
    return 'loading';
  });
  const [txData, setTxData] = useState<any>(null);

  const firedConfetti = useRef(false);

  useEffect(() => {
    if (state === 'success' && !firedConfetti.current) {
      firedConfetti.current = true;
      const duration = 2000;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 } });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 } });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [state]);

  useEffect(() => {
    if (checkoutState === 'failure' || checkoutState === 'pending') return;

    if (checkoutState !== 'success') {
      navigate(AppRoute.CHECKOUT, { replace: true });
      return;
    }

    // If no payment identifiers, assume webhook already processed it
    if (!paymentId && !externalReference) {
      setState('success');
      return;
    }

    void supabase.functions
      .invoke('mercadopago-sync-payment', {
        body: {
          paymentId: paymentId || undefined,
          transactionId: externalReference || undefined,
        },
      })
      .then(async ({ data, error }) => {
        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        // Fetch transaction details for the summary
        const txId = data.transactionId || externalReference;
        if (txId) {
          const { data: tx } = await supabase.from('transactions').select('*').eq('id', txId).maybeSingle();
          if (tx) setTxData(tx);
        }

        if (data?.status === 'approved') {
          setState('success');
          void refreshProfile();
          return;
        }
        if (data?.status === 'pending') {
          setState('pending');
          return;
        }
        setState('failure');
      })
      .catch(() => {
        setState('failure');
      });
  }, [checkoutState, paymentId, externalReference, navigate, refreshProfile]);

  const config: Record<Exclude<ResultState, 'loading'>, {
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    description: string;
    primaryAction: { label: string; route: string };
    secondaryAction?: { label: string; route: string };
  }> = {
    success: {
      icon: <Icons.CheckCircle2 className="w-spacing-xl h-spacing-xl text-primary" />,
      iconBg: 'bg-primary/10',
      title: 'Pagamento aprovado!',
      description: 'Seu acesso PRO foi liberado. Aproveite todos os recursos exclusivos do Cathedra.',
      primaryAction: { label: 'Ir para o Dashboard', route: AppRoute.DASHBOARD },
      secondaryAction: { label: 'Explorar Trilhas', route: AppRoute.TRILHAS },
    },
    pending: {
      icon: <Icons.Clock className="w-spacing-xl h-spacing-xl text-accent-foreground" />,
      iconBg: 'bg-accent',
      title: 'Pagamento em análise',
      description: 'Seu pagamento foi recebido e está sendo processado. Assim que for aprovado, seu acesso PRO será liberado automaticamente.',
      primaryAction: { label: 'Voltar ao Dashboard', route: AppRoute.DASHBOARD },
    },
    failure: {
      icon: <Icons.XCircle className="w-spacing-xl h-spacing-xl text-destructive" />,
      iconBg: 'bg-destructive/10',
      title: 'Pagamento não concluído',
      description: 'O pagamento foi cancelado ou recusado. Nenhuma cobrança foi realizada. Você pode tentar novamente quando quiser.',
      primaryAction: { label: 'Tentar novamente', route: AppRoute.CHECKOUT },
      secondaryAction: { label: 'Voltar ao início', route: AppRoute.DASHBOARD },
    },
  };

  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-spacing-lg">
        <div className="w-spacing-3xl h-spacing-3xl border-4 border-secondary border-t-transparent rounded-premium animate-spin" />
        <p className="text-muted-foreground font-serif italic text-premium-lg">Confirmando seu pagamento...</p>
      </div>
    );
  }

  const c = config[state];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-spacing-xl w-full py-spacing-2xl"
    >
      <div className={`w-spacing-4xl h-spacing-4xl rounded-premium-full ${c.iconBg} flex items-center justify-center`}>
        {c.icon}
      </div>

      <div className="space-y-spacing-sm">
        <h1 className="text-premium-3xl md:text-premium-4xl font-serif font-bold text-foreground">{c.title}</h1>
        <p className="text-muted-foreground font-serif italic text-premium-base leading-relaxed">{c.description}</p>
      </div>

      {txData && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full bg-muted/50 rounded-premium-full p-spacing-lg border border-border/50 space-y-spacing-md"
        >
          <div className="flex justify-between items-center pb-spacing-xs border-b border-border/50">
            <span className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground">Resumo da Transação</span>
            <span className="text-premium-xs font-mono text-muted-foreground">#{txData.payment_id || txData.id.slice(0, 8)}</span>
          </div>
          
          <div className="space-y-spacing-sm">
            <div className="flex justify-between items-center">
              <span className="text-premium-sm text-muted-foreground">Descrição</span>
              <span className="text-premium-sm font-bold text-foreground">{txData.description || 'Contribuição Cathedra'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-premium-sm text-muted-foreground">Valor</span>
              <span className="text-premium-lg font-black text-primary">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(txData.amount)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-premium-sm text-muted-foreground">Status</span>
              <span className={`text-premium-xs font-bold uppercase px-spacing-xs py-spacing-3xs rounded-premium-full ${state === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                {state === 'success' ? 'Aprovado' : 'Em processamento'}
              </span>
            </div>
          </div>

          {state === 'success' && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full h-spacing-xl text-premium-xs font-bold uppercase text-muted-foreground gap-spacing-xs"
              onClick={() => window.print()}
            >
              <Icons.Download className="w-spacing-sm h-spacing-sm" /> Baixar Comprovante
            </Button>
          )}
        </motion.div>
      )}

      <div className="flex flex-col sm:flex-row gap-spacing-sm w-full">
        <Button
          onClick={() => navigate(c.primaryAction.route)}
          className="flex-1 h-spacing-2xl rounded-premium-full font-bold uppercase text-premium-xs tracking-widest"
        >
          {c.primaryAction.label}
        </Button>
        {c.secondaryAction && (
          <Button
            variant="outline"
            onClick={() => navigate(c.secondaryAction!.route)}
            className="flex-1 h-spacing-2xl rounded-premium-full font-bold uppercase text-premium-xs tracking-widest"
          >
            {c.secondaryAction.label}
          </Button>
        )}
      </div>
      
      <Button
        variant="ghost"
        onClick={() => navigate(AppRoute.TRANSACTIONS)}
        className="text-premium-xs font-serif italic text-muted-foreground hover:text-primary transition-colors mt-spacing-md"
      >
        Ver histórico de transações
      </Button>
    </motion.div>
  );
};

export default CheckoutResultPage;
