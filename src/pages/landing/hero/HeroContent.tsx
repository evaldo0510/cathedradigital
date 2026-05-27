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
      className="relative z-10 max-w-[var(--layout-max-width)] text-center px-6 md:px-14 flex flex-col items-center justify-center min-h-[85vh] w-full"
    >
      {/* Upper Spiritual Anchor - Refined Monastic Line */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 3, ease: EASE }}
        className="mb-24 md:mb-32"
      >
        <div className="flex flex-col items-center gap-12">
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: 160 }}
            transition={{ duration: 2.5, delay: 0.8, ease: EASE }}
            className="w-[1.5px] bg-gradient-to-b from-transparent via-primary/20 to-transparent" 
          />
          <p className="text-[11px] md:text-[12px] font-black uppercase tracking-[1.4em] text-primary/10 leading-none select-none ml-4">
            Sanctuarium Spiritus
          </p>
        </div>
      </motion.div>

      {/* Primary Identity - The Architectural Focus */}
      <motion.div
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        className="mb-14 md:mb-20"
      >
        <h2 className="text-[5.5rem] md:text-[11rem] lg:text-[15rem] xl:text-[20rem] font-display font-light text-primary leading-none tracking-tight uppercase select-none filter blur-[0.2px] hover:blur-none transition-all duration-2000 group">
          Cathedra
          <span className="block h-[1px] w-0 group-hover:w-full bg-primary/10 transition-all duration-3000 mx-auto mt-4" />
        </h2>
      </motion.div>

      {/* Editorial Headline - Emotionally Deep */}
      <motion.div
        variants={fadeInUpVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.6 }}
        className="space-y-12 mb-32 md:mb-48"
      >
        <p className="max-w-5xl mx-auto font-serif text-3xl md:text-5xl lg:text-6xl text-foreground/40 italic leading-snug tracking-tight px-8">
          Habite a profundidade do silêncio, <br /> 
          <span className="text-secondary/70">contemple a clareza da Verdade.</span>
        </p>
        <p className="max-w-2xl mx-auto font-sans text-[10px] md:text-[11px] text-primary/20 uppercase tracking-[1em] font-black leading-relaxed select-none">
          O santuário digital para a sabedoria eterna
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
        <div className="flex flex-col md:flex-row items-center justify-center gap-14 md:gap-20 w-full px-6">
          <HomeButton
            size="lg"
            variant="outline"
            onClick={() => navigate('/bible')}
            className="w-full md:w-auto min-w-[300px] border-primary/5 hover:border-primary/20 text-primary/40 hover:text-primary transition-all duration-1000 bg-transparent rounded-full h-20 uppercase tracking-[0.4em] text-[10px] font-bold"
            aria-label="Explorar Escrituras"
          >
            Explorar Escrituras
          </HomeButton>
          
          <HomeButton
            size="lg"
            variant="primary"
            onClick={onStart}
            className="w-full md:w-auto min-w-[320px] bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-1000 rounded-full h-24 shadow-2xl shadow-primary/10 uppercase tracking-[0.6em] text-[11px] font-black group overflow-hidden relative border-none"
            aria-label="Continuar jornada"
          >
            <span className="relative z-10">Continuar jornada</span>
            <div className="absolute inset-0 bg-white/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          </HomeButton>

          <HomeButton
            size="lg"
            variant="ghost"
            onClick={() => navigate('/biblioteca')}
            className="w-full md:w-auto min-w-[300px] text-primary/20 hover:text-primary/60 transition-all duration-1000 rounded-full h-20 uppercase tracking-[0.4em] text-[10px] font-bold"
            aria-label="Iniciar leitura"
          >
            Iniciar leitura
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