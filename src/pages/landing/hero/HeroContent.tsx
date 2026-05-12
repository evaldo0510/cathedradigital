import { motion, MotionValue } from "framer-motion";
import { Icons } from "@/constants";
import { Button } from "@/components/ui/button";
import { buttonHover } from "../animations";
import { Play } from "lucide-react";
import logosAvatar from "@/assets/logos-avatar.png";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const letterVariants = {
  hidden: { opacity: 0, y: 40, rotateX: -60 },
  visible: (i: number) => ({
    opacity: 1, y: 0, rotateX: 0,
    transition: { duration: 0.6, delay: 0.8 + i * 0.04, ease: EASE },
  }),
};

const AnimatedTitle = ({ text }: { text: string }) => (
  <span>
    {text.split("").map((char, i) => (
      <motion.span
        key={i}
        variants={letterVariants}
        initial="hidden"
        animate="visible"
        custom={i}
        className="inline-block font-serif"
        style={{ display: char === " " ? "inline" : "inline-block" }}
      >
        {char === " " ? "\u00A0" : char}
      </motion.span>
    ))}
  </span>
);

interface HeroContentProps {
  heroOpacity: MotionValue<number>;
  heroScale: MotionValue<number>;
  heroY: MotionValue<number>;
  onStart: () => void;
  onAbout: () => void;
}

const HeroContent = ({ heroOpacity, heroScale, heroY, onStart, onAbout }: HeroContentProps) => {
  const scrollToVideo = () => {
    document.getElementById('video')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.div
      style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
      className="relative z-10 max-w-4xl lg:max-w-5xl text-center space-y-8 sm:space-y-12 px-4"
    >
      {/* Logos Avatar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.5, ease: EASE }}
        className="flex justify-center"
      >
        <div className="relative group">
          {/* Breathing halo glow */}
          <motion.div
            animate={{ opacity: [0.15, 0.3, 0.15], scale: [1, 1.15, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-secondary/20 blur-3xl rounded-full"
          />
          {/* Gentle floating */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            {/* Avatar container */}
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-[3px] border-secondary/40 shadow-2xl group-hover:border-secondary/60 transition-all duration-500 bg-card/60 backdrop-blur-xl">
              <img src={logosAvatar} alt="Logos — Mestre Contemplativo" className="w-full h-full object-cover" />
              <motion.div
                animate={{ opacity: [0, 0.06, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-secondary/30 rounded-full"
              />
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-4 rounded-full border border-secondary/10 -z-10"
              style={{ borderStyle: 'dashed' }}
            />
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] whitespace-nowrap border-[4px] border-background shadow-2xl"
          >
            Logos · Mestre Contemplativo
          </motion.div>
        </div>
      </motion.div>

      {/* Title */}
      <div className="text-2xl xs:text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight text-foreground leading-[1.2] sm:leading-[1.1] pt-2 sm:pt-4">
        <AnimatedTitle text="Como está a sua alma" />
        <br className="hidden sm:block" />
        <span className="inline sm:hidden">{" "}</span>
        <motion.span
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.6, ease: EASE }}
          className="text-primary italic font-light drop-shadow-sm inline-block font-serif text-[1.1em] sm:text-[0.9em]"
        >
          hoje?
        </motion.span>
      </div>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 2.2 }}
        className="max-w-2xl mx-auto text-xl md:text-2xl text-muted-foreground font-serif italic leading-relaxed"
      >
        "A oração é o respirar da alma e o silêncio é a linguagem de Deus." <br />
        <span className="text-base md:text-lg not-italic opacity-80 block mt-3">
          Abra seu coração ao Logos IA e receba orientações espirituais personalizadas fundamentadas na Sagrada Tradição e no Magistério.
        </span>
      </motion.p>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 2.5 }}
        className="flex flex-col items-center justify-center gap-8 pt-4"
      >
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full max-w-2xl">
          <motion.div className="w-full sm:flex-1" variants={buttonHover} initial="rest" whileHover="hover" whileTap="tap">
            <Button
              size="lg"
              className="w-full h-16 sm:h-20 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.2em] shadow-xl text-sm sm:text-base group"
              onClick={onStart}
            >
              Iniciar Jornada <Icons.PenTool className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
          
          <motion.div className="w-full sm:flex-1" variants={buttonHover} initial="rest" whileHover="hover" whileTap="tap">
            <Button
              size="lg"
              variant="outline"
              className="w-full h-16 sm:h-20 px-8 rounded-2xl border-border bg-card/40 backdrop-blur-md hover:bg-card/60 text-foreground font-black uppercase tracking-[0.2em] text-sm sm:text-base group"
              onClick={scrollToVideo}
            >
              <Play className="mr-3 w-5 h-5 fill-current" /> Ver Apresentação
            </Button>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.8 }}
          className="w-full max-w-sm flex flex-col gap-3"
        >
          <div className="flex items-center gap-3 w-full">
            <div className="h-px bg-border flex-1 opacity-20" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Acesso Rápido</span>
            <div className="h-px bg-border flex-1 opacity-20" />
          </div>
          <GoogleSignInButton 
            className="h-14 sm:h-16 rounded-2xl bg-background hover:bg-muted/50 border-border/50 text-xs"
            text="Continuar com Google"
          />
        </motion.div>

        <div className="flex items-center gap-3 opacity-40">
          <span className="w-8 h-px bg-muted-foreground" />
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            Tradição & Tecnologia
          </p>
          <span className="w-8 h-px bg-muted-foreground" />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HeroContent;