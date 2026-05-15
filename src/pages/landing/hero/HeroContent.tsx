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
  user: any;
}

const HeroContent = ({ heroOpacity, heroScale = 1, heroY, onStart, onAbout, user }: HeroContentProps) => {
  const scrollToVideo = () => {
    document.getElementById('video')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.div
      style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
      className="relative z-10 w-full max-w-[1280px] mx-auto text-center space-y-24 md:space-y-32 lg:space-y-48 px-6 sm:px-8 lg:px-16"
    >
      {/* Logos Avatar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, delay: 0.5, ease: EASE }}
        className="flex justify-center"
      >
        <div className="relative group">
          <div className="relative">
            {/* Avatar container - Softer border and background */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] overflow-hidden border border-white/[0.03] bg-white/[0.02] mx-auto shadow-premium transition-all duration-1000 group-hover:border-white/[0.08]">
              <img src={logosAvatar} alt="Logos — Mestre Contemplativo" className="w-full h-full object-cover grayscale-[0.2] contrast-[1.02] opacity-80 group-hover:opacity-100 transition-opacity duration-1000" loading="eager" />
            </div>
          </div>
          <div className="mt-6 px-5 py-2 rounded-full border border-white/[0.03] bg-background/50 backdrop-blur-sm text-[9px] font-black uppercase tracking-[0.5em] text-primary/20 inline-block mx-auto group-hover:text-primary/40 transition-colors duration-1000">
            Logos · Mestre Contemplativo
          </div>
        </div>
      </motion.div>

      {/* Title - Iconic Signature */}
      <motion.div 
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        <h1 
          className="pt-2 max-w-5xl mx-auto text-6xl md:text-8xl lg:text-9xl font-display font-medium text-primary leading-[1.05] tracking-tightest"
          aria-label="Nem toda prisão é visível"
        > 
          Nem toda <br/> 
          <span className="text-primary/90">prisão é</span> <br/> 
          <span className="text-secondary/40 italic font-serif">visível</span> 
        </h1>
        
        <motion.p
          variants={fadeInUpVariants}
          className="max-w-2xl mx-auto font-serif text-xl md:text-2xl text-foreground/40 italic leading-relaxed font-light"
        >
          Uma plataforma espiritual inteligente guiada pela Tradição viva, <br className="hidden md:block" /> Sagradas Escrituras e o mestre contemplativo Logos IA.
        </motion.p>
      </motion.div>

      {/* CTA Buttons - Refined */}
      <motion.div
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.4 }}
        className="flex flex-col items-center justify-center gap-10 pt-4"
      >
        <div className="flex flex-col sm:flex-row items-center gap-6 w-full max-w-md">
          <HomeButton
            size="lg"
            variant="primary"
            className="w-full sm:flex-1 h-16 text-sm uppercase tracking-[0.2em] font-bold"
            onClick={onStart}
            aria-label={user ? "Acessar suas atividades" : "Iniciar sua jornada espiritual"}
          >
            {user ? 'Ver Atividades' : 'Iniciar Jornada'}
          </HomeButton>
          
          <HomeButton
            variant="outline"
            className="w-full sm:w-auto h-16 px-10 text-sm uppercase tracking-[0.2em] font-bold border-white/[0.05] hover:bg-white/[0.02]"
            onClick={scrollToVideo}
            aria-label="Ver vídeo de apresentação"
          >
            Apresentação
          </HomeButton>
        </div>

        <div className="flex items-center justify-center gap-6 opacity-20 w-full max-w-lg mx-auto">
          <div className="h-px flex-1 bg-primary" />
          <p className="text-[10px] text-primary font-black uppercase tracking-[0.5em] whitespace-nowrap">
            Tradição & Tecnologia
          </p>
          <div className="h-px flex-1 bg-primary" />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HeroContent;