import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Bookmark, Star, Trophy, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fadeUp, buttonHover } from "./animations";

const registerBenefits = [
  { 
    title: "Vida de Oração", 
    description: "Sincronize seu plano de leitura bíblica e estudos teológicos em todos os seus dispositivos.", 
    icon: <Bookmark className="h-4 w-4 text-primary" /> 
  },
  { 
    title: "Tesouros Pessoais", 
    description: "Guarde versículos, orações e meditações que tocam seu coração para consultas rápidas.", 
    icon: <Star className="h-4 w-4 text-primary" /> 
  },
  { 
    title: "Constância", 
    description: "Acompanhe sua jornada com metas de estudo, insígnias e lembretes para manter o hábito espiritual.", 
    icon: <Trophy className="h-4 w-4 text-primary" /> 
  },
  { 
    title: "Estudo Guiado", 
    description: "Desbloqueie o acesso completo ao Logos IA para diálogos teológicos sem limites.", 
    icon: <ShieldCheck className="h-4 w-4 text-primary" /> 
  },
];

interface BenefitsSectionProps {
  onLogin: () => void;
}

const BenefitsSection = ({ onLogin }: BenefitsSectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
  const imageScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.1, 1.05, 1]);

  return (
    <section ref={sectionRef} className="w-full bg-foreground text-background py-24 px-6 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-primary/5" />
      </div>

      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
        <div className="space-y-10">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-display font-bold leading-tight">
              Sua morada espiritual no <span className="text-primary italic font-serif">Cathedra</span>
            </h2>
            <p className="text-lg opacity-70 leading-relaxed max-w-xl">
              Criar sua conta permite uma experiência única de crescimento, guardando sua história viva com a Palavra de Deus e o Magistério.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6 lg:gap-8">
            {registerBenefits.map((benefit, i) => (
              <Card 
                key={benefit.title} 
                variant="interactive" 
                padding="md" 
                className="bg-white/[0.03] border-white/5 group"
              >
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-white/5 transition-colors group-hover:bg-primary/20">
                    {benefit.icon}
                  </div>
                  <h3 className="font-bold text-lg tracking-tight">{benefit.title}</h3>
                  <p className="text-sm opacity-40 leading-relaxed font-serif italic">{benefit.description}</p>
                </div>
              </Card>
            ))}
          </div>

          <motion.div variants={buttonHover} initial="rest" whileHover="hover" whileTap="tap">
            <Button size="lg" className="h-16 px-12 rounded-full bg-primary text-primary-foreground font-black uppercase tracking-widest w-full sm:w-auto" onClick={onLogin}>
              Criar Conta Gratuitamente
            </Button>
          </motion.div>
        </div>

        <div className="relative hidden lg:block">
          <motion.div initial={{ rotate: 3 }} whileHover={{ rotate: 0, scale: 1.01 }} transition={{ duration: 0.5 }} className="relative aspect-square rounded-premium-lg overflow-hidden border border-white/20 shadow-lg">
            <motion.img
              src="https://images.unsplash.com/photo-1544427928-201cd49e6657?auto=format&fit=crop&q=40&w=600"
              alt="Devoção católica"
              className="w-full h-full object-cover grayscale opacity-60"
              loading="lazy"
              decoding="async"
              style={{ y: imageY, scale: imageScale }}
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute bottom-10 left-10 right-10 p-8 bg-black/60 rounded-premium border border-white/20">
              <p className="text-xl font-serif mb-4">Onde está o teu tesouro, aí estará também o teu coração.</p>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Mateus 6,21</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;