import { motion, MotionValue } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { HomeButton } from "@/components/cathedra/HomeButton";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const fadeInUpVariants = {
  hidden: { opacity: 0, y: 10 },
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
}

const HeroContent = ({ heroOpacity, heroScale = 1, heroY, onStart }: HeroContentProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
      className="relative z-10 max-w-5xl text-center px-4 flex flex-col items-center justify-center min-h-[60vh]"
    >
      {/* Subtle Visual Anchor - The Pillar */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.8, ease: EASE }}
        className="mb-12 md:mb-16"
      >
        <div className="flex flex-col items-center gap-5">
          <div className="w-px h-12 bg-gradient-to-b from-transparent via-primary/20 to-transparent" />
          <p className="text-[8px] sm:text-[9px] font-medium uppercase tracking-[0.6em] text-primary/40 leading-none">
            Sanctuarium Digitale
          </p>
        </div>
      </motion.div>

      {/* Main Heading - The Cathedral Identity */}
      <motion.div
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        className="mb-10 md:mb-12"
      >
        <h2 className="text-6xl md:text-8xl lg:text-[10rem] font-display font-light text-primary leading-none tracking-[0.12em] uppercase">
          Cathedra
        </h2>
      </motion.div>

      {/* Description - Editorial Rhythm */}
      <motion.p
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3 }}
        className="max-w-xl mx-auto font-serif text-lg md:text-xl text-foreground/60 italic leading-relaxed mb-16 md:mb-20 tracking-wide px-6"
      >
        O silêncio que revela a Verdade. <br className="hidden md:block" />
        Habite as fontes imutáveis da fé em uma experiência de leitura pura.
      </motion.p>

      {/* CTAs - Sophisticated and Discreet */}
      <motion.div
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.5 }}
        className="flex flex-col items-center gap-12 w-full px-6"
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 md:gap-8 w-full max-w-4xl">
          <HomeButton
            size="lg"
            variant="primary"
            onClick={onStart}
            className="w-full sm:w-auto min-w-[220px]"
            aria-label="Continuar leitura"
          >
            Continuar Leitura
          </HomeButton>
          <HomeButton
            size="lg"
            variant="outline"
            onClick={() => navigate('/bible')}
            className="w-full sm:w-auto min-w-[220px]"
            aria-label="Explorar Escrituras"
          >
            Explorar Escrituras
          </HomeButton>
          <HomeButton
            size="lg"
            variant="ghost"
            onClick={() => navigate('/jornadas')}
            className="w-full sm:w-auto min-w-[220px] text-primary/60 hover:text-primary transition-colors"
            aria-label="Iniciar jornada espiritual"
          >
            Iniciar Jornada
          </HomeButton>
        </div>

        {/* Elegant Minimal Signature */}
        <div className="flex items-center gap-4 opacity-10">
          <span className="w-10 h-px bg-primary" />
          <p className="text-[9px] font-bold uppercase tracking-[0.8em] text-primary translate-x-[0.4em]">
            Cathedra
          </p>
          <span className="w-10 h-px bg-primary" />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HeroContent;