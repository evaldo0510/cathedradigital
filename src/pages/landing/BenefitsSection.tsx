import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Bookmark, Star, Trophy, ShieldCheck } from "lucide-react";
import { HomeButton } from "@/components/cathedra/HomeButton";
import { fadeUp, cardHover, buttonHover } from "./animations";

const registerBenefits = [
  { 
    title: "Vida de Oração", 
    description: "Sincronize seu plano de leitura bíblica e estudos teológicos em todos os seus dispositivos.", 
    icon: <Bookmark className="h-spacing-md w-spacing-md text-primary" /> 
  },
  { 
    title: "Tesouros Pessoais", 
    description: "Guarde versículos, orações e meditações que tocam seu coração para consultas rápidas.", 
    icon: <Star className="h-spacing-md w-spacing-md text-primary" /> 
  },
  { 
    title: "Constância", 
    description: "Acompanhe sua jornada com metas de estudo, insígnias e lembretes para manter o hábito espiritual.", 
    icon: <Trophy className="h-spacing-md w-spacing-md text-primary" /> 
  },
  { 
    title: "Estudo Guiado", 
    description: "Desbloqueie o acesso completo ao Logos IA para diálogos teológicos sem limites.", 
    icon: <ShieldCheck className="h-spacing-md w-spacing-md text-primary" /> 
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
    <section ref={sectionRef} className="w-full bg-foreground text-background py-spacing-4xl px-spacing-lg overflow-hidden relative">
      <div className="absolute top-spacing-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-primary/5" />
      </div>

      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-spacing-3xl items-center relative z-10">
        <div className="space-y-spacing-xl">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-spacing-lg">
            <h2 className="text-premium-4xl md:text-premium-5xl font-display font-bold leading-tight">
              Sua morada espiritual no <span className="text-primary italic font-serif">Cathedra</span>
            </h2>
            <p className="text-premium-lg opacity-70 leading-relaxed max-w-spacing-xl">
              Criar sua conta permite uma experiência única de crescimento, guardando sua história viva com a Palavra de Deus e o Magistério.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-spacing-md">
            {registerBenefits.map((benefit, i) => (
              <motion.div key={benefit.title} variants={cardHover} initial="rest" whileHover="hover" whileTap="tap">
                <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} className="space-y-spacing-sm p-spacing-lg rounded-premium bg-card/50 border border-white/10 cursor-pointer h-full">
                  <motion.div whileHover={{ rotate: 15, scale: 1.15 }} transition={{ type: "spring", stiffness: 400 }} className="w-spacing-xl h-spacing-xl rounded-premium bg-primary/20 flex items-center justify-center">
                    {benefit.icon}
                  </motion.div>
                  <h3 className="font-bold text-premium-lg">{benefit.title}</h3>
                  <p className="text-premium-sm opacity-50 leading-relaxed">{benefit.description}</p>
                </motion.div>
              </motion.div>
            ))}
          </div>

          <motion.div variants={buttonHover} initial="rest" whileHover="hover" whileTap="tap">
            <HomeButton size="lg" className="h-spacing-3xl px-spacing-2xl rounded-premium-full bg-primary text-primary-foreground font-black uppercase tracking-widest w-full sm:w-auto" onClick={onLogin}>
              Criar Conta Gratuitamente
            </HomeButton>
          </motion.div>
        </div>

        <div className="relative hidden lg:block">
          <motion.div initial={{ rotate: 3 }} whileHover={{ rotate: 0, scale: 1.01 }} transition={{ duration: 0.5 }} className="relative aspect-square rounded-[3rem] overflow-hidden border border-white/20 shadow-premium">
            <motion.img
              src="https://images.unsplash.com/photo-1544427928-201cd49e6657?auto=format&fit=crop&q=40&w=600"
              alt="Devoção católica"
              className="w-full h-full object-cover grayscale opacity-60"
              loading="lazy"
              decoding="async"
              style={{ y: imageY, scale: imageScale }}
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute bottom-spacing-xl left-spacing-xl right-spacing-xl p-spacing-xl bg-black/60 rounded-premium border border-white/20">
              <p className="text-premium-xl font-serif mb-spacing-md">Onde está o teu tesouro, aí estará também o teu coração.</p>
              <p className="text-premium-xs font-black uppercase tracking-[0.2em] text-primary">Mateus 6,21</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;