import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Icons } from '@/constants';
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, CheckCircle2, Clock, ShieldCheck, RefreshCcw } from "lucide-react";

const ease = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({ 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.8, delay: i * 0.15, ease } 
  }),
};

const BENEFITS = [
  { 
    title: "Jornadas Completas", 
    desc: "Acesse todos os caminhos de formação sem limites ou interrupções.",
    icon: Icons.Compass 
  },
  { 
    title: "Respostas mais profundas da Logos", 
    desc: "Obtenha reflexões teológicas densas e personalizadas com nossa IA.",
    icon: Icons.Sparkles 
  },
  { 
    title: "Acompanhamento Contínuo", 
    desc: "Métricas e lembretes para garantir sua constância na vida de oração.",
    icon: Icons.Target 
  },
  { 
    title: "Conteúdos Exclusivos", 
    desc: "Acesso total a documentos raros, meditações e estudos avançados.",
    icon: Icons.Library 
  }
];

const UpgradePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, isPremium } = useAuth();
  const [isSimulating, setIsSimulating] = useState(false);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const { isAdmin } = useIsAdmin();

  useEffect(() => {
    if (isAdmin) {
      fetchLogs();
    }
  }, [isAdmin]);

  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    const { data, error } = await supabase
      .from('webhook_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (!error && data) {
      setWebhookLogs(data);
    }
    setIsLoadingLogs(false);
  };

  const simulatePayment = async (status: 'approved' | 'cancelled' | 'pending' = 'approved') => {
    if (!user) return;
    setIsSimulating(true);
    try {
      // We'll call the actual webhook with a simulated payload
      const requestId = `sim_${Date.now()}`;
      const { data, error } = await supabase.functions.invoke('mercado-pago-webhook', {
        body: { 
          action: 'payment.updated', 
          data: { id: 'sim_payment_123' },
          simulation: true,
          simulated_status: status
        },
        headers: {
          'x-request-id': requestId,
          'x-simulation': 'true'
        }
      });
      
      if (error) throw error;
      
      toast.success(`Simulação de ${status} enviada para o webhook.`);
      fetchLogs();
      setTimeout(() => window.location.reload(), 2000);
    } catch (error: any) {
      toast.error('Erro na simulação: ' + error.message);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="min-h-[80dvh] flex flex-col items-center justify-center py-spacing-2xl md:py-spacing-3xl px-spacing-md relative overflow-hidden">
      <Helmet>
        <title>Cathedra PRO — Eleve sua Vida Espiritual</title>
      </Helmet>

      {/* Decorative background elements */}
      <div className="absolute top-spacing-0 left-spacing-2xs/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none opacity-20">
        <div className="absolute top-[10%] left-spacing-2xs/4 w-spacing-4xl h-spacing-4xl bg-primary/20 rounded-premium " />
        <div className="absolute bottom-[20%] right-spacing-2xs/4 w-spacing-4xl h-spacing-4xl bg-primary/10 rounded-premium " />
      </div>

      <div className="max-w-spacing-3xl w-full text-center space-y-spacing-xl">
        <motion.div 
          variants={fadeUp} 
          initial="hidden" 
          animate="visible" 
          custom={0}
          className="flex justify-center"
        >
          <div className="inline-flex items-center gap-spacing-xs px-spacing-sm py-spacing-2xs bg-primary/10 border border-primary/20 rounded-premium text-primary">
            <Icons.Crown className="w-spacing-md h-spacing-md" />
            <span className="text-premium-xs font-black uppercase tracking-widest">Cathedra PRO</span>
          </div>
        </motion.div>

        <motion.div 
          variants={fadeUp} 
          initial="hidden" 
          animate="visible" 
          custom={1}
          className="space-y-spacing-md"
        >
          <h1 className="text-premium-4xl md:text-premium-6xl font-display font-bold tracking-tight text-balance">
            Sua caminhada de fé merece <span className="text-primary italic">profundidade</span>.
          </h1>
          <p className="text-premium-lg md:text-premium-xl text-muted-foreground font-serif italic max-w-spacing-xl mx-auto leading-relaxed">
            O Cathedra PRO foi desenhado para quem deseja ir além do essencial e vivenciar a plenitude da nossa tradição.
          </p>
        </motion.div>

        <motion.div 
          variants={fadeUp} 
          initial="hidden" 
          animate="visible" 
          custom={2}
          className="grid sm:grid-cols-2 gap-spacing-lg text-left py-spacing-xl"
        >
          {BENEFITS.map((benefit, i) => (
            <div key={i} className="group p-spacing-md rounded-premium bg-card border border-border/50 hover:border-primary/30 transition-all duration-500 ">
              <div className="w-spacing-xl h-spacing-xl rounded-premium bg-primary/10 flex items-center justify-center text-primary mb-spacing-md group-hover:scale-110 transition-transform duration-500">
                <benefit.icon className="w-spacing-md h-spacing-md" />
              </div>
              <h3 className="font-bold text-premium-lg mb-spacing-2xs">{benefit.title}</h3>
              <p className="text-premium-sm text-muted-foreground leading-relaxed">{benefit.desc}</p>
            </div>
          ))}
        </motion.div>

        <motion.div 
          variants={fadeUp} 
          initial="hidden" 
          animate="visible" 
          custom={3}
          className="flex flex-col items-center gap-spacing-lg"
        >
          <Button 
            size="lg"
            className="h-spacing-3xl px-spacing-xl rounded-premium-full text-premium-lg font-bold bg-primary text-primary-foreground shadow-premium-hover shadow-primary/30 hover:shadow-primary/50 transition-all duration-500 group"
            onClick={() => navigate(AppRoute.CHECKOUT)}
            disabled={isPremium}
          >
            {isPremium ? (
              <span className="flex items-center gap-spacing-xs">Experiência Desbloqueada <Icons.Zap className="w-spacing-md h-spacing-md fill-current" /></span>
            ) : (
              <span className="flex items-center gap-spacing-xs">
                Desbloquear experiência completa
                <Icons.ArrowRight className="w-spacing-md h-spacing-md group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </Button>
          
          <div className="flex flex-col items-center gap-spacing-md">
            <div className="flex items-center gap-spacing-lg text-premium-xs font-medium text-muted-foreground/60 tracking-widest uppercase">
              <span>Acesso Imediato</span>
              <div className="w-spacing-2xs h-spacing-2xs rounded-premium bg-border" />
              <span>Cancele quando quiser</span>
            </div>
            
            {profile?.premium_status && profile.premium_status !== 'inactive' && (
              <div className="p-spacing-md bg-primary/5 rounded-premium border border-primary/20 text-center">
                <p className="text-premium-sm font-bold text-primary mb-1">
                  Status Atual: {profile.premium_status.toUpperCase()}
                </p>
                {profile.premium_expires_at && (
                  <p className="text-premium-xs text-muted-foreground">
                    Expira em: {new Date(profile.premium_expires_at).toLocaleDateString('pt-BR')}
                  </p>
                )}
                <Button 
                  variant="link" 
                  size="sm" 
                  className="text-red-500 hover:text-red-700 font-bold"
                  onClick={async () => {
                    if (confirm('Deseja realmente cancelar sua assinatura?')) {
                      toast.promise(
                        supabase.functions.invoke('mercadopago-simulate', {
                          body: { userId: user?.id, status: 'cancelled' }
                        }),
                        {
                          loading: 'Processando cancelamento...',
                          success: () => {
                            setTimeout(() => window.location.reload(), 1500);
                            return 'Assinatura cancelada com sucesso.';
                          },
                          error: 'Erro ao cancelar.'
                        }
                      );
                    }
                  }}
                >
                  Cancelar Assinatura
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {isAdmin && (
          <motion.div 
            variants={fadeUp} 
            initial="hidden" 
            animate="visible" 
            custom={4}
            className="pt-spacing-2xl border-t border-border/50"
          >
            <div className="flex flex-col items-center gap-spacing-md bg-muted/30 p-spacing-xl rounded-[2.5rem] border border-dashed border-primary/30">
              <div className="w-spacing-2xl h-spacing-2xl rounded-premium bg-primary/10 flex items-center justify-center text-primary mb-spacing-xs">
                <Icons.FlaskConical className="w-spacing-lg h-spacing-lg" />
              </div>
              <h3 className="text-premium-xl font-serif font-bold italic">Zona de Testes (Admin)</h3>
              <p className="text-premium-sm text-muted-foreground font-serif italic mb-spacing-md max-w-spacing-sm">
                Como administrador, você pode simular o checkout e o retorno do Mercado Pago para validar o fluxo de liberação PRO.
              </p>
              <div className="flex flex-wrap justify-center gap-spacing-sm">
                <Button 
                  variant="outline"
                  onClick={simulatePayment}
                  disabled={isSimulating || isPremium}
                  className="rounded-premium-full border-primary/30 text-primary hover:bg-primary/5 h-spacing-2xl px-spacing-lg font-bold"
                >
                  {isSimulating ? 'Processando...' : isPremium ? '✓ Já é PRO' : 'Simular Aprovação (Webhook)'}
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => navigate(AppRoute.TRANSACTIONS)}
                  className="rounded-premium-full h-spacing-2xl px-spacing-lg font-bold"
                >
                  Ver Histórico de Transações
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default UpgradePage;