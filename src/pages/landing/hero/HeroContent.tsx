import { motion, MotionValue } from "framer-motion";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  return (
    <motion.div
      style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
      className="relative z-10 max-w-5xl text-center px-4 flex flex-col items-center justify-center min-h-[60vh]"
    >
      {/* Subtle Visual Anchor - Replacement for Avatar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, ease: EASE }}
        className="mb-12"
      >
        <div className="px-6 py-2 rounded-full border border-primary/5 bg-primary/[0.02] text-[10px] font-bold uppercase tracking-[0.5em] text-primary/30">
          Santuário Digital
        </div>
      </motion.div>

      {/* Main Heading - Refined Hierarchy */}
      <motion.div
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4 mb-10"
      >
        <h1 className="text-6xl md:text-8xl lg:text-[9rem] font-display font-medium text-primary leading-[0.95] tracking-tight">
          Nem toda prisão <br/> é <span className="text-secondary/50 italic font-serif font-light">visível</span>
        </h1>
      </motion.div>

      {/* Description - Cleaner and More Contemplative */}
      <motion.p
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3 }}
        className="max-w-2xl mx-auto font-serif text-xl md:text-2xl text-foreground/40 italic leading-relaxed mb-16"
      >
        Silêncio, profundidade e clareza. <br className="hidden md:block" />
        Uma jornada espiritual guiada pela Tradição e inteligência contemplativa.
      </motion.p>

      {/* Primary CTA - Simplified and Focused */}
      <motion.div
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.5 }}
        className="flex flex-col items-center gap-12"
      >
        <HomeButton
          size="lg"
          className="px-16 py-8 text-xs tracking-[0.3em] font-black uppercase rounded-full shadow-2xl shadow-primary/10 hover:shadow-primary/20 transition-all duration-700 active:scale-95"
          onClick={onStart}
          aria-label="Entrar no santuário digital"
        >
          Entrar no Santuário
        </HomeButton>

        {/* Elegant Minimal Signature */}
        <div className="flex items-center gap-6 opacity-20">
          <span className="w-12 h-px bg-primary" />
          <p className="text-[9px] font-bold uppercase tracking-[0.6em] text-primary">
            Cathedra Digital
          </p>
          <span className="w-12 h-px bg-primary" />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HeroContent;