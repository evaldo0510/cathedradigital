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
      {/* Subtle Visual Anchor */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, ease: EASE }}
        className="mb-12 md:mb-20"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-px h-12 bg-primary/10" />
          <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-primary/30">
            Mosteiro Digital
          </p>
        </div>
      </motion.div>

      {/* Main Heading - Refined Hierarchy */}
      <motion.div
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        className="mb-12 md:mb-16"
      >
        <h1 className="text-6xl md:text-8xl lg:text-[7rem] font-display font-medium text-primary leading-tight tracking-tighter">
          Cathedra
        </h1>
      </motion.div>

      {/* Description - Cleaner and More Contemplative */}
      <motion.p
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
        className="max-w-xl mx-auto font-serif text-xl md:text-2xl text-foreground/20 italic leading-relaxed mb-16 md:mb-24"
      >
        A jornada espiritual guiada pela Tradição.
      </motion.p>

      {/* CTAs - Simplified and Focused */}
      <motion.div
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.4 }}
        className="flex flex-col items-center gap-12"
      >
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
          <HomeButton
            size="lg"
            variant="primary"
            onClick={onStart}
            aria-label="Entrar no santuário digital"
          >
            Entrar no Santuário
          </HomeButton>
        </div>

        {/* Elegant Minimal Signature */}
        <div className="flex items-center gap-4 opacity-10">
          <span className="w-8 h-px bg-primary" />
          <p className="text-[8px] font-bold uppercase tracking-[0.5em] text-primary">
            Cathedra
          </p>
          <span className="w-8 h-px bg-primary" />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HeroContent;