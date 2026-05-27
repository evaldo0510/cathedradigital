import { motion, MotionValue } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { HomeButton } from "@/components/cathedra/HomeButton";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const fadeInUpVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { 
    opacity: 1, y: 0,
    transition: { duration: 1.4, ease: EASE }
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
      className="relative z-10 max-w-5xl text-center px-4 flex flex-col items-center justify-center min-h-[65vh]"
    >
      {/* Subtle Visual Anchor - The Pillar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 2.2, ease: EASE }}
        className="mb-14 md:mb-18"
      >
        <div className="flex flex-col items-center gap-6">
          <div className="w-px h-16 bg-gradient-to-b from-transparent via-primary/15 to-transparent opacity-60" />
          <p className="text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.8em] text-primary/30 leading-none select-none">
            Sanctuarium Digitale
          </p>
        </div>
      </motion.div>

      {/* Main Heading - The Cathedral Identity */}
      <motion.div
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        className="mb-10 md:mb-14"
      >
        <h2 className="text-6xl md:text-9xl lg:text-[11rem] font-display font-light text-primary leading-none tracking-[0.16em] uppercase select-none">
          Cathedra
        </h2>
      </motion.div>

      {/* Description - Editorial Rhythm */}
      <motion.p
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.4 }}
        className="max-w-xl mx-auto font-serif text-lg md:text-xl text-foreground/50 italic leading-relaxed mb-18 md:mb-24 tracking-wide px-8 opacity-90"
      >
        O silêncio que revela a Verdade. <br className="hidden md:block" />
        Habite as fontes imutáveis da fé em uma experiência de leitura absoluta.
      </motion.p>

      {/* CTAs - Sophisticated and Discreet */}
      <motion.div
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.6 }}
        className="flex flex-col items-center gap-14 w-full px-6"
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 md:gap-10 w-full max-w-5xl">
          <HomeButton
            size="lg"
            variant="primary"
            onClick={onStart}
            className="w-full sm:w-auto min-w-[240px] tracking-[0.5em] text-[10px]"
            aria-label="Continuar leitura"
          >
            Continuar Leitura
          </HomeButton>
          <HomeButton
            size="lg"
            variant="outline"
            onClick={() => navigate('/bible')}
            className="w-full sm:w-auto min-w-[240px] tracking-[0.5em] text-[10px]"
            aria-label="Explorar Escrituras"
          >
            Explorar Escrituras
          </HomeButton>
          <HomeButton
            size="lg"
            variant="ghost"
            onClick={() => navigate('/jornadas')}
            className="w-full sm:w-auto min-w-[240px] text-primary/40 hover:text-primary transition-all duration-500 tracking-[0.5em] text-[10px]"
            aria-label="Iniciar jornada espiritual"
          >
            Iniciar Jornada
          </HomeButton>
        </div>

        {/* Elegant Minimal Signature */}
        <div className="flex items-center gap-6 opacity-[0.05] select-none">
          <span className="w-12 h-px bg-primary" />
          <p className="text-[10px] font-bold uppercase tracking-[1em] text-primary translate-x-[0.5em]">
            Cathedra
          </p>
          <span className="w-12 h-px bg-primary" aria-hidden="true" />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HeroContent;