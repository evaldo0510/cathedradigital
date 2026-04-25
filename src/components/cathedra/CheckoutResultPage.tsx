import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppRoute } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, XCircle, Download } from 'lucide-react';
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
      icon: <CheckCircle2 className="w-10 h-10 text-primary" />,
      iconBg: 'bg-primary/10',
      title: 'Pagamento aprovado!',
      description: 'Seu acesso PRO foi liberado. Aproveite todos os recursos exclusivos do Cathedra.',
      primaryAction: { label: 'Ir para o Dashboard', route: AppRoute.DASHBOARD },
      secondaryAction: { label: 'Explorar Trilhas', route: AppRoute.TRILHAS },
    },
    pending: {
      icon: <Clock className="w-10 h-10 text-accent-foreground" />,
      iconBg: 'bg-accent',
      title: 'Pagamento em análise',
      description: 'Seu pagamento foi recebido e está sendo processado. Assim que for aprovado, seu acesso PRO será liberado automaticamente.',
      primaryAction: { label: 'Voltar ao Dashboard', route: AppRoute.DASHBOARD },
    },
    failure: {
      icon: <XCircle className="w-10 h-10 text-destructive" />,
      iconBg: 'bg-destructive/10',
      title: 'Pagamento não concluído',
      description: 'O pagamento foi cancelado ou recusado. Nenhuma cobrança foi realizada. Você pode tentar novamente quando quiser.',
      primaryAction: { label: 'Tentar novamente', route: AppRoute.CHECKOUT },
      secondaryAction: { label: 'Voltar ao início', route: AppRoute.DASHBOARD },
    },
  };

  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-serif italic text-lg">Confirmando seu pagamento...</p>
      </div>
    );
  }

  const c = config[state];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 max-w-lg mx-auto py-12"
    >
      <div className={`w-24 h-24 rounded-full ${c.iconBg} flex items-center justify-center`}>
        {c.icon}
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">{c.title}</h1>
        <p className="text-muted-foreground font-serif italic text-base leading-relaxed">{c.description}</p>
      </div>

      {txData && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full bg-muted/50 rounded-3xl p-6 border border-border/50 space-y-4"
        >
          <div className="flex justify-between items-center pb-2 border-b border-border/50">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Resumo da Transação</span>
            <span className="text-[10px] font-mono text-muted-foreground">#{txData.payment_id || txData.id.slice(0, 8)}</span>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Descrição</span>
              <span className="text-sm font-bold text-foreground">{txData.description || 'Contribuição Cathedra'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Valor</span>
              <span className="text-lg font-black text-primary">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(txData.amount)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${state === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                {state === 'success' ? 'Aprovado' : 'Em processamento'}
              </span>
            </div>
          </div>

          {state === 'success' && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full h-8 text-[10px] font-bold uppercase text-muted-foreground gap-2"
              onClick={() => window.print()}
            >
              <Download className="w-3 h-3" /> Baixar Comprovante
            </Button>
          )}
        </motion.div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <Button
          onClick={() => navigate(c.primaryAction.route)}
          className="flex-1 h-12 rounded-2xl font-bold uppercase text-xs tracking-widest"
        >
          {c.primaryAction.label}
        </Button>
        {c.secondaryAction && (
          <Button
            variant="outline"
            onClick={() => navigate(c.secondaryAction!.route)}
            className="flex-1 h-12 rounded-2xl font-bold uppercase text-xs tracking-widest"
          >
            {c.secondaryAction.label}
          </Button>
        )}
      </div>
      
      <Button
        variant="ghost"
        onClick={() => navigate(AppRoute.TRANSACTIONS)}
        className="text-xs font-serif italic text-muted-foreground hover:text-primary transition-colors mt-4"
      >
        Ver histórico de transações
      </Button>
    </motion.div>
  );
};

export default CheckoutResultPage;
