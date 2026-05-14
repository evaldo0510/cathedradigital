import { motion, MotionValue } from "framer-motion";
import { ChevronRight } from "lucide-react";
import logosAvatar from "@/assets/logos-avatar.png";
import { HomeButton } from "@/components/cathedra/HomeButton";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const fadeInUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, y: 0,
    transition: { duration: 0.8, ease: EASE }
  },
};

interface HeroContentProps {
  heroOpacity: MotionValue<number>;
  heroScale?: number;
  heroY: MotionValue<number>;
  onStart: () => void;
  onAbout: () => void;
}

const HeroContent = ({ heroOpacity, heroScale = 1, heroY, onStart, onAbout }: HeroContentProps) => {
  const scrollToVideo = () => {
    document.getElementById('video')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.div
      style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
      className="relative z-10 max-w-4xl lg:max-w-5xl text-center space-y-12 sm:space-y-16 px-4"
    >
      {/* Logos Avatar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.5, ease: EASE }}
        className="flex justify-center"
      >
        <div className="relative">
          <div className="relative">
            {/* Avatar container */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border border-secondary/10 bg-card mx-auto shadow-2xl shadow-primary/5">
              <img src={logosAvatar} alt="Logos — Mestre Contemplativo" className="w-full h-full object-cover grayscale-[0.1] contrast-[1.05]" loading="eager" />
            </div>
          </div>
          <div className="mt-4 px-4 py-1 rounded-full border border-border/5 bg-background text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.3em] inline-block mx-auto">
            Logos · Mestre Contemplativo
          </div>
        </div>
      </motion.div>

      {/* Title */}
      <motion.h1 
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        className="font-display font-bold tracking-tight text-foreground pt-4 sm:pt-6 text-4xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.1]"
      > Nem toda prisão <br/> é visível </motion.h1>

      {/* Description */}
      <motion.p
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
        className="max-w-xl mx-auto text-base md:text-lg text-muted-foreground font-serif leading-relaxed"
      >
        Uma experiência espiritual guiada por Bíblia, Catecismo e Logos IA.
      </motion.p>

      {/* CTA Buttons */}
      <motion.div
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.4 }}
        className="flex flex-col items-center justify-center gap-6 pt-4"
      >
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-sm">
          <HomeButton
            size="lg"
            className="w-full"
            onClick={onStart}
            aria-label="Iniciar sua jornada espiritual"
          >
            Iniciar Jornada
          </HomeButton>
          
          <HomeButton
            variant="outline"
            className="w-full sm:w-auto"
            onClick={scrollToVideo}
            aria-label="Ver vídeo de apresentação"
          >
            Ver Apresentação
          </HomeButton>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.8 }}
          className="w-full max-w-sm flex flex-col gap-3"
        >
          {/* Quick access options removed for minimalism */}
        </motion.div>

        <div className="flex items-center gap-3 opacity-40">
          <span className="w-8 h-px bg-muted-foreground" />
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            Tradição & Tecnologia
          </p>
          <span className="w-8 h-px bg-muted-foreground" />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HeroContent;