import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronRight, Sparkles, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fadeUp, buttonHover } from "./animations";

interface HeroSectionProps {
  onStart: () => void;
  onAbout: () => void;
}

const HeroSection = ({ onStart, onAbout }: HeroSectionProps) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <section ref={heroRef} className="relative w-full h-[90vh] md:h-[95vh] flex items-center justify-center px-6 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1548610762-656391d1ad4d?auto=format&fit=crop&q=40&w=800"
          alt="Catedral interior com vitrais"
          className="w-full h-full object-cover opacity-10 dark:opacity-[0.06] scale-110 blur-[1px]"
          loading="eager"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/80 to-background" />
      </div>

      <motion.div
        style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        className="relative z-10 max-w-5xl text-center space-y-10"
      >
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="inline-flex items-center gap-2 px-5 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-[0.2em]">O Santuário Digital da Fé</span>
        </motion.div>

        <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1} className="text-5xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight text-foreground leading-[1.05]">
          Aprofunde sua <br />
          <span className="text-primary italic font-light drop-shadow-sm">Vida Interior.</span>
        </motion.h1>

        <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2} className="max-w-2xl mx-auto text-xl md:text-2xl text-muted-foreground font-serif italic">
          "A oração é a elevação da alma a Deus." <br />
          Explore a Bíblia, o Catecismo e a tradição católica em uma plataforma unificada.
        </motion.p>

        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3} className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-6">
          <motion.div variants={buttonHover} initial="rest" whileHover="hover" whileTap="tap">
            <Button size="lg" className="h-16 px-12 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest shadow-2xl shadow-primary/20 text-base" onClick={onStart}>
              Começar Jornada <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
          <motion.div variants={buttonHover} initial="rest" whileHover="hover" whileTap="tap">
            <Button size="lg" variant="outline" className="h-16 px-12 rounded-2xl border-primary/20 bg-card/50 backdrop-blur-md font-black uppercase tracking-widest text-base" onClick={onAbout}>
              Conhecer o Projeto
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-muted-foreground/40"
      >
        <ArrowDown className="w-5 h-5" />
      </motion.div>
    </section>
  );
};

export default HeroSection;
