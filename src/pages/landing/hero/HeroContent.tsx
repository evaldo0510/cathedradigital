import { motion, MotionValue, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { HomeButton } from "@/components/cathedra/HomeButton";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const fadeInUpVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, y: 0,
    transition: { duration: 1.6, ease: EASE }
  },
};

interface HeroContentProps {
  heroOpacity: MotionValue<number>;
  heroScale?: number;
  heroY: MotionValue<number>;
  onStart: () => void;
}

const HeroContent = ({ heroOpacity, heroScale = 1, heroY, onStart }: HeroContentProps) => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      style={{ 
        opacity: heroOpacity, 
        scale: shouldReduceMotion ? 1 : heroScale, 
        y: shouldReduceMotion ? 0 : heroY 
      }}
      className="relative z-10 max-w-6xl text-center px-6 flex flex-col items-center justify-center min-h-[70vh] w-full"
    >
      {/* Upper Spiritual Anchor */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 2.5, ease: EASE }}
        className="mb-16 md:mb-20"
      >
        <div className="flex flex-col items-center gap-8">
          <div className="w-px h-24 bg-gradient-to-b from-transparent via-primary/10 to-transparent opacity-40" />
          <p className="text-[10px] font-medium uppercase tracking-[1em] text-primary/20 leading-none select-none">
            Bibliotheca Divina
          </p>
        </div>
      </motion.div>

      {/* Primary Identity - The Portal */}
      <motion.div
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        className="mb-12 md:mb-16"
      >
        <h2 className="text-7xl md:text-9xl lg:text-[13rem] font-display font-extralight text-primary leading-none tracking-[0.2em] uppercase select-none drop-shadow-sm">
          Cathedra
        </h2>
      </motion.div>

      {/* Poetic Guidance */}
      <motion.div
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.5 }}
        className="space-y-6 mb-24 md:mb-32"
      >
        <p className="max-w-2xl mx-auto font-serif text-xl md:text-2xl text-foreground/40 italic leading-relaxed tracking-wide px-8">
          O silêncio que revela a Verdade eterna.
        </p>
        <p className="max-w-xl mx-auto font-sans text-xs md:text-sm text-primary/20 uppercase tracking-[0.4em] font-light leading-relaxed">
          Habite a tradição em uma experiência de leitura pura
        </p>
      </motion.div>

      {/* Actions - The Sacred Entry */}
      <motion.div
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.8 }}
        className="flex flex-col items-center gap-20 w-full"
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 md:gap-14 w-full">
          <HomeButton
            size="lg"
            variant="outline"
            onClick={() => navigate('/bible')}
            className="w-full sm:w-auto min-w-[260px] border-primary/5 hover:border-primary/20 text-primary/50 hover:text-primary transition-all duration-700 bg-transparent"
            aria-label="Explorar Escrituras"
          >
            Explorar Escrituras
          </HomeButton>
          
          <HomeButton
            size="lg"
            variant="primary"
            onClick={onStart}
            className="w-full sm:w-auto min-w-[260px] shadow-none hover:shadow-[0_0_40px_-10px_rgba(var(--primary),0.1)] transition-all duration-700"
            aria-label="Continuar leitura"
          >
            Continuar Leitura
          </HomeButton>

          <HomeButton
            size="lg"
            variant="ghost"
            onClick={() => navigate('/jornadas')}
            className="w-full sm:w-auto min-w-[260px] text-primary/30 hover:text-primary transition-all duration-700"
            aria-label="Iniciar jornada espiritual"
          >
            Iniciar Jornada
          </HomeButton>
        </div>

        {/* Lower Monastic Anchor */}
        <div className="flex items-center gap-10 opacity-[0.03] select-none pointer-events-none">
          <div className="w-16 h-px bg-primary" />
          <div className="w-2 h-2 rounded-full border border-primary" />
          <div className="w-16 h-px bg-primary" />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HeroContent;