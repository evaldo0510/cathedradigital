import { motion, MotionValue } from "framer-motion";
import { ChevronRight } from "lucide-react";
import logosAvatar from "@/assets/logos-avatar.png";
import { HomeButton } from "@/components/cathedra/HomeButton";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const fadeInUpVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, y: 0,
    transition: { duration: 1.2, ease: EASE }
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
      className="relative z-10 w-full max-w-7xl mx-auto text-center px-6"
    >
      <div className="space-y-24 md:space-y-32">
        {/* Subtle Identity - Reduced visual excess */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 0.8 }}
          className="flex flex-col items-center"
        >
          <div className="text-[10px] font-black uppercase tracking-[0.6em] text-primary/15">
            Logos · Mestre Contemplativo
          </div>
        </motion.div>

        {/* Title - Iconic Signature with improved typography */}
        <motion.div 
          variants={fadeInUpVariants}
          initial="hidden"
          animate="visible"
          className="space-y-12"
        >
          <h1 
            className="max-w-4xl mx-auto text-5xl md:text-7xl lg:text-8xl font-display font-normal text-primary leading-[1.1] tracking-tightest"
            aria-label="Nem toda prisão é visível"
          > 
            Nem toda <br/> 
            <span className="text-primary/80">prisão é</span> <br/> 
            <span className="text-secondary/30 italic font-serif font-light">visível</span> 
          </h1>
          
          <motion.p
            variants={fadeInUpVariants}
            className="max-w-xl mx-auto font-serif text-lg md:text-xl text-primary/30 italic leading-relaxed font-light"
          >
            Uma plataforma de direção espiritual guiada <br className="hidden md:block" /> pela Tradição e Inteligência Contemplativa.
          </motion.p>
        </motion.div>

        {/* CTA - Focused and refined */}
        <motion.div
          variants={fadeInUpVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.6 }}
          className="flex flex-col items-center pt-8"
        >
          <HomeButton
            size="lg"
            variant="primary"
            className="min-w-[280px] h-16 text-[11px] uppercase tracking-[0.4em] font-black shadow-premium hover:shadow-premium-lg transition-all duration-700"
            onClick={onStart}
            aria-label={user ? "Acessar Interior" : "Iniciar Caminhada Espiritual"}
          >
            {user ? 'Acessar Interior' : 'Iniciar Caminhada'}
          </HomeButton>
          
          <button 
            onClick={onAbout}
            className="mt-10 text-[10px] uppercase tracking-[0.3em] font-bold text-primary/20 hover:text-primary/40 transition-colors duration-500"
          >
            Sobre a Obra
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};
  );
};

export default HeroContent;