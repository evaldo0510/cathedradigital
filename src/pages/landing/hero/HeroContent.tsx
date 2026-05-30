import { motion, MotionValue, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { HomeButton } from "@/components/cathedra/HomeButton";
import { Icons } from "@/constants";

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
      className="relative z-10 max-w-[var(--layout-max-width)] text-center px-md md:px-2xl flex flex-col items-center justify-center min-h-[75vh] md:min-h-[85vh] w-full"
    >
      {/* Upper Spiritual Anchor - Refined Monastic Line */}
      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 1.5 : 3, ease: EASE }}
        className="mb-xl md:mb-3xl lg:mb-4xl"
      >
        <div className="flex flex-col items-center gap-md md:gap-xl">
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: shouldReduceMotion ? 40 : 80, opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: shouldReduceMotion ? 1 : 2.5, delay: 0.8, ease: EASE }}
            className="w-[1.5px] bg-gradient-to-b from-transparent via-primary/20 to-transparent" 
          />
          <p className="text-[10px] md:text-xs font-semibold uppercase tracking-premium-widest md:tracking-[1.4em] text-primary/10 leading-none select-none ml-md">
            Sanctuarium Spiritus
          </p>
        </div>
      </motion.div>

      {/* Primary Identity - The Architectural Focus */}
      <motion.div
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        className="mb-lg md:mb-3xl lg:mb-3xl"
      >
        <h2 className="text-[3.5rem] sm:text-[5rem] md:text-[10rem] lg:text-[14rem] xl:text-[18rem] font-display font-light text-primary leading-none tracking-tight uppercase select-none filter blur-[0.2px] hover:blur-none transition-all duration-[2000ms] group">
          Cathedra
          <span className="block h-[1px] w-0 group-hover:w-full bg-primary/10 transition-all duration-[3000ms] mx-auto mt-md" />
        </h2>
      </motion.div>

      {/* Editorial Headline - Emotionally Deep */}
      <motion.div
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.6 }}
        className="space-y-6 md:space-y-12 mb-2xl md:mb-40 lg:mb-48"
      >
        <p className="max-w-[95vw] md:max-w-5xl mx-auto font-serif text-xl sm:text-3xl md:text-5xl lg:text-6xl text-foreground/40 italic leading-snug tracking-tight px-xs md:px-xl">
          Habite a profundidade do silêncio, <br /> 
          <span className="text-secondary/70">contemple a clareza da Verdade.</span>
        </p>
        <p className="max-w-2xl mx-auto font-sans text-[9px] md:text-[11px] text-primary/20 uppercase tracking-[0.8em] md:tracking-[1em] font-black leading-relaxed select-none">
          O santuário digital para a sabedoria eterna
        </p>
      </motion.div>

      {/* Actions - The Sacred Entry */}
      <motion.div
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.8 }}
        className="flex flex-col items-center gap-xl md:gap-3xl w-full"
      >
        <div className="flex flex-col md:flex-row items-center justify-center gap-lg md:gap-3xl w-full px-md md:px-lg">
          <HomeButton
            size="lg"
            variant="outline"
            onClick={() => navigate('/bible')}
            className="w-full md:w-auto min-w-[240px] md:min-w-[300px] border-primary/5 hover:border-primary/20 text-primary/40 hover:text-primary transition-all duration-1000 bg-transparent rounded-full h-2xl md:h-3xl uppercase tracking-[0.4em] text-[9px] md:text-[10px] font-bold"
            aria-label="Explorar Escrituras"
          >
            Explorar Escrituras
          </HomeButton>
          
          <HomeButton
            size="lg"
            variant="primary"
            onClick={onStart}
            className="w-full md:w-auto min-w-[260px] md:min-w-[320px] bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-1000 rounded-full h-3xl md:h-4xl shadow-premium shadow-primary/10 uppercase tracking-[0.6em] text-[10px] md:text-[11px] font-black group overflow-hidden relative border-none"
            aria-label="Continuar jornada"
          >
            <span className="relative z-10">Continuar jornada</span>
            <div className="absolute inset-0 bg-white/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          </HomeButton>

          <HomeButton
            size="lg"
            variant="ghost"
            onClick={() => navigate('/biblioteca')}
            className="w-full md:w-auto min-w-[240px] md:min-w-[300px] text-primary/20 hover:text-primary/60 transition-all duration-1000 rounded-full h-2xl md:h-3xl uppercase tracking-[0.4em] text-[9px] md:text-[10px] font-bold"
            aria-label="Iniciar leitura"
          >
            Iniciar leitura
          </HomeButton>
        </div>

        {/* Lower Monastic Anchor */}
        <div className="flex items-center gap-xl opacity-[0.03] select-none pointer-events-none">
          <div className="w-3xl h-px bg-primary" />
          <div className="w-xs h-xs rounded-full border border-primary" />
          <div className="w-3xl h-px bg-primary" />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HeroContent;