import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Crown, Sparkles, Target, Library, Compass, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';
import { useAuth } from '@/hooks/useAuth';

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
  const { isPremium } = useAuth();

  return (
    <div className="min-h-[80dvh] flex flex-col items-center justify-center py-12 md:py-20 px-4 relative overflow-hidden">
      <Helmet>
        <title>Cathedra PRO — Eleve sua Vida Espiritual</title>
      </Helmet>

      {/* Decorative background elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none opacity-20">
        <div className="absolute top-[10%] left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-1/4 w-72 h-72 bg-primary/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-3xl w-full text-center space-y-8">
        <motion.div 
          variants={fadeUp} 
          initial="hidden" 
          animate="visible" 
          custom={0}
          className="flex justify-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-primary">
            <Crown className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Cathedra PRO</span>
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
          className="grid sm:grid-cols-2 gap-6 text-left py-8"
        >
          {BENEFITS.map((benefit, i) => (
            <div key={i} className="group p-5 rounded-3xl bg-card/50 border border-border/50 hover:border-primary/30 transition-all duration-500 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform duration-500">
                <benefit.icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg mb-1">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{benefit.desc}</p>
            </div>
          ))}
        </motion.div>

        <motion.div 
          variants={fadeUp} 
          initial="hidden" 
          animate="visible" 
          custom={3}
          className="flex flex-col items-center gap-6"
        >
          <Button 
            size="lg"
            className="h-16 px-10 rounded-full text-lg font-bold bg-primary text-primary-foreground shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-500 group"
            onClick={() => navigate(AppRoute.CHECKOUT)}
            disabled={isPremium}
          >
            {isPremium ? (
              <span className="flex items-center gap-2">Experiência Desbloqueada <Zap className="w-5 h-5 fill-current" /></span>
            ) : (
              <span className="flex items-center gap-2">
                Desbloquear experiência completa
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </Button>
          
          <div className="flex items-center gap-6 text-xs font-medium text-muted-foreground/60 tracking-widest uppercase">
            <span>Acesso Imediato</span>
            <div className="w-1 h-1 rounded-full bg-border" />
            <span>Cancele quando quiser</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default UpgradePage;