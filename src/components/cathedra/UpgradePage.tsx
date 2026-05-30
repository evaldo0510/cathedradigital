import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Crown, Sparkles, Target, Library, Compass, ArrowRight, Zap, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
    icon: Compass 
  },
  { 
    title: "Respostas mais profundas da Logos", 
    desc: "Obtenha reflexões teológicas densas e personalizadas com nossa IA.",
    icon: Sparkles 
  },
  { 
    title: "Acompanhamento Contínuo", 
    desc: "Métricas e lembretes para garantir sua constância na vida de oração.",
    icon: Target 
  },
  { 
    title: "Conteúdos Exclusivos", 
    desc: "Acesso total a documentos raros, meditações e estudos avançados.",
    icon: Library 
  }
];

const UpgradePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, isPremium } = useAuth();
  const [isSimulating, setIsSimulating] = useState(false);

  const isAdmin = profile?.role === 'admin';

  const simulatePayment = async () => {
    if (!user) return;
    setIsSimulating(true);
    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-simulate', {
        body: { userId: user.id, planId: 'cathedra_pro_annual_test', status: 'approved' },
      });
      if (error) throw error;
      toast.success('Simulação concluída! Seu acesso PRO foi liberado.');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      toast.error('Erro na simulação: ' + error.message);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="min-h-[80dvh] flex flex-col items-center justify-center py-2xl md:py-3xl px-md relative overflow-hidden">
      <Helmet>
        <title>Cathedra PRO — Eleve sua Vida Espiritual</title>
      </Helmet>

      {/* Decorative background elements */}
      <div className="absolute top-0 left-2xs/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none opacity-20">
        <div className="absolute top-[10%] left-2xs/4 w-64 h-64 bg-primary/20 rounded-premium " />
        <div className="absolute bottom-[20%] right-2xs/4 w-72 h-72 bg-primary/10 rounded-premium " />
      </div>

      <div className="max-w-3xl w-full text-center space-y-8">
        <motion.div 
          variants={fadeUp} 
          initial="hidden" 
          animate="visible" 
          custom={0}
          className="flex justify-center"
        >
          <div className="inline-flex items-center gap-xs px-sm py-2xs bg-primary/10 border border-primary/20 rounded-premium text-primary">
            <Crown className="w-md h-md" />
            <span className="text-premium-tiny font-black uppercase tracking-widest">Cathedra PRO</span>
          </div>
        </motion.div>

        <motion.div 
          variants={fadeUp} 
          initial="hidden" 
          animate="visible" 
          custom={1}
          className="space-y-4"
        >
          <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-balance">
            Sua caminhada de fé merece <span className="text-primary italic">profundidade</span>.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-serif italic max-w-xl mx-auto leading-relaxed">
            O Cathedra PRO foi desenhado para quem deseja ir além do essencial e vivenciar a plenitude da nossa tradição.
          </p>
        </motion.div>

        <motion.div 
          variants={fadeUp} 
          initial="hidden" 
          animate="visible" 
          custom={2}
          className="grid sm:grid-cols-2 gap-lg text-left py-xl"
        >
          {BENEFITS.map((benefit, i) => (
            <div key={i} className="group p-md rounded-premium bg-card border border-border/50 hover:border-primary/30 transition-all duration-500 ">
              <div className="w-xl h-xl rounded-premium bg-primary/10 flex items-center justify-center text-primary mb-md group-hover:scale-110 transition-transform duration-500">
                <benefit.icon className="w-md h-md" />
              </div>
              <h3 className="font-bold text-lg mb-2xs">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{benefit.desc}</p>
            </div>
          ))}
        </motion.div>

        <motion.div 
          variants={fadeUp} 
          initial="hidden" 
          animate="visible" 
          custom={3}
          className="flex flex-col items-center gap-lg"
        >
          <Button 
            size="lg"
            className="h-3xl px-xl rounded-full text-lg font-bold bg-primary text-primary-foreground shadow-premium-hover shadow-primary/30 hover:shadow-primary/50 transition-all duration-500 group"
            onClick={() => navigate(AppRoute.CHECKOUT)}
            disabled={isPremium}
          >
            {isPremium ? (
              <span className="flex items-center gap-xs">Experiência Desbloqueada <Zap className="w-md h-md fill-current" /></span>
            ) : (
              <span className="flex items-center gap-xs">
                Desbloquear experiência completa
                <ArrowRight className="w-md h-md group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </Button>
          
          <div className="flex items-center gap-lg text-xs font-medium text-muted-foreground/60 tracking-widest uppercase">
            <span>Acesso Imediato</span>
            <div className="w-2xs h-2xs rounded-premium bg-border" />
            <span>Cancele quando quiser</span>
          </div>
        </motion.div>

        {isAdmin && (
          <motion.div 
            variants={fadeUp} 
            initial="hidden" 
            animate="visible" 
            custom={4}
            className="pt-2xl border-t border-border/50"
          >
            <div className="flex flex-col items-center gap-md bg-muted/30 p-xl rounded-[2.5rem] border border-dashed border-primary/30">
              <div className="w-2xl h-2xl rounded-premium bg-primary/10 flex items-center justify-center text-primary mb-xs">
                <FlaskConical className="w-lg h-lg" />
              </div>
              <h3 className="text-xl font-serif font-bold italic">Zona de Testes (Admin)</h3>
              <p className="text-sm text-muted-foreground font-serif italic mb-md max-w-sm">
                Como administrador, você pode simular o checkout e o retorno do Mercado Pago para validar o fluxo de liberação PRO.
              </p>
              <div className="flex flex-wrap justify-center gap-sm">
                <Button 
                  variant="outline"
                  onClick={simulatePayment}
                  disabled={isSimulating || isPremium}
                  className="rounded-full border-primary/30 text-primary hover:bg-primary/5 h-2xl px-lg font-bold"
                >
                  {isSimulating ? 'Processando...' : isPremium ? '✓ Já é PRO' : 'Simular Aprovação (Webhook)'}
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => navigate(AppRoute.TRANSACTIONS)}
                  className="rounded-full h-2xl px-lg font-bold"
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