import { motion, MotionValue } from "framer-motion";
import { HomeButton } from "@/components/cathedra/HomeButton";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    }
  }
};

const fadeInUpVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { 
    opacity: 1, y: 0,
    transition: { duration: 1.8, ease: EASE }
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
  return (
    <motion.div
      style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
      className="relative z-10 w-full max-w-7xl mx-auto text-center px-6 md:px-12"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="space-y-16 sm:space-y-24 md:space-y-32">
        {/* Subtle Identity */}
        <motion.div
          variants={fadeInUpVariants}
          className="flex flex-col items-center"
        >
          <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.6em] text-primary/15 select-none">
            Logos · Mestre Contemplativo
          </div>
        </motion.div>

        {/* Title - Iconic Signature */}
        <motion.div 
          variants={fadeInUpVariants}
          className="space-y-8 sm:space-y-12"
        >
          <h1 
            className="max-w-4xl mx-auto text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-display font-normal text-primary leading-[1.1] tracking-tightest px-4 sm:px-0 heading-hero"
            aria-label="Nem toda prisão é visível"
          > 
            Nem toda <br/> 
            <span className="text-primary/70">prisão é</span> <br/> 
            <span className="text-secondary/60 italic font-serif font-light">visível</span> 
          </h1>
          
          <motion.p
            className="max-w-lg mx-auto font-serif text-base sm:text-lg md:text-xl text-primary/60 italic leading-relaxed font-light px-6 sm:px-0 text-premium-body"
          >
            Uma plataforma de direção espiritual guiada <br className="hidden sm:block" /> pela Tradição e Inteligência Contemplativa.
          </motion.p>

        </motion.div>

        {/* CTA - Refined Focus */}
        <motion.div
          variants={fadeInUpVariants}
          className="flex flex-col items-center pt-4 sm:pt-8"
        >
          <HomeButton
            size="lg"
            variant="primary"
            className="w-full sm:w-auto sm:min-w-[320px] h-16 text-[10px] sm:text-[11px] uppercase tracking-[0.4em] font-black shadow-premium hover:shadow-premium-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background outline-none transition-all duration-1000"
            onClick={onStart}
            aria-label={user ? "Acessar Interior" : "Iniciar Caminhada Espiritual"}
          >
            {user ? 'Acessar Interior' : 'Iniciar Caminhada'}
          </HomeButton>
          
          <button 
            onClick={onAbout}
            className="mt-12 text-[9px] sm:text-[10px] uppercase tracking-[0.3em] font-bold text-primary/15 hover:text-primary/40 focus-visible:text-primary focus-visible:ring-2 focus-visible:ring-primary/10 focus-visible:rounded-full px-4 py-2 outline-none transition-all duration-700"
            aria-label="Saiba mais sobre a obra Cathedra"
          >
            Sobre a Obra
          </button>

        </motion.div>
      </div>
    </motion.div>
  );
};

export default HeroContent;