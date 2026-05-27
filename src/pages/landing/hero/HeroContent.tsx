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
      className="relative z-10 max-w-[var(--layout-max-width)] text-center px-6 md:px-14 flex flex-col items-center justify-center min-h-[75vh] w-full"
    >
      {/* Upper Spiritual Anchor */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 2.5, ease: EASE }}
        className="mb-20 md:mb-24"
      >
        <div className="flex flex-col items-center gap-10">
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: 120 }}
            transition={{ duration: 2, delay: 0.5 }}
            className="w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent" 
          />
          <p className="text-[11px] font-bold uppercase tracking-[1.2em] text-primary/10 leading-none select-none">
            Sanctuarium Spiritus
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
        <h2 className="text-8xl md:text-[11rem] lg:text-[16rem] xl:text-[22rem] font-display font-light text-primary leading-none tracking-tight uppercase select-none filter blur-[0.2px] transition-all duration-1000">
          Cathedra
        </h2>
      </motion.div>

      {/* Poetic Guidance */}
      <motion.div
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.5 }}
        className="space-y-10 mb-28 md:mb-40"
      >
        <p className="max-w-4xl mx-auto font-serif text-3xl md:text-5xl text-foreground/40 italic leading-snug tracking-tight px-8">
          A profundidade do silêncio, <br /> 
          <span className="text-secondary/60">a clareza da Verdade.</span>
        </p>
        <p className="max-w-2xl mx-auto font-sans text-[10px] md:text-xs text-primary/15 uppercase tracking-[0.8em] font-black leading-relaxed">
          O santuário digital para a alma que busca sabedoria
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
        <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-16 w-full px-6">
          <HomeButton
            size="lg"
            variant="outline"
            onClick={() => navigate('/bible')}
            className="w-full md:w-auto min-w-[280px] border-primary/5 hover:border-primary/20 text-primary/40 hover:text-primary transition-all duration-1000 bg-transparent rounded-full h-20 uppercase tracking-[0.4em] text-[10px] font-bold"
            aria-label="Explorar Escrituras"
          >
            Explorar Escrituras
          </HomeButton>
          
          <HomeButton
            size="lg"
            variant="primary"
            onClick={onStart}
            className="w-full md:w-auto min-w-[280px] bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-1000 rounded-full h-24 shadow-2xl shadow-primary/10 uppercase tracking-[0.6em] text-[11px] font-black group overflow-hidden relative"
            aria-label="Continuar leitura"
          >
            <span className="relative z-10">Continuar Jornada</span>
            <div className="absolute inset-0 bg-white/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          </HomeButton>

          <HomeButton
            size="lg"
            variant="ghost"
            onClick={() => navigate('/biblioteca')}
            className="w-full md:w-auto min-w-[280px] text-primary/20 hover:text-primary/60 transition-all duration-1000 rounded-full h-20 uppercase tracking-[0.4em] text-[10px] font-bold"
            aria-label="Acessar biblioteca completa"
          >
            Iniciar Leitura
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