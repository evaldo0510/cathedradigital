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
        className="mb-16 md:mb-24"
      >
        <div className="flex flex-col items-center gap-6">
          <div className="w-px h-16 bg-gradient-to-b from-transparent via-primary/10 to-transparent" />
          <p className="text-[9px] font-medium uppercase tracking-[0.6em] text-primary/30 leading-none">
            Sanctuarium Digitale
          </p>
        </div>
      </motion.div>

      {/* Main Heading - The Cathedral Identity */}
      <motion.div
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        className="mb-14 md:mb-20"
      >
        <h2 className="text-5xl md:text-8xl lg:text-9xl font-display font-light text-primary leading-none tracking-[0.1em] uppercase">
          Cathedra
        </h2>
      </motion.div>

      {/* Description - Editorial Rhythm */}
      <motion.p
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3 }}
        className="max-w-2xl mx-auto font-serif text-lg md:text-2xl text-foreground/50 italic leading-relaxed mb-20 md:mb-32 tracking-wide"
      >
        O silêncio que revela a Verdade. <br className="hidden md:block" />
        Explore as fontes imutáveis da fé em uma experiência de leitura pura.
      </motion.p>

      {/* CTAs - Sophisticated and Discreet */}
      <motion.div
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.5 }}
        className="flex flex-col items-center gap-16 w-full"
      >
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 w-full max-w-2xl">
          <HomeButton
            size="lg"
            variant="primary"
            onClick={onStart}
            className="w-full md:w-auto min-w-[240px] px-12"
            aria-label="Entrar no santuário digital"
          >
            Entrar no Santuário
          </HomeButton>
          <HomeButton
            size="lg"
            variant="outline"
            onClick={() => navigate('/bible')}
            className="w-full md:w-auto min-w-[240px] px-12"
            aria-label="Explorar as Escrituras"
          >
            Explorar Escrituras
          </HomeButton>
        </div>

        {/* Elegant Minimal Signature */}
        <div className="flex items-center gap-4 opacity-10">
          <span className="w-8 h-px bg-primary" />
          <p className="text-[9px] font-bold uppercase tracking-[0.6em] text-primary">
            Cathedra
          </p>
          <span className="w-8 h-px bg-primary" />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HeroContent;