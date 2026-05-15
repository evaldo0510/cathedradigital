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
      className="relative z-10 max-w-[1280px] w-full text-center space-y-16 sm:space-y-24 px-6 mx-auto"
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
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-white/10 bg-white/5 mx-auto shadow-premium">
              <img src={logosAvatar} alt="Logos — Mestre Contemplativo" className="w-full h-full object-cover grayscale-[0.1] contrast-[1.05]" loading="eager" />
            </div>
          </div>
          <div className="mt-4 px-4 py-1.5 rounded-2xl border border-border/10 bg-background text-[10px] font-black uppercase tracking-[0.4em] text-primary/40 inline-block mx-auto">
            Logos · Mestre Contemplativo
          </div>
        </div>
      </motion.div>

      {/* Title */}
      <motion.h1 
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        className="pt-6 sm:pt-10 max-w-5xl mx-auto text-5xl md:text-7xl lg:text-8xl font-display font-medium text-primary leading-[1.1] tracking-tighter"
        aria-label="Nem toda prisão é visível"
      > Nem toda <br/> prisão é <span className="text-secondary/60 italic font-serif">visível</span> </motion.h1>

      {/* Description */}
      <motion.p
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
        className="max-w-2xl mx-auto font-serif text-xl md:text-2xl text-foreground/50 italic leading-relaxed"
      >
        Uma plataforma espiritual inteligente guiada pela Tradição viva, <br className="hidden md:block" /> Sagradas Escrituras e o mestre contemplativo Logos IA.
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
            className="w-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            onClick={onStart}
            aria-label="Iniciar sua jornada espiritual"
          >
            Iniciar Jornada
          </HomeButton>
          
          <HomeButton
            variant="outline"
            className="w-full sm:w-auto focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
          <p className="text-premium-tiny text-muted-foreground font-bold uppercase tracking-widest">
            Tradição & Tecnologia
          </p>
          <span className="w-8 h-px bg-muted-foreground" />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HeroContent;