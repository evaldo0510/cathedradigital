import { motion, MotionValue } from "framer-motion";
import { Icons } from "@/constants";
import { Button } from "@/components/ui/button";
import { buttonHover } from "../animations";
import { Play } from "lucide-react";
import logosAvatar from "@/assets/logos-avatar.png";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

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
      className="relative z-10 max-w-4xl lg:max-w-5xl text-center space-y-8 sm:space-y-12 px-4"
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
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border border-secondary/10 bg-card/40 backdrop-blur-sm mx-auto">
              <img src={logosAvatar} alt="Logos — Mestre Contemplativo" className="w-full h-full object-cover grayscale-[0.2]" />
            </div>
          </div>
          <div className="mt-4 px-4 py-1 rounded-full border border-border/5 bg-background/30 backdrop-blur-sm text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.3em] inline-block mx-auto">
            Logos · Mestre Contemplativo
          </div>
        </div>
      </motion.div>

      {/* Title */}
      <motion.h1 
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        className="text-2xl xs:text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight text-foreground leading-[1.2] sm:leading-[1.1] pt-2 sm:pt-4"
      >
        Nem toda prisão é visível
      </motion.h1>

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
        <div className="flex flex-col sm:row items-center gap-4 w-full max-w-sm">
          <Button
            size="lg"
            className="w-full h-14 px-8 rounded-full bg-primary text-primary-foreground font-bold uppercase tracking-[0.2em] text-xs shadow-none"
            onClick={onStart}
          >
            Iniciar Jornada
          </Button>
          
          <button
            className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors py-2"
            onClick={scrollToVideo}
          >
            Ver Apresentação
          </button>
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